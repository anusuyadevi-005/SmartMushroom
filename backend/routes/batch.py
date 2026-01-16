from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from db import batch_col

batch_bp = Blueprint("batch", __name__)

@batch_bp.route("/batch", methods=["POST"])
def create_batch():
    try:
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
def update_batch_stage(batch_id):
    try:
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
def log_maintenance(batch_id):
    try:
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
def record_harvest(batch_id):
    try:
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
