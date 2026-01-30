from flask import Blueprint, request, jsonify
from datetime import datetime
from db import order_col
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity

orders_bp = Blueprint("orders", __name__)

# 🔹 AUTO INCREMENT ORDER NUMBER
def get_next_order_no():
    last_order = order_col.find_one({}, sort=[("orderNo", -1)])
    if last_order and "orderNo" in last_order:
        return last_order["orderNo"] + 1
    else:
        return 1


# ================================
# USER → PLACE ORDER
# ================================
@orders_bp.route("/orders", methods=["POST", "OPTIONS"])
def create_order():
    if request.method == "OPTIONS":
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 200

    data = request.json

    order = {
        "orderNo": get_next_order_no(),  # ✅ NEW
        "customerName": data["customerName"],
        "phone": data["phone"],
        "product": data["product"],
        "quantity": data["quantity"],
        "status": "PENDING",
        "createdAt": datetime.now()
    }

    # If client provides email (e.g., when user is logged in), store it to associate orders with user accounts
    if data.get("email"):
        order["email"] = data.get("email")

    order_col.insert_one(order)
    return jsonify({"message": "Order placed successfully"}), 201


# ================================
# VIEW ALL ORDERS (Public)
# ================================
@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    orders = list(order_col.find({}))
    for o in orders:
        o["_id"] = str(o["_id"])
    return jsonify(orders)


# ================================
# ADMIN → UPDATE STATUS
# ================================
@orders_bp.route("/orders/status", methods=["PUT"])
@jwt_required()
def update_status():
    identity = get_jwt_identity() or {}
    role = identity.get("role") if isinstance(identity, dict) else None
    if role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.json

    result = order_col.update_one(
        {"_id": ObjectId(data["orderId"])},  # ✅ FIXED
        {"$set": {"status": data["status"]}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"message": "Order status updated"})


# ================================
# USER → TRACK ORDERS BY PHONE
# ================================
@orders_bp.route("/orders/track/<phone>", methods=["GET"])
def track_orders(phone):
    orders = list(order_col.find(
        {"phone": str(phone)},
        {"_id": 0}
    ))
    return jsonify(orders)


# ================================
# USER → UPDATE ORDER (QUANTITY ONLY IF PENDING)
# ================================
@orders_bp.route("/orders/<order_id>", methods=["PUT"])
def update_order(order_id):
    try:
        data = request.json
        order = order_col.find_one({"_id": ObjectId(order_id)})

        if not order:
            return jsonify({"error": "Order not found"}), 404

        if order["status"] != "PENDING":
            return jsonify({"error": "Only pending orders can be updated"}), 400

        update_data = {}
        if "quantity" in data:
            update_data["quantity"] = data["quantity"]

        if update_data:
            result = order_col.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                return jsonify({"error": "Order not found"}), 404

        return jsonify({"message": "Order updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update order", "details": str(e)}), 500


# ================================
# USER → DELETE ORDER (ONLY IF PENDING)
# ================================
@orders_bp.route("/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    try:
        order = order_col.find_one({"_id": ObjectId(order_id)})

        if not order:
            return jsonify({"error": "Order not found"}), 404

        if order["status"] != "PENDING":
            return jsonify({"error": "Only pending orders can be deleted"}), 400

        result = order_col.delete_one({"_id": ObjectId(order_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Order not found"}), 404

        return jsonify({"message": "Order deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete order", "details": str(e)}), 500


# ================================
# DASHBOARD → ORDER STATISTICS
# ================================
@orders_bp.route("/orders/stats", methods=["GET"])
def get_order_stats():
    pipeline = [
        {"$group": {"_id": "$product", "count": {"$sum": 1}}}
    ]
    stats = list(order_col.aggregate(pipeline))

    # Convert to format suitable for pie chart
    result = []
    for stat in stats:
        result.append({
            "product": stat["_id"],
            "count": stat["count"]
        })

    return jsonify(result)


# ================================
# USER → FETCH OWN ORDERS (AUTHENTICATED)
# ================================
@orders_bp.route("/orders/my", methods=["GET"])
@jwt_required()
def my_orders():
    identity = get_jwt_identity() or {}
    email = None
    if isinstance(identity, dict):
        email = identity.get("email")

    if not email:
        return jsonify({"error": "User email not found in token"}), 400

    orders = list(order_col.find({"email": email}))
    # Convert ObjectId to string and return relevant fields
    for o in orders:
        o["_id"] = str(o["_id"])
        if "createdAt" in o:
            o["createdAt"] = o["createdAt"].isoformat()
    return jsonify(orders)
