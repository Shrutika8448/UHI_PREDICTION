print("PROGRAM STARTED")

# pyrefly: ignore [missing-import]
import ee
import pandas as pd
from city_to_roi import get_roi
import datetime

print("IMPORTS DONE")

import os
import json
import google.oauth2.service_account as service_account

# Check if we are running on Render (which passes the JSON as a string)
if "GOOGLE_APPLICATION_CREDENTIALS_JSON" in os.environ:
    creds_json = json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
    # Earth Engine requires explicit OAuth scopes when using a raw Service Account JSON
    scopes = ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/cloud-platform']
    credentials = service_account.Credentials.from_service_account_info(creds_json, scopes=scopes)
    ee.Initialize(credentials=credentials, project=creds_json.get("project_id", "uhv-preciction-492819"))
else:
    # Just initialize with Earth Engine directly for local development. 
    # It will use the local token you generated via ee.Authenticate()
    ee.Initialize(project="uhv-preciction-492819")

def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloudBitMask = 1 << 10
    cirrusBitMask = 1 << 11
    mask = qa.bitwiseAnd(cloudBitMask).eq(0) \
        .And(qa.bitwiseAnd(cirrusBitMask).eq(0))
    return image.updateMask(mask).divide(10000)

print("EE INITIALIZED")

S2_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
LANDSAT_COLLECTION = "LANDSAT/LC08/C02/T1_L2"


def _date_range(days_back, end_date=None):
    end = end_date or datetime.datetime.now()
    start = end - datetime.timedelta(days=days_back)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def _s2_collection(roi, start_date, end_date, max_cloud_pct):
    return (
        ee.ImageCollection(S2_COLLECTION)
        .filterBounds(roi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud_pct))
        .map(mask_s2_clouds)
    )


def get_s2_median(roi, end_date):
    """Return a Sentinel-2 median composite, falling back to wider/date-looser filters if empty."""
    strategies = [
        (180, 60),
        (365, 80),
    ]
    for days_back, max_cloud in strategies:
        start_date, end = _date_range(days_back, datetime.datetime.strptime(end_date, "%Y-%m-%d"))
        col = _s2_collection(roi, start_date, end, max_cloud)
        count = col.size().getInfo()
        print(f"S2 search ({days_back}d, <{max_cloud}% cloud): {count} scenes")
        if count > 0:
            return col.median()

    raise Exception(
        "No Sentinel-2 imagery found for this city. Try again later or pick a different city."
    )


def get_landsat_median(roi, end_date):
    """Return a Landsat median composite with a wider fallback window if needed."""
    for days_back in (180, 365):
        start_date, end = _date_range(days_back, datetime.datetime.strptime(end_date, "%Y-%m-%d"))
        col = (
            ee.ImageCollection(LANDSAT_COLLECTION)
            .filterBounds(roi)
            .filterDate(start_date, end)
        )
        count = col.size().getInfo()
        print(f"Landsat search ({days_back}d): {count} scenes")
        if count > 0:
            return col.median()

    raise Exception(
        "No Landsat imagery found for this city. Try again later or pick a different city."
    )


def extract(city):

    print("ENTERED EXTRACT")

    roi = get_roi(city)
    print("ROI CREATED")

    end_date = datetime.datetime.now().strftime('%Y-%m-%d')

    collection = get_s2_median(roi, end_date)
    print("COLLECTION READY")

    # For Sentinel-2, there is no thermal band (LST). We will use LST from Landsat as an intersecting band
    # or rely solely on NDWI and atmospheric temp. The model needs LST.
    landsat_coll = get_landsat_median(roi, end_date)

    lst = landsat_coll.select("ST_B10") \
        .multiply(0.00341802).add(149).subtract(273).rename("LST")

    print("LST READY")
    evi = collection.expression(
    '2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))',
    {
        'NIR': collection.select('B8'),
        'RED': collection.select('B4'),
        'BLUE': collection.select('B2')
    }).rename("EVI")

    albedo = collection.expression(
    '0.356*B2 + 0.130*B4 + 0.373*B8 + 0.085*B11 + 0.072*B12 - 0.0018',
    {
        'B2': collection.select('B2'),
        'B4': collection.select('B4'),
        'B8': collection.select('B8'),
        'B11': collection.select('B11'),
        'B12': collection.select('B12')
    }).rename("Albedo")

    mndwi = collection.normalizedDifference(['B3','B11']).rename("MNDWI")
    
    savi = collection.expression(
    '((NIR-RED)/(NIR+RED+0.5))*1.5',
    {
        'NIR': collection.select('B8'),
        'RED': collection.select('B4')
    }).rename("SAVI")

    ndbi = collection.normalizedDifference(['B11','B8']).rename("NDBI")
    print("NDBI READY")
    ndvi = collection.normalizedDifference(['B8','B4']).rename("NDVI")
    print("NDVI READY")
    ibi = ndbi.subtract(ndvi).rename("IBI")

    dem = ee.Image("USGS/SRTMGL1_003")

    elevation = dem.rename("Elevation")

    slope = ee.Terrain.slope(dem).rename("Slope")

    night = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG") \
    .filterBounds(roi) \
    .mean() \
    .select("avg_rad") \
    .rename("NightLights")

    
    
    stack = lst.addBands([
    ndvi,
    ndbi,
    evi,
    savi,
    albedo,
    mndwi,
    ibi,
    elevation,
    slope,
    night
    ])
    print("STACK READY")

    samples = stack.sample(region=roi, scale=500, numPixels=150, geometries=True)
    print("SAMPLES CREATED")

    data = samples.getInfo()
    print("DOWNLOADED FROM CLOUD")

    rows = []

    for f in data["features"]:
        props = f["properties"]
        coords = f["geometry"]["coordinates"]
        props["lon"] = coords[0]
        props["lat"] = coords[1]
        rows.append(props)

    df = pd.DataFrame(rows)

    print(df.head())

    return df


if __name__ == "__main__":
    print("CALLING FUNCTION")
    df = extract("Mumbai")
    print("PROGRAM FINISHED")
