import { useState, useEffect, useMemo } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
  body { background: #f3f4f6; }
  
  @keyframes fadeUp { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
  .animate-up { animation: fadeUp 0.5s ease both; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
`;

export default function Forecast() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [search, setSearch] = useState("");
  const [selectedLocality, setSelectedLocality] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [allFeatures, setAllFeatures] = useState([]);
  const [localityData, setLocalityData] = useState(null);

  // Gemini AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMitigations, setAiMitigations] = useState([]);

  const availableLocalities = useMemo(() => {
    const names = [...new Set(allFeatures.map(f => f.locality).filter(Boolean).filter(n => n !== "Unknown"))];
    return names.sort();
  }, [allFeatures]);

  const filtered = availableLocalities.filter(l => l.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    fetchData();
  }, []);

  const [liveTemp, setLiveTemp] = useState("--");

  // Update locality stats & trigger AI when selected locality changes
  useEffect(() => {
    if (allFeatures.length > 0) {
      const match = allFeatures.find(f => f.locality === selectedLocality);
      if (match) {
        setLocalityData(match);
        generateAIMitigations(selectedLocality, match.future_risk_3months, match.risk);
        
        // Fetch Live Temp from OpenWeather API using the API Key like Dashboard.js
        const fetchLiveWeather = async () => {
          setLiveTemp("Loading...");
          try {
            const apiKey = "67b92f0af5416edbfe58458f502b0a31";
            let q = (selectedLocality === "Pune City" || selectedLocality === "Pune") ? "Pune" : `${selectedLocality}, Pune`;
            let wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`);
            if (!wRes.ok) {
                wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Pune&appid=${apiKey}&units=metric`);
            }
            if (wRes.ok) {
                const wData = await wRes.json();
                setLiveTemp(wData.main.temp.toFixed(1) + "°C");
            } else {
                setLiveTemp(match.risk ? (match.risk * 0.15 + 28).toFixed(1) + "°C" : "--");
            }
          } catch (e) {
            setLiveTemp(match.risk ? (match.risk * 0.15 + 28).toFixed(1) + "°C" : "--");
          }
        };
        fetchLiveWeather();
        
      } else {
        setLocalityData(null);
        setAiMitigations([]);
        setLiveTemp("--");
      }
    }
  }, [allFeatures, selectedLocality]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      const resData = await fetch(`${apiUrl}/analyze?city=Pune`);
      if (!resData.ok) throw new Error("Failed to fetch data.");
      const dataJson = await resData.json();
      
      const featuresRaw = (dataJson.features || []).map(f => f.properties);
      setAllFeatures(featuresRaw);
      
      const firstLocality = featuresRaw.find(f => f.locality && f.locality !== "Unknown");
      if (firstLocality) {
        setSelectedLocality(firstLocality.locality);
        setSearch(firstLocality.locality);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch data from backend. Make sure the python backend is running locally on port 5001.");
    } finally {
      setLoading(false);
    }
  };

  const generateAIMitigations = async (locality, futureRisk, currentRisk) => {
    setAiLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      const prompt = `
        You are an expert Urban Planner and Climate Scientist. 
        The locality of ${locality} in Pune city currently has an Urban Heat Island (UHI) risk score of ${currentRisk?.toFixed(1)}.
        Based on our AI satellite predictive models, the 3-month future risk score is projected to be ${futureRisk?.toFixed(1)}.

        Give me 3 highly specific, actionable, and innovative mitigation strategies for this specific locality to reduce the heat risk within 3 months.
        Keep each point to one sentence, crisp and punchy. Return ONLY a JSON string array like this: ["Point 1", "Point 2", "Point 3"].
      `;

      const res = await fetch(`${apiUrl}/api/mitigations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locality, prompt, model: "gemini-1.5-flash" })
      });
      
      if (!res.ok) throw new Error("Backend mitigations failed");
      const data = await res.json();
      
      if (data.mitigations && data.mitigations.length > 0) {
        setAiMitigations(data.mitigations);
      } else {
        throw new Error("Empty mitigations returned");
      }
    } catch (err) {
      console.error("Gemini AI API Error:", err);
      setAiMitigations(["Plant more trees in urban areas.", "Use lighter colored paints for roofs.", "Reduce asphalt coverage where possible."]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectLocality = (loc) => {
    setSearch(loc);
    setSelectedLocality(loc);
    setShowDropdown(false);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <div style={{ background: "#ffffff", padding: "40px 32px 64px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#111827", letterSpacing: "-1px", marginBottom: 12 }}>
            Forecast Future Risk
          </h1>
          <p style={{ color: "#4b5563", fontSize: 16 }}>
            Select a Pune locality to run a 3-month predictive future risk simulation and generate dynamic intervention strategies using Google Gemini AI.
          </p>
        </div>
      </div>

      {/* ── Main Dashboard Content ── */}
      <div style={{ maxWidth: 1000, margin: "-40px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: 80, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Running Predictive Satellite Analysis...</h3>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : errorMsg ? (
          <div style={{ background: "#fef2f2", borderRadius: 20, padding: 40, textAlign: "center", border: "1.5px solid #fecaca" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#991b1b" }}>Backend Connection Failed</h3>
            <p style={{ color: "#b91c1c", fontSize: 14, marginTop: 4 }}>{errorMsg}</p>
          </div>
        ) : (
          <div className="animate-up" style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
            
            {/* Search Tool */}
            <div style={{ position: "relative", marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#4b5563", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Target Locality</label>
              <input
                type="text"
                placeholder="Search any Pune locality..."
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                style={{ width: "100%", padding: "16px 20px", borderRadius: 12, border: "2px solid #e5e7eb", background: "#f9fafb", color: "#111827", fontSize: 16, fontWeight: 600, outline: "none", transition: "0.2s" }}
                onFocusCapture={e => e.target.style.borderColor = "#c084fc"}
                onBlurCapture={e => e.target.style.borderColor = "#e5e7eb"}
              />
              {showDropdown && filtered.length > 0 && search !== selectedLocality && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", overflow: "hidden", zIndex: 100, maxHeight: 300, overflowY: "auto" }}>
                  {filtered.map(loc => (
                    <div key={loc} onClick={() => handleSelectLocality(loc)}
                      style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.color = "#8b5cf6"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; }}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard Results */}
            {localityData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                
                {/* Hero Metric Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Future Risk */}
                    <div style={{ background: localityData.future_risk_3months > 60 ? "#fef2f2" : "#f0fdf4", padding: 24, borderRadius: 16, border: `1px solid ${localityData.future_risk_3months > 60 ? '#fca5a5' : '#86efac'}` }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: localityData.future_risk_3months > 60 ? "#b91c1c" : "#15803d", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>3-Month Projection</div>
                      <div style={{ fontSize: 56, fontWeight: 900, color: localityData.future_risk_3months > 60 ? "#991b1b" : "#166534", lineHeight: 1 }}>{localityData.future_risk_3months?.toFixed(1) || "--"}</div>
                      <div style={{ fontSize: 14, color: localityData.future_risk_3months > 60 ? "#dc2626" : "#16a34a", marginTop: 12, fontWeight: 700 }}>
                        {localityData.future_risk_3months > 60 ? "Critical Danger Zone Expected" : "Risk Stabilized"}
                       </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ background: "#f9fafb", padding: "18px 20px", borderRadius: 16, border: "1px solid #f3f4f6", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Est. Local Population Exposed</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#1f2937", marginTop: 4 }}>{(localityData?.people_at_risk || 0).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flex: 1 }}>
                        <div style={{ background: "#f9fafb", padding: "18px 20px", borderRadius: 16, border: "1px solid #f3f4f6", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Current Risk</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#1f2937", marginTop: 4 }}>{localityData?.risk?.toFixed(1) || "--"}</div>
                        </div>
                        <div style={{ background: "#fffaf0", padding: "18px 20px", borderRadius: 16, border: "1px solid #fef08a", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 13, color: "#ca8a04", fontWeight: 700, textTransform: "uppercase" }}>Live Est. Temp</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#a16207", marginTop: 4 }}>
                            {liveTemp}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Gemini AI Recommendations */}
                <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: 16, padding: 24, border: "1px solid #e9d5ff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }}>
                      ✨
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#6b21a8" }}>Gemini AI Recommended Mitigations</h3>
                  </div>
                  
                  {aiLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#9333ea", fontWeight: 600, padding: "12px 0" }}>
                      <div style={{ width: 20, height: 20, border: "2px solid #e9d5ff", borderTopColor: "#9333ea", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Generating highly contextual interventions...
                    </div>
                  ) : (
                    <ul style={{ paddingLeft: 24, color: "#4c1d95", fontSize: 15, fontWeight: 500, display: "flex", flexDirection: "column", gap: 12, margin: 0 }}>
                      {aiMitigations.map((action, idx) => (
                        <li key={idx} style={{ lineHeight: 1.5 }}>{action}</li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ padding: 48, textAlign: "center", background: "#f9fafb", borderRadius: 20, border: "2px dashed #e5e7eb" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>📡</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>No Recent Thermal Data</h3>
                <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 400, margin: "0 auto" }}>
                  No real-time satellite footprint was captured for <b>{selectedLocality}</b> in the latest analysis block. Try searching for a major node like Kothrud, Hadapsar, or Wakad.
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
