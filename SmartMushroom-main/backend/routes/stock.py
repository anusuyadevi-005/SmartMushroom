from flask import Blueprint, request, jsonify
from datetime import datetime
from db import product_col, stock_history_col
from flask_jwt_extended import jwt_required
from routes.auth import get_current_user_role
from socketio_server import socketio

stock_bp = Blueprint("stock", __name__)

LOW_STOCK_THRESHOLD = 10  # Default threshold for low-stock alerts


# ─────────────────────────────────────────────
# Helper: Log a stock movement to history
# ─────────────────────────────────────────────
def log_stock_movement(product_id, product_name, change_qty, new_stock, reason, movement_type, reference_id=None):
    """
    Record every stock change for audit trail.
    movement_type: 'order' | 'cancellation' | 'manual_adjust' | 'harvest' | 'restock'
    """
    try:
        entry = {
            "productId": product_id,
            "productName": product_name,
            "changeQty": change_qty,        # negative for deductions, positive for additions
            "newStock": new_stock,
            "reason": reason,
            "type": movement_type,
            "referenceId": reference_id,     # e.g. order ID
            "timestamp": datetime.now()
        }
        if stock_history_col is not None:
            stock_history_col.insert_one(entry)
    except Exception as e:
        print(f"[STOCK] Failed to log stock movement: {e}")


# ═══════════════════════════════════════════════
# GET /stock/summary — All products with stock info
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/summary", methods=["GET"])
def get_stock_summary():
    try:
        products = list(product_col.find({}, {"_id": 0, "id": 1, "name": 1, "stock": 1, "price": 1, "unit": 1, "image": 1}))
        summary = []
        total_items = 0
        low_stock_count = 0
        out_of_stock_count = 0

        for p in products:
            stock = p.get("stock", 0)
            if stock is None:
                stock = 0
            total_items += stock

            status = "in_stock"
            if stock == 0:
                status = "out_of_stock"
                out_of_stock_count += 1
            elif stock <= LOW_STOCK_THRESHOLD:
                status = "low_stock"
                low_stock_count += 1

            summary.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "stock": stock,
                "price": p.get("price"),
                "unit": p.get("unit"),
                "image": p.get("image"),
                "status": status
            })

        return jsonify({
            "products": summary,
            "totalProducts": len(products),
            "totalItems": total_items,
            "lowStockCount": low_stock_count,
            "outOfStockCount": out_of_stock_count
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch stock summary", "details": str(e)}), 500


# ═══════════════════════════════════════════════
# PUT /stock/<product_id>/adjust — Manual stock adjust
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/<product_id>/adjust", methods=["PUT"])
@jwt_required()
def adjust_stock(product_id):
    try:
        if get_current_user_role() != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json()
        adjustment = data.get("adjustment")  # positive to add, negative to subtract
        reason = data.get("reason", "Manual adjustment")

        if adjustment is None:
            return jsonify({"error": "adjustment field is required"}), 400

        try:
            adjustment = int(adjustment)
        except (ValueError, TypeError):
            return jsonify({"error": "adjustment must be an integer"}), 400

        product = product_col.find_one({"id": product_id})
        if not product:
            return jsonify({"error": "Product not found"}), 404

        current_stock = product.get("stock", 0) or 0
        new_stock = max(0, current_stock + adjustment)  # Never go below 0

        # Update product stock
        product_col.update_one({"id": product_id}, {"$set": {"stock": new_stock}})

        # Log to audit trail
        movement_type = "restock" if adjustment > 0 else "manual_adjust"
        log_stock_movement(
            product_id=product_id,
            product_name=product.get("name", ""),
            change_qty=adjustment,
            new_stock=new_stock,
            reason=reason,
            movement_type=movement_type
        )

        # Emit real-time update via Socket.IO
        try:
            socketio.emit('stock_update', {
                'id': product_id,
                'name': product.get("name", ""),
                'stock': new_stock,
                'change': adjustment,
                'reason': reason,
                'type': movement_type
            }, namespace='/')
        except Exception:
            pass

        return jsonify({
            "message": f"Stock adjusted for {product.get('name', product_id)}",
            "previousStock": current_stock,
            "adjustment": adjustment,
            "newStock": new_stock
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to adjust stock", "details": str(e)}), 500


# ═══════════════════════════════════════════════
# GET /stock/history — Audit trail of all movements
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/history", methods=["GET"])
@jwt_required()
def get_stock_history():
    try:
        if get_current_user_role() != "admin":
            return jsonify({"error": "Admin access required"}), 403

        # Optional query params for filtering
        product_id = request.args.get("productId")
        movement_type = request.args.get("type")
        limit = int(request.args.get("limit", 100))

        query = {}
        if product_id:
            query["productId"] = product_id
        if movement_type:
            query["type"] = movement_type

        history = list(
            stock_history_col.find(query, {"_id": 0})
            .sort("timestamp", -1)
            .limit(limit)
        )

        # Convert datetime to ISO string
        for entry in history:
            if "timestamp" in entry and isinstance(entry["timestamp"], datetime):
                entry["timestamp"] = entry["timestamp"].isoformat()

        return jsonify(history), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch stock history", "details": str(e)}), 500


# ═══════════════════════════════════════════════
# GET /stock/alerts — Products below threshold
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/alerts", methods=["GET"])
def get_stock_alerts():
    try:
        threshold = int(request.args.get("threshold", LOW_STOCK_THRESHOLD))

        products = list(product_col.find(
            {"stock": {"$lte": threshold}},
            {"_id": 0, "id": 1, "name": 1, "stock": 1, "unit": 1, "image": 1}
        ))

        alerts = []
        for p in products:
            stock = p.get("stock", 0)
            if stock is None:
                stock = 0
            severity = "critical" if stock == 0 else "warning"
            alerts.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "stock": stock,
                "unit": p.get("unit"),
                "image": p.get("image"),
                "severity": severity,
                "message": f"{'OUT OF STOCK' if stock == 0 else f'Low stock: {stock} units remaining'}"
            })

        return jsonify(alerts), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch stock alerts", "details": str(e)}), 500


# ═══════════════════════════════════════════════
# PUT /stock/<product_id>/set — Set stock to exact value
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/<product_id>/set", methods=["PUT"])
@jwt_required()
def set_stock(product_id):
    try:
        if get_current_user_role() != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json()
        new_stock = data.get("stock")
        reason = data.get("reason", "Stock count correction")

        if new_stock is None:
            return jsonify({"error": "stock field is required"}), 400

        try:
            new_stock = max(0, int(new_stock))
        except (ValueError, TypeError):
            return jsonify({"error": "stock must be an integer"}), 400

        product = product_col.find_one({"id": product_id})
        if not product:
            return jsonify({"error": "Product not found"}), 404

        current_stock = product.get("stock", 0) or 0
        change = new_stock - current_stock

        product_col.update_one({"id": product_id}, {"$set": {"stock": new_stock}})

        log_stock_movement(
            product_id=product_id,
            product_name=product.get("name", ""),
            change_qty=change,
            new_stock=new_stock,
            reason=reason,
            movement_type="manual_adjust"
        )

        try:
            socketio.emit('stock_update', {
                'id': product_id,
                'name': product.get("name", ""),
                'stock': new_stock,
                'change': change,
                'reason': reason,
                'type': 'manual_adjust'
            }, namespace='/')
        except Exception:
            pass

        return jsonify({
            "message": f"Stock set for {product.get('name', product_id)}",
            "previousStock": current_stock,
            "newStock": new_stock
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to set stock", "details": str(e)}), 500

# ═══════════════════════════════════════════════
# POST /stock/convert — Convert one product to another
# ═══════════════════════════════════════════════
@stock_bp.route("/stock/convert", methods=["POST"])
@jwt_required()
def convert_stock():
    try:
        if get_current_user_role() != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json()
        source_id = data.get("sourceProductId")
        target_id = data.get("targetProductId")
        source_qty = int(data.get("sourceQty", 0))
        target_qty = int(data.get("targetQty", 0))
        reason = data.get("reason", "Expired stock converted to processed product")

        if source_qty <= 0 or target_qty <= 0:
            return jsonify({"error": "Quantities must be greater than 0"}), 400

        source = product_col.find_one({"id": source_id})
        target = product_col.find_one({"id": target_id})

        if not source or not target:
            return jsonify({"error": "Source or target product not found"}), 404

        if source.get("stock", 0) < source_qty:
            return jsonify({"error": f"Insufficient stock of {source.get('name')} to convert"}), 400

        new_source_stock = source.get("stock", 0) - source_qty
        new_target_stock = target.get("stock", 0) + target_qty

        product_col.update_one({"id": source_id}, {"$set": {"stock": new_source_stock}})
        product_col.update_one({"id": target_id}, {"$set": {"stock": new_target_stock}})

        log_stock_movement(source_id, source.get("name"), -source_qty, new_source_stock, reason, "manual_adjust")
        log_stock_movement(target_id, target.get("name"), target_qty, new_target_stock, reason, "restock")

        try:
            socketio.emit('stock_update', {'id': source_id, 'stock': new_source_stock}, namespace='/')
            socketio.emit('stock_update', {'id': target_id, 'stock': new_target_stock}, namespace='/')
        except Exception:
            pass

        return jsonify({"message": "Stock converted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to convert stock", "details": str(e)}), 500
