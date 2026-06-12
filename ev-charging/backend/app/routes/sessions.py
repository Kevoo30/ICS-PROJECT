from flask import Blueprint, request, jsonify #type: ignore
from app.services.session_service import start_session, end_session, get_user_sessions, get_port_sessions

sessions_bp = Blueprint("sessions", __name__)

@sessions_bp.route("/start", methods=["POST"])
def begin_session():
    data = request.get_json()

    required_fields = ["user_id", "vehicle_id", "port_id", "queue_entry_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    response, status = start_session(data)
    return jsonify(response), status


@sessions_bp.route("/<session_id>/end", methods=["PUT"])
def finish_session(session_id):
    response, status = end_session(session_id)
    return jsonify(response), status


@sessions_bp.route("/user/<user_id>", methods=["GET"])
def user_sessions(user_id):
    response, status = get_user_sessions(user_id)
    return jsonify(response), status


@sessions_bp.route("/port/<port_id>", methods=["GET"])
def port_sessions(port_id):
    response, status = get_port_sessions(port_id)
    return jsonify(response), status