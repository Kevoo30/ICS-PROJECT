from firebase_admin import firestore #type: ignore
from datetime import datetime, timezone

db = firestore.client()

def start_session(data):
    try:
        # Check user exists and is not banned
        user = db.collection("users").document(data["user_id"]).get()
        if not user.exists:
            return {"error": "User not found"}, 404
        if user.to_dict()["is_banned"]:
            return {"error": "User is banned from the platform"}, 403

        # Check port exists and is available
        port = db.collection("charging_ports").document(data["port_id"]).get()
        if not port.exists:
            return {"error": "Port not found"}, 404
        if port.to_dict()["status"] == "offline":
            return {"error": "Port is offline"}, 400

        # Check queue entry exists
        queue_entry = db.collection("queue_entries").document(data["queue_entry_id"]).get()
        if not queue_entry.exists:
            return {"error": "Queue entry not found"}, 404

        # Create session
        session_ref = db.collection("sessions").document()
        session_doc = {
            "session_id": session_ref.id,
            "user_id": data["user_id"],
            "vehicle_id": data["vehicle_id"],
            "port_id": data["port_id"],
            "booking_id": data.get("booking_id", None),
            "queue_entry_id": data["queue_entry_id"],
            "status": "active",
            "start_time": datetime.now(timezone.utc),
            "end_time": None,
            "duration_minutes": None,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        session_ref.set(session_doc)

        # Update port status to occupied
        db.collection("charging_ports").document(data["port_id"]).update({
            "status": "occupied",
            "current_session_id": session_ref.id,
            "updated_at": datetime.now(timezone.utc)
        })

        # Update queue entry status to charging
        db.collection("queue_entries").document(data["queue_entry_id"]).update({
            "status": "charging",
            "updated_at": datetime.now(timezone.utc)
        })

        return {"message": "Session started successfully", "session_id": session_ref.id}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def end_session(session_id):
    try:
        session = db.collection("sessions").document(session_id).get()
        if not session.exists:
            return {"error": "Session not found"}, 404

        session_data = session.to_dict()
        if session_data["status"] == "completed":
            return {"error": "Session already completed"}, 400

        end_time = datetime.now(timezone.utc)
        start_time = session_data["start_time"]
        duration = round((end_time - start_time).total_seconds() / 60, 2)

        # Update session
        db.collection("sessions").document(session_id).update({
            "status": "completed",
            "end_time": end_time,
            "duration_minutes": duration,
            "updated_at": datetime.now(timezone.utc)
        })

        # Update port status back to available
        db.collection("charging_ports").document(session_data["port_id"]).update({
            "status": "available",
            "current_session_id": None,
            "updated_at": datetime.now(timezone.utc)
        })

        # Update queue entry status to completed
        db.collection("queue_entries").document(session_data["queue_entry_id"]).update({
            "status": "completed",
            "updated_at": datetime.now(timezone.utc)
        })

        return {"message": "Session ended successfully", "duration_minutes": duration}, 200

    except Exception as e:
        return {"error": str(e)}, 400


def get_user_sessions(user_id):
    try:
        sessions = db.collection("sessions")\
            .where("user_id", "==", user_id)\
            .where("is_deleted", "==", False)\
            .get()
        return [s.to_dict() for s in sessions], 200
    except Exception as e:
        return {"error": str(e)}, 400


def get_port_sessions(port_id):
    try:
        sessions = db.collection("sessions")\
            .where("port_id", "==", port_id)\
            .where("is_deleted", "==", False)\
            .get()
        return [s.to_dict() for s in sessions], 200
    except Exception as e:
        return {"error": str(e)}, 400