from firebase_admin import auth, firestore #type: ignore
from datetime import datetime

db = firestore.client()

def create_user(data):
    try:
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=data["email"],
            password=data["password"],
            display_name=data["name"]
        )

        # Create user document in Firestore
        user_doc = {
            "uid": user_record.uid,
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "role": data["role"],
            "is_banned": False,
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        db.collection("users").document(user_record.uid).set(user_doc)

        return {"message": "User created successfully", "uid": user_record.uid}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_user(uid):
    try:
        user = db.collection("users").document(uid).get()
        if not user.exists:
            return {"error": "User not found"}, 404
        return user.to_dict(), 200
    except Exception as e:
        return {"error": str(e)}, 400
    
def create_vehicle(uid, data):
    try:
        # Check if user exists
        user = db.collection("users").document(uid).get()
        if not user.exists:
            return {"error": "User not found"}, 404

        # Check if this is the user's first vehicle
        existing_vehicles = db.collection("vehicles").where("user_id", "==", uid).where("is_deleted", "==", False).get()
        is_default = len(existing_vehicles) == 0

        vehicle_ref = db.collection("vehicles").document()
        vehicle_doc = {
            "vehicle_id": vehicle_ref.id,
            "user_id": uid,
            "vehicle_model": data["vehicle_model"],
            "number_plate": data["number_plate"],
            "connector_type": data["connector_type"],
            "is_default": is_default,
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        vehicle_ref.set(vehicle_doc)
        return {"message": "Vehicle added successfully", "vehicle_id": vehicle_ref.id}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_user_vehicles(uid):
    try:
        vehicles = db.collection("vehicles").where("user_id", "==", uid).where("is_deleted", "==", False).get()
        return [v.to_dict() for v in vehicles], 200
    except Exception as e:
        return {"error": str(e)}, 400


def set_default_vehicle(uid, vehicle_id):
    try:
        vehicles = db.collection("vehicles").where("user_id", "==", uid).where("is_deleted", "==", False).get()
        
        batch = db.batch()
        for v in vehicles:
            batch.update(v.reference, {
                "is_default": v.id == vehicle_id,
                "updated_at": datetime.utcnow()
            })
        batch.commit()

        return {"message": "Default vehicle updated"}, 200
    except Exception as e:
        return {"error": str(e)}, 400