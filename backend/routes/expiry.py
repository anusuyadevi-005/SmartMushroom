from flask import Blueprint, request, jsonify
from logic.shelf_life import calculate_shelf_life

expiry_bp = Blueprint("expiry", __name__)

@expiry_bp.route("/expiry", methods=["POST"])
def get_expiry():
    data = request.json

    expiry_date, status = calculate_shelf_life(
        data["temperature"],
        data["humidity"]
    )

    return jsonify({
        "expiryDate": expiry_date.strftime("%Y-%m-%d"),
        "status": status
    })
