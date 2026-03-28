import hashlib
import json
import os
from threading import Lock

import psycopg2
from dotenv import load_dotenv


DEFAULT_CACHE_PATH = os.path.join(os.path.dirname(__file__), "geocode_cache.json")

_cache_lock = Lock()
_cache_mtime = None
_cache_data = {}


def _load_cache(cache_path: str):
    global _cache_mtime, _cache_data

    if not os.path.exists(cache_path):
        _cache_mtime = None
        _cache_data = {}
        return _cache_data

    mtime = os.path.getmtime(cache_path)
    if _cache_mtime == mtime:
        return _cache_data

    with open(cache_path, "r", encoding="utf-8") as cache_file:
        _cache_data = json.load(cache_file)
    _cache_mtime = mtime
    return _cache_data


def get_cached_coordinates(address: str, cache_path: str | None = None):
    if not address:
        return None

    resolved_cache_path = cache_path or os.environ.get("GEOCODE_CACHE_PATH", DEFAULT_CACHE_PATH)
    cache_key = hashlib.md5(address.encode("utf-8")).hexdigest()

    with _cache_lock:
        cache = _load_cache(resolved_cache_path)
        coords = cache.get(cache_key)

    if not coords or not isinstance(coords, list) or len(coords) != 2:
        return None

    lat, lng = coords
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "database": os.environ.get("DB_NAME", "phillygasalerts"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "PhillyGas2026!"),
    "port": os.environ.get("DB_PORT", "5432"),
}


def extract_brand(station_name: str) -> str:
    return station_name.split(" - ", 1)[0].strip()


def fetch_stations(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ON (station_name, address)
                station_name,
                address
            FROM gas_prices
            ORDER BY station_name, address, time DESC
            """
        )
        return cur.fetchall()


def seed_stations():
    conn = psycopg2.connect(
        host=DB_CONFIG["host"],
        database=DB_CONFIG["database"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        port=DB_CONFIG["port"],
    )
    inserted = 0

    try:
        with conn:
            with conn.cursor() as cur:
                for station_name, address in fetch_stations(conn):
                    coords = get_cached_coordinates(address)
                    if not coords:
                        continue

                    lat, lng = coords
                    brand = extract_brand(station_name)

                    cur.execute(
                        """
                        INSERT INTO gas_stations (
                            station_name,
                            address,
                            brand,
                            lat,
                            lng,
                            geom
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                        )
                        ON CONFLICT (station_name, address) DO UPDATE SET
                            brand = EXCLUDED.brand,
                            lat = EXCLUDED.lat,
                            lng = EXCLUDED.lng,
                            geom = EXCLUDED.geom
                        """,
                        (station_name, address, brand, lat, lng, lng, lat),
                    )
                    inserted += 1
    finally:
        conn.close()

    print(f"Seeded {inserted} gas_stations rows with geometry.")


if __name__ == "__main__":
    seed_stations()
