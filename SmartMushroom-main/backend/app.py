print("🔥 THIS APP.PY IS RUNNING 🔥")
from routes.ml_predict import ml_bp

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from flask_jwt_extended import JWTManager

from db import batch_col
from routes.expiry import expiry_bp
from routes.environment import env_bp
from routes.orders import orders_bp
from routes.dashboard import dashboard_bp
from routes.batch import batch_bp
from routes.products import products_bp
from routes.dishes import dishes_bp
from routes.reviews import reviews_bp

app = Flask(__name__)
# allow CORS from frontend during development and permit Authorization header
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization"]) 

# JWT config (used by auth routes)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-this-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# register blueprints
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)
app.register_blueprint(orders_bp, url_prefix='/orders')
app.register_blueprint(dashboard_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(products_bp)
app.register_blueprint(dishes_bp)
app.register_blueprint(reviews_bp)

try:
    from routes.auth import (
        google_login, google_callback, login, signup, 
        admin_login, admin_signup, get_wishlist, 
        add_to_wishlist, remove_from_wishlist, get_me, update_me, change_password, upload_picture
    )
    # Google endpoints (if configured)
    app.add_url_rule("/login/google", view_func=google_login)
    app.add_url_rule("/login/google/callback", view_func=google_callback)

    # User/Admin Identity
    app.add_url_rule("/auth/me", "get_me", get_me, methods=["GET"])
    app.add_url_rule("/auth/update", "update_me", update_me, methods=["PUT"])
    app.add_url_rule("/auth/change-password", "change_password", change_password, methods=["PUT"])
    app.add_url_rule("/auth/upload-picture", "upload_picture", upload_picture, methods=["POST"])

    # User Auth
    app.add_url_rule("/auth/signup", "signup", signup, methods=["POST"])
    app.add_url_rule("/auth/login", "login", login, methods=["POST"])

    # Admin Auth
    app.add_url_rule("/admin/login", "admin_login", admin_login, methods=["POST"])
    app.add_url_rule("/admin/signup", "admin_signup", admin_signup, methods=["POST"])

    # Wishlist
    app.add_url_rule("/wishlist", "get_wishlist", get_wishlist, methods=["GET"])
    app.add_url_rule("/wishlist/add", "add_to_wishlist", add_to_wishlist, methods=["POST"])
    app.add_url_rule("/wishlist/remove", "remove_from_wishlist", remove_from_wishlist, methods=["POST"])
except ImportError as e:
    print(f"⚠️  Auth dependency or module missing: {e}")
except Exception as e:
    print(f"⚠️  Unexpected error during auth registration: {e}")


@app.route("/")
def home():
    return jsonify({
        "status": "AgroSense Backend Running Successfully"
    })



if __name__ == "__main__":
    app.run(host='127.0.0.1', debug=True, use_reloader=True, threaded=True)

