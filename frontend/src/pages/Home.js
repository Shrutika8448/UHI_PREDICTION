import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate

/* ══════════════════════════════════════════
   ANIMATED EARTH VISUAL
══════════════════════════════════════════ */
function EarthVisual() {
  const SIZE = 400;
  const IMG_SIZE = 134;

  const images = [
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=85", alt: "Green field", label: "Green Zones",  top: 14,     left: 14    },
    { src: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=85", alt: "Dry earth",   label: "Drought Risk", top: 14,     right: 14   },
    { src: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=85", alt: "Flood",        label: "Flood Zones",  bottom: 14,  left: 14    },
    { src: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&q=85", alt: "Wildfire",    label: "Fire Risk",    bottom: 14,  right: 14   },
  ];

  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>

      {/* Ring 1 — outer dashed green, slow CW */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        border: "3px dashed rgba(74,222,128,0.75)",
        animation: "ring1 24s linear infinite"
      }} />
      {/* Ring 2 — dotted emerald, medium CCW */}
      <div style={{
        position: "absolute", top: 26, left: 26, right: 26, bottom: 26,
        borderRadius: "50%", border: "2px dotted rgba(52,211,153,0.6)",
        animation: "ring2 15s linear infinite"
      }} />
      {/* Ring 3 — thin gray, slow CW */}
      <div style={{
        position: "absolute", top: 54, left: 54, right: 54, bottom: 54,
        borderRadius: "50%", border: "1px solid rgba(134,239,172,0.35)",
        animation: "ring3 38s linear infinite"
      }} />

      {/* Center glow */}
      <div style={{
        position: "absolute",
        top: SIZE / 2 - 80, left: SIZE / 2 - 80, width: 160, height: 160,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(187,247,208,0.55) 0%, transparent 70%)"
      }} />

      {/* 4 Image circles */}
      {images.map((img, i) => {
        const isHov = hovered === i;
        const pos = {};
        if (img.top    !== undefined) pos.top    = img.top;
        if (img.bottom !== undefined) pos.bottom = img.bottom;
        if (img.left   !== undefined) pos.left   = img.left;
        if (img.right  !== undefined) pos.right  = img.right;

        return (
          <div key={i}
            style={{ position: "absolute", width: IMG_SIZE, height: IMG_SIZE, ...pos, cursor: "pointer", zIndex: 10 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Glow halo */}
            <div style={{
              position: "absolute", inset: -6, borderRadius: "50%",
              background: isHov ? "rgba(74,222,128,0.22)" : "transparent",
              filter: "blur(8px)",
              transition: "background 0.3s"
            }} />
            {/* Image frame */}
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              overflow: "hidden", border: "5px solid #fff",
              boxShadow: isHov ? "0 8px 32px rgba(74,222,128,0.4)" : "0 4px 20px rgba(0,0,0,0.18)",
              transform: isHov ? "scale(1.10)" : "scale(1)",
              transition: "all 0.4s cubic-bezier(.34,1.56,.64,1)",
              position: "relative"
            }}>
              <img src={img.src} alt={img.alt}
                style={{ width: "100%", height: "100%", objectFit: "cover",
                  transform: isHov ? "scale(1.12)" : "scale(1)",
                  transition: "transform 0.6s ease"
                }}
              />
              {/* Label overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: isHov ? "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" : "transparent",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                paddingBottom: 10,
                opacity: isHov ? 1 : 0,
                transition: "opacity 0.3s"
              }}>
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {img.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Center AI node */}
      <div style={{
        position: "absolute",
        top: SIZE / 2 - 28, left: SIZE / 2 - 28,
        width: 56, height: 56,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20
      }}>
        <div style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(74,222,128,0.3)", animation: "ping 2s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: "1px solid rgba(74,222,128,0.15)", animation: "ping 2s ease-in-out infinite", animationDelay: "0.6s" }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#030712", border: "2.5px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(74,222,128,0.2)", position: "relative", zIndex: 2 }}>
          <svg width="24" height="24" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
function Hero({ onOpenChat }) {
  const navigate = useNavigate();

  return (
    <section style={{ background: "linear-gradient(135deg, #fff 0%, #f0fdf4 50%, #fff 100%)", padding: "80px 0", overflow: "hidden" }}>
      <div className="hero-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

        {/* LEFT */}
        <div style={{ animation: "fadeIn 0.9s ease forwards" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
            <span style={{ width: 20, height: 2, background: "#22c55e", borderRadius: 2, display: "inline-block" }} />
            ONE PLATFORM · REAL-TIME DATA · SMARTER CITIES
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 56, fontWeight: 900, color: "#111827", lineHeight: 1.08, margin: "0 0 24px", letterSpacing: "-1px" }}>
            AI-Powered{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ color: "#16a34a" }}>Environmental</span>
              <svg style={{ position: "absolute", bottom: -4, left: 0, width: "100%" }} viewBox="0 0 220 8" fill="none">
                <path d="M0 6 Q55 0 110 6 Q165 12 220 6" stroke="#86efac" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <br />Risk Prediction
          </h1>

          {/* Subtext */}
          <p style={{ color: "#6b7280", fontSize: 17, lineHeight: 1.7, maxWidth: 420, margin: "0 0 36px" }}>
            Harness machine learning and satellite data to predict, prevent, and respond to climate risks — before they become disasters.
          </p>

          {/* ── Buttons ── */}
          <div className="hero-buttons" style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380 }}>

            {/* Know Your Locality — full width */}
            <button 
              onClick={() => navigate('/dashboard')}
              style={{
              background: "#111827", color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "14px 28px", borderRadius: 16, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              transition: "all 0.2s"
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Know Your Locality
            </button>

            {/* Climate AI + Generate Reports — side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button 
                onClick={onOpenChat}
                style={{
                background: "transparent", color: "#15803d", fontWeight: 600, fontSize: 13,
                padding: "12px 16px", borderRadius: 16, border: "2px solid #22c55e", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s"
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Climate AI
              </button>
              <button 
                onClick={() => navigate('/climate-assistant')}
                style={{
                background: "#7ed321", color: "#fff", fontWeight: 600, fontSize: 13,
                padding: "12px 16px", borderRadius: 16, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(126,211,33,0.35)",
                transition: "all 0.2s"
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Reports
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
            {["ISO 27001", "SOC 2 Type II", "GDPR Ready"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9ca3af" }}>
                <svg width="13" height="13" fill="#22c55e" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="earth-visual-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0" }}>
          <EarthVisual />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   AI CHATBOT
══════════════════════════════════════════ */
const PREDEFINED_QUESTIONS = [
  "What is the current risk level of my locality?",
  "Which are the top 10 most livable localities?",
  "Which are the top 10 high-risk localities?",
  "What factors are increasing heat stress in my area?",
  "What mitigation strategies can reduce risk right now?",
];

function ChatBot({ open, setOpen }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm CityCare AI 🌿 Ask me anything about climate risks in Pune." }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const [cityData, setCityData] = useState(null);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
         const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
         const summaryRes = await fetch(`${apiUrl}/api/summary?city=Pune`);
         const summaryData = await summaryRes.json();
         if (summaryData.cached && summaryData.rankings) {
           setCityData(summaryData);
           return;
         }
         const res = await fetch(`${apiUrl}/analyze?city=Pune`);
         const data = await res.json();
         setCityData(data);
      } catch (err) {
         console.error("Failed to fetch context", err);
      }
    };
    fetchCityData();
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (textOverride) => {
    const t = textOverride || input.trim();
    if (!t) return;
    
    // Add user message
    setMessages(p => [...p, { from: "user", text: t }]);
    setInput("");
    
    // Add temporary bot loading message
    setMessages(p => [...p, { from: "bot", text: "Analyzing real-time satellite & sensor data...", isLoading: true }]);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      let contextStr = "No live backend data available. Assume general Pune knowledge."; 
      if (cityData) {
         // Create a summarized string from the backend data
         const highRisk = (cityData.rankings?.least_livable || []).slice(0, 10).map(x => `${x.locality} (${x.risk.toFixed(1)})`).join(", ");
         const safe = (cityData.rankings?.most_livable || []).slice(0, 10).map(x => `${x.locality} (${x.risk.toFixed(1)})`).join(", ");
         contextStr = `Current City: Pune. Top 10 High-Risk Heat Zones: ${highRisk}. Safest / Coolest areas: ${safe}.`;
      }

      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t, context: contextStr })
      });
      
      if (!res.ok) throw new Error("Backend chat failed");
      const data = await res.json();
      
      setMessages(p => {
         const newMsgs = [...p];
         newMsgs.pop();
         return [...newMsgs, { from: "bot", text: data.response || "No response received." }];
      });

    } catch (err) {
      console.error(err);
      setMessages(p => {
         const newMsgs = [...p];
         newMsgs.pop(); // remove loading message
         return [...newMsgs, { from: "bot", text: "Error communicating with the satellite AI servers." }];
      });
    }
  };

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 999,
          width: 320, background: "#fff", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid #f3f4f6",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "slideUp 0.25s ease forwards"
        }}>
          {/* Header */}
          <div style={{ background: "#030712", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>CityCare AI</div>
                <div style={{ color: "#4ade80", fontSize: 11, marginTop: 2 }}>● Online now</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "16px", background: "#f9fafb", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            
            {/* Quick Questions bubbles */}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {PREDEFINED_QUESTIONS.map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => send(q)}
                    style={{ background: "#e0f2fe", border: "1.5px solid #bae6fd", color: "#0369a1", fontSize: 11, padding: "6px 10px", borderRadius: 12, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", fontSize: 13, padding: "10px 14px",
                  borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: m.from === "user" ? "#111827" : "#fff",
                  color: m.from === "user" ? "#fff" : "#374151",
                  boxShadow: m.from === "bot" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  lineHeight: 1.5
                }}>{m.isLoading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, border: "2px solid #cbd5e1", borderTopColor: "#64748b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    {m.text}
                  </span>
                ) : m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #f3f4f6", background: "#fff", display: "flex", gap: 8 }}>
            <input
              style={{ flex: 1, fontSize: 13, border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "8px 12px", outline: "none", color: "#374151" }}
              placeholder="Ask about climate risks..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button onClick={send} style={{
              width: 36, height: 36, background: "#7ed321", border: "none", borderRadius: 10,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          width: 56, height: 56, borderRadius: "50%",
          background: "#030712", border: "2.5px solid #4ade80",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(74,222,128,0.15)",
          transition: "transform 0.2s"
        }}
      >
        {open
          ? <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg width="22" height="22" fill="none" stroke="#4ade80" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        }
        {!open && (
          <span style={{
            position: "absolute", top: -4, right: -4, width: 20, height: 20,
            background: "#22c55e", borderRadius: "50%", border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, color: "#fff", fontWeight: 900
          }}>AI</span>
        )}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════
   FOOTER
══════════════════════════════════════════ */
function GlobalFooter() {
  const cols = [
    {
      heading: "Platform",
      links: ["Risk Mapping", "Early Warning", "Compliance Reports", "API Access"],
    },
    {
      heading: "Company",
      links: ["About Us", "Careers", "Press", "Blog"],
    },
    {
      heading: "Resources",
      links: ["Case Studies", "Research Papers", "Documentation", "City Dashboard"],
    },
  ];

  const social = [
    {
      label: "in",
      path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
    },
    {
      label: "tw",
      path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
    },
    {
      label: "gh",
      path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
    },
  ];

  return (
    <footer style={{ background: "#030712", color: "#9ca3af", paddingTop: 64, paddingBottom: 0 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>

        {/* ── Top grid: brand + 3 link cols ── */}
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 48, paddingBottom: 48 }}>

          {/* Brand col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#111827", border: "1px solid #166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 32 32" width="24" height="24">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="#4ade80" strokeWidth="1.5" />
                  <path d="M16 5 C10 5 7 10 7 14 C7 19.5 11.5 23 16 27 C20.5 23 25 19.5 25 14 C25 10 22 5 16 5Z" fill="#4ade80" opacity="0.9" />
                  <path d="M13 9 C10 11 9 15 11 18" fill="none" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", lineHeight: 1 }}>CityCare</div>
                <div style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Climate AI</div>
              </div>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6b7280", maxWidth: 240 }}>
              AI-powered climate risk intelligence for smarter, more resilient cities worldwide.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 10 }}>
              {social.map((s) => (
                <a key={s.label} href="#" style={{
                  width: 34, height: 34, borderRadius: "50%", background: "#1f2937",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#16a34a"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1f2937"}
                >
                  <svg width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                {col.heading}
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "#fff"}
                      onMouseLeave={e => e.target.style.color = "#6b7280"}
                    >{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: "1px solid #1f2937" }} />

        {/* ── Bottom bar ── */}
        <div className="footer-bottom" style={{ padding: "20px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>

          {/* Copyright */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4b5563" }}>
            <svg width="14" height="14" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.83 9.17a4 4 0 100 5.66" />
            </svg>
            <span>© 2026 <strong style={{ color: "#e5e7eb", fontWeight: 700 }}>CityCare</strong>. All rights reserved.</span>
          </div>

          {/* Legal links */}
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Service", "Accessibility"].map((link) => (
              <a key={link} href="#" style={{ fontSize: 12, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "#4b5563"}
              >{link}</a>
            ))}
          </div>

          {/* Made with badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5563" }}>
            <span>Made with</span>
            <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>♻</span>
            <span>for the planet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function App() {
  // Lift the chat state here so the Hero "Climate AI" button can trigger it
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", background: "#f0fdf4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        @keyframes ring1   { to { transform: rotate(360deg);  } }
        @keyframes ring2   { to { transform: rotate(-360deg); } }
        @keyframes ring3   { to { transform: rotate(360deg);  } }
        @keyframes ping    { 0%,100%{ transform:scale(1); opacity:.6 } 50%{ transform:scale(1.3); opacity:0 } }
        @keyframes pulse   { 0%,100%{ opacity:1 } 50%{ opacity:.4 } }
        @keyframes fadeIn  { from{ opacity:0; transform:translateY(20px) } to{ opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:translateY(0) } }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        button { font-family: inherit; }
      `}</style>
      <Hero onOpenChat={() => setChatOpen(true)} />
      <GlobalFooter />
      <ChatBot open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
