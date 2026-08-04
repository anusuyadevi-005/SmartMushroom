import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Role-specific quick suggestions ────────────────────────────────────────
const ADMIN_SUGGESTIONS = [
  ["🌡️ Temperature & Humidity", "What is the current temperature and humidity?"],
  ["🌾 Active Batches", "Show all active batches"],
  ["🤖 Predict Yield", "Predict yield for active batches"],
  ["📊 Order Analytics", "Show order analytics"],
  ["📦 Inventory Status", "Show current inventory status"],
  ["💡 Cultivation Tips", "What are the best cultivation conditions?"],
  ["📍 Farm Location", "Where is the farm located?"],
  ["📞 Contact Support", "How can I contact support?"],
];

const CUSTOMER_SUGGESTIONS = [
  ["🛍️ Show Products", "Show available products"],
  ["💰 Check Prices", "What are the prices?"],
  ["🏷️ Discounts & Offers", "Any discounts available today?"],
  ["📦 My Orders", "Show my orders"],
  ["🚚 Delivery Info", "How long does delivery take?"],
  ["💳 Payment Methods", "What payment methods are accepted?"],
  ["🍄 Mushroom Benefits", "What are the benefits of oyster mushrooms?"],
  ["👨‍🍳 Cooking Tips", "How do I cook oyster mushrooms?"],
  ["🧊 Storage Tips", "How do I store oyster mushrooms?"],
  ["↩️ Returns & Refunds", "What is the refund policy?"],
  ["⭐ Reviews", "Show recent customer reviews"],
  ["📞 Contact Support", "How can I contact support?"],
];

// ─── Topic category groups for "Browse Topics" panel ────────────────────────
const ADMIN_TOPICS = {
  "🌿 Cultivation": [
    ["Batch Status", "Show all active batches"],
    ["Harvest Prediction", "When will batches be harvested?"],
    ["Yield Forecast", "Predict yield for active batches"],
    ["Cultivation Tips", "What are the best cultivation conditions?"],
    ["Growth Stages", "Explain the mushroom growth stages"],
  ],
  "🌡️ Environment": [
    ["Current Weather", "What is the current temperature and humidity?"],
    ["Air Quality", "What is the current air quality?"],
    ["Wind & Pressure", "Show full weather details"],
    ["Safe Conditions", "Are cultivation conditions safe right now?"],
  ],
  "📊 Business": [
    ["Order Analytics", "Show order analytics"],
    ["Inventory Status", "Show current inventory status"],
    ["Product List", "Show all products"],
    ["Low Stock Alert", "Which products are running low?"],
  ],
  "ℹ️ Info": [
    ["About System", "What is SmartMushroom?"],
    ["Contact Us", "How can I contact support?"],
    ["Location", "Where is the farm?"],
    ["Working Hours", "What are your business hours?"],
  ],
};

const CUSTOMER_TOPICS = {
  "🛍️ Shopping": [
    ["Browse Products", "Show available products"],
    ["Check Prices", "What are the product prices?"],
    ["Current Offers", "Any discounts today?"],
    ["Cart & Wishlist", "How does the cart work?"],
    ["Reviews", "Show recent customer reviews"],
  ],
  "📦 Orders": [
    ["My Orders", "Show my orders"],
    ["Track Order", "How do I track my order?"],
    ["Cancel Order", "How do I cancel an order?"],
    ["Return & Refund", "What is the return and refund policy?"],
  ],
  "🚚 Delivery": [
    ["Delivery Time", "How long does delivery take?"],
    ["Shipping Cost", "Is there free shipping?"],
    ["Delivery Areas", "Where do you deliver?"],
    ["Payment Methods", "What payment methods are accepted?"],
  ],
  "🍄 Mushroom Info": [
    ["Health Benefits", "What are the benefits of oyster mushrooms?"],
    ["Nutrition Facts", "Nutritional value of oyster mushrooms"],
    ["How to Cook", "How do I cook oyster mushrooms?"],
    ["Storage Guide", "How do I store oyster mushrooms?"],
    ["Freshness Tips", "How do I know if mushrooms are fresh?"],
  ],
  "👤 Account": [
    ["Login / Signup", "How do I create an account?"],
    ["Forgot Password", "How do I reset my password?"],
    ["Update Profile", "How do I update my profile?"],
    ["Contact Support", "How can I contact support?"],
  ],
};

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.trim() === "") return <div key={i} style={{ height: "5px" }} />;

    const inlineParse = (str) => {
      const parts = [];
      let rem = str, k = 0;
      while (rem.length > 0) {
        const boldM  = rem.match(/\*\*(.+?)\*\*/);
        const striM  = rem.match(/~~(.+?)~~/);
        const italM  = rem.match(/_(.+?)_/);
        const codeM  = rem.match(/`(.+?)`/);
        const all    = [boldM, striM, italM, codeM].filter(Boolean);
        if (!all.length) { parts.push(<span key={k++}>{rem}</span>); break; }
        const first  = all.reduce((a, b) => (a.index < b.index ? a : b));
        if (first.index > 0) parts.push(<span key={k++}>{rem.slice(0, first.index)}</span>);
        if (first === boldM)
          parts.push(<strong key={k++} style={{ color: "#fff" }}>{first[1]}</strong>);
        else if (first === striM)
          parts.push(<del key={k++} style={{ opacity: 0.6 }}>{first[1]}</del>);
        else if (first === codeM)
          parts.push(
            <code key={k++} style={{
              background: "rgba(29,185,84,0.15)", padding: "1px 5px",
              borderRadius: "4px", fontSize: "12px", color: "#7ecb87"
            }}>{first[1]}</code>
          );
        else parts.push(<em key={k++}>{first[1]}</em>);
        rem = rem.slice(first.index + first[0].length);
      }
      return parts;
    };

    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
          <span style={{ color: "#1db954", flexShrink: 0, marginTop: "1px" }}>•</span>
          <span>{inlineParse(line.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\./.test(line)) {
      const num  = line.match(/^(\d+\.)/)[1];
      const rest = line.slice(num.length).trim();
      return (
        <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
          <span style={{ color: "#1db954", flexShrink: 0, minWidth: "18px" }}>{num}</span>
          <span>{inlineParse(rest)}</span>
        </div>
      );
    }
    return <div key={i} style={{ marginBottom: "2px" }}>{inlineParse(line)}</div>;
  });
}

// ─── CSS injection ───────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
@keyframes chatSlideUp {
  from { opacity:0; transform:translateY(24px) scale(.97); }
  to   { opacity:1; transform:translateY(0)    scale(1);   }
}
@keyframes fadeIn {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0);   }
}
@keyframes pulseGreen {
  0%,100% { box-shadow:0 0 0 0 rgba(29,185,84,.5); }
  50%      { box-shadow:0 0 0 8px rgba(29,185,84,0); }
}
@keyframes bounce3 {
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-5px); }
}
.cb-dot1 { animation:bounce3 1s ease infinite 0s; }
.cb-dot2 { animation:bounce3 1s ease infinite .2s; }
.cb-dot3 { animation:bounce3 1s ease infinite .4s; }
.cb-fab  { transition:transform .2s,box-shadow .2s; }
.cb-fab:hover { transform:scale(1.1)!important; box-shadow:0 16px 48px rgba(29,185,84,.6)!important; }
.cb-send:hover  { opacity:.85!important; transform:scale(1.06)!important; }
.cb-send:active { transform:scale(.94)!important; }
.cb-close:hover { background:rgba(255,255,255,.28)!important; }
.cb-pill { transition:all .18s; }
.cb-pill:hover { background:rgba(29,185,84,.25)!important; transform:scale(1.03); }
.cb-pill:active { transform:scale(.96); }
.cb-topic-btn { transition:all .18s; }
.cb-topic-btn:hover { background:rgba(29,185,84,.18)!important; color:#fff!important; }
.cb-input { transition:border .2s,box-shadow .2s; }
.cb-input:focus { border-color:rgba(29,185,84,.55)!important; box-shadow:0 0 0 3px rgba(29,185,84,.12)!important; outline:none; }
.cb-msg-bot { animation:fadeIn .22s ease; }
.cb-msg-user { animation:fadeIn .15s ease; }
.cb-scroll::-webkit-scrollbar { width:4px; }
.cb-scroll::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:2px; }
.cb-tab:hover { background:rgba(255,255,255,.07)!important; }
.cb-tab-active { background:rgba(29,185,84,.15)!important; color:#1db954!important; border-bottom:2px solid #1db954!important; }
`;

export default function Chatbot() {
  const [open,       setOpen]       = useState(false);
  const [tab,        setTab]        = useState("chat");      // "chat" | "topics"
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [typing,     setTyping]     = useState(false);
  const [unread,     setUnread]     = useState(0);
  const [topicOpen,  setTopicOpen]  = useState(null);        // expanded topic group
  const [quickList,  setQuickList]  = useState([]);          // shown after each reply
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const role  = localStorage.getItem("role") || "customer";
  const email = (() => {
    try {
      const t = localStorage.getItem("token");
      if (!t) return "";
      return JSON.parse(atob(t.split(".")[1])).email || "";
    } catch { return ""; }
  })();

  const suggestions = role === "admin" ? ADMIN_SUGGESTIONS : CUSTOMER_SUGGESTIONS;
  const topics      = role === "admin" ? ADMIN_TOPICS      : CUSTOMER_TOPICS;

  // Inject CSS once
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const greet = role === "admin"
        ? "👋 Welcome, Admin! I'm your **SmartMushroom Intelligence Assistant** 🍄\n\nAsk me anything about weather, batches, yield, orders, or inventory.\nOr tap **Browse Topics** to explore all I can help with!"
        : "👋 Welcome to **SmartMushroom** 🍄\n\nI'm your personal assistant! Ask me about products, orders, delivery, cooking tips, and more.\nOr tap **Browse Topics** to see everything I can help with!";
      setMessages([{ from: "bot", text: greet, time: new Date() }]);
      setQuickList(suggestions.slice(0, 4));
    }
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]); // eslint-disable-line

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput("");
    setTab("chat");
    setQuickList([]);
    setMessages(prev => [...prev, { from: "user", text: trimmed, time: new Date() }]);
    setTyping(true);

    try {
      const res  = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, role, email }),
      });
      const data = await res.json();
      setTyping(false);
      const reply = data.reply || "Currently, this information is not available. Please try again later.";
      setMessages(prev => [...prev, { from: "bot", text: reply, time: new Date() }]);
      if (!open) setUnread(n => n + 1);

      // Show 3 fresh contextual suggestions after reply
      const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
      setQuickList(shuffled.slice(0, 3));
    } catch {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "⚠️ Cannot reach the server. Please ensure the backend is running on port 5000.", time: new Date() },
      ]);
    }
  }, [input, role, email, open, suggestions]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const GRN = "#1db954";

  // ─── Shared style tokens ───────────────────────────────────────────────────
  const BG    = "linear-gradient(160deg,#121212 0%,#1a1f2e 100%)";
  const HDRBG = `linear-gradient(90deg,${GRN} 0%,#0a6b2f 100%)`;
  const BORD  = "1px solid rgba(255,255,255,0.07)";

  return (
    <>
      {/* ── CHAT WINDOW ──────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:"fixed", bottom:"100px", right:"28px",
          width:"380px", maxWidth:"calc(100vw - 32px)",
          height:"590px", maxHeight:"calc(100vh - 130px)",
          background: BG,
          borderRadius:"22px",
          boxShadow:"0 32px 80px rgba(0,0,0,.75),0 0 0 1px rgba(29,185,84,.18)",
          display:"flex", flexDirection:"column",
          zIndex:9998, overflow:"hidden",
          fontFamily:"'Inter','Segoe UI',sans-serif",
          animation:"chatSlideUp .28s cubic-bezier(.4,0,.2,1)",
        }}>

          {/* Header */}
          <div style={{ background:HDRBG, padding:"13px 16px",
            display:"flex", alignItems:"center", gap:"11px", flexShrink:0 }}>
            <div style={{
              width:"42px",height:"42px",borderRadius:"50%",
              background:"rgba(255,255,255,.15)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"22px",flexShrink:0,
            }}>🍄</div>
            <div style={{ flex:1 }}>
              <p style={{ color:"#fff",fontWeight:700,fontSize:"14.5px",margin:0 }}>
                SmartMushroom Assistant
              </p>
              <p style={{ color:"rgba(255,255,255,.75)",fontSize:"11px",margin:0 }}>
                <span style={{
                  display:"inline-block",width:"8px",height:"8px",
                  borderRadius:"50%",background:"#7fffb0",marginRight:"5px",
                  animation:"pulseGreen 2s infinite",
                }}/>
                {role==="admin" ? "Admin Mode · Live Data" : "Online · Here to help"}
              </p>
            </div>
            <button
              className="cb-close"
              onClick={() => setOpen(false)}
              style={{
                background:"rgba(255,255,255,.15)",border:"none",color:"#fff",
                width:"30px",height:"30px",borderRadius:"50%",cursor:"pointer",
                fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center",
              }}
            >✕</button>
          </div>

          {/* Tab bar */}
          <div style={{
            display:"flex",borderBottom:BORD,flexShrink:0,background:"rgba(0,0,0,.2)"
          }}>
            {["chat","topics"].map(t => (
              <button
                key={t}
                className={`cb-tab${tab===t?" cb-tab-active":""}`}
                onClick={() => setTab(t)}
                style={{
                  flex:1,background:"transparent",border:"none",
                  borderBottom:"2px solid transparent",
                  color: tab===t ? GRN : "rgba(255,255,255,.5)",
                  padding:"9px 0",fontSize:"12.5px",cursor:"pointer",
                  fontWeight: tab===t ? 600 : 400,fontFamily:"inherit",
                  transition:"all .18s",
                }}
              >
                {t==="chat" ? "💬 Chat" : "📋 Browse Topics"}
              </button>
            ))}
          </div>

          {/* ── CHAT TAB ─────────────────────────────────────────────────── */}
          {tab === "chat" && (
            <>
              {/* Messages */}
              <div className="cb-scroll" style={{
                flex:1,overflowY:"auto",padding:"12px",
                display:"flex",flexDirection:"column",gap:"9px",
              }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={msg.from==="bot" ? "cb-msg-bot" : "cb-msg-user"}
                    style={msg.from==="bot" ? {
                      alignSelf:"flex-start",
                      background:"rgba(255,255,255,.055)",
                      border:"1px solid rgba(255,255,255,.08)",
                      borderRadius:"16px 16px 16px 4px",
                      padding:"10px 14px",maxWidth:"90%",
                      color:"#ddd",fontSize:"13px",lineHeight:"1.65",
                    } : {
                      alignSelf:"flex-end",
                      background:`linear-gradient(135deg,${GRN},#0a6b2f)`,
                      borderRadius:"16px 16px 4px 16px",
                      padding:"10px 14px",maxWidth:"80%",
                      color:"#fff",fontSize:"13px",lineHeight:"1.65",fontWeight:500,
                    }}
                  >
                    {msg.from==="bot" ? renderMarkdown(msg.text) : msg.text}
                    <span style={{ fontSize:"10px",color:"rgba(255,255,255,.35)",
                      marginTop:"4px",display:"block" }}>
                      {fmt(msg.time)}
                    </span>
                  </div>
                ))}
                {typing && (
                  <div style={{
                    alignSelf:"flex-start",
                    background:"rgba(255,255,255,.055)",
                    border:"1px solid rgba(255,255,255,.08)",
                    borderRadius:"16px 16px 16px 4px",
                    padding:"13px 18px",display:"flex",gap:"5px",alignItems:"center",
                  }}>
                    {[1,2,3].map(n => (
                      <div key={n} className={`cb-dot${n}`} style={{
                        width:"7px",height:"7px",borderRadius:"50%",background:GRN,
                      }}/>
                    ))}
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Quick-reply pills */}
              {quickList.length > 0 && (
                <div style={{
                  display:"flex",flexWrap:"wrap",gap:"5px",
                  padding:"7px 12px",borderTop:BORD,flexShrink:0,
                }}>
                  {quickList.map(([label, query]) => (
                    <button
                      key={label}
                      className="cb-pill"
                      onClick={() => sendMessage(query)}
                      style={{
                        background:"rgba(29,185,84,.1)",
                        border:"1px solid rgba(29,185,84,.28)",
                        color:GRN,padding:"5px 11px",borderRadius:"20px",
                        fontSize:"11.5px",cursor:"pointer",fontFamily:"inherit",
                      }}
                    >{label}</button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TOPICS TAB ───────────────────────────────────────────────── */}
          {tab === "topics" && (
            <div className="cb-scroll" style={{
              flex:1,overflowY:"auto",padding:"10px",
              display:"flex",flexDirection:"column",gap:"6px",
            }}>
              <p style={{ color:"rgba(255,255,255,.45)",fontSize:"11.5px",
                margin:"2px 0 6px",textAlign:"center" }}>
                Tap any topic to ask instantly
              </p>
              {Object.entries(topics).map(([group, items]) => (
                <div key={group}>
                  {/* Group header */}
                  <button
                    onClick={() => setTopicOpen(topicOpen===group ? null : group)}
                    style={{
                      width:"100%",background:"rgba(255,255,255,.05)",
                      border:"1px solid rgba(255,255,255,.08)",
                      borderRadius:"10px",padding:"9px 13px",
                      color:"#ddd",fontSize:"13px",fontWeight:600,
                      cursor:"pointer",display:"flex",justifyContent:"space-between",
                      alignItems:"center",fontFamily:"inherit",
                      transition:"background .18s",
                    }}
                    className="cb-topic-btn"
                  >
                    <span>{group}</span>
                    <span style={{ color:GRN,fontSize:"11px" }}>
                      {topicOpen===group ? "▲" : "▼"}
                    </span>
                  </button>
                  {/* Items */}
                  {topicOpen===group && (
                    <div style={{
                      marginTop:"4px",display:"flex",flexDirection:"column",gap:"3px",
                    }}>
                      {items.map(([label, query]) => (
                        <button
                          key={label}
                          className="cb-pill"
                          onClick={() => sendMessage(query)}
                          style={{
                            marginLeft:"8px",
                            background:"rgba(29,185,84,.08)",
                            border:"1px solid rgba(29,185,84,.2)",
                            borderRadius:"8px",padding:"7px 12px",
                            color:"#ccc",fontSize:"12.5px",cursor:"pointer",
                            textAlign:"left",fontFamily:"inherit",
                            display:"flex",alignItems:"center",gap:"6px",
                          }}
                        >
                          <span style={{ color:GRN }}>›</span> {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <p style={{ color:"rgba(255,255,255,.3)",fontSize:"11px",
                margin:"6px 0 2px",textAlign:"center" }}>
                Or switch to Chat and type any question
              </p>
            </div>
          )}

          {/* Input bar — always shown */}
          <div style={{
            display:"flex",alignItems:"center",gap:"8px",
            padding:"10px 12px",borderTop:BORD,
            background:"rgba(0,0,0,.25)",flexShrink:0,
          }}>
            <input
              ref={inputRef}
              className="cb-input"
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setTab("chat")}
              style={{
                flex:1,background:"rgba(255,255,255,.06)",
                border:"1px solid rgba(255,255,255,.1)",
                borderRadius:"12px",padding:"9px 14px",
                color:"#e8e8e8",fontSize:"13px",fontFamily:"inherit",
              }}
            />
            <button
              className="cb-send"
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              title="Send"
              style={{
                background:`linear-gradient(135deg,${GRN},#0a6b2f)`,
                border:"none",borderRadius:"12px",
                width:"40px",height:"40px",color:"#fff",
                cursor: input.trim() ? "pointer" : "default",
                fontSize:"16px",display:"flex",
                alignItems:"center",justifyContent:"center",flexShrink:0,
                opacity: input.trim() ? 1 : 0.4,
                transition:"opacity .2s,transform .1s",
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* ── FAB BUTTON ───────────────────────────────────────────────────── */}
      <button
        className="cb-fab"
        onClick={() => setOpen(o => !o)}
        title={open ? "Close assistant" : "Open SmartMushroom Assistant"}
        style={{
          position:"fixed",bottom:"28px",right:"28px",
          width:"60px",height:"60px",borderRadius:"50%",
          background:`linear-gradient(135deg,${GRN} 0%,#0a6b2f 100%)`,
          color:"#fff",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 8px 30px rgba(29,185,84,.45)",
          zIndex:9999,fontSize:"26px",
        }}
      >
        {open ? "✕" : "🍄"}
        {!open && unread > 0 && (
          <span style={{
            position:"absolute",top:"-4px",right:"-4px",
            background:"#ff4e50",color:"#fff",borderRadius:"50%",
            width:"20px",height:"20px",fontSize:"11px",
            fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
            border:"2px solid #121212",
          }}>{unread}</span>
        )}
      </button>
    </>
  );
}
