import requests
import concurrent.futures

import os
GOOGLE_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyA7ybs5MSMy-nq4QQkBiOrYG6Fi7CI1YD4")
loc_cache = {}

def get_suburb(lat, lon):
    # Round to 2 decimal places (~1.1km) to reduce unique geocode calls
    rounded = (round(lat, 2), round(lon, 2))
    if rounded in loc_cache:
        return loc_cache[rounded]

    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={GOOGLE_API_KEY}"
    try:
        resp = requests.get(url, timeout=5).json()
        if resp['status'] == 'OK':
            for result in resp['results']:
                for comp in result['address_components']:
                    if 'sublocality' in comp['types'] or 'locality' in comp['types'] or 'neighborhood' in comp['types']:
                        name = comp['long_name']
                        loc_cache[rounded] = name
                        return name
        else:
            print(f"Reverse geocoding status: {resp['status']} for ({lat},{lon})")
    except Exception as e:
        print(f"Geocoding error: {e}")
    
    loc_cache[rounded] = "Unknown"
    return "Unknown"

def add_locality(df):
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = []
        for _, r in df.iterrows():
            futures.append(executor.submit(get_suburb, r.lat, r.lon))
        names = [f.result() for f in futures]

    df["locality"] = names
    unique_localities = sorted(set(n for n in names if n != "Unknown"))
    print(f"LOCALITIES FOUND ({len(unique_localities)}): {unique_localities}")
    return df

if __name__=="__main__":
    import pandas as pd
    df = pd.DataFrame({
        "lat":[19.076],
        "lon":[72.877]
    })
    print(add_locality(df))
