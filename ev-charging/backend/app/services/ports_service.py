from firebase_admin import firestore #type: ignore
from datetime import datetime

db = firestore.client()

def create_port(data):
    try:
        port_ref = db.collection("charging_ports").document()
        port_doc = {
            "port_id": port_ref.id,
            "port_name": data["port_name"],
            "connector_type": data["connector_type"],
            "status": "available",
            "current_session_id": None,
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        port_ref.set(port_doc)
        return {"message": "Port created successfully", "port_id": port_ref.id}, 201
    except Exception as e:
        return {"error": str(e)}, 400


def get_all_ports():
    try:
        ports = db.collection("charging_ports").where("is_deleted", "==", False).get()
        return [p.to_dict() for p in ports], 200
    except Exception as e:
        return {"error": str(e)}, 400


def update_port_status(port_id, status):
    try:
        valid_statuses = ["available", "occupied", "offline"]
        if status not in valid_statuses:
            return {"error": "Invalid status"}, 400

        port = db.collection("charging_ports").document(port_id).get()
        if not port.exists:
            return {"error": "Port not found"}, 404

        db.collection("charging_ports").document(port_id).update({
            "status": status,
            "updated_at": datetime.utcnow()
        })
        return {"message": "Port status updated"}, 200
    except Exception as e:
        return {"error": str(e)}, 400


def delete_port(port_id):
    try:
        port = db.collection("charging_ports").document(port_id).get()
        if not port.exists:
            return {"error": "Port not found"}, 404

        db.collection("charging_ports").document(port_id).update({
            "is_deleted": True,
            "updated_at": datetime.utcnow()
        })
        return {"message": "Port deleted successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 400