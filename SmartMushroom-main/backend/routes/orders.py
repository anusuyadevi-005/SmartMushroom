from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
from db import order_col, product_col
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from routes.auth import get_current_user_role
from utils.email_service import send_order_confirmation, send_payment_receipt, send_order_status_update
from routes.stock import log_stock_movement

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
@orders_bp.route("/", methods=["POST", "OPTIONS"], strict_slashes=False)
@cross_origin()
@jwt_required(optional=True)
def create_order():
    # Return 200 immediately for CORS preflight
    if request.method == "OPTIONS":
        return jsonify({}), 200
    # Manually enforce auth for POST
    identity = get_jwt_identity()
    if identity is None:
        return jsonify({"error": "Missing or invalid Authorization token"}), 401
    print("DEBUG: create_order function entrance")
    try:
        if order_col is None:
            return jsonify({"error": "Database connection not available"}), 500

        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract email from JWT identity if not provided
        identity = get_jwt_identity()
        email = data.get("email")
        if not email:
            if isinstance(identity, dict):
                email = identity.get("email")
            else:
                email = identity

        # Verify role (Admin should not place orders)
        jwt_data = get_jwt()
        if jwt_data.get("role") == "admin":
             return jsonify({"error": "Admins cannot place orders"}), 403

        # Support both single product (legacy) and multi-item cart (new)
        items = data.get("items", [])
        if not items and data.get("product"):
            items = [{
                "product": data.get("product"),
                "quantity": data.get("quantity", 1),
                "price": data.get("price", 0) # price per unit
            }]

        if not items:
            return jsonify({"error": "Order must contain at least one item"}), 400

        order = {
            "orderNo": get_next_order_no(),
            "customerName": data.get("customerName"),
            "phone": data.get("phone"),
            "email": email,
            "items": items,
            "shippingAddress": data.get("shippingAddress", {}),
            "totalAmount": data.get("totalAmount", 0),
            "status": "PENDING",
            "createdAt": datetime.now()
        }

        # Backward compatibility for single product field if needed by some parts of the system
        if items:
            first_item = items[0]
            # Safely get product name from either 'product' or 'name' key
            order["product"] = first_item.get("product") or first_item.get("name") or "Unknown Product"
            order["quantity"] = first_item.get("quantity", 1)

        print(f"[DIAGNOSTIC] Order dictionary prepared: {order}")
        
        # 🔹 CHECK STOCK AND DECREMENT
        for item in items:
            product_id = item.get("id") or item.get("product") or item.get("variantId")
            # If variantId is like 'product1_1kg', the base product ID is 'product1'
            base_product_id = item.get("variantId") or product_id
            quantity = item.get("quantity", 1)

            product = product_col.find_one({"id": base_product_id})
            if not product:
                # Try finding by 'name' if 'id' fails (fallback for legacy)
                product = product_col.find_one({"name": base_product_id})
            
            if product:
                current_stock = product.get("stock")
                if current_stock is not None: # Only check if stock feature is enabled for this product
                    if current_stock < quantity:
                        return jsonify({"error": f"Insufficient stock for {product.get('name', base_product_id)}. Available: {current_stock}"}), 400
                    
                    # Decrement stock atomically
                    product_col.update_one({"id": product["id"]}, {"$inc": {"stock": -quantity}})
                    new_stock = current_stock - quantity
                    log_stock_movement(
                        product_id=product["id"],
                        product_name=product.get("name", ""),
                        change_qty=-quantity,
                        new_stock=new_stock,
                        reason=f"Order #{order['orderNo']} placed",
                        movement_type="order",
                        reference_id=str(order["orderNo"])
                    )
                    print(f"[DIAGNOSTIC] Decremented stock for {product['id']} by {quantity}")

        order_col.insert_one(order)
        print("[DIAGNOSTIC] Order inserted successfully")

        # 📧 Send Order Confirmation & Payment Receipt
        try:
            send_order_confirmation(email, data.get("customerName"), order)
            send_payment_receipt(email, data.get("customerName"), order)
        except Exception as e:
            print(f"Error sending order emails: {e}")

        return jsonify({"message": "Order placed successfully", "orderNo": order["orderNo"]}), 201
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in create_order: {e}")
        print(error_trace)
        return jsonify({
            "error": "Internal server error",
            "details": f"{str(e)}\n\nTraceback:\n{error_trace}"
        }), 500


# ================================
# VIEW ALL ORDERS (Public)
# ================================
@orders_bp.route("/", methods=["GET", "OPTIONS"], strict_slashes=False)
@cross_origin()
@jwt_required(optional=True)
def get_orders():
    # Return 200 immediately for CORS preflight
    if request.method == "OPTIONS":
        return jsonify({}), 200
    # Manually enforce auth for GET
    identity = get_jwt_identity()
    if identity is None:
        return jsonify({"error": "Missing or invalid Authorization token"}), 401
    role = get_current_user_role()
    identity = get_jwt_identity()
    print(f"[DIAGNOSTIC] get_orders called. Identity: {identity}, Role: {role}")
    
    if role != "admin":
        print(f"[DIAGNOSTIC] Denying access to get_orders. Role is {role}")
        return jsonify({
            "error": "Admin access required",
            "details": f"Your current role identified by the server is '{role}'. Only 'admin' role can perform this action.",
            "identity": str(identity)
        }), 403
    
    if order_col is None:
        print("[ERROR] order_col is None in get_orders")
        return jsonify({"error": "Database connection not available"}), 500
        
    try:
        orders = list(order_col.find({}))
        print(f"[DIAGNOSTIC] Successfully fetched {len(orders)} orders")
        for o in orders:
            o["_id"] = str(o["_id"])
            if "createdAt" in o and isinstance(o["createdAt"], datetime):
                o["createdAt"] = o["createdAt"].isoformat()
        return jsonify(orders)
    except Exception as e:
        import traceback
        print(f"[ERROR] get_orders failed: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ================================
# USER/ADMIN → VIEW SINGLE ORDER
# ================================
# ================================================================
# USER/ADMIN → MANAGE SINGLE ORDER (GET, PUT, DELETE)
# ================================================================
@orders_bp.route("/<order_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required(optional=True)
def manage_order(order_id):
    try:
        method = request.method
        order = order_col.find_one({"_id": ObjectId(order_id)})
        if not order:
            return jsonify({"error": "Order not found"}), 404

        # 1. GET - View Details
        if method == "GET":
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            
            identity = get_jwt_identity()
            email = identity.get("email") if isinstance(identity, dict) else identity
            role = get_current_user_role()

            if role != "admin" and order.get("email") != email:
                return jsonify({"error": "Unauthorized to view this order"}), 403

            order["_id"] = str(order["_id"])
            if "createdAt" in order:
                order["createdAt"] = order["createdAt"].isoformat()
            return jsonify(order), 200

        # 2. PUT - Update (Quantity if Pending)
        elif method == "PUT":
            data = request.json
            if order.get("status") != "PENDING":
                return jsonify({"error": "Only pending orders can be updated"}), 400

            update_data = {}
            if "quantity" in data:
                update_data["quantity"] = data["quantity"]

            if update_data:
                order_col.update_one({"_id": ObjectId(order_id)}, {"$set": update_data})
            return jsonify({"message": "Order updated successfully"}), 200

        # 3. DELETE - Cancel (If Pending)
        elif method == "DELETE":
            if order.get("status") != "PENDING":
                return jsonify({"error": "Only pending orders can be cancelled"}), 400

            # 🔹 RESTORE STOCK ON CANCELLATION
            items = order.get("items", [])
            for item in items:
                base_product_id = item.get("variantId") or item.get("id") or item.get("product")
                quantity = item.get("quantity", 1)
                product_col.update_one({"id": base_product_id}, {"$inc": {"stock": quantity}})
                # Log stock restoration to audit trail
                restored_product = product_col.find_one({"id": base_product_id})
                restored_stock = restored_product.get("stock", quantity) if restored_product else quantity
                log_stock_movement(
                    product_id=base_product_id,
                    product_name=restored_product.get("name", "") if restored_product else base_product_id,
                    change_qty=quantity,
                    new_stock=restored_stock,
                    reason=f"Order #{order.get('orderNo', 'N/A')} cancelled",
                    movement_type="cancellation",
                    reference_id=str(order.get("orderNo", ""))
                )
                print(f"[DIAGNOSTIC] Restored stock for {base_product_id} by {quantity}")

            order_col.delete_one({"_id": ObjectId(order_id)})
            return jsonify({"message": "Order deleted successfully"}), 200

    except Exception as e:
        import traceback
        print(f"ERROR in manage_order ({request.method}): {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ================================
# ADMIN → UPDATE STATUS
# ================================
@orders_bp.route("/status", methods=["PUT"])
@jwt_required()
def update_status():
    try:
        role = get_current_user_role()
        identity = get_jwt_identity()
        
        # Log for diagnostics (visible in server stdout)
        print(f"[DIAGNOSTIC] update_status called. Identity: {identity}, Role from helper: {role}")
        
        if role != "admin":
            return jsonify({
                "error": "Admin access required",
                "details": f"Your current role identified by the server is '{role}'. Only 'admin' role can perform this action.",
                "identity": str(identity)
            }), 403

        data = request.json
        if not data or "orderId" not in data or "status" not in data:
             return jsonify({"error": "orderId and status are required"}), 400

        result = order_col.update_one(
            {"_id": ObjectId(data["orderId"])},
            {"$set": {"status": data["status"]}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Order not found"}), 404

        # 📧 Send Order Status Update Email
        try:
            updated_order = order_col.find_one({"_id": ObjectId(data["orderId"])})
            if updated_order:
                send_order_status_update(
                    updated_order.get("email"),
                    updated_order.get("customerName"),
                    updated_order.get("orderNo"),
                    data["status"]
                )
        except Exception as e:
            print(f"Error sending status update email: {e}")

        return jsonify({"message": "Order status updated"})
    except Exception as e:
        print(f"[ERROR] update_status failed: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ================================
# USER → TRACK ORDERS BY PHONE (OR ORDER NO)
# ================================
@orders_bp.route("/track/<phone>", methods=["GET"])
def track_orders(phone):
    try:
        # Search by phone number
        orders = list(order_col.find(
            {"phone": str(phone)},
            {"_id": 0}
        ))
        
        # If no orders found by phone, try searching by orderNo (if it's numeric)
        if not orders and phone.isdigit():
            order_no = int(phone)
            orders = list(order_col.find(
                {"orderNo": order_no},
                {"_id": 0}
            ))

        # Convert datetime objects to ISO strings for JSON serialization
        for o in orders:
            if "createdAt" in o and isinstance(o["createdAt"], datetime):
                o["createdAt"] = o["createdAt"].isoformat()

        return jsonify(orders)
    except Exception as e:
        print(f"[ERROR] track_orders failed: {e}")
        return jsonify({"error": "Failed to track orders", "details": str(e)}), 500


@orders_bp.route("/track/order/<int:order_no>", methods=["GET"])
def track_order_by_no(order_no):
    try:
        order = order_col.find_one({"orderNo": order_no}, {"_id": 0})
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Convert datetime objects to ISO strings
        if "createdAt" in order and isinstance(order["createdAt"], datetime):
            order["createdAt"] = order["createdAt"].isoformat()
            
        return jsonify([order])
    except Exception as e:
        print(f"[ERROR] track_order_by_no failed: {e}")
        return jsonify({"error": "Failed to track order", "details": str(e)}), 500






# ================================
# DASHBOARD → ORDER STATISTICS
# ================================
@orders_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_order_stats():
    if get_current_user_role() != "admin":
        return jsonify({"error": "Admin access required"}), 403
        
    orders = list(order_col.find({}, {"product": 1, "items": 1}))
    
    stats_dict = {}
    for o in orders:
        products_in_order = []
        if o.get("items"):
            for item in o.get("items"):
                name = item.get("name") or item.get("product") or "Unknown"
                qty = item.get("quantity", 1)
                products_in_order.append({"name": name, "qty": qty})
        else:
            name = o.get("product") or "Unknown"
            qty = o.get("quantity", 1)
            products_in_order.append({"name": name, "qty": qty})
            
        for p in products_in_order:
            name_lower = str(p["name"]).lower()
            if "pickle" in name_lower:
                normalized = "Mushroom Pickle"
            elif "powder" in name_lower:
                normalized = "Mushroom Powder"
            elif "fresh" in name_lower or "oyster" in name_lower or "mushroom" in name_lower:
                normalized = "Fresh Oyster Mushroom"
            else:
                normalized = str(p["name"])
                
            # Aggregate by count of items (orders) or quantity? Let's count by number of times ordered (like original)
            stats_dict[normalized] = stats_dict.get(normalized, 0) + 1

    result = []
    for prod, count in stats_dict.items():
        result.append({
            "product": prod,
            "count": count
        })

    return jsonify(result)


# ================================
# USER → FETCH OWN ORDERS (AUTHENTICATED)
# ================================
@orders_bp.route("/my", methods=["GET"])
@jwt_required()
def my_orders():
    identity = get_jwt_identity()
    email = None
    if isinstance(identity, dict):
        email = identity.get("email")
    else:
        email = identity

    if not email:
        return jsonify({"error": "User email not found in token"}), 400

    orders = list(order_col.find({"email": email}))
    # Convert ObjectId to string and return relevant fields
    for o in orders:
        o["_id"] = str(o["_id"])
        if "createdAt" in o:
            o["createdAt"] = o["createdAt"].isoformat()
    return jsonify(orders)
