from firebase_admin import firestore #type: ignore
from datetime import datetime

db = firestore.client()

def create_booking(data):
    try:
        # Check user exists and is not banned
        user = db.collection("users").document(data["user_id"]).get()
        if not user.exists:
            return {"error": "User not found"}, 404
        if user.to_dict()["is_banned"]:
            return {"error": "User is banned from the platform"}, 403

        # Check vehicle exists and belongs to user
        vehicle = db.collection("vehicles").document(data["vehicle_id"]).get()
        if not vehicle.exists:
            return {"error": "Vehicle not found"}, 404
        if vehicle.to_dict()["user_id"] != data["user_id"]:
            return {"error": "Vehicle does not belong to user"}, 403

        # Check port exists and is available
        port = db.collection("charging_ports").document(data["port_id"]).get()
        if not port.exists:
            return {"error": "Port not found"}, 404
        if port.to_dict()["status"] == "offline":
            return {"error": "Port is offline"}, 400

        # Check connector compatibility
        if vehicle.to_dict()["connector_type"] != port.to_dict()["connector_type"]:
            return {"error": "Vehicle connector type does not match port"}, 400

        # Guard against duplicate active bookings caused by repeated submits.
        existing_bookings = db.collection("bookings").where("user_id", "==", data["user_id"]).get()
        for booking in existing_bookings:
            booking_data = booking.to_dict()
            if booking_data.get("is_deleted"):
                continue
            if booking_data.get("status") not in ["pending", "confirmed"]:
                continue
            if booking_data.get("vehicle_id") != data["vehicle_id"]:
                continue
            if booking_data.get("port_id") != data["port_id"]:
                continue
            if booking_data.get("preferred_time") != data.get("preferred_time", None):
                continue

            return {
                "message": "Duplicate booking request detected. Reusing existing booking.",
                "booking_id": booking_data.get("booking_id", booking.id),
                "deduplicated": True,
            }, 200

        # Create booking
        booking_ref = db.collection("bookings").document()
        booking_doc = {
            "booking_id": booking_ref.id,
            "user_id": data["user_id"],
            "vehicle_id": data["vehicle_id"],
            "port_id": data["port_id"],
            "preferred_time": data.get("preferred_time", None),
            "assigned_slot_start": None,
            "assigned_slot_end": None,
            "status": "pending",
            "is_priority": data.get("is_priority", False),
            "battery_level": data.get("battery_level", None),
            "is_delayed": False,
            "delay_count": 0,
            "cancelled_by": None,
            "cancelled_at": None,
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        booking_ref.set(booking_doc)
        return {"message": "Booking created successfully", "booking_id": booking_ref.id}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_user_bookings(user_id):
    try:
        bookings = db.collection("bookings").where("user_id", "==", user_id).where("is_deleted", "==", False).get()
        return [b.to_dict() for b in bookings], 200
    except Exception as e:
        return {"error": str(e)}, 400


def cancel_booking(booking_id, cancelled_by):
    try:
        booking = db.collection("bookings").document(booking_id).get()
        if not booking.exists:
            return {"error": "Booking not found"}, 404

        booking_data = booking.to_dict()
        if booking_data["status"] in ["cancelled", "completed"]:
            return {"error": "Booking cannot be cancelled"}, 400

        db.collection("bookings").document(booking_id).update({
            "status": "cancelled",
            "cancelled_by": cancelled_by,
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        return {"message": "Booking cancelled successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 400


def delay_booking(booking_id):
    try:
        from config import Config
        booking = db.collection("bookings").document(booking_id).get()
        if not booking.exists:
            return {"error": "Booking not found"}, 404

        booking_data = booking.to_dict()
        if booking_data["status"] != "confirmed":
            return {"error": "Only confirmed bookings can be delayed"}, 400

        new_delay_count = booking_data["delay_count"] + 1

        if new_delay_count >= Config.DELAY_LIMIT:
            db.collection("bookings").document(booking_id).update({
                "status": "cancelled",
                "cancelled_by": "system",
                "cancelled_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            return {"message": "Booking cancelled due to exceeding delay limit"}, 200

        db.collection("bookings").document(booking_id).update({
            "is_delayed": True,
            "delay_count": new_delay_count,
            "updated_at": datetime.utcnow()
        })
        return {"message": "Booking delayed successfully", "delay_count": new_delay_count}, 200

    except Exception as e:
        return {"error": str(e)}, 400