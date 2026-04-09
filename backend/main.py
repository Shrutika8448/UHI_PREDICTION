import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai

# Import custom project modules
from gee_engine import extract
from city_to_roi import initialize_ee
from locality import add_locality
from livability import compute
from analytics import enrich_dataframe
from map_generator import generate_current_heatmap, generate_future_heatmap

print("PROGRAM STARTED")

# 1. Initialize Flask and serve the React 'build' folder
# Dockerfile puts build at /app/build and runs main.py from /app/backend
app = Flask(__name__, static_folder='../build', static_url_path='/')
CORS(app)

# Earth Engine is automatically initialized when gee_engine handles imports

# 3. Load the model
model = joblib.load("uhi_model.pkl")

# THE FIX: Add this line right after loading
if not hasattr(model, 'gpu_id'):
    model.gpu_id = None
print("MODEL LOADED AND PATCHED")

# Define the features exactly as expected by your trained model
FEATURES = [
    "NDVI", "NDBI", "EVI", "SAVI", "Albedo",
    "MNDWI", "IBI", "Elevation", "Slope", "NightLights"
]

# --- FRONTEND ROUTES ---

@app.route("/")
def serve():
    """Serves the main React application."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    """Serves static files (JS, CSS, Images) for React."""
    return send_from_directory(app.static_folder, path)

# --- API ROUTES ---

@app.route("/api/status")
def status():
    return jsonify({"status": "Urban Heat Island AI Backend Running"})

def df_to_geojson(df, category):
    """Helper to convert the processed DataFrame to GeoJSON format for the map."""
    features = []
    for _, row in df.iterrows():
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row["lon"], row["lat"]]
            },
            "properties": {k: v for k, v in row.items() if k not in ["lat", "lon"]}
        }
        feature["properties"]["category"] = category
        features.append(feature)
    return features

@app.route("/generate-maps")
def generate_maps():
    city = request.args.get("city", "Pune")
    df = extract(city)
    
    # FIX: Scale Albedo to match the existing XGBoost model's training data scale (0-10000)
    if "Albedo" in df.columns:
        df["Albedo"] = df["Albedo"] * 10000.0
        
    df["prediction"] = model.predict(df[FEATURES])
    df = compute(df)
    df = enrich_dataframe(df, model, FEATURES)
    
    current_map_html = generate_current_heatmap(df, city)
    future_map_html = generate_future_heatmap(df, city)
    
    return jsonify({
        "current_map": current_map_html,
        "future_map": future_map_html
    })

@app.route("/analyze")
def analyze():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City parameter is required"}), 400
        
    try:
        # Step 1: Extract satellite data from GEE
        df = extract(city)
        
        # FIX: Scale Albedo to match the existing XGBoost model's training data scale (0-10000)
        if "Albedo" in df.columns:
            df["Albedo"] = df["Albedo"] * 10000.0
        
        # Step 2: Run predictions
        df["prediction"] = model.predict(df[FEATURES])
        
        # Step 3: Compute secondary indices and enrich data
        df = compute(df)
        df = enrich_dataframe(df, model, FEATURES)
        df = add_locality(df)
        
        # Step 4: Generate rankings by locality
        if "locality" in df.columns:
            locality_summary = df.groupby("locality").agg({
                "risk": "mean",
                "resilience_score": "mean",
                "green_deficit": "mean",
                "livability_index": "mean"
            }).reset_index()
            
            top_10 = locality_summary.sort_values("livability_index", ascending=False).head(10).to_dict(orient="records")
            bottom_10 = locality_summary.sort_values("livability_index", ascending=True).head(10).to_dict(orient="records")
        else:
            top_10, bottom_10 = [], []
            
        return jsonify({
            "type": "FeatureCollection",
            "city": city,
            "rankings": {
                "most_livable": top_10,
                "least_livable": bottom_10
            },
            "features": df_to_geojson(df, "all_points")
        })

    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def api_chat():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"response": "Backend is missing GEMINI_API_KEY environment variable. Please configure it in Cloud Run."})
        
    data = request.json
    user_message = data.get("message", "")
    context = data.get("context", "General Pune Context")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f'''
        You are CityCare AI, an Urban Heat Island and Climate Assistant for Pune.
        Here is the latest realtime satellite data report context from our backend: {context}
        
        The user asks: "{user_message}"
        
        Provide a concise, helpful, and scientific answer in 1-2 short paragraphs. Be conversational but authoritative. Do not use asterisks or markdown, keep it plain text.
        '''
        
        response = model.generate_content(prompt)
        text = response.text.replace('*', '').replace('#', '').replace('`', '')
        return jsonify({"response": text})
    except Exception as e:
        print(f"GEMINI CHAT ERROR: {e}")
        return jsonify({"response": "Error communicating with the satellite AI servers."})

@app.route("/api/mitigations", methods=["POST"])
def api_mitigations():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback if no key is set yet
        return jsonify({"mitigations": [
            "Establish dedicated green corridors to disrupt heat trapping.",
            "Enforce reflective paving materials on new residential projects.",
            "Map out highly vulnerable civic zones for immediate cooling intervention."
        ]})
        
    data = request.json
    locality = data.get("locality", "Unknown")
    prompt = data.get("prompt", "")
    model_version = data.get("model", "gemini-1.5-flash")
    temperature = data.get("temperature", 0.7)
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name=model_version, generation_config={"temperature": temperature})
        response = model.generate_content(prompt)
        
        import json
        text = response.text.replace('```json', '').replace('```', '').strip()
        parsed = json.loads(text)
        return jsonify({"mitigations": parsed})
    except Exception as e:
        print(f"GEMINI MITIGATION ERROR: {e}")
        return jsonify({"mitigations": [
            f"Implement emergency cooling interventions such as temporary shading and misting systems in {locality}'s densest sectors.",
            f"Mandate cool-roof coatings for all new commercial developments.",
            f"Enhance localized green corridors to disrupt specific heat-trapping patterns."
        ]})

@app.route("/api/generate", methods=["POST"])
def api_generate():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"response": "Due to API key constraints, a live Gemini generation was skipped. However, based on Pune's current metrics:\n\n1. Macro-Policy: Enforce strict tree-canopy preservation policies across all high-risk urban sprawl zones (e.g. Kothrud, Viman Nagar).\n\n2. Infrastructure: Introduce city-wide cool-roof mandates for commercial buildings to combat systemic albedo absorption, alongside misting stations in primary plazas.\n\n3. Community: Establish interconnected green corridors linking isolated community parks to restore natural wind channels, incentivizing local citizen maintenance groups."})
        
    data = request.json
    prompt = data.get("prompt", "")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"temperature": 0.85, "top_p": 0.95})
        response = model.generate_content(prompt)
        text = response.text.replace('*', '').replace('#', '').replace('`', '')
        return jsonify({"response": text})
    except Exception as e:
        print(f"GEMINI GENERATE ERROR: {e}")
        return jsonify({"response": "Due to API request limits, a live Gemini generation was skipped. However, based on Pune's current metrics:\n\n1. Macro-Policy: Enforce strict tree-canopy preservation policies across all high-risk urban sprawl zones (e.g. Kothrud, Viman Nagar).\n\n2. Infrastructure: Introduce city-wide cool-roof mandates for commercial buildings to combat systemic albedo absorption, alongside misting stations in primary plazas.\n\n3. Community: Establish interconnected green corridors linking isolated community parks to restore natural wind channels, incentivizing local citizen maintenance groups."})

@app.errorhandler(404)
def catch_all(e):
    # This ensures that any route not found by Flask is handled by React
    return send_from_directory(app.static_folder, 'index.html')

# --- SERVER START ---

if __name__ == "__main__":
    # Force port to 5001 for local React proxy
    port = 5001
    app.run(host="127.0.0.1", port=port, debug=False)
