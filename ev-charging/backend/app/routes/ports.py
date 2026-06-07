from flask import Blueprint, request, jsonify #type: ignore
from app.services.ports_service import create_port, get_all_ports, update_port_status, delete_port

ports_bp = Blueprint("ports", __name__)

@ports_bp.route("/", methods=["POST"])
def add_port():
    data = request.get_json()

    required_fields = ["port_name", "connector_type"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    if data["connector_type"] not in ["Type 1", "Type 2", "CCS", "CHAdeMO"]:
        return jsonify({"error": "Invalid connector type"}), 400

    response, status = create_port(data)
    return jsonify(response), status


@ports_bp.route("/", methods=["GET"])
def get_ports():
    response, status = get_all_ports()
    return jsonify(response), status


@ports_bp.route("/<port_id>/status", methods=["PUT"])
def update_status(port_id):
    data = request.get_json()

    if "status" not in data:
        return jsonify({"error": "status is required"}), 400

    response, status = update_port_status(port_id, data["status"])
    return jsonify(response), status


@ports_bp.route("/<port_id>", methods=["DELETE"])
def remove_port(port_id):
    response, status = delete_port(port_id)
    return jsonify(response), status