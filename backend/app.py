print("🔥 THIS APP.PY IS RUNNING 🔥")
from routes.ml_predict import ml_bp

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
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

app = Flask(__name__)
# allow CORS from frontend during development
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002"]}})

# JWT config (used by auth routes)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-this-secret')
jwt = JWTManager(app)

# register blueprints
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(products_bp)

try:
    from routes.auth import google_login, google_callback, login, signup, admin_login, admin_signup
    # Google endpoints (if configured)
    app.add_url_rule("/login/google", view_func=google_login)
    app.add_url_rule("/login/google/callback", view_func=google_callback)

    # User auth
    app.add_url_rule("/auth/signup", "signup", signup, methods=["POST"])
    app.add_url_rule("/auth/login", "login", login, methods=["POST"])

    # Admin auth
    app.add_url_rule("/admin/login", "admin_login", admin_login, methods=["POST"])
    app.add_url_rule("/admin/signup", "admin_signup", admin_signup, methods=["POST"])
except Exception as e:
    # auth dependencies missing in this environment (e.g., authlib)
    print("⚠️  Some auth routes not registered:", e)

# Register admin login/signup route fallback if import partially failed
try:
    from routes.auth import admin_login, admin_signup
    app.add_url_rule("/admin/login", "admin_login", admin_login, methods=["POST"])
    app.add_url_rule("/admin/signup", "admin_signup", admin_signup, methods=["POST"])
except ImportError:
    print("⚠️  Admin auth not available")


@app.route("/")
def home():
    return jsonify({
        "status": "AgroSense Backend Running Successfully"
    })



if __name__ == "__main__":
    app.run(host='127.0.0.1', debug=True, use_reloader=False, threaded=True)

