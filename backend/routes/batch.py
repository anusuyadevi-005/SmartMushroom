from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from db import batch_col
from flask_jwt_extended import jwt_required, get_jwt_identity

batch_bp = Blueprint("batch", __name__)

@batch_bp.route("/batch", methods=["POST"])
@jwt_required()
def create_batch():
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json

        if not data or "batchId" not in data or "startDate" not in data:
            return jsonify({"error": "batchId and startDate are required"}), 400

        start_date = datetime.strptime(data["startDate"], "%Y-%m-%d")
        growth_days = int(data.get("growthDays", 90))  # Default to 90 days if not provided

        # Calculate harvest date (start + growth period)
        harvest_date = start_date + timedelta(days=growth_days)

        # Calculate expiry date (harvest + 2 days shelf life)
        expiry_date = harvest_date + timedelta(days=2)

        batch = {
            "batchId": data["batchId"],
            "startDate": data["startDate"],
            "expiryDate": expiry_date.strftime("%Y-%m-%d"),
            "status": "ACTIVE",
            "createdAt": datetime.now()
        }

        try:
            batch_col.insert_one(batch)
            return jsonify({
                "message": "Batch created successfully",
                "expiryDate": batch["expiryDate"]
            }), 201
        except Exception as db_err:
            # If DB is unreachable (development environment), return success
            # with a warning so frontend can continue working locally.
            print(f"⚠️  DB insert failed: {db_err}")
            return jsonify({
                "message": "Batch created (DB unavailable, running in dev fallback)",
                "expiryDate": batch["expiryDate"],
                "warning": str(db_err)
            }), 201
    except Exception as e:
        return jsonify({"error": "Failed to create batch", "details": str(e)}), 500
@batch_bp.route("/batch", methods=["GET"])
def get_all_batches():
    try:
        batches = list(batch_col.find({}, {"_id": 0}))
        return jsonify(batches), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch batches", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>", methods=["GET"])
def get_batch(batch_id):
    try:
        batch = batch_col.find_one({"batchId": batch_id}, {"_id": 0})
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        return jsonify(batch), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch batch", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>/stage", methods=["PUT"])
@jwt_required()
def update_batch_stage(batch_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        new_stage = data.get("stage")
        notes = data.get("notes", "")

        if not new_stage:
            return jsonify({"error": "Stage is required"}), 400

        valid_stages = ["SPAWN", "INCUBATION", "FRUITING", "HARVEST", "COMPLETED"]
        if new_stage not in valid_stages:
            return jsonify({"error": f"Invalid stage. Must be one of: {', '.join(valid_stages)}"}), 400

        # Add to maintenance logs
        log_entry = {
            "timestamp": datetime.now(),
            "action": f"Stage changed to {new_stage}",
            "notes": notes,
            "type": "stage_update"
        }

        result = batch_col.update_one(
            {"batchId": batch_id},
            {
                "$set": {
                    "stage": new_stage,
                    "lastUpdated": datetime.now()
                },
                "$push": {"maintenanceLogs": log_entry}
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Batch {batch_id} stage updated to {new_stage}"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update batch stage", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>/maintenance", methods=["POST"])
@jwt_required()
def log_maintenance(batch_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        maintenance_type = data.get("type")  # watering, co2_adjustment, temperature_check, etc.
        value = data.get("value")  # measurement or adjustment amount
        notes = data.get("notes", "")

        if not maintenance_type:
            return jsonify({"error": "Maintenance type is required"}), 400

        log_entry = {
            "timestamp": datetime.now(),
            "action": maintenance_type,
            "value": value,
            "notes": notes,
            "type": "maintenance"
        }

        result = batch_col.update_one(
            {"batchId": batch_id},
            {
                "$push": {"maintenanceLogs": log_entry},
                "$set": {"lastUpdated": datetime.now()}
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Maintenance logged for batch {batch_id}"}), 201
    except Exception as e:
        return jsonify({"error": "Failed to log maintenance", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>/harvest", methods=["POST"])
@jwt_required()
def record_harvest(batch_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json
        actual_yield = data.get("actualYield")
        quality_score = data.get("qualityScore")
        notes = data.get("notes", "")

        if actual_yield is None:
            return jsonify({"error": "Actual yield is required"}), 400

        log_entry = {
            "timestamp": datetime.now(),
            "action": "Harvest completed",
            "value": actual_yield,
            "notes": notes,
            "type": "harvest"
        }

        result = batch_col.update_one(
            {"batchId": batch_id},
            {
                "$set": {
                    "stage": "COMPLETED",
                    "actualYield": actual_yield,
                    "qualityScore": quality_score,
                    "lastUpdated": datetime.now()
                },
                "$push": {"maintenanceLogs": log_entry}
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Harvest recorded for batch {batch_id}"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to record harvest", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>/environment", methods=["PUT"])
def update_batch_environment(batch_id):
    try:
        data = request.json
        environment_data = {
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "co2Level": data.get("co2Level"),
            "lightLevel": data.get("lightLevel"),
            "recordedAt": datetime.now()
        }

        result = batch_col.update_one(
            {"batchId": batch_id},
            {
                "$set": {
                    "currentEnvironment": environment_data,
                    "lastUpdated": datetime.now()
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Environment data updated for batch {batch_id}"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update environment data", "details": str(e)}), 500
@batch_bp.route("/batch/<batch_id>", methods=["PUT"])
@jwt_required()
def update_batch(batch_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.json

        if not data:
            return jsonify({"error": "Update data is required"}), 400

        # Build update object
        update_data = {"lastUpdated": datetime.now()}

        # Update allowed fields
        allowed_fields = ["batchId", "startDate", "expiryDate", "status", "stage", "growthDays"]
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Recalculate dates if startDate or growthDays changed
        if "startDate" in data or "growthDays" in data:
            start_date_str = data.get("startDate", None)
            if not start_date_str:
                # Get current start date from DB
                current_batch = batch_col.find_one({"batchId": batch_id})
                if current_batch:
                    start_date_str = current_batch.get("startDate")

            if start_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                growth_days = int(data.get("growthDays", 90))

                harvest_date = start_date + timedelta(days=growth_days)
                expiry_date = harvest_date + timedelta(days=2)

                update_data["expiryDate"] = expiry_date.strftime("%Y-%m-%d")

        result = batch_col.update_one(
            {"batchId": batch_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Batch {batch_id} updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update batch", "details": str(e)}), 500

@batch_bp.route("/batch/<batch_id>", methods=["DELETE"])
@jwt_required()
def delete_batch(batch_id):
    try:
        identity = get_jwt_identity() or {}
        role = identity.get("role") if isinstance(identity, dict) else None
        if role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        result = batch_col.delete_one({"batchId": batch_id})

        if result.deleted_count == 0:
            return jsonify({"error": "Batch not found"}), 404

        return jsonify({"message": f"Batch {batch_id} deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete batch", "details": str(e)}), 500

@batch_bp.route("/predict/harvest", methods=["POST"])
def predict_harvest():
    try:
        data = request.json
        days = int(data.get("days_since_spawn", 0))

        # Dummy ML logic (replace later with real model)
        prediction = {
            "expected_harvest_day": max(0, 90 - days),
            "expected_yield_kg": round(1.5 + (days * 0.02), 2),
            "current_temperature": 24,
            "current_humidity": 88
        }

        return jsonify(prediction), 200

    except Exception as e:
        return jsonify({
            "error": "Prediction failed",
            "details": str(e)
        }), 500
