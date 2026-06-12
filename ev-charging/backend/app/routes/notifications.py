from flask import Blueprint, request, jsonify #type:ignore
from app.services.notification_service import create_notification, get_user_notifications, mark_as_read, delete_notification

notifications_bp = Blueprint("notifications", __name__)

valid_types = ["slot_activated", "queue_update", "session_complete", "no_show_warning"]

@notifications_bp.route("/", methods=["POST"])
def add_notification():
    data = request.get_json()

    required_fields = ["user_id", "type", "message"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data["type"] not in valid_types:
        return jsonify({"error": f"type must be one of {valid_types}"}), 400

    if "sent_via" in data and data["sent_via"] not in ["email", "in_app"]:
        return jsonify({"error": "sent_via must be email or in_app"}), 400

    response, status = create_notification(data)
    return jsonify(response), status


@notifications_bp.route("/user/<user_id>", methods=["GET"])
def get_notifications(user_id):
    response, status = get_user_notifications(user_id)
    return jsonify(response), status


@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
def read_notification(notification_id):
    response, status = mark_as_read(notification_id)
    return jsonify(response), status


@notifications_bp.route("/<notification_id>", methods=["DELETE"])
def remove_notification(notification_id):
    response, status = delete_notification(notification_id)
    return jsonify(response), status