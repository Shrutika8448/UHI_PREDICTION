import requests
import ee
import os
import google.auth

# Define the Project ID as a variable for easy updates
PROJECT_ID = "project-8dd5a2c6-c802-4fd1-8eb"
API_KEY = "AIzaSyAkx28z2za3UzFI4wC4aoZVIrDPZtjdG3o"

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
    """Geocoding request to find the center of the city using Nominatim (Free Open-Source)."""
    url = f"https://nominatim.openstreetmap.org/search?q={city},India&format=json"
    headers = {"User-Agent": "UHIDetectionApp/1.0"}
    
    response = requests.get(url, headers=headers)
    data = response.json()

    if not data:
        raise Exception(f"Geocoding failed for city: {city}")

    lat = float(data[0]["lat"])
    lon = float(data[0]["lon"])

    # Creates a 25km buffer around the city coordinates for analysis
    roi = ee.Geometry.Point([lon, lat]).buffer(25000)

    return roi
