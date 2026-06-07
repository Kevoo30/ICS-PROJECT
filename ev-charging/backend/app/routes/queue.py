from flask import Blueprint, request, jsonify #type: ignore
from app.services.queue_service import join_queue, get_queue, delay_queue_entry, mark_no_show

queue_bp = Blueprint("queue", __name__)

@queue_bp.route("/join", methods=["POST"])
def join():
    data = request.get_json()

    required_fields = ["user_id", "vehicle_id", "port_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data.get("is_priority") and "battery_level" not in data:
        return jsonify({"error": "battery_level is required for priority requests"}), 400

    response, status = join_queue(data)
    return jsonify(response), status


@queue_bp.route("/port/<port_id>", methods=["GET"])
def get_port_queue(port_id):
    response, status = get_queue(port_id)
    return jsonify(response), status


@queue_bp.route("/<entry_id>/delay", methods=["PUT"])
def delay_entry(entry_id):
    response, status = delay_queue_entry(entry_id)
    return jsonify(response), status


@queue_bp.route("/<entry_id>/noshow", methods=["PUT"])
def no_show(entry_id):
    response, status = mark_no_show(entry_id)
    return jsonify(response), status