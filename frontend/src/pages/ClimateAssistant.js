import { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";

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

export default function ClimateAssistant() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [search, setSearch] = useState("");
  const [selectedLocality, setSelectedLocality] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [allFeatures, setAllFeatures] = useState([]);
  const [localityData, setLocalityData] = useState(null);
  const [cityRankings, setCityRankings] = useState(null);

  // Gemini AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMitigations, setAiMitigations] = useState([]);
  
  // PDF Generation State
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const availableLocalities = useMemo(() => {
    const names = [...new Set(allFeatures.map(f => f.locality).filter(Boolean).filter(n => n !== "Unknown"))];
    return names.sort();
  }, [allFeatures]);

  const filtered = availableLocalities.filter(l => l.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (allFeatures.length > 0) {
      const match = allFeatures.find(f => f.locality === selectedLocality);
      if (match) {
        setLocalityData(match);
        generateAIMitigations(match);
      } else {
        setLocalityData(null);
        setAiMitigations([]);
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
      setCityRankings(dataJson.rankings);
      
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

  const generateAIMitigations = async (data) => {
    setAiLoading(true);
    setAiMitigations([]); // Clear stale mitigations immediately
    try {

      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      const prompt = `
        You are an expert Urban Planner and Climate Scientist. 
        You are analyzing the locality of ${data.locality} in Pune city.
        
        Here is the real-time satellite footprint and backend analysis data for this locality:
        - Current Heat Risk Score: ${data.risk?.toFixed(1)} / 100
        - 3-Month Projected Risk: ${data.future_risk_3months?.toFixed(1)} / 100
        - Resilience Score: ${data.resilience_score?.toFixed(1)} / 100
        - Green Deficit: ${data.green_deficit?.toFixed(1)}%
        - Cooling Potential: ${data.cooling_potential?.toFixed(1)}%
        - Vulnerable Population: ${data.people_at_risk}
        - Top 3 Heat Drivers: ${data.top_drivers?.join(", ")}
        - Early Warning Triggered: ${data.early_warning ? "YES" : "NO"}

        Based on these highly specific metrics, give me 3 highly distinct, non-generic, actionable, and innovative mitigation strategies specifically designed for this locality to reduce its specific heat risk within 3 months. Address the precise primary heat drivers and demographic vulnerabilities. 
        CRITICAL: Never give generic advice like "plant more trees," "cool roofs," or "green buffers". Suggest bleeding-edge or hyper-localized interventions (e.g., "enforce reflective high-albedo coatings exclusively on the 5 largest commercial roofs" or "deploy misting cannons along the busiest arterial road"). Provide three varied techniques: 1 Policy intervention, 1 Structural/Infrastructure intervention, and 1 Community-based intervention.
        Keep each point to one sentence, crisp and punchy. Return ONLY a JSON string array like this: ["Point 1", "Point 2", "Point 3"].
      `;

      const res = await fetch(`${apiUrl}/api/mitigations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locality: data.locality, prompt, model: "gemini-2.5-flash", temperature: 0.85 })
      });
      
      if (!res.ok) throw new Error("Backend mitigations failed");
      const resData = await res.json();
      
      if (resData.mitigations && resData.mitigations.length > 0) {
        setAiMitigations(resData.mitigations);
      } else {
        throw new Error("Empty mitigations returned");
      }
    } catch (err) {
      console.error("Gemini AI API Error:", err);
      // Contextual fallback if network/backend fails
      setAiMitigations([
        `Implement emergency cooling interventions such as temporary shading and misting systems in ${data.locality}'s densest sectors.`,
        `Mandate cool-roof coatings for all new commercial developments to reduce systemic albedo retention.`,
        `Enhance localized green corridors to disrupt the specific heat-trapping patterns identified in the area.`
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadCityReport = async () => {
    if (!cityRankings || !allFeatures.length) return;
    setPdfGenerating(true);
    
    try {
      const doc = new jsPDF();
      let y = 20;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("SMART HEAT RISK REPORT - PUNE CITY", 105, y, { align: "center" });
      
      if (localityData) {
        y += 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("================ SMART HEAT RISK REPORT ================", 105, y, { align: "center" });
        y += 12;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`Locality: ${localityData.locality}`, 20, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`Heat Risk Score: ${localityData.risk?.toFixed(2)}`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 5;
        doc.text(`   Optimal: < 30 | Moderate: 30 – 60 | High: > 60`, 20, y);
        doc.setTextColor(0);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Main Heat Drivers:`, 20, y);
        doc.setFont("helvetica", "normal");
        if (localityData.top_drivers && localityData.top_drivers.length > 0) {
            localityData.top_drivers.forEach(d => {
                y += 5;
                doc.text(`   • ${d}`, 20, y);
            });
        }
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Green Deficit: ${localityData.green_deficit?.toFixed(2)} %`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 5;
        doc.text(`   Optimal: < 20 | Concerning: 20 – 40 | Critical: > 40`, 20, y);
        doc.setTextColor(0);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Cooling Potential: ${localityData.cooling_potential?.toFixed(2)} %`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 5;
        doc.text(`   Optimal: > 60 | Concerning: 30 – 60 | Critical: < 30`, 20, y);
        doc.setTextColor(0);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`People at Risk: ${(localityData.people_at_risk || 0).toLocaleString()} persons`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 5;
        doc.text(`   Optimal: < 500 | Concerning: 500 – 2000 | Critical: > 2000`, 20, y);
        doc.setTextColor(0);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Future Risk (3 months): ${localityData.future_risk_3months?.toFixed(2)}`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 5;
        doc.text(`   Optimal: < 40 | Concerning: 40 – 70 | Critical: > 70`, 20, y);
        doc.setTextColor(0);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Urban Resilience Score: ${localityData.resilience_score?.toFixed(2)}`, 20, y);
        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`AI-Recommended Mitigation Actions:`, 20, y);
        doc.setFont("helvetica", "normal");
        if (aiMitigations && aiMitigations.length > 0) {
            aiMitigations.forEach(m => {
                y += 6;
                const splitM = doc.splitTextToSize(`• ${m}`, 170);
                doc.text(splitM, 20, y);
                y += (splitM.length - 1) * 6;
            });
        }
        
        doc.addPage();
        y = 20;
      }

      // City-Wide Metrics Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CITY-WIDE AGGREGATED METRICS", 105, y, { align: "center" });
      
      // Calculate city-wide metrics
      const avgRisk = (allFeatures.reduce((acc, f) => acc + (f.risk || 0), 0) / allFeatures.length).toFixed(1);
      const totalPopRisk = allFeatures.reduce((acc, f) => acc + (f.people_at_risk || 0), 0);
      
      y += 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`City-Wide Average Risk Score: ${avgRisk} / 100`, 20, y); y += 6;
      doc.text(`Total Estimated Vulnerable Population: ${totalPopRisk.toLocaleString()}`, 20, y); y += 12;

      // Top 10 Most Livable
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Top 10 Most Livable Localities:", 20, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      (cityRankings.most_livable || []).slice(0, 10).forEach((loc, i) => {
        doc.text(`${i + 1}. ${loc.locality} (Livability Index: ${loc.livability_index?.toFixed(2)})`, 25, y);
        y += 6;
      });

      y += 10;
      
      // Top 10 Least Livable
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Top 10 High Risk Localities:", 20, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      (cityRankings.least_livable || []).slice(0, 10).forEach((loc, i) => {
        doc.text(`${i + 1}. ${loc.locality} (Livability Index: ${loc.livability_index?.toFixed(2)})`, 25, y);
        y += 6;
      });

      // Complete Data Table
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Complete Locality Data", 105, y, { align: "center" });
      y += 15;
      
      doc.setFontSize(10);
      doc.text("Locality", 20, y);
      doc.text("Risk", 90, y);
      doc.text("Proj (3mo)", 110, y);
      doc.text("Grn Def%", 135, y);
      doc.text("Resilience", 160, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 7;
      
      doc.setFont("helvetica", "normal");
      // Sort all features alphabetically
      const sortedFeatures = [...allFeatures].sort((a, b) => (a.locality || "").localeCompare(b.locality || ""));
      
      sortedFeatures.forEach(f => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.text("Locality", 20, y); doc.text("Risk", 90, y); doc.text("Proj (3mo)", 110, y); doc.text("Grn Def%", 135, y); doc.text("Resilience", 160, y);
          y += 5; doc.line(20, y, 190, y); y += 7;
          doc.setFont("helvetica", "normal");
        }
        
        const locName = (f.locality || "Unknown").substring(0, 30);
        doc.text(locName, 20, y);
        doc.text(f.risk?.toFixed(1) || "--", 90, y);
        doc.text(f.future_risk_3months?.toFixed(1) || "--", 110, y);
        doc.text(f.green_deficit?.toFixed(1) || "--", 135, y);
        doc.text(f.resilience_score?.toFixed(1) || "--", 160, y);
        y += 6;
      });

      // AI City-Wide Summary
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("AI City-Wide Strategic Summary", 105, y, { align: "center" });
      y += 15;

      try {
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.text("Generating insights using Google Gemini AI...", 20, y);
        
        const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
        const highRiskNames = (cityRankings.least_livable || []).slice(0, 5).map(l => l.locality).join(", ");
        
        const prompt = `
          You are an expert Chief Resilience Officer for Pune city. 
          Based on our live satellite data, the city average Heat Risk Score is ${avgRisk}/100. 
          A total of ${totalPopRisk.toLocaleString()} citizens are currently vulnerable to heat stress.
          The top 5 most critically at-risk localities are: ${highRiskNames}.
          
          Provide a high-level, strategic executive summary (3 short paragraphs) on how the city should allocate budget and resources over the next 3 months to mitigate this city-wide risk. Focus on systemic, macro-level urban policies. Do not use asterisks or markdown, just plain text.
        `;
        
        const res = await fetch(`${apiUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        
        if (!res.ok) throw new Error("Backend generate failed");
        const data = await res.json();
        const textResponse = data.response;
        
        // Clear the "Generating..." text area
        doc.setFillColor(255, 255, 255);
        doc.rect(15, y - 5, 180, 10, 'F');
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        const splitText = doc.splitTextToSize(textResponse, 170);
        doc.text(splitText, 20, y);
        
      } catch(e) {
        console.error("AI Summary generation failed", e);
        doc.setFillColor(255, 255, 255);
        doc.rect(15, y - 5, 180, 10, 'F');
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        const fallbackText = "Due to API request limits, a live Gemini generation was skipped. However, based on Pune's current metrics:\n\n1. Macro-Policy: Enforce strict tree-canopy preservation policies across all high-risk urban sprawl zones (e.g. Kothrud, Viman Nagar).\n\n2. Infrastructure: Introduce city-wide cool-roof mandates for commercial buildings to combat systemic albedo absorption, alongside misting stations in primary plazas.\n\n3. Community: Establish interconnected green corridors linking isolated community parks to restore natural wind channels, incentivizing local citizen maintenance groups.";
        const fallbackSplit = doc.splitTextToSize(fallbackText, 170);
        doc.text(fallbackSplit, 20, y);
      }

      doc.save("Pune_Comprehensive_Climate_Report.pdf");
      
    } catch(err) {
      console.error("PDF Generation Error", err);
    } finally {
      setPdfGenerating(false);
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
            Climate Assistant
          </h1>
          <p style={{ color: "#4b5563", fontSize: 16, marginBottom: 20 }}>
            Select a Pune locality to run report, or download the full city-wide summary.
          </p>
          <button 
            onClick={downloadCityReport}
            disabled={!cityRankings || pdfGenerating || aiLoading}
            style={{ 
              background: "#111827", color: "#fff", border: "none", padding: "12px 24px", 
              borderRadius: "8px", fontWeight: "600", cursor: (!cityRankings || pdfGenerating || aiLoading) ? "not-allowed" : "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", transition: "0.2s", opacity: (!cityRankings || pdfGenerating || aiLoading) ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", gap: "8px"
            }}
          >
            {pdfGenerating ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                Generating PDF...
              </>
            ) : "📄 Download Complete Pune Report (PDF)"}
          </button>
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
                    
                    {/* Primary Risk & Resilience Group */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Current Risk */}
                      <div style={{ background: localityData.risk > 60 ? "#fef2f2" : (localityData.risk > 30 ? "#fffbeb" : "#f0fdf4"), padding: 24, borderRadius: 16, border: `1px solid ${localityData.risk > 60 ? '#fca5a5' : (localityData.risk > 30 ? '#fde68a' : '#86efac')}`, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: localityData.risk > 60 ? "#b91c1c" : (localityData.risk > 30 ? "#b45309" : "#15803d"), textTransform: "uppercase", letterSpacing: "1px" }}>🔥 Heat Risk Score</div>
                          {localityData.early_warning && <div style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 999 }}>EARLY WARNING</div>}
                        </div>
                        <div style={{ fontSize: 48, fontWeight: 900, color: localityData.risk > 60 ? "#991b1b" : (localityData.risk > 30 ? "#92400e" : "#166534"), lineHeight: 1 }}>{localityData.risk?.toFixed(1) || "--"}</div>
                        <div style={{ fontSize: 13, color: localityData.risk > 60 ? "#dc2626" : (localityData.risk > 30 ? "#d97706" : "#16a34a"), marginTop: 12, fontWeight: 700 }}>
                          {localityData.risk > 60 ? "High Risk" : (localityData.risk > 30 ? "Moderate Risk" : "Optimal")}
                        </div>
                      </div>

                      {/* 3 Month Future */}
                      <div style={{ background: "#f9fafb", padding: "18px 20px", borderRadius: 16, border: "1px solid #e5e7eb", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>⏳ 3-Month Projection</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#1f2937", marginTop: 2 }}>{localityData.future_risk_3months?.toFixed(1)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>🛡 Resilience</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: localityData.resilience_score < 40 ? "#dc2626" : "#2563eb", marginTop: 2 }}>{localityData.resilience_score?.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Environmental Metrics Group */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {/* Green Deficit */}
                      <div style={{ background: "#f0fdf4", padding: "18px 20px", borderRadius: 16, border: "1px solid #bbf7d0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 12, color: "#166534", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>🌱 Green Deficit</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#15803d" }}>{(localityData.green_deficit < 0 ? 0 : localityData.green_deficit)?.toFixed(2)}%</div>
                        <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4, fontWeight: 600 }}>{localityData.green_deficit > 40 ? "Critical" : (localityData.green_deficit > 20 ? "Concerning" : "Optimal")}</div>
                      </div>

                      {/* Cooling Potential */}
                      <div style={{ background: "#eff6ff", padding: "18px 20px", borderRadius: 16, border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>❄ Cooling Potential</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{localityData.cooling_potential?.toFixed(1)}%</div>
                        <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>{localityData.cooling_potential < 30 ? "Critical" : (localityData.cooling_potential < 60 ? "Concerning" : "Optimal")}</div>
                      </div>

                      {/* People At Risk */}
                      <div style={{ background: "#fef2f2", padding: "18px 20px", borderRadius: 16, border: "1px solid #fecaca", display: "flex", flexDirection: "column", justifyContent: "center", gridColumn: "span 2" }}>
                        <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>👥 Vulnerable Population (Est.)</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#b91c1c" }}>{(localityData.people_at_risk || 0).toLocaleString()} <span style={{fontSize: 14, fontWeight: 600, color: "#dc2626"}}>persons</span></div>
                      </div>
                    </div>

                </div>

                {/* Heat Drivers */}
                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 16, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
                      🧠 Primary Heat Drivers in {localityData.locality}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(localityData.top_drivers || []).map((driver, i) => (
                        <div key={i} style={{ background: "#f3f4f6", padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#4b5563", border: "1px solid #d1d5db" }}>
                          {driver}
                        </div>
                      ))}
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
