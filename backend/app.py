print("🔥 THIS APP.PY IS RUNNING 🔥")
from routes.ml_predict import ml_bp

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from db import batch_col
from routes.expiry import expiry_bp
from routes.environment import env_bp
from routes.orders import orders_bp
from routes.dashboard import dashboard_bp
from routes.batch import batch_bp
app = Flask(__name__)
# allow CORS from frontend during development
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# register blueprints
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(ml_bp)

try:
    from routes.auth import google_login, google_callback
    app.add_url_rule("/login/google", view_func=google_login)
    app.add_url_rule("/login/google/callback", view_func=google_callback)
except Exception:
    # auth dependencies missing in this environment (e.g., authlib)
    # skip registering Google auth routes so the app can run for development
    print("⚠️  Google auth routes not registered (missing dependencies)")


@app.route("/")
def home():
    return jsonify({
        "status": "AgroSense Backend Running Successfully"
    })



if __name__ == "__main__":
    app.run(host='localhost', debug=True, use_reloader=True)

