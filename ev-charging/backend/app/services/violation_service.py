from firebase_admin import firestore #type: ignore
from datetime import datetime, timezone
from config import Config

db = firestore.client()

def create_violation(data):
    try:
        user = db.collection("users").document(data["user_id"]).get()
        if not user.exists:
            return {"error": "User not found"}, 404

        # Create violation
        violation_ref = db.collection("violations").document()
        violation_doc = {
            "violation_id": violation_ref.id,
            "user_id": data["user_id"],
            "reason": data["reason"],
            "issued_by": data["issued_by"],
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        violation_ref.set(violation_doc)

        # Count active violations
        violations = db.collection("violations")\
            .where("user_id", "==", data["user_id"])\
            .where("is_deleted", "==", False)\
            .get()

        # Ban user if violation limit reached
        if len(violations) >= Config.VIOLATION_LIMIT:
            db.collection("users").document(data["user_id"]).update({
                "is_banned": True,
                "updated_at": datetime.now(timezone.utc)
            })
            return {"message": "Violation added and user banned", "violation_id": violation_ref.id}, 201

        return {"message": "Violation added successfully", "violation_id": violation_ref.id}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_user_violations(user_id):
    try:
        violations = db.collection("violations")\
            .where("user_id", "==", user_id)\
            .where("is_deleted", "==", False)\
            .get()
        return [v.to_dict() for v in violations], 200
    except Exception as e:
        return {"error": str(e)}, 400


def delete_violation(violation_id):
    try:
        violation = db.collection("violations").document(violation_id).get()
        if not violation.exists:
            return {"error": "Violation not found"}, 404

        violation_data = violation.to_dict()
        user_id = violation_data["user_id"]

        # Soft delete violation
        db.collection("violations").document(violation_id).update({
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc)
        })

        # Recount violations and lift ban if below limit
        remaining_violations = db.collection("violations")\
            .where("user_id", "==", user_id)\
            .where("is_deleted", "==", False)\
            .get()

        if len(remaining_violations) < Config.VIOLATION_LIMIT:
            db.collection("users").document(user_id).update({
                "is_banned": False,
                "updated_at": datetime.now(timezone.utc)
            })

        return {"message": "Violation deleted successfully"}, 200

    except Exception as e:
        return {"error": str(e)}, 400