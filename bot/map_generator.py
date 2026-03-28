import folium
from folium.plugins import MarkerCluster, HeatMap
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
import os
import json
import hashlib
from datetime import datetime
import pytz

try:
    from .utils.database import get_all_stations_with_location
except ImportError:
    from utils.database import get_all_stations_with_location


CACHE_FILE = "/opt/phillygasalerts/bot/geocode_cache.json"
PHILLY_CENTER = [39.9526, -75.1652]
EST = pytz.timezone('America/New_York')

geolocator = Nominatim(user_agent="philly_gas_alerts_bot_v2", timeout=10)


def load_cache():
    """Load geocoding cache from file"""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_cache(cache):
    """Save geocoding cache to file"""
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)


def geocode_address(address, force_refresh=False):
    """Convert address to lat/long with caching"""
    cache = load_cache()
    cache_key = hashlib.md5(address.encode()).hexdigest()
    
    if not force_refresh and cache_key in cache:
        return cache[cache_key]
    
    try:
        location = geolocator.geocode(f"{address}, Philadelphia, PA", timeout=10)
        if location:
            result = [location.latitude, location.longitude]
            cache[cache_key] = result
            save_cache(cache)
            time.sleep(1.1)
            return result
        else:
            cache[cache_key] = None
            save_cache(cache)
            return None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Geocoding error for {address}: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error geocoding {address}: {e}")
        return None


def format_est_time(dt):
    """Format datetime in EST for display"""
    if dt is None:
        return "N/A"
    try:
        if hasattr(dt, 'astimezone'):
            est_dt = dt.astimezone(EST)
            return est_dt.strftime('%Y-%m-%d %I:%M %p')
        elif hasattr(dt, 'tzinfo') and dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
            est_dt = dt.astimezone(EST)
            return est_dt.strftime('%Y-%m-%d %I:%M %p')
        return str(dt)
    except Exception as e:
        print(f"Time format error: {e}")
        return str(dt)


def get_price_color(price, min_price, max_price):
    """Get color based on price (green=cheap, red=expensive)"""
    price = float(price)
    min_price = float(min_price)
    max_price = float(max_price)
    
    if max_price == min_price:
        return '#FFD700'
    
    normalized = (price - min_price) / (max_price - min_price)
    
    if normalized < 0.33:
        return '#2ECC71'
    elif normalized < 0.66:
        return '#F1C40F'
    else:
        return '#E74C3C'


def generate_gas_map():
    """Generate interactive Folium map with all gas stations"""
    print("Fetching stations from database...")
    stations = get_all_stations_with_location(limit=200)
    
    if not stations:
        print("No stations found in database")
        return None
    
    print(f"Found {len(stations)} stations")
    
    prices = [float(s['price_regular']) for s in stations]
    min_price = min(prices)
    max_price = max(prices)
    
    m = folium.Map(
        location=PHILLY_CENTER,
        zoom_start=12,
        tiles='cartodbpositron'
    )
    
    folium.TileLayer('openstreetmap', name='OpenStreetMap').add_to(m)
    folium.TileLayer('cartodbdark_matter', name='Dark Mode').add_to(m)
    
    marker_cluster = MarkerCluster(name='Station Clusters').add_to(m)
    
    heat_data = []
    geocoded_count = 0
    failed_geocode = []
    
    print("Geocoding addresses...")
    for station in stations:
        lat_lng = geocode_address(station['address'])
        
        if lat_lng:
            geocoded_count += 1
            color = get_price_color(station['price_regular'], min_price, max_price)
            est_time = format_est_time(station.get('local_time', station.get('time')))
            
            popup_html = f"""
            <div style="font-family: Arial, sans-serif; width: 220px;">
                <h4 style="margin: 0 0 8px 0; color: #2C3E50;">{station['station_name']}</h4>
                <hr style="margin: 5px 0;">
                <p style="margin: 4px 0; font-size: 14px;">
                    <b style="color: #27AE60;">${station['price_regular']:.2f}</b>/gal
                </p>
                <p style="margin: 4px 0; font-size: 12px; color: #555;">
                    📍 {station['address']}
                </p>
                <p style="margin: 4px 0; font-size: 12px; color: #555;">
                    📬 ZIP: {station['zip_code']}
                </p>
                <hr style="margin: 5px 0;">
                <p style="margin: 4px 0; font-size: 11px; color: #888;">
                    🕐 Updated: {est_time} EDT
                </p>
            </div>
            """
            
            folium.CircleMarker(
                location=lat_lng,
                radius=12,
                popup=folium.Popup(popup_html, max_width=280),
                tooltip=f"${station['price_regular']:.2f} - {station['station_name']}",
                color=color,
                fill=True,
                fillColor=color,
                fillOpacity=0.8,
                weight=2
            ).add_to(marker_cluster)
            
            heat_data.append([lat_lng[0], lat_lng[1], float(station['price_regular'])])
    
    print(f"Geocoded {geocoded_count}/{len(stations)} stations")
    
    if heat_data:
        HeatMap(
            heat_data, 
            name='Price Heatmap', 
            radius=20, 
            blur=15,
            gradient={0.4: 'blue', 0.65: 'lime', 1: 'red'}
        ).add_to(m)
    
    folium.LayerControl().add_to(m)
    
    try:
        from folium.plugins import Fullscreen, MiniMap
        Fullscreen().add_to(m)
        MiniMap(toggle_display=True, position='bottomright').add_to(m)
    except ImportError:
        print("Note: Fullscreen/MiniMap plugins not available")
    
    price_range = max_price - min_price
    legend_html = f'''
    <div style="position: fixed; bottom: 70px; left: 50px; z-index: 1000; 
                background-color: white; padding: 15px; border-radius: 8px;
                border: 2px solid #333; font-size: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">
            ⛽ PhillyGasAlerts
        </div>
        <div style="margin-bottom: 8px;">
            <b>Price Legend:</b>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="background: #2ECC71; width: 18px; height: 18px; border-radius: 50%; margin-right: 8px;"></div>
            <span>Cheap (${min_price:.2f})</span>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="background: #F1C40F; width: 18px; height: 18px; border-radius: 50%; margin-right: 8px;"></div>
            <span>Medium (${min_price + price_range * 0.5:.2f})</span>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="background: #E74C3C; width: 18px; height: 18px; border-radius: 50%; margin-right: 8px;"></div>
            <span>Expensive (${max_price:.2f})</span>
        </div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
            Click markers for details<br>
            Toggle layers (top right)
        </div>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))
    
    title_html = f'''
    <div style="position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 1000;
                background-color: white; padding: 10px 20px; border-radius: 8px;
                border: 2px solid #333; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <div style="font-weight: bold; font-size: 16px;">
            🗺️ PhillyGasAlerts - Gas Prices Map
        </div>
        <div style="font-size: 12px; color: #666;">
            {geocoded_count} stations | ${min_price:.2f} - ${max_price:.2f}/gal
        </div>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))
    
    return m


def save_map(filename="/opt/phillygasalerts/bot/gas_map.html"):
    """Generate and save the map to a file"""
    print("=" * 50)
    print("PHILLYGASALERTS MAP GENERATOR")
    print("=" * 50)
    m = generate_gas_map()
    if m:
        m.save(filename)
        print(f"Map saved to {filename}")
        print("=" * 50)
        return filename
    print("Failed to generate map")
    print("=" * 50)
    return None


if __name__ == "__main__":
    save_map()
