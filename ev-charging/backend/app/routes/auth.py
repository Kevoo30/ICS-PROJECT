from flask import Blueprint, request, jsonify #type: ignore
from app.services.auth_service import create_user, get_user, get_user_by_email, create_vehicle, get_user_vehicles, set_default_vehicle, delete_vehicle #type: ignore

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["email", "password", "name", "phone", "role", "vehicle_model", "number_plate", "connector_type"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data["role"] not in ["driver", "operator"]:
        return jsonify({"error": "role must be driver or operator"}), 400

    if data["connector_type"] not in ["Type 1", "Type 2", "CCS", "CHAdeMO"]:
        return jsonify({"error": "Invalid connector type"}), 400

    response, status = create_user(data)
    return jsonify(response), status


@auth_bp.route("/user/<uid>", methods=["GET"])
def get_user_route(uid):
    response, status = get_user(uid)
    return jsonify(response), status


@auth_bp.route("/user-by-email", methods=["POST"])
def get_user_by_email_route():
    data = request.get_json() or {}
    email = data.get("email")
    response, status = get_user_by_email(email)
    return jsonify(response), status

@auth_bp.route("/user/<uid>/vehicles", methods=["POST"])
def add_vehicle(uid):
    data = request.get_json()

    required_fields = ["vehicle_model", "number_plate", "connector_type"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data["connector_type"] not in ["Type 1", "Type 2", "CCS", "CHAdeMO"]:
        return jsonify({"error": "Invalid connector type"}), 400

    response, status = create_vehicle(uid, data)
    return jsonify(response), status


@auth_bp.route("/user/<uid>/vehicles", methods=["GET"])
def get_vehicles(uid):
    response, status = get_user_vehicles(uid)
    return jsonify(response), status


@auth_bp.route("/user/<uid>/vehicles/<vehicle_id>/default", methods=["PUT"])
def update_default_vehicle(uid, vehicle_id):
    response, status = set_default_vehicle(uid, vehicle_id)
    return jsonify(response), status


@auth_bp.route("/user/<uid>/vehicles/<vehicle_id>", methods=["DELETE"])
def remove_vehicle(uid, vehicle_id):
    response, status = delete_vehicle(uid, vehicle_id)
    return jsonify(response), status