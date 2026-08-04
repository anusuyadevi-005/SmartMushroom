from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from db import batch_col, product_col
from routes.stock import log_stock_movement
from socketio_server import socketio

expiry_bp = Blueprint("expiry", __name__)

@expiry_bp.route("/expiry", methods=["GET"])
def check_expiry():
    now = datetime.now()

    batches = list(batch_col.find({}, {"_id": 0}))

    expired = []
    expiring_soon = []

    for b in batches:
        start = datetime.strptime(b["startDate"], "%Y-%m-%d")
        # Expiry is start + growthDays + 2, but we simplify to expiryDate string if available
        expiry_date_str = b.get("expiryDate")
        if expiry_date_str:
            expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
        else:
            expiry_date = start + timedelta(days=2)

        if now > expiry_date:
            expired.append(b)
        elif expiry_date - now <= timedelta(hours=36):
            expiring_soon.append(b)

        # ══ AUTO-CONVERSION LOGIC ══
        # If batch is harvested (COMPLETED), and 2 days have passed since harvest (lastUpdated)
        if b.get("stage") == "COMPLETED" and not b.get("autoConverted"):
            harvest_time = b.get("lastUpdated")
            if harvest_time and now > (harvest_time + timedelta(days=2)):
                source_id = b.get("productId")
                yield_qty = b.get("actualYield", 0)
                
                if source_id and yield_qty > 0:
                    source_product = product_col.find_one({"id": source_id})
                    # Check if it's a fresh mushroom (not already pickle/powder)
                    if source_product and "pickle" not in source_product.get("name", "").lower() and "powder" not in source_product.get("name", "").lower():
                        # Find a target product (default to pickle)
                        target_product = product_col.find_one({"name": {"$regex": "pickle", "$options": "i"}})
                        if target_product:
                            current_stock = source_product.get("stock", 0)
                            # Convert only what is left in stock up to the batch yield
                            convert_qty = min(int(yield_qty), current_stock)
                            
                            if convert_qty > 0:
                                new_source_stock = current_stock - convert_qty
                                new_target_stock = target_product.get("stock", 0) + convert_qty
                                
                                product_col.update_one({"id": source_id}, {"$set": {"stock": new_source_stock}})
                                product_col.update_one({"id": target_product["id"]}, {"$set": {"stock": new_target_stock}})
                                
                                reason = f"Auto-converted unsold fresh mushrooms from batch {b.get('batchId')}"
                                log_stock_movement(source_id, source_product.get("name"), -convert_qty, new_source_stock, reason, "conversion_out")
                                log_stock_movement(target_product["id"], target_product.get("name"), convert_qty, new_target_stock, reason, "conversion_in")
                                
                                try:
                                    socketio.emit('stock_update', {'id': source_id, 'stock': new_source_stock}, namespace='/')
                                    socketio.emit('stock_update', {'id': target_product["id"], 'stock': new_target_stock}, namespace='/')
                                except Exception:
                                    pass
                                    
                # Mark as processed so we don't do it again
                batch_col.update_one({"batchId": b.get("batchId")}, {"$set": {"autoConverted": True}})

    return jsonify({
        "expired": expired,
        "expiringSoon": expiring_soon
    })
