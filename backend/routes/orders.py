from flask import Blueprint, request, jsonify
from datetime import datetime
from db import order_col

orders_bp = Blueprint("orders", __name__)

# USER → PLACE ORDER
@orders_bp.route("/orders", methods=["POST"])
def create_order():
    data = request.json

    order = {
        "customerName": data["customerName"],
        "phone": data["phone"],
        "product": data["product"],
        "quantity": data["quantity"],
        "status": "PLACED",
        "createdAt": datetime.now()
    }

    order_col.insert_one(order)
    return jsonify({"message": "Order placed successfully"}), 201


# ADMIN → VIEW ALL ORDERS
@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    orders = list(order_col.find({}, {"_id": 0}))
    return jsonify(orders)


# ADMIN → UPDATE STATUS
@orders_bp.route("/orders/status", methods=["PUT"])
def update_status():
    data = request.json

    order_col.update_one(
        {"customerName": data["customerName"], "product": data["product"]},
        {"$set": {"status": data["status"]}}
    )

    return jsonify({"message": "Order status updated"})
# USER → TRACK ORDERS BY PHONE
@orders_bp.route("/orders/track/<phone>", methods=["GET"])
def track_orders(phone):
    orders = list(order_col.find(
        {"phone": str(phone)},
        {"_id": 0}
    ))
    return jsonify(orders)

