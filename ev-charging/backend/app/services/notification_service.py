from firebase_admin import firestore #type:ignore
from datetime import datetime, timezone

db = firestore.client()

def create_notification(data):
    try:
        user = db.collection("users").document(data["user_id"]).get()
        if not user.exists:
            return {"error": "User not found"}, 404

        notification_ref = db.collection("notifications").document()
        notification_doc = {
            "notification_id": notification_ref.id,
            "user_id": data["user_id"],
            "type": data["type"],
            "message": data["message"],
            "sent_via": data.get("sent_via", "in_app"),
            "is_read": False,
            "is_deleted": False,
            "sent_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        notification_ref.set(notification_doc)
        return {"message": "Notification created successfully", "notification_id": notification_ref.id}, 201

    except Exception as e:
        return {"error": str(e)}, 400


def get_user_notifications(user_id):
    try:
        notifications = db.collection("notifications")\
            .where("user_id", "==", user_id)\
            .where("is_deleted", "==", False)\
            .get()
        return [n.to_dict() for n in notifications], 200
    except Exception as e:
        return {"error": str(e)}, 400


def mark_as_read(notification_id):
    try:
        notification = db.collection("notifications").document(notification_id).get()
        if not notification.exists:
            return {"error": "Notification not found"}, 404

        db.collection("notifications").document(notification_id).update({
            "is_read": True,
            "updated_at": datetime.now(timezone.utc)
        })
        return {"message": "Notification marked as read"}, 200

    except Exception as e:
        return {"error": str(e)}, 400


def delete_notification(notification_id):
    try:
        notification = db.collection("notifications").document(notification_id).get()
        if not notification.exists:
            return {"error": "Notification not found"}, 404

        db.collection("notifications").document(notification_id).update({
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc)
        })
        return {"message": "Notification deleted successfully"}, 200

    except Exception as e:
        return {"error": str(e)}, 400