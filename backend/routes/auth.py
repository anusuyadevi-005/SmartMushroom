from flask import redirect, url_for, jsonify, request
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from db import users_col, admin_col
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
    users_col.insert_one({"name": name, "email": email, "password": hashed, "role": "user"})

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

