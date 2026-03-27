from flask import Blueprint, request, jsonify
from db import reviews_col, order_col, users_col
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from bson import ObjectId
from datetime import datetime

reviews_bp = Blueprint("reviews", __name__)


def _get_email_and_role():
    """Helper to extract email and role from JWT."""
    identity = get_jwt_identity()
    claims = get_jwt()
    email = identity.get("email") if isinstance(identity, dict) else identity
    role = identity.get("role") if isinstance(identity, dict) else claims.get("role")
    return email, role


def _has_delivered_order(email, product_id):
    """
    Returns True if the user has at least one DELIVERED order
    that contains the given product_id. Handles both:
    - multi-item cart orders (items array with variantId / id / product fields)
    - legacy single-product orders (top-level 'product' field)
    Uses separate queries to avoid $or inside $elemMatch (unsupported by MongoDB).
    """
    if order_col is None:
        return False

    # Fetch all DELIVERED orders for this user (usually a small set)
    delivered = list(order_col.find({"email": email, "status": "DELIVERED"}))

    for order in delivered:
        # Check legacy single-product field
        if order.get("product") == product_id:
            return True

        # Check items array
        for item in order.get("items", []):
            variant_id = item.get("variantId", "")
            item_id = item.get("id", "")
            item_product = item.get("product", "")

            if (variant_id == product_id or
                    item_product == product_id or
                    item_id == product_id or
                    (isinstance(item_id, str) and item_id.startswith(product_id + "_")) or
                    (isinstance(variant_id, str) and variant_id.startswith(product_id + "_"))):
                return True

    return False


# ============================================================
# GET /reviews/<product_id>  — Public: fetch all reviews
# ============================================================
@reviews_bp.route("/reviews/<product_id>", methods=["GET"])
def get_reviews(product_id):
    try:
        if reviews_col is None:
            return jsonify({"error": "Database not available"}), 500

        raw = list(reviews_col.find({"productId": product_id}).sort("createdAt", -1))

        for r in raw:
            r["_id"] = str(r["_id"])
            if "createdAt" in r and isinstance(r["createdAt"], datetime):
                r["createdAt"] = r["createdAt"].isoformat()

        count = len(raw)
        avg_rating = round(sum(r["rating"] for r in raw) / count, 1) if count else 0

        return jsonify({
            "reviews": raw,
            "avgRating": avg_rating,
            "count": count
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch reviews", "details": str(e)}), 500


# ============================================================
# POST /reviews/<product_id>  — JWT required: submit review
# ============================================================
@reviews_bp.route("/reviews/<product_id>", methods=["POST"])
@jwt_required()
def submit_review(product_id):
    try:
        if reviews_col is None:
            return jsonify({"error": "Database not available"}), 500

        email, role = _get_email_and_role()

        if role == "admin":
            return jsonify({"error": "Admins cannot submit reviews"}), 403

        # Verify the user has actually purchased and received this product
        verified = _has_delivered_order(email, product_id)

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        rating = data.get("rating")
        if not rating or not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be a number between 1 and 5"}), 400

        title = data.get("title", "").strip()
        body = data.get("body", "").strip()

        if not body:
            return jsonify({"error": "Review body is required"}), 400

        # Prevent duplicate reviews from the same user for the same product
        existing = reviews_col.find_one({"productId": product_id, "userEmail": email})
        if existing:
            return jsonify({"error": "You have already reviewed this product"}), 409

        # Get user's display name from users collection
        user_doc = users_col.find_one({"email": email}) if users_col is not None else None
        user_name = (user_doc or {}).get("name") or email.split("@")[0].title()

        review = {
            "productId": product_id,
            "userEmail": email,
            "userName": user_name,
            "rating": int(rating),
            "title": title,
            "body": body,
            "verifiedPurchase": verified,
            "createdAt": datetime.now()
        }

        result = reviews_col.insert_one(review)
        review["_id"] = str(result.inserted_id)
        review["createdAt"] = review["createdAt"].isoformat()

        return jsonify({"message": "Review submitted successfully", "review": review}), 201

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in submit_review: {e}")
        print(error_trace)
        return jsonify({
            "error": "Failed to submit review",
            "details": str(e),
            "traceback": error_trace
        }), 500


# ============================================================
# DELETE /reviews/<review_id>  — JWT + Admin: delete a review
# ============================================================
@reviews_bp.route("/reviews/<review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    try:
        if reviews_col is None:
            return jsonify({"error": "Database not available"}), 500

        email, role = _get_email_and_role()

        review = reviews_col.find_one({"_id": ObjectId(review_id)})
        if not review:
            return jsonify({"error": "Review not found"}), 404

        # Allow admin or the review author to delete
        if role != "admin" and review.get("userEmail") != email:
            return jsonify({"error": "Unauthorized to delete this review"}), 403

        reviews_col.delete_one({"_id": ObjectId(review_id)})
        return jsonify({"message": "Review deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Failed to delete review", "details": str(e)}), 500
