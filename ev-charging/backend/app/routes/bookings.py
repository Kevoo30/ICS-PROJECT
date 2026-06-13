from flask import Blueprint, request, jsonify #type: ignore
from app.services.booking_service import create_booking, get_user_bookings, cancel_booking, delay_booking

bookings_bp = Blueprint("bookings", __name__)

@bookings_bp.route("/", methods=["POST"])
def add_booking():
    data = request.get_json()

    required_fields = ["user_id", "vehicle_id", "port_id", "preferred_time"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data.get("is_priority") and "battery_level" not in data:
        return jsonify({"error": "battery_level is required for priority bookings"}), 400

    response, status = create_booking(data)
    return jsonify(response), status


@bookings_bp.route("/user/<user_id>", methods=["GET"])
def get_bookings(user_id):
    response, status = get_user_bookings(user_id)
    return jsonify(response), status


@bookings_bp.route("/<booking_id>/cancel", methods=["PUT"])
def cancel(booking_id):
    data = request.get_json()

    if "cancelled_by" not in data:
        return jsonify({"error": "cancelled_by is required"}), 400

    if data["cancelled_by"] not in ["driver", "operator"]:
        return jsonify({"error": "cancelled_by must be driver or operator"}), 400

    response, status = cancel_booking(booking_id, data["cancelled_by"])
    return jsonify(response), status


@bookings_bp.route("/<booking_id>/delay", methods=["PUT"])
def delay(booking_id):
    response, status = delay_booking(booking_id)
    return jsonify(response), status