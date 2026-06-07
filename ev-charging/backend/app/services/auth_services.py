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