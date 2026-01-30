from flask import Blueprint, request, jsonify
from db import dish_col
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity

dishes_bp = Blueprint("dishes", __name__)

@dishes_bp.route("/dishes", methods=["GET"])
def get_dishes():
    try:
        dishes = list(dish_col.find({}, {"_id": 0}))
        return jsonify(dishes), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch dishes", "details": str(e)}), 500

@dishes_bp.route("/dishes", methods=["POST"])
@jwt_required()
def create_dish():
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        required_fields = ["id", "name", "description", "price", "unit", "image", "features"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        dish = {
            "id": data["id"],
            "name": data["name"],
            "description": data["description"],
            "price": data["price"],
            "unit": data["unit"],
            "image": data["image"],
            "features": data["features"]
        }

        dish_col.insert_one(dish)
        return jsonify({"message": "Dish created successfully"}), 201
    except Exception as e:
        return jsonify({"error": "Failed to create dish", "details": str(e)}), 500

@dishes_bp.route("/dishes/<dish_id>", methods=["PUT"])
@jwt_required()
def update_dish(dish_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        update_data = {}
        for field in ["name", "description", "price", "unit", "image", "features"]:
            if field in data:
                update_data[field] = data[field]

        result = dish_col.update_one({"id": dish_id}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Dish not found"}), 404

        return jsonify({"message": "Dish updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update dish", "details": str(e)}), 500

@dishes_bp.route("/dishes/<dish_id>", methods=["DELETE"])
def delete_dish(dish_id):
    try:
        result = dish_col.delete_one({"id": dish_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Dish not found"}), 404

        return jsonify({"message": "Dish deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete dish", "details": str(e)}), 500
