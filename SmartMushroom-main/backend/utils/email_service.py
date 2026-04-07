from flask_mail import Message
from flask import current_app
import threading

# ─────────────────────────────────────────────
# CORE SENDER  (runs in background thread)
# ─────────────────────────────────────────────
def _send_async(app, msg):
    with app.app_context():
        mail = app.extensions['mail']
        mail.send(msg)


def send_email(to, subject, html_body, text_body=None):
    """
    Send an HTML email (with a plain-text fallback).
    Fires in a background thread so it never blocks a request.
    """
    app = current_app._get_current_object()
    msg = Message(
        subject=subject,
        sender=('SmartMushroom Team', 'smartmushroomteam@gmail.com'),
        recipients=[to]
    )
    msg.html = html_body
    msg.body = text_body or _strip_html(html_body)

    t = threading.Thread(target=_send_async, args=(app, msg))
    t.daemon = True
    t.start()


def _strip_html(html):
    """Very light HTML→plain-text strip."""
    import re
    return re.sub(r'<[^>]+>', '', html)


# ─────────────────────────────────────────────
# SHARED LAYOUT WRAPPER
# ─────────────────────────────────────────────
def _wrap(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body {{
      margin: 0; padding: 0;
      background: #f4f7f2;
      font-family: 'Inter', Arial, sans-serif;
      color: #2d3748;
    }}
    .wrapper {{
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }}
    .header {{
      background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
      padding: 36px 40px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }}
    .header p.tagline {{
      margin: 4px 0 0;
      color: rgba(255,255,255,0.85);
      font-size: 13px;
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #1a202c;
    }}
    .body p {{
      font-size: 15px;
      line-height: 1.7;
      color: #4a5568;
      margin: 0 0 16px;
    }}
    .info-box {{
      background: #f0f9f0;
      border-left: 4px solid #2e7d32;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 24px 0;
    }}
    .info-box table {{
      width: 100%;
      border-collapse: collapse;
    }}
    .info-box td {{
      padding: 6px 0;
      font-size: 14px;
    }}
    .info-box td.label {{
      color: #718096;
      width: 40%;
      font-weight: 600;
    }}
    .info-box td.value {{
      color: #1a202c;
      font-weight: 600;
    }}
    .status-badge {{
      display: inline-block;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}
    .badge-packed  {{ background:#e8f5e9; color:#2e7d32; }}
    .badge-shipped {{ background:#e3f2fd; color:#1565c0; }}
    .badge-delivered {{ background:#fff3e0; color:#e65100; }}
    .badge-confirmed {{ background:#f3e5f5; color:#6a1b9a; }}
    .cta-btn {{
      display: inline-block;
      margin: 8px 0 24px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #2e7d32, #43a047);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 30px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }}
    .divider {{
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }}
    .footer {{
      background: #f7fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }}
    .footer p {{
      font-size: 12px;
      color: #a0aec0;
      margin: 0;
      line-height: 1.7;
    }}
    .footer a {{ color: #2e7d32; text-decoration: none; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🍄 SmartMushroom</h1>
      <p class="tagline">Premium Mushroom Products — Grown with Technology</p>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      <p>
        © 2026 SmartMushroom Team · All rights reserved<br/>
        Questions? <a href="mailto:smartmushroomteam@gmail.com">smartmushroomteam@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>
"""


# ─────────────────────────────────────────────
# 1. WELCOME EMAIL  (on signup)
# ─────────────────────────────────────────────
def send_welcome_email(to: str, name: str):
    first = name.split()[0] if name else "there"
    content = f"""
    <h2>Welcome to SmartMushroom, {first}! 🎉</h2>
    <p>
      We're thrilled to have you join our growing community of mushroom enthusiasts.
      SmartMushroom brings you the freshest, IoT-monitored mushrooms — cultivated with
      precision and delivered to your doorstep.
    </p>
    <div class="info-box">
      <table>
        <tr>
          <td class="label">Account Email</td>
          <td class="value">{to}</td>
        </tr>
        <tr>
          <td class="label">Member Since</td>
          <td class="value">Today 🌱</td>
        </tr>
      </table>
    </div>
    <p>Here's what you can do next:</p>
    <p>🛍️ &nbsp;<strong>Browse Products</strong> — Explore our fresh mushroom varieties<br/>
       📦 &nbsp;<strong>Place an Order</strong> — Fast, reliable delivery to your home<br/>
       🌡️ &nbsp;<strong>Track Batches</strong> — Watch your mushrooms grow in real-time</p>
    <a class="cta-btn" href="http://localhost:3000">Start Shopping →</a>
    <hr class="divider"/>
    <p style="font-size:13px; color:#718096;">
      If you didn't create this account, please ignore this email or
      <a href="mailto:smartmushroomteam@gmail.com" style="color:#2e7d32;">contact us</a>.
    </p>
    """
    send_email(to, "Welcome to SmartMushroom! 🍄", _wrap(content))


# ─────────────────────────────────────────────
# 2. ORDER CONFIRMATION  (on order placement)
# ─────────────────────────────────────────────
def send_order_confirmation(to: str, name: str, order: dict):
    first = (name or "Customer").split()[0]
    order_no  = order.get("orderNo", "—")
    items     = order.get("items", [])
    total     = order.get("totalAmount", 0)
    address   = order.get("shippingAddress", {})
    addr_str  = f"{address.get('street','')}, {address.get('city','')}, {address.get('state','')}" \
                if isinstance(address, dict) else str(address)

    rows = ""
    for it in items:
        prod  = it.get("product") or it.get("name", "Item")
        qty   = it.get("quantity", 1)
        price = it.get("price", 0)
        rows += f"""
          <tr>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">{prod}</td>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0; text-align:center;">{qty}</td>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0; text-align:right;">₹{price * qty:.2f}</td>
          </tr>"""

    content = f"""
    <h2>Thank You for Your Order, {first}! 🎊</h2>
    <p>Your order has been received and is now being processed. We'll notify you
       as soon as it's packed and on its way.</p>

    <div class="info-box">
      <table>
        <tr>
          <td class="label">Order Number</td>
          <td class="value">#{order_no}</td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="value"><span class="status-badge badge-confirmed">Confirmed</span></td>
        </tr>
        <tr>
          <td class="label">Ship To</td>
          <td class="value">{addr_str or "—"}</td>
        </tr>
      </table>
    </div>

    <h3 style="margin:0 0 12px; font-size:16px; color:#2d3748;">🛒 Order Summary</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr style="border-bottom:2px solid #2e7d32;">
          <th style="text-align:left; padding:8px 0; color:#2e7d32;">Product</th>
          <th style="text-align:center; padding:8px 0; color:#2e7d32;">Qty</th>
          <th style="text-align:right; padding:8px 0; color:#2e7d32;">Amount</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0 0; font-weight:700; font-size:15px;">Total</td>
          <td style="padding:12px 0 0; text-align:right; font-weight:700; font-size:15px; color:#2e7d32;">₹{total:.2f}</td>
        </tr>
      </tfoot>
    </table>

    <hr class="divider"/>
    <p style="font-size:13px; color:#718096;">
      Need to make changes? You can manage your order from your
      <a href="http://localhost:3000/my-orders" style="color:#2e7d32;">order history</a>
      within 24 hours of placement.
    </p>
    """
    send_email(to, f"Order Confirmed — #{order_no} | SmartMushroom", _wrap(content))


# ─────────────────────────────────────────────
# 3. PAYMENT RECEIPT  (after payment)
# ─────────────────────────────────────────────
def send_payment_receipt(to: str, name: str, order: dict):
    first    = (name or "Customer").split()[0]
    order_no = order.get("orderNo", "—")
    total    = order.get("totalAmount", 0)
    items    = order.get("items", [])
    from datetime import datetime
    paid_at  = datetime.now().strftime("%d %b %Y, %I:%M %p")

    rows = ""
    for it in items:
        prod  = it.get("product") or it.get("name", "Item")
        qty   = it.get("quantity", 1)
        price = it.get("price", 0)
        rows += f"""
          <tr>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">{prod}</td>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0; text-align:center;">{qty}</td>
            <td style="padding:8px 0; border-bottom:1px solid #e2e8f0; text-align:right;">₹{price * qty:.2f}</td>
          </tr>"""

    content = f"""
    <h2>Payment Receipt 🧾</h2>
    <p>Hi {first}, your payment has been successfully received. Here is your official receipt.</p>

    <div class="info-box">
      <table>
        <tr>
          <td class="label">Receipt For</td>
          <td class="value">Order #{order_no}</td>
        </tr>
        <tr>
          <td class="label">Payment Status</td>
          <td class="value" style="color:#2e7d32;">✅ Paid</td>
        </tr>
        <tr>
          <td class="label">Date &amp; Time</td>
          <td class="value">{paid_at}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="value">Online / COD</td>
        </tr>
      </table>
    </div>

    <h3 style="margin:0 0 12px; font-size:16px; color:#2d3748;">🧾 Items Purchased</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr style="border-bottom:2px solid #2e7d32;">
          <th style="text-align:left; padding:8px 0; color:#2e7d32;">Product</th>
          <th style="text-align:center; padding:8px 0; color:#2e7d32;">Qty</th>
          <th style="text-align:right; padding:8px 0; color:#2e7d32;">Amount</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0 0; font-weight:700;">Total Paid</td>
          <td style="padding:12px 0 0; text-align:right; font-weight:700; font-size:16px; color:#2e7d32;">₹{total:.2f}</td>
        </tr>
      </tfoot>
    </table>

    <hr class="divider"/>
    <p style="font-size:13px; color:#718096;">
      Please keep this email as your payment proof.
      For any payment issues, reach us at
      <a href="mailto:smartmushroomteam@gmail.com" style="color:#2e7d32;">smartmushroomteam@gmail.com</a>.
    </p>
    """
    send_email(to, f"Payment Receipt — Order #{order_no} | SmartMushroom", _wrap(content))


# ─────────────────────────────────────────────
# 4. ORDER STATUS UPDATE  (admin action)
# ─────────────────────────────────────────────
_STATUS_META = {
    "PACKED": {
        "emoji": "📦",
        "badge": "badge-packed",
        "headline": "Your Order Has Been Packed!",
        "message": (
            "Great news! Your order has been carefully packed and is now "
            "ready for dispatch. Our delivery partner will pick it up very soon."
        ),
        "next": "We'll email you again once your order is out for delivery.",
        "subject": "Your Order is Packed 📦"
    },
    "SHIPPED": {
        "emoji": "🚚",
        "badge": "badge-shipped",
        "headline": "Your Order is On Its Way!",
        "message": (
            "Your order has been handed over to our delivery partner and "
            "is now on its way to you. Sit tight — it'll be there soon!"
        ),
        "next": "You'll receive another email when your order is delivered.",
        "subject": "Your Order Has Been Shipped 🚚"
    },
    "DELIVERED": {
        "emoji": "✅",
        "badge": "badge-delivered",
        "headline": "Your Order Has Been Delivered!",
        "message": (
            "Your order has been successfully delivered. We hope you enjoy "
            "your SmartMushroom products! Don't forget to leave a review."
        ),
        "next": "Thank you for choosing SmartMushroom. See you again! 🍄",
        "subject": "Order Delivered Successfully ✅"
    },
    "CANCELLED": {
        "emoji": "❌",
        "badge": "badge-confirmed",
        "headline": "Your Order Has Been Cancelled",
        "message": (
            "Your order has been cancelled as requested. If this was a mistake "
            "or you have questions, please contact our support team."
        ),
        "next": "We hope to serve you again soon.",
        "subject": "Order Cancelled | SmartMushroom"
    },
}

def send_order_status_update(to: str, name: str, order_no, new_status: str):
    first  = (name or "Customer").split()[0]
    status = new_status.upper()
    meta   = _STATUS_META.get(status, {
        "emoji": "🔔",
        "badge": "badge-confirmed",
        "headline": f"Order Status Updated to {status}",
        "message": f"Your order #{order_no} status has been updated to {status}.",
        "next": "Log in to your account to view more details.",
        "subject": f"Order Status Update — {status}"
    })

    content = f"""
    <h2>{meta['emoji']} {meta['headline']}</h2>
    <p>Hi {first},<br/>{meta['message']}</p>

    <div class="info-box">
      <table>
        <tr>
          <td class="label">Order Number</td>
          <td class="value">#{order_no}</td>
        </tr>
        <tr>
          <td class="label">Current Status</td>
          <td class="value">
            <span class="status-badge {meta['badge']}">{status}</span>
          </td>
        </tr>
      </table>
    </div>

    <p>{meta['next']}</p>
    <a class="cta-btn" href="http://localhost:3000/my-orders">View My Orders →</a>

    <hr class="divider"/>
    <p style="font-size:13px; color:#718096;">
      Questions about your delivery? Contact us at
      <a href="mailto:smartmushroomteam@gmail.com" style="color:#2e7d32;">smartmushroomteam@gmail.com</a>.
    </p>
    """
    send_email(to, f"{meta['subject']} — Order #{order_no} | SmartMushroom", _wrap(content))
