from flask import Blueprint, request, jsonify
import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

pay_bp = Blueprint("payments", __name__)

@pay_bp.route("/create-order", methods=["POST"])
def create_order():
    try:
        data = request.json
        amount_paisa = int(data.get("amount", 0) * 100)
        
        RAZOR_KEY = os.environ.get("RAZORPAY_KEY_ID")
        RAZOR_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

        if not RAZOR_KEY or not RAZOR_SECRET:
            return jsonify({"error": "Razorpay keys missing in .env"}), 401

        # STRICT PURITY: No mock fallback. This WILL fail if keys are wrong.
        client = razorpay.Client(auth=(RAZOR_KEY, RAZOR_SECRET))
        order_data = {
            "amount": amount_paisa,
            "currency": "INR",
            "payment_capture": 1 
        }
        
        razor_order = client.order.create(data=order_data)
        
        return jsonify({
            "orderId": razor_order["id"],
            "amount": razor_order["amount"],
            "currency": razor_order["currency"],
            "key": RAZOR_KEY
        }), 201

    except Exception as e:
        print(f"Razorpay PURE Error: {str(e)}")
        # We return 400 so the frontend knows the keys are the problem
        return jsonify({"error": str(e)}), 400

@pay_bp.route("/verify-payment", methods=["POST"])
def verify_payment():
    return jsonify({"status": "success"}), 200
