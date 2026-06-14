from firebase_admin import firestore, db as rtdb #type: ignore
from datetime import datetime, timedelta
from config import Config

fs = firestore.client()

def join_queue(data):
    try:
        # Check user exists and is not banned
        user = fs.collection("users").document(data["user_id"]).get()
        if not user.exists:
            return {"error": "User not found"}, 404
        if user.to_dict()["is_banned"]:
            return {"error": "User is banned from the platform"}, 403

        # Check vehicle exists and belongs to user
        vehicle = fs.collection("vehicles").document(data["vehicle_id"]).get()
        if not vehicle.exists:
            return {"error": "Vehicle not found"}, 404
        if vehicle.to_dict()["user_id"] != data["user_id"]:
            return {"error": "Vehicle does not belong to user"}, 403

        # Check port exists
        port = fs.collection("charging_ports").document(data["port_id"]).get()
        if not port.exists:
            return {"error": "Port not found"}, 404
        if port.to_dict()["status"] == "offline":
            return {"error": "Port is offline"}, 400

        # Check connector compatibility
        if vehicle.to_dict()["connector_type"] != port.to_dict()["connector_type"]:
            return {"error": "Vehicle connector type does not match port"}, 400

        booking_id = data.get("booking_id")
        if booking_id:
            active_entries = fs.collection("queue_entries")\
                .where("booking_id", "==", booking_id)\
                .where("is_deleted", "==", False)\
                .get()

            for entry in active_entries:
                entry_data = entry.to_dict()
                if entry_data.get("status") in ["waiting", "called", "charging"]:
                    return {
                        "message": "Booking is already in queue",
                        "entry_id": entry_data.get("entry_id", entry.id),
                        "queue_position": entry_data.get("queue_position"),
                        "estimated_wait": entry_data.get("estimated_wait"),
                        "deduplicated": True,
                    }, 200

        # Get current queue length for this port
        existing_entries = fs.collection("queue_entries")\
            .where("port_id", "==", data["port_id"])\
            .where("status", "in", ["waiting", "called"])\
            .where("is_deleted", "==", False)\
            .get()

        queue_position = len(existing_entries) + 1
        estimated_wait = queue_position * 30

        # Create queue entry
        entry_ref = fs.collection("queue_entries").document()
        entry_doc = {
            "entry_id": entry_ref.id,
            "user_id": data["user_id"],
            "vehicle_id": data["vehicle_id"],
            "booking_id": data.get("booking_id", None),
            "port_id": data["port_id"],
            "entry_type": data.get("entry_type", "walk_in"),
            "is_priority": data.get("is_priority", False),
            "battery_level": data.get("battery_level", None),
            "queue_position": queue_position,
            "estimated_wait": estimated_wait,
            "status": "waiting",
            "is_delayed": False,
            "no_show_deadline": None,
            "arrived_at": datetime.utcnow(),
            "called_at": None,
            "is_deleted": False,
            "updated_at": datetime.utcnow()
        }

        entry_ref.set(entry_doc)

        # Update Realtime Database
        update_realtime_queue(data["port_id"])

        return {"message": "Joined queue successfully", "entry_id": entry_ref.id, "queue_position": queue_position, "estimated_wait": estimated_wait}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_queue(port_id):
    try:
        entries = fs.collection("queue_entries")\
            .where("port_id", "==", port_id)\
            .where("status", "in", ["waiting", "called"])\
            .where("is_deleted", "==", False)\
            .order_by("queue_position")\
            .get()
        return [e.to_dict() for e in entries], 200
    except Exception as e:
        return {"error": str(e)}, 400


def delay_queue_entry(entry_id):
    try:
        entry = fs.collection("queue_entries").document(entry_id).get()
        if not entry.exists:
            return {"error": "Queue entry not found"}, 404

        entry_data = entry.to_dict()
        if entry_data["status"] != "waiting":
            return {"error": "Only waiting entries can be delayed"}, 400

        current_position = entry_data["queue_position"]
        port_id = entry_data["port_id"]

        # Find the entry directly behind this one
        next_entries = fs.collection("queue_entries")\
            .where("port_id", "==", port_id)\
            .where("queue_position", "==", current_position + 1)\
            .where("is_deleted", "==", False)\
            .get()

        if not next_entries:
            return {"error": "No one behind you in the queue"}, 400

        next_entry = next_entries[0]

        # Swap positions
        batch = fs.batch()
        batch.update(entry.reference, {
            "queue_position": current_position + 1,
            "is_delayed": True,
            "updated_at": datetime.utcnow()
        })
        batch.update(next_entry.reference, {
            "queue_position": current_position,
            "updated_at": datetime.utcnow()
        })
        batch.commit()

        # Update Realtime Database
        update_realtime_queue(port_id)

        return {"message": "Position delayed by one"}, 200

    except Exception as e:
        return {"error": str(e)}, 400


def mark_no_show(entry_id):
    try:
        entry = fs.collection("queue_entries").document(entry_id).get()
        if not entry.exists:
            return {"error": "Queue entry not found"}, 404

        entry_data = entry.to_dict()
        user_id = entry_data["user_id"]
        port_id = entry_data["port_id"]

        # Mark as no show
        fs.collection("queue_entries").document(entry_id).update({
            "status": "no_show",
            "updated_at": datetime.utcnow()
        })

        # Add violation
        violation_ref = fs.collection("violations").document()
        violation_ref.set({
            "violation_id": violation_ref.id,
            "user_id": user_id,
            "reason": "No show at charging port",
            "issued_by": "system",
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        # Check violation count and ban if necessary
        violations = fs.collection("violations")\
            .where("user_id", "==", user_id)\
            .where("is_deleted", "==", False)\
            .get()

        if len(violations) >= Config.VIOLATION_LIMIT:
            fs.collection("users").document(user_id).update({
                "is_banned": True,
                "updated_at": datetime.utcnow()
            })

        # Recalculate queue positions
        recalculate_queue(port_id)

        return {"message": "No show recorded"}, 200

    except Exception as e:
        return {"error": str(e)}, 400


def recalculate_queue(port_id):
    entries = fs.collection("queue_entries")\
        .where("port_id", "==", port_id)\
        .where("status", "in", ["waiting", "called"])\
        .where("is_deleted", "==", False)\
        .order_by("queue_position")\
        .get()

    batch = fs.batch()
    for i, entry in enumerate(entries):
        batch.update(entry.reference, {
            "queue_position": i + 1,
            "estimated_wait": (i + 1) * 30,
            "updated_at": datetime.utcnow()
        })
    batch.commit()
    update_realtime_queue(port_id)


def update_realtime_queue(port_id):
    entries = fs.collection("queue_entries")\
        .where("port_id", "==", port_id)\
        .where("status", "in", ["waiting", "called"])\
        .where("is_deleted", "==", False)\
        .order_by("queue_position")\
        .get()

    queue_data = {
        "queue_length": len(entries),
        "updated_at": datetime.utcnow().isoformat(),
        "entries": {
            e.to_dict()["entry_id"]: {
                "position": e.to_dict()["queue_position"],
                "estimated_wait": e.to_dict()["estimated_wait"],
                "user_id": e.to_dict()["user_id"]
            } for e in entries
        }
    }

    rtdb.reference(f"/queue_state/port_{port_id}").set(queue_data)