from flask import Blueprint, request, jsonify #type: ignore
from app.services.violation_service import create_violation, get_user_violations, delete_violation

violations_bp = Blueprint("violations", __name__)

@violations_bp.route("/", methods=["POST"])
def add_violation():
    data = request.get_json()

    required_fields = ["user_id", "reason", "issued_by"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    response, status = create_violation(data)
    return jsonify(response), status


@violations_bp.route("/user/<user_id>", methods=["GET"])
def get_violations(user_id):
    response, status = get_user_violations(user_id)
    return jsonify(response), status


@violations_bp.route("/<violation_id>", methods=["DELETE"])
def remove_violation(violation_id):
    response, status = delete_violation(violation_id)
    return jsonify(response), status