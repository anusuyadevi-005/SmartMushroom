from flask import redirect, url_for, jsonify
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import create_access_token
from db import users_col

oauth = OAuth()

google = oauth.register(
    name="google",
    client_id="YOUR_GOOGLE_CLIENT_ID",
    client_secret="YOUR_GOOGLE_CLIENT_SECRET",
    access_token_url="https://oauth2.googleapis.com/token",
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    api_base_url="https://www.googleapis.com/oauth2/v1/",
    client_kwargs={"scope": "openid email profile"},
)

def google_login():
    redirect_uri = url_for("google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

def google_callback():
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()

    email = user_info["email"]

    if not users_col.find_one({"email": email}):
        users_col.insert_one({
            "name": user_info["name"],
            "email": email,
            "picture": user_info["picture"]
        })

    access_token = create_access_token(identity=email)
    return redirect(f"http://localhost:3000/dashboard?token={access_token}")
