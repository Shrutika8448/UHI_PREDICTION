import requests
# pyrefly: ignore [missing-import]
import ee
import os
import google.auth

# Define the Project ID as a variable for easy updates
PROJECT_ID = "project-8dd5a2c6-c802-4fd1-8eb"
API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyA7ybs5MSMy-nq4QQkBiOrYG6Fi7CI1YD4")

def initialize_ee():
    """Initializes Earth Engine using Cloud Run Service Account credentials."""
    try:
        # 1. Get the default credentials from the Cloud Run environment
        credentials, project_id = google.auth.default()

        # 2. Initialize Earth Engine with those credentials
        # This prevents the "Please authorize access" error in Cloud Run
        ee.Initialize(
            credentials=credentials,
            project=PROJECT_ID
        )
        print("Earth Engine Initialized Successfully")
    except Exception as e:
        print(f"EE Initialization Failed: {e}")

def get_roi(city):
    """Standard Geocoding request to find the center of the city."""
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={city},India&key={API_KEY}"
    
    response = requests.get(url)
    data = response.json()

    if data["status"] != "OK":
        raise Exception(f"Geocoding failed: {data['status']}")

    location = data["results"][0]["geometry"]["location"]
    lat = location["lat"]
    lon = location["lng"]

    # Creates a 25km buffer around the city coordinates for analysis
    roi = ee.Geometry.Point([lon, lat]).buffer(25000)

    return roi
