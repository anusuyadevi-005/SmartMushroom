from flask import redirect, url_for, jsonify, request
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from db import users_col, admin_col
from datetime import datetime
import os

oauth = OAuth()

# Google OAuth (optional) - keep existing behavior if authlib is available
try:
    google = oauth.register(
        name="google",
        client_id=os.environ.get("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", "YOUR_GOOGLE_CLIENT_SECRET"),
        access_token_url="https://oauth2.googleapis.com/token",
        authorize_url="https://accounts.google.com/o/oauth2/auth",
        api_base_url="https://www.googleapis.com/oauth2/v1/",
        client_kwargs={"scope": "openid email profile"},
    )
except Exception:
    google = None

def get_current_user_role():
    """Helper to extract role from JWT claims safely."""
    identity = get_jwt_identity()
    claims = get_jwt()
    role = None
    if isinstance(identity, dict):
        role = identity.get("role")
    if not role:
        role = claims.get("role")
    return role


def google_login():
    if not google:
        return jsonify({"error": "Google auth not configured"}), 501
    redirect_uri = url_for("google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)


def google_callback():
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()

    email = user_info["email"]

    if not users_col.find_one({"email": email}):
        users_col.insert_one({
            "name": user_info.get("name"),
            "email": email,
            "picture": user_info.get("picture")
        })

    access_token = create_access_token(identity=email, additional_claims={"role": "user"})
    return redirect(f"http://localhost:3000/dashboard?token={access_token}")


# User signup
def signup():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409

    hashed = generate_password_hash(password)
    new_user = {
        "name": name,
        "email": email,
        "password": hashed,
        "role": "user",
        "phone": data.get("phone"),
        "address": data.get("address"),
        "mushroomInterest": data.get("mushroomInterest"),
        "createdAt": datetime.utcnow()
    }
    users_col.insert_one(new_user)

    token = create_access_token(identity=email, additional_claims={"role": "user"})
    return jsonify({"token": token, "role": "user"})


# User login
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_col.find_one({"email": email})
    if not user or not user.get("password"):
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=email, additional_claims={"role": user.get("role", "user")})
    return jsonify({"token": token, "role": user.get("role", "user")})


# Admin signup (requires ADMIN_KEY env var if set, otherwise only allowed if no admins exist)
def admin_signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    admin_key = data.get("admin_key")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # If ADMIN_KEY is set in env, require it. Otherwise only allow first admin to be created.
    expected = os.environ.get("ADMIN_KEY")
    if expected:
        if not admin_key or admin_key != expected:
            return jsonify({"error": "Invalid admin key"}), 401
    else:
        if admin_col.count_documents({}) > 0:
            return jsonify({"error": "Admin signup disabled. Contact existing admin."}), 403

    if admin_col.find_one({"email": email}):
        return jsonify({"error": "Admin already exists"}), 409

    hashed = generate_password_hash(password)
    admin_col.insert_one({"email": email, "password": hashed, "role": "admin"})

    token = create_access_token(identity=email, additional_claims={"role": "admin"})
    return jsonify({"token": token, "role": "admin"})


# Admin login - check admin collection
def admin_login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    admin = admin_col.find_one({"email": email})
    if not admin or not admin.get("password"):
        return jsonify({"error": "Invalid admin credentials"}), 401

    if not check_password_hash(admin["password"], password):
        return jsonify({"error": "Invalid admin credentials"}), 401

    token = create_access_token(identity=email, additional_claims={"role": "admin"})
    return jsonify({"token": token, "role": "admin"})


# Wishlist management
@jwt_required()
def get_wishlist():
    try:
        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        
        # Verify role (Admin should not have a wishlist in this context)
        jwt_data = get_jwt()
        if jwt_data.get("role") == "admin":
             return jsonify({"error": "Admins cannot have wishlists"}), 403

        if not email:
            return jsonify({"error": "User email not found"}), 400

        user = users_col.find_one({"email": email}, {"wishlist": 1, "_id": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404

        wishlist_ids = user.get("wishlist", [])
        from db import product_col
        products = list(product_col.find({"id": {"$in": wishlist_ids}}, {"_id": 0}))
        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@jwt_required()
def add_to_wishlist():
    try:
        jwt_data = get_jwt()
        if jwt_data.get("role") == "admin":
             return jsonify({"error": "Admins cannot manage wishlists"}), 403

        data = request.get_json() or {}
        product_id = data.get("productId")
        if not product_id:
            return jsonify({"error": "productId is required"}), 400

        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        
        result = users_col.update_one(
            {"email": email},
            {"$addToSet": {"wishlist": product_id}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({"message": "Added to wishlist"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@jwt_required()
def remove_from_wishlist():
    try:
        jwt_data = get_jwt()
        if jwt_data.get("role") == "admin":
             return jsonify({"error": "Admins cannot manage wishlists"}), 403

        data = request.get_json() or {}
        product_id = data.get("productId")
        if not product_id:
            return jsonify({"error": "productId is required"}), 400

        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        
        result = users_col.update_one(
            {"email": email},
            {"$pull": {"wishlist": product_id}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({"message": "Removed from wishlist"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_me():
    try:
        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        role = get_current_user_role()

        # Check in appropriate collection based on role
        collection = admin_col if role == "admin" else users_col
        user = collection.find_one({"email": email}, {"password": 0, "_id": 0})
        
        if not user:
            return jsonify({"error": "User profile not found"}), 404
            
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def update_me():
    try:
        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        role = get_current_user_role()

        data = request.get_json() or {}
        update_fields = {}
        
        if "name" in data: update_fields["name"] = data["name"]
        if "phone" in data: update_fields["phone"] = data["phone"]
        if "address" in data: update_fields["address"] = data["address"]

        if not update_fields:
            return jsonify({"error": "No fields provided to update"}), 400

        collection = admin_col if role == "admin" else users_col
        result = collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def change_password():
    try:
        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        role = get_current_user_role()

        data = request.get_json() or {}
        old_password = data.get("oldPassword")
        new_password = data.get("newPassword")

        if not old_password or not new_password:
            return jsonify({"error": "Old and new passwords are required"}), 400

        collection = admin_col if role == "admin" else users_col
        user = collection.find_one({"email": email})
        
        if not user or not user.get("password"):
            return jsonify({"error": "User not found or password login not available"}), 404

        if not check_password_hash(user["password"], old_password):
            return jsonify({"error": "Incorrect old password"}), 401

        hashed = generate_password_hash(new_password)
        collection.update_one(
            {"email": email},
            {"$set": {"password": hashed}}
        )
        
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
from werkzeug.utils import secure_filename

@jwt_required()
def upload_picture():
    try:
        identity = get_jwt_identity()
        email = identity.get("email") if isinstance(identity, dict) else identity
        role = get_current_user_role()

        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file:
            filename = secure_filename(f"{email.replace('@', '_').replace('.', '_')}_{file.filename}")
            # Ensure static/uploads exists (this might be better in app.py or as a one-time setup)
            upload_folder = os.path.join('static', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)

            # URL for the frontend
            picture_url = f"http://localhost:5000/static/uploads/{filename}"

            collection = admin_col if role == "admin" else users_col
            collection.update_one(
                {"email": email},
                {"$set": {"picture": picture_url}}
            )

            return jsonify({"message": "Picture uploaded successfully", "picture": picture_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
