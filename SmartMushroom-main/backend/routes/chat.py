from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
import os, re

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

chat_bp = Blueprint("chat", __name__)

# ═══════════════════════════════════════════════════════════
#  LIVE DATA HELPERS
# ═══════════════════════════════════════════════════════════

def _get_weather():
    try:
        import requests as req
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            return None
        city = "kovilpatti"
        url = (f"http://api.openweathermap.org/data/2.5/weather"
               f"?q={city}&appid={api_key}&units=metric")
        r = req.get(url, timeout=5)
        r.raise_for_status()
        d = r.json()
        feels = round(d["main"].get("feels_like", d["main"]["temp"]))
        wind  = d.get("wind", {}).get("speed", 0)
        return {
            "temperature":   round(d["main"]["temp"]),
            "feels_like":    feels,
            "humidity":      d["main"]["humidity"],
            "pressure":      d["main"].get("pressure", 0),
            "description":   d["weather"][0]["description"].title(),
            "wind_speed":    wind,
            "visibility":    d.get("visibility", 0),
            "status":        "WARNING" if d["main"]["temp"] > 35 else "SAFE",
            "city":          city.title(),
        }
    except Exception:
        return None


def _get_products():
    try:
        from db import product_col
        if product_col is None:
            return []
        return list(product_col.find({}, {"_id": 0}))
    except Exception:
        return []


def _get_order_stats():
    try:
        from db import order_col
        if order_col is None:
            return {}
        total      = order_col.count_documents({})
        pending    = order_col.count_documents({"status": "PENDING"})
        delivered  = order_col.count_documents({"status": "DELIVERED"})
        processing = order_col.count_documents({"status": "PROCESSING"})
        cancelled  = order_col.count_documents({"status": "CANCELLED"})
        shipped    = order_col.count_documents({"status": "SHIPPED"})
        return {
            "total": total, "pending": pending,
            "delivered": delivered, "processing": processing,
            "cancelled": cancelled, "shipped": shipped,
        }
    except Exception:
        return {}


def _get_batches():
    try:
        from db import batch_col
        if batch_col is None:
            return []
        return list(batch_col.find({}, {"_id": 0}))
    except Exception:
        return []


def _get_user_orders(email):
    try:
        from db import order_col
        if order_col is None or not email:
            return []
        orders = list(order_col.find({"email": email}, {"_id": 0}))
        for o in orders:
            if "createdAt" in o and isinstance(o["createdAt"], datetime):
                o["createdAt"] = o["createdAt"].isoformat()
        return orders
    except Exception:
        return []


def _get_reviews():
    try:
        from db import reviews_col
        if reviews_col is None:
            return []
        return list(reviews_col.find({}, {"_id": 0}).sort("createdAt", -1).limit(5))
    except Exception:
        return []


# ═══════════════════════════════════════════════════════════
#  INTENT ENGINE  — keyword lists + scorer
# ═══════════════════════════════════════════════════════════

INTENT_MAP = {
    # ── environment ─────────────────────────────────────────
    "weather": [
        "weather", "temperature", "temp", "humidity", "humid",
        "climate", "environment", "hot", "cold", "warm", "cool",
        "rain", "wind", "pressure", "air quality", "airquality",
        "atmosphere", "condition", "forecast", "outside", "kovilpatti",
        "how hot", "how cold", "how warm", "current temp",
    ],
    # ── batches / cultivation ────────────────────────────────
    "batches": [
        "batch", "batches", "cultivation", "cultivate", "spawn", "spawning",
        "incubation", "incubate", "fruiting", "harvest", "harvesting",
        "mushroom grow", "growing", "stage", "growth", "substrate",
        "mycelium", "pinning", "flush", "second flush", "log",
        "farm", "farming", "how many batches", "active batch",
        "batch status", "batch list", "show batch",
    ],
    # ── yield / ML ──────────────────────────────────────────
    "yield": [
        "yield", "predict", "prediction", "ml", "machine learning",
        "ai predict", "kg", "kilogram", "how much yield",
        "expected yield", "harvest estimate", "harvest prediction",
        "yield forecast", "predicted kg",
    ],
    # ── inventory / stock ────────────────────────────────────
    "inventory": [
        "stock", "inventory", "available", "availability", "in stock",
        "out of stock", "how many", "quantity", "units left",
        "remaining", "current stock", "low stock", "restock",
        "how much stock", "is there stock",
    ],
    # ── order analytics (admin) ──────────────────────────────
    "order_stats": [
        "order count", "total orders", "order analytics",
        "order statistics", "order summary", "order report",
        "how many orders", "pending orders", "delivered orders",
        "cancelled orders", "shipped orders", "order overview",
        "orders today", "daily orders",
    ],
    # ── customer's own orders ────────────────────────────────
    "my_orders": [
        "my order", "my orders", "track order", "track my order",
        "where is my order", "where is my", "order status",
        "order tracking", "order history", "past orders",
        "view orders", "my purchase", "did i order",
    ],
    # ── products ─────────────────────────────────────────────
    "products": [
        "product", "products", "catalog", "catalogue",
        "what do you sell", "what is available", "show me",
        "list product", "what products", "items for sale",
        "what can i buy", "show products", "product list",
        "what mushrooms", "do you have",
    ],
    # ── price ────────────────────────────────────────────────
    "price": [
        "price", "cost", "how much", "rate", "pricing",
        "how much does", "what is the price", "charges",
        "fee", "amount", "rupee", "rs", "₹", "inr", "expensive",
        "cheap", "affordable", "value",
    ],
    # ── discounts / offers ───────────────────────────────────
    "discounts": [
        "discount", "offer", "deal", "sale", "promo", "coupon",
        "voucher", "cashback", "savings", "reduced", "special price",
        "any offer", "current offer", "today offer",
        "promotional", "reduced price", "off",
    ],
    # ── mushroom benefits / nutrition ────────────────────────
    "mushroom_info": [
        "benefit", "nutrition", "nutritional", "healthy", "health",
        "protein", "vitamin", "mineral", "antioxidant", "fiber",
        "calories", "calorie", "carbs", "fat", "diet",
        "why eat", "why mushroom", "what is oyster mushroom",
        "oyster mushroom", "properties", "medicinal", "immune",
        "immunity", "cholesterol", "weight loss", "keto",
    ],
    # ── how to cook / use ────────────────────────────────────
    "cooking": [
        "cook", "cooking", "recipe", "how to cook", "how to use",
        "prepare", "preparation", "fry", "saute", "sauté", "grill",
        "boil", "steam", "stir fry", "stir-fry", "soup", "curry",
        "dish", "food", "eat", "how to eat", "serve", "serving",
        "taste", "flavor", "flavour", "delicious",
    ],
    # ── storage / freshness ──────────────────────────────────
    "storage": [
        "store", "storage", "fresh", "freshness", "shelf life",
        "expiry", "expiration", "how long", "last", "lasting",
        "fridge", "refrigerate", "refrigerator", "freeze",
        "keep", "preserve", "preservation", "spoil", "spoilage",
        "dry", "packaging", "pack",
    ],
    # ── shipping / delivery ──────────────────────────────────
    "shipping": [
        "shipping", "delivery", "deliver", "ship", "dispatch",
        "courier", "transit", "days to deliver", "delivery time",
        "when will i get", "when will it arrive", "estimated delivery",
        "free shipping", "shipping charge", "delivery fee",
        "how long delivery", "delivery area", "location",
    ],
    # ── payment ──────────────────────────────────────────────
    "payment": [
        "payment", "pay", "paying", "checkout", "razorpay",
        "upi", "card", "netbanking", "net banking", "cod",
        "cash on delivery", "online payment", "payment method",
        "how to pay", "payment option", "transaction",
        "payment failed", "debit", "credit", "gpay", "phonepe",
        "paytm", "wallet", "refund payment",
    ],
    # ── return / refund ──────────────────────────────────────
    "returns": [
        "return", "refund", "cancel order", "cancellation",
        "money back", "exchange", "replace", "replacement",
        "damaged", "wrong product", "defective", "complaint",
        "issue with order", "problem with order", "return policy",
        "refund policy", "how to cancel",
    ],
    # ── contact / support ────────────────────────────────────
    "contact": [
        "contact", "support", "help", "customer care", "customer service",
        "phone number", "email address", "reach you", "call",
        "whatsapp", "helpline", "feedback", "complaint", "report",
        "talk to human", "talk to agent", "speak to", "connect", "chat support",
    ],
    # ── account / profile ────────────────────────────────────
    "account": [
        "account", "profile", "login", "sign in", "signup", "register",
        "password", "forgot password", "reset password", "change password",
        "update profile", "my account", "logout", "sign out",
        "email change", "username", "user", "create account",
    ],
    # ── wishlist ─────────────────────────────────────────────
    "wishlist": [
        "wishlist", "wish list", "favourite", "favorite",
        "save product", "saved items", "save for later", "liked items",
    ],
    # ── cart ─────────────────────────────────────────────────
    "cart": [
        "cart", "basket", "shopping cart", "add to cart",
        "remove from cart", "view cart", "items in cart",
        "checkout cart", "cart total",
    ],
    # ── reviews ──────────────────────────────────────────────
    "reviews": [
        "review", "rating", "reviews", "feedback", "testimonial",
        "what do customers say", "customer review", "star",
        "how good", "opinion", "experience",
    ],
    # ── cultivation tips ─────────────────────────────────────
    "cultivation_tips": [
        "tip", "advice", "guide", "how to grow", "grow mushroom",
        "cultivation guide", "growing tips", "best conditions",
        "ideal temperature", "ideal humidity", "optimal",
        "recommended", "suggestions for growth", "grow at home",
        "beginner", "start growing",
    ],
    # ── greeting ─────────────────────────────────────────────
    "greet": [
        "hi", "hello", "hey", "good morning", "good afternoon",
        "good evening", "good night", "howdy", "greetings",
        "hiya", "sup", "what's up", "whats up", "yo",
        "namaste", "vanakkam",
    ],
    # ── capabilities / help ──────────────────────────────────
    "help": [
        "help", "what can you do", "capabilities", "feature",
        "what do you know", "how can you help", "what are you",
        "who are you", "what questions", "ask you",
        "how does this work", "instructions",
    ],
    # ── about system ─────────────────────────────────────────
    "about": [
        "about", "about this", "what is smartmushroom",
        "about the system", "what is this website", "this platform",
        "what is this app", "smart mushroom system", "agrosense",
        "this project", "what does this do",
    ],
    # ── working hours / availability ─────────────────────────
    "hours": [
        "open", "closed", "working hours", "business hours",
        "hours of operation", "when are you open",
        "available time", "timing", "schedule",
    ],
    # ── location ─────────────────────────────────────────────
    "location": [
        "location", "address", "where are you", "where is the farm",
        "farm location", "city", "state", "kovilpatti", "tamilnadu",
        "where located", "map", "directions",
    ],
    # ── thanks ───────────────────────────────────────────────
    "thanks": [
        "thank", "thanks", "thank you", "thankyou", "thx",
        "great", "awesome", "perfect", "wonderful", "helpful",
        "good job", "well done", "nice", "brilliant",
    ],
    # ── bye ──────────────────────────────────────────────────
    "bye": [
        "bye", "goodbye", "see you", "see ya", "later",
        "take care", "exit", "quit", "close", "done",
    ],
}


def detect_intent(msg: str):
    """Score each intent by keyword hits and return the winner."""
    msg_lower = msg.lower().strip()
    scores = {}

    for intent, keywords in INTENT_MAP.items():
        score = 0
        for kw in keywords:
            if kw in msg_lower:
                # exact multi-word match scores higher
                weight = 2 if " " in kw else 1
                score += weight
        if score > 0:
            scores[intent] = score

    if not scores:
        return "unknown"

    # Return intent with highest score
    return max(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════
#  RESPONSE BUILDERS
# ═══════════════════════════════════════════════════════════

def r_weather():
    d = _get_weather()
    if not d:
        return ("🌤️ Weather data is temporarily unavailable.\n"
                "Please check back in a moment or verify the API key in `.env`.")
    icon = "⚠️" if d["status"] == "WARNING" else "✅"
    advice = ("⚠️ Temperature is above 35°C — consider cooling the grow room immediately."
              if d["status"] == "WARNING"
              else "✅ Conditions are within the safe range for oyster mushroom cultivation.")
    return (
        f"🌡️ **Live Weather — {d['city']}**\n\n"
        f"• Temperature: **{d['temperature']}°C** (Feels like {d['feels_like']}°C) {icon}\n"
        f"• Humidity: **{d['humidity']}%**\n"
        f"• Wind Speed: {d['wind_speed']} m/s\n"
        f"• Pressure: {d['pressure']} hPa\n"
        f"• Condition: {d['description']}\n"
        f"• Status: **{d['status']}**\n\n"
        f"{advice}"
    )


def r_batches():
    batches = _get_batches()
    if not batches:
        return ("📦 No batches found in the system.\n"
                "You can create a new batch from the **Batch Management** page.")
    now = datetime.now()
    active = [b for b in batches if b.get("status") != "COMPLETED"]
    completed = len(batches) - len(active)

    lines = [f"🌾 **Cultivation Batches** — {len(batches)} total "
             f"({len(active)} active, {completed} completed)\n"]

    for b in active[:8]:
        bid   = b.get("batchId", "N/A")
        stage = b.get("stage", b.get("status", "ACTIVE"))
        start = b.get("startDate", "N/A")
        hint  = ""
        if start and start != "N/A":
            try:
                start_dt = datetime.strptime(start, "%Y-%m-%d")
                growth   = int(b.get("growthDays", 90))
                harvest  = start_dt + timedelta(days=growth)
                delta    = (harvest - now).days
                if delta > 0:
                    hint = f" | 🗓️ Harvest in **~{delta} days**"
                elif delta == 0:
                    hint = " | 🎉 **Harvest today!**"
                else:
                    hint = f" | Harvested {abs(delta)} days ago"
            except Exception:
                pass
        lines.append(f"• **{bid}** — Stage: `{stage}` | Started: {start}{hint}")

    if len(active) > 8:
        lines.append(f"\n_...and {len(active)-8} more active batches._")
    return "\n".join(lines)


def r_yield():
    batches = _get_batches()
    weather = _get_weather()
    if not batches:
        return "🤖 No batches found. Create a batch first to get yield predictions."
    temp     = weather["temperature"] if weather else 28
    humidity = weather["humidity"] if weather else 85
    try:
        from ml.predict import predict_yield
        lines = ["🤖 **ML Yield Predictions**\n"]
        now   = datetime.now()
        for b in batches[:6]:
            start_str = b.get("startDate", "")
            if not start_str:
                continue
            try:
                start_dt = datetime.strptime(start_str, "%Y-%m-%d")
                days     = max(0, (now - start_dt).days)
                res      = predict_yield(temp, humidity, 1, days)
                lines.append(
                    f"• **{b.get('batchId','N/A')}** (Day {days}) → "
                    f"Yield: **{res.get('predicted_yield_kg','?')} kg**, "
                    f"Harvest in: **{res.get('days_to_harvest','?')} days**"
                )
            except Exception:
                lines.append(f"• **{b.get('batchId','N/A')}** — ML result unavailable.")
        lines.append(f"\n_Based on: {temp}°C, {humidity}% humidity._")
        return "\n".join(lines)
    except Exception:
        return ("🤖 The ML model is loaded. Use the **Simulation** page for detailed "
                "yield predictions with custom inputs.")


def r_inventory():
    products = _get_products()
    if not products:
        return "📦 Inventory data is currently unavailable."
    lines = ["🛒 **Product Inventory**\n"]
    low = []
    for p in products:
        stock = p.get("stock", p.get("inStock", None))
        if isinstance(stock, (int, float)):
            if stock == 0:
                label = "❌ Out of Stock"
            elif stock < 10:
                label = f"⚠️ Low Stock ({stock} units)"
                low.append(p.get("name", "?"))
            else:
                label = f"✅ {stock} units"
        elif stock is True:
            label = "✅ In Stock"
        elif stock is False:
            label = "❌ Out of Stock"
        else:
            label = "✅ Available"
        disc = f" | 🏷️ {p['discount']}% off" if p.get("discount") else ""
        lines.append(f"• **{p.get('name','?')}** — ₹{p.get('price',0)}/{p.get('unit','unit')} | {label}{disc}")
    if low:
        lines.append(f"\n⚠️ **Low stock alert:** {', '.join(low)}")
    return "\n".join(lines)


def r_order_stats():
    s = _get_order_stats()
    if not s:
        return "📊 Order data is unavailable right now."
    return (
        f"📊 **Order Analytics**\n\n"
        f"• Total Orders: **{s.get('total',0)}**\n"
        f"• Pending: **{s.get('pending',0)}** ⏳\n"
        f"• Processing: **{s.get('processing',0)}** 🔄\n"
        f"• Shipped: **{s.get('shipped',0)}** 🚚\n"
        f"• Delivered: **{s.get('delivered',0)}** ✅\n"
        f"• Cancelled: **{s.get('cancelled',0)}** ❌\n\n"
        "Visit the **Orders** page for full details and status management."
    )


def r_my_orders(email):
    orders = _get_user_orders(email)
    if not orders:
        return ("📦 No orders found for your account.\n"
                "Browse the **Products** page and place your first order!")
    icon_map = {"PENDING":"⏳","PROCESSING":"🔄","SHIPPED":"🚚","DELIVERED":"✅","CANCELLED":"❌"}
    lines = [f"📦 **Your Orders** ({len(orders)} found)\n"]
    for o in orders[:6]:
        status = o.get("status","UNKNOWN")
        lines.append(
            f"• **Order #{o.get('orderNo','N/A')}** — "
            f"{icon_map.get(status,'📋')} {status} | "
            f"₹{o.get('totalAmount',0)} | {str(o.get('createdAt',''))[:10]}"
        )
    if len(orders) > 6:
        lines.append(f"\n_Visit **My Orders** page to see all {len(orders)} orders._")
    return "\n".join(lines)


def r_products():
    products = _get_products()
    if not products:
        return "🛍️ No products are listed yet."
    lines = ["🍄 **Available Products**\n"]
    for p in products[:8]:
        disc = p.get("discount", 0)
        price = p.get("price", 0)
        disc_txt = (f" _(Save {disc}%! ~~₹{price}~~ → ₹{round(price*(1-disc/100),2)})_"
                    if disc else "")
        lines.append(
            f"• **{p.get('name','?')}** — ₹{price}/{p.get('unit','unit')}{disc_txt}\n"
            f"  _{(p.get('description',''))[:90]}_"
        )
    if len(products) > 8:
        lines.append(f"\n_...and {len(products)-8} more. Visit the **Products** page!_")
    return "\n".join(lines)


def r_price():
    products = _get_products()
    if not products:
        return "💰 Pricing info is unavailable right now."
    lines = ["💰 **Product Pricing**\n"]
    for p in products:
        disc = p.get("discount", 0)
        price = p.get("price", 0)
        final = round(price * (1 - disc / 100), 2) if disc else price
        tag = f" ~~₹{price}~~ → **₹{final}**" if disc else f" **₹{price}**"
        lines.append(f"• **{p.get('name','?')}** per {p.get('unit','unit')}:{tag}")
    lines.append("\n_Prices may vary. Check the Products page for latest info._")
    return "\n".join(lines)


def r_discounts():
    products = _get_products()
    offers = [p for p in products if p.get("discount", 0) > 0]
    if not offers:
        return ("🏷️ No active discounts right now.\n"
                "Follow us for upcoming offers and seasonal sales!")
    lines = ["🎉 **Active Discounts & Offers**\n"]
    for p in offers:
        orig  = p.get("price", 0)
        disc  = p.get("discount", 0)
        final = round(orig * (1 - disc / 100), 2)
        lines.append(
            f"• **{p.get('name','?')}** — **{disc}% OFF!** "
            f"~~₹{orig}~~ → **₹{final}** per {p.get('unit','unit')}"
        )
    return "\n".join(lines)


def r_mushroom_info():
    return (
        "🍄 **Oyster Mushroom — Benefits & Nutrition**\n\n"
        "• 🥩 **High Protein** — ~3.3g per 100g; great plant-based source\n"
        "• 🔋 **Energy Boost** — B-vitamins (B1, B2, B3, B5, B12)\n"
        "• ☀️ **Vitamin D** — natural source when exposed to sunlight\n"
        "• ❤️ **Heart Health** — lowers bad cholesterol (LDL)\n"
        "• 🛡️ **Immunity** — beta-glucans strengthen immune system\n"
        "• 🦠 **Antimicrobial** — natural antibacterial & antifungal\n"
        "• ⚖️ **Weight-Friendly** — only ~33 kcal per 100g, low fat\n"
        "• 🌿 **Iron & Zinc** — supports blood health and metabolism\n"
        "• 🧠 **Brain Health** — ergothioneine antioxidant may protect neurons\n\n"
        "Perfect for vegetarians, diabetics, and heart patients! 🌱"
    )


def r_cooking():
    return (
        "👨‍🍳 **How to Cook Oyster Mushrooms**\n\n"
        "**Quick Sauté (Best method):**\n"
        "1. Tear mushrooms into pieces\n"
        "2. Heat olive oil/butter in a pan\n"
        "3. Sauté on high heat 3–5 min until golden\n"
        "4. Add garlic, salt, pepper — done!\n\n"
        "**Other popular recipes:**\n"
        "• 🍜 Oyster mushroom soup / Tom Yum\n"
        "• 🥘 Mushroom curry (goes great with rice)\n"
        "• 🌮 Crispy fried mushroom as snack\n"
        "• 🥗 Mushroom stir-fry with veggies\n"
        "• 🍕 Pizza / pasta topping\n\n"
        "**Tips:** Don't over-wash — just wipe with a damp cloth. "
        "Cook on high heat for best texture. Avoid boiling too long."
    )


def r_storage():
    return (
        "🧊 **Storage & Freshness Guide**\n\n"
        "• 🕐 **Shelf Life:** 2–3 days at room temperature, up to **7 days** refrigerated\n"
        "• ❄️ **Refrigerate** in a paper bag (not plastic) to prevent moisture build-up\n"
        "• 🌡️ **Ideal Storage Temp:** 2°C – 5°C\n"
        "• ☀️ **Avoid** direct sunlight or humid areas\n"
        "• 🫙 **Freeze:** Blanch first, then freeze up to 3 months\n"
        "• 🌬️ **Dry** mushrooms for 12-month shelf life (grind into powder)\n\n"
        "**Signs of spoilage:** Slimy texture, dark spots, sour smell — discard immediately.\n\n"
        "For freshest experience, consume within **2 days** of delivery! 🍄"
    )


def r_shipping():
    return (
        "🚚 **Shipping & Delivery**\n\n"
        "• 📦 Orders are typically dispatched within **1–2 business days**\n"
        "• 🕐 Expected delivery: **3–5 business days** (vary by location)\n"
        "• 🆓 **Free shipping** may apply on orders above a threshold\n"
        "• 🌍 We currently deliver within **Tamil Nadu** and nearby regions\n"
        "• 📲 You'll receive updates via email when your order is shipped\n\n"
        "**Track your order** via the 'My Orders' or 'Track Order' page.\n\n"
        "_For urgent delivery queries, contact our support team._"
    )


def r_payment():
    return (
        "💳 **Payment Methods**\n\n"
        "We accept the following payment options:\n\n"
        "• 💳 **Debit / Credit Cards** (Visa, MasterCard, RuPay)\n"
        "• 📱 **UPI** (GPay, PhonePe, Paytm, BHIM)\n"
        "• 🏦 **Net Banking**\n"
        "• 💼 **Digital Wallets**\n"
        "• 🤝 **Razorpay** — our secure payment gateway\n\n"
        "All transactions are **SSL encrypted** and fully secure.\n"
        "If a payment fails, the amount is auto-refunded within **5–7 business days**."
    )


def r_returns():
    return (
        "↩️ **Return & Refund Policy**\n\n"
        "• ✅ **Fresh produce** (mushrooms) — refund/replacement if received damaged or spoiled\n"
        "• 📷 Contact us within **24 hours** of delivery with a photo\n"
        "• 💰 Refunds are processed within **5–7 business days**\n"
        "• ❌ Cancellations accepted for **PENDING** orders only\n"
        "• 🔄 We offer **replacement delivery** for quality issues\n\n"
        "To cancel or report an issue, visit **My Orders** and tap the order, "
        "or email us at **smartmushroomteam@gmail.com**."
    )


def r_contact():
    return (
        "📞 **Contact & Support**\n\n"
        "• 📧 **Email:** smartmushroomteam@gmail.com\n"
        "• 🕐 **Support Hours:** Mon–Sat, 9 AM – 6 PM IST\n"
        "• 🌐 **Website:** SmartMushroom Portal (you're here!)\n"
        "• 📝 **Feedback:** Use the Reviews section after your purchase\n\n"
        "For urgent queries, email us and we'll respond within **24 hours**.\n\n"
        "_Our team is based in Kovilpatti, Tamil Nadu, India_ 🇮🇳"
    )


def r_account():
    return (
        "👤 **Account & Profile**\n\n"
        "• **Sign Up:** Visit `/signup` and create a free account\n"
        "• **Login:** Use email + password or **Google Sign-In**\n"
        "• **Forgot Password:** Use the reset link on the Login page\n"
        "• **Update Profile:** Go to your **Profile** page after logging in\n"
        "• **Change Password:** Profile → Change Password section\n"
        "• **Logout:** Click your avatar in the top-right navbar\n\n"
        "_Admin accounts can only be created by the system administrator._"
    )


def r_wishlist():
    return (
        "❤️ **Wishlist**\n\n"
        "• Save products you love by clicking the **heart icon** on the product card\n"
        "• View all saved items on the **Wishlist** page\n"
        "• Add wishlist items directly to your **Cart**\n"
        "• Remove items anytime from the Wishlist page\n\n"
        "_You must be logged in to use the Wishlist feature._"
    )


def r_cart():
    return (
        "🛒 **Shopping Cart**\n\n"
        "• Add products using the **Add to Cart** button\n"
        "• Adjust quantities inside the **Cart** page\n"
        "• Click **Checkout** to place your order\n"
        "• Cart items are saved while you're logged in\n\n"
        "Visit the **Cart** (🛒) icon in the navbar to view your items!"
    )


def r_reviews():
    revs = _get_reviews()
    lines = ["⭐ **Recent Customer Reviews**\n"]
    if not revs:
        lines.append("No reviews yet — be the first to review after your purchase!")
    else:
        for rev in revs:
            stars = "⭐" * int(rev.get("rating", 5))
            name  = rev.get("userName", rev.get("name", "Customer"))
            text  = (rev.get("comment", rev.get("text", "")))[:100]
            lines.append(f"• {stars} **{name}** — _{text}_")
    lines.append("\n_Leave your own review from the Product page after purchase._")
    return "\n".join(lines)


def r_cultivation_tips():
    return (
        "🌾 **Oyster Mushroom Cultivation Tips**\n\n"
        "**Ideal Growing Conditions:**\n"
        "• 🌡️ Temperature: **24°C – 28°C** (fruiting); 25°C–30°C (incubation)\n"
        "• 💧 Humidity: **80% – 95%** throughout\n"
        "• 💨 Fresh Air: CO₂ <1000 ppm — ensure good ventilation\n"
        "• 💡 Light: **12 hrs/day** indirect light (pinning trigger)\n\n"
        "**Growth Stages:**\n"
        "1. **Spawn Run** (0–14 days) — mycelium colonises substrate\n"
        "2. **Incubation** (14–30 days) — full colonisation in dark\n"
        "3. **Fruiting** (30–60 days) — expose to light & fresh air\n"
        "4. **Pinning** — tiny mushrooms appear (maintain 90%+ humidity)\n"
        "5. **Harvest** — harvest when caps flatten before edges lift\n\n"
        "**Common Substrates:** Paddy straw, wheat straw, sawdust, coffee grounds\n\n"
        "💡 _Pro tip: Mist walls & floor (not caps) to keep humidity high!_"
    )


def r_about():
    return (
        "🍄 **About SmartMushroom**\n\n"
        "SmartMushroom is an **IoT-powered oyster mushroom cultivation & e-commerce platform**.\n\n"
        "**What it does:**\n"
        "• 🌡️ Real-time weather & environment monitoring\n"
        "• 🌾 End-to-end batch cultivation management\n"
        "• 🤖 Machine Learning based yield prediction\n"
        "• 🛍️ E-commerce store for fresh mushroom products\n"
        "• 📊 Admin dashboard with order, inventory & batch analytics\n"
        "• 🔔 Email notifications for orders, shipping & harvest alerts\n\n"
        "**Built with:** React · Flask · MongoDB · OpenWeatherMap · Razorpay · ML\n\n"
        "_Developed by Team SmartMushroom, Kovilpatti, Tamil Nadu 🇮🇳_"
    )


def r_hours():
    return (
        "🕐 **Business Hours**\n\n"
        "• 🛍️ **Online Store:** Open 24/7\n"
        "• 📦 **Order Processing:** Mon–Sat, 9 AM – 5 PM IST\n"
        "• 📞 **Customer Support:** Mon–Sat, 9 AM – 6 PM IST\n"
        "• 🌾 **Farm Operations:** Daily, 6 AM – 6 PM IST\n\n"
        "_Orders placed after 3 PM will be processed the next business day._"
    )


def r_location():
    return (
        "📍 **Our Location**\n\n"
        "SmartMushroom Farm & Operations:\n"
        "**Kovilpatti, Thoothukudi District**\n"
        "Tamil Nadu, India — 628501\n\n"
        "• 🌡️ Weather monitored live from Kovilpatti\n"
        "• 🚚 Deliveries dispatched from this location\n"
        "• 🌾 All batches cultivated at this facility\n\n"
        "_Contact us at smartmushroomteam@gmail.com for farm visit queries._"
    )


def r_thanks():
    return (
        "😊 You're welcome! Happy to help.\n\n"
        "Is there anything else you'd like to know about "
        "our products, orders, or mushroom cultivation? 🍄"
    )


def r_bye():
    return (
        "👋 Goodbye! Have a great day!\n\n"
        "Feel free to come back anytime — I'm here 24/7 to assist you. 🍄✨"
    )


def r_greet(role):
    hour = datetime.now().hour
    t = "morning" if hour < 12 else "afternoon" if hour < 17 else "evening"
    if role == "admin":
        return (
            f"👋 Good {t}, Admin!\n\n"
            "I'm your **SmartMushroom Intelligence Assistant** 🍄\n\n"
            "**I can help you with:**\n"
            "• 🌡️ Live weather & environment data\n"
            "• 🌾 Batch status & harvest timelines\n"
            "• 🤖 ML yield predictions\n"
            "• 📊 Order analytics & inventory\n"
            "• 💡 Cultivation tips & guides\n\n"
            "What would you like to know?"
        )
    return (
        f"👋 Good {t}! Welcome to **SmartMushroom** 🍄\n\n"
        "I'm your personal shopping assistant!\n\n"
        "**I can help you with:**\n"
        "• 🛍️ Products & pricing\n"
        "• 🏷️ Discounts & offers\n"
        "• 📦 Order tracking\n"
        "• 🍄 Mushroom benefits, cooking & storage\n"
        "• 🚚 Shipping & payments\n\n"
        "Ask me anything!"
    )


def r_help(role):
    if role == "admin":
        return (
            "🤖 **Admin Assistant — Full Capabilities**\n\n"
            "• `weather` / `temperature` / `humidity` → Live environment stats\n"
            "• `batches` / `harvest` / `stage` → Batch cultivation status\n"
            "• `yield` / `predict` → ML yield forecasts per batch\n"
            "• `inventory` / `stock` → Product stock levels\n"
            "• `orders` / `analytics` → Full order statistics\n"
            "• `cultivation tips` → Best growing conditions & advice\n"
            "• `about` → System overview\n"
            "• `contact` / `support` → Team contact info\n"
        )
    return (
        "🛍️ **Customer Assistant — Full Capabilities**\n\n"
        "• `products` / `show products` → Browse catalog\n"
        "• `price` / `how much` → Product pricing\n"
        "• `discount` / `offers` → Current promotions\n"
        "• `my orders` / `track order` → Your order history\n"
        "• `shipping` / `delivery` → Delivery info\n"
        "• `payment` → Payment methods\n"
        "• `return` / `refund` → Return policy\n"
        "• `how to cook` → Cooking recipes\n"
        "• `storage` / `freshness` → Storing mushrooms\n"
        "• `benefits` / `nutrition` → Health info\n"
        "• `contact` → Reach our team\n"
        "• `wishlist` / `cart` → Shopping features\n"
        "• `reviews` → Customer reviews\n"
    )


# ═══════════════════════════════════════════════════════════
#  SMART FALLBACK — tries to give a relevant answer anyway
# ═══════════════════════════════════════════════════════════

FALLBACK_KEYWORDS = {
    # single-word catches that didn't match above
    "mushroom":   r_mushroom_info,
    "farm":       r_location,
    "grow":       r_cultivation_tips,
    "fresh":      r_storage,
    "quality":    r_storage,
    "safe":       r_storage,
    "order":      None,   # handled by role below
    "buy":        r_products,
    "purchase":   r_products,
    "shop":       r_products,
    "money":      r_payment,
    "cash":       r_payment,
    "address":    r_location,
    "map":        r_location,
    "account":    r_account,
    "password":   r_account,
    "login":      r_account,
    "signup":     r_account,
    "delivery":   r_shipping,
    "ship":       r_shipping,
    "cancel":     r_returns,
    "damage":     r_returns,
    "broken":     r_returns,
    "recipe":     r_cooking,
    "cook":       r_cooking,
    "eat":        r_cooking,
    "review":     r_reviews,
    "rating":     r_reviews,
    "star":       r_reviews,
}

def smart_fallback(msg: str, role: str, email: str) -> str:
    msg_l = msg.lower()
    for kw, fn in FALLBACK_KEYWORDS.items():
        if kw in msg_l:
            if fn is None:
                return r_my_orders(email) if role != "admin" else r_order_stats()
            return fn()
    # last resort
    if role == "admin":
        return (
            "🤔 I'm not sure about that specific query.\n\n"
            "Try asking about: **weather**, **batches**, **yield**, **inventory**, "
            "**orders**, **cultivation tips**, or **contact**.\n\n"
            "Or type **help** to see everything I can do!"
        )
    return (
        "🤔 I'm not sure about that.\n\n"
        "Try asking about: **products**, **price**, **discount**, **my orders**, "
        "**shipping**, **payment**, **cooking tips**, or **mushroom benefits**.\n\n"
        "Or type **help** to see all my capabilities!"
    )


# ═══════════════════════════════════════════════════════════
#  ROUTE
# ═══════════════════════════════════════════════════════════

INTENT_HANDLERS = {
    "weather":           lambda role, email: r_weather(),
    "batches":           lambda role, email: r_batches() if role == "admin" else (
        "🍄 Our oyster mushrooms go through Spawn → Incubation → Fruiting → Harvest "
        "over ~90 days in carefully controlled environments. Type **cultivation tips** "
        "to learn more about the growing process!"
    ),
    "yield":             lambda role, email: r_yield() if role == "admin"
                         else "🔒 Yield prediction is an admin-only feature.",
    "inventory":         lambda role, email: r_inventory(),
    "order_stats":       lambda role, email: r_order_stats() if role == "admin"
                         else r_my_orders(email),
    "my_orders":         lambda role, email: r_my_orders(email),
    "products":          lambda role, email: r_products(),
    "price":             lambda role, email: r_price(),
    "discounts":         lambda role, email: r_discounts(),
    "mushroom_info":     lambda role, email: r_mushroom_info(),
    "cooking":           lambda role, email: r_cooking(),
    "storage":           lambda role, email: r_storage(),
    "shipping":          lambda role, email: r_shipping(),
    "payment":           lambda role, email: r_payment(),
    "returns":           lambda role, email: r_returns(),
    "contact":           lambda role, email: r_contact(),
    "account":           lambda role, email: r_account(),
    "wishlist":          lambda role, email: r_wishlist(),
    "cart":              lambda role, email: r_cart(),
    "reviews":           lambda role, email: r_reviews(),
    "cultivation_tips":  lambda role, email: r_cultivation_tips(),
    "about":             lambda role, email: r_about(),
    "hours":             lambda role, email: r_hours(),
    "location":          lambda role, email: r_location(),
    "thanks":            lambda role, email: r_thanks(),
    "bye":               lambda role, email: r_bye(),
    "greet":             lambda role, email: r_greet(role),
    "help":              lambda role, email: r_help(role),
}


@chat_bp.route("/chat", methods=["POST", "OPTIONS"])
@cross_origin()
def chat():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    body    = request.get_json(force=True, silent=True) or {}
    message = body.get("message", "").strip()
    role    = body.get("role", "customer").lower()
    email   = body.get("email", "")

    if not message:
        return jsonify({"reply": "Please type a message to get started! 💬"}), 200

    intent  = detect_intent(message)
    handler = INTENT_HANDLERS.get(intent)

    if handler:
        reply = handler(role, email)
    else:
        reply = smart_fallback(message, role, email)

    return jsonify({"reply": reply, "intent": intent}), 200
