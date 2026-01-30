from flask import Blueprint, request, jsonify
from db import product_col
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

products_bp = Blueprint("products", __name__)

@products_bp.route("/products", methods=["GET"])
def get_products():
    try:
        products = list(product_col.find({}, {"_id": 0}))
        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch products", "details": str(e)}), 500


@products_bp.route("/products", methods=["POST"])
@jwt_required()
def create_product():
    try:
        # Extract identity and claims safely
        identity = get_jwt_identity()
        claims = get_jwt()
        # role may be inside identity (if identity is a dict) or as a top-level claim
        role = None
        if isinstance(identity, dict):
            role = identity.get("role")
        if not role:
            role = claims.get("role")
        # email may also be inside identity
        email = identity.get("email") if isinstance(identity, dict) else identity

        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json()

        required_fields = ["id", "name", "description", "price", "unit", "image", "features"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        if product_col.find_one({"id": data["id"]}):
            return jsonify({"error": "Product with this ID already exists"}), 409

        product_col.insert_one({
            "id": data["id"],
            "name": data["name"],
            "description": data["description"],
            "price": data["price"],
            "unit": data["unit"],
            "image": data["image"],
            "features": data["features"]
        })

        return jsonify({"message": "Product created successfully"}), 201

    except Exception as e:
        return jsonify({"error": "Failed to create product", "details": str(e)}), 500


@products_bp.route("/products/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        identity = get_jwt_identity()
        claims = get_jwt()
        role = None
        if isinstance(identity, dict):
            role = identity.get("role")
        if not role:
            role = claims.get("role")

        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json()
        update_data = {k: v for k, v in data.items()
                       if k in ["name", "description", "price", "unit", "image", "features"]}

        result = product_col.update_one({"id": product_id}, {"$set": update_data})

        if result.matched_count == 0:
            return jsonify({"error": "Product not found"}), 404

        return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Failed to update product", "details": str(e)}), 500


@products_bp.route("/products/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        identity = get_jwt_identity()
        claims = get_jwt()
        role = None
        if isinstance(identity, dict):
            role = identity.get("role")
        if not role:
            role = claims.get("role")

        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        result = product_col.delete_one({"id": product_id})

        if result.deleted_count == 0:
            return jsonify({"error": "Product not found"}), 404

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Failed to delete product", "details": str(e)}), 500
