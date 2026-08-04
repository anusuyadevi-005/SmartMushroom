print("🔥 THIS APP.PY IS RUNNING 🔥")
from routes.ml_predict import ml_bp
from routes.chat import chat_bp

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
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
from routes.stock import stock_bp
from routes.auth import oauth as auth_oauth
from routes.payments import pay_bp

app = Flask(__name__)
app.secret_key = os.environ.get("APP_SECRET_KEY", "secret123")

# allow CORS from frontend during development and permit Authorization header
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization"]) 

# JWT config (used by auth routes)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-this-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
# ✅ MAIL CONFIG (ADD THIS ONLY - DON'T MODIFY ABOVE CODE)
from flask_mail import Mail

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'smartmushroomteam@gmail.com'
app.config['MAIL_PASSWORD'] = 'siun jfor bulb poin'

mail = Mail(app)

from utils.email_service import send_email

# Socket.IO server (initialized separately so routes can import it)
from socketio_server import socketio
socketio.init_app(app)
# register blueprints
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)
app.register_blueprint(orders_bp, url_prefix='/orders')
app.register_blueprint(dashboard_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(products_bp)
app.register_blueprint(dishes_bp)
app.register_blueprint(reviews_bp)
app.register_blueprint(stock_bp)
from routes.payments import pay_bp
app.register_blueprint(pay_bp, url_prefix='/payments')

try:
    from routes.auth import (
        google_login, google_callback, login, signup, 
        admin_login, admin_signup, get_wishlist, 
        add_to_wishlist, remove_from_wishlist, get_me, update_me, change_password, upload_picture
    )
    auth_oauth.init_app(app)
    # Google endpoints (if configured)
    app.add_url_rule("/login/google", view_func=google_login)
    app.add_url_rule("/authorize", "google_callback", google_callback, methods=["GET"])

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

@app.route("/test-mail")
def test_mail():
    send_email(
        "your_personal_email@gmail.com",  # where you want to receive
        "Test Mail ✅",
        "Your SmartMushroom email system is working!"
    )
    return "Mail sent successfully!"



if __name__ == "__main__":
    # Use Socket.IO runner (eventlet recommended in requirements)
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)

