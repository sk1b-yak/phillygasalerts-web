import os
from datetime import datetime
from typing import List, Optional
from collections import defaultdict
from threading import Lock
from time import time

from fastapi import FastAPI, Response, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from geocode import get_cached_coordinates

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = FastAPI(
    title="PhillyGasAlerts API",
    description="API for tracking Philadelphia gas prices",
    version="1.0.0"
)

APP_START_TIME = datetime.utcnow()

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "database": os.environ.get("DB_NAME", "phillygasalerts"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "port": os.environ.get("DB_PORT", "5432"),
    "minconn": 1,
    "maxconn": 10
}

RATE_LIMIT = int(os.environ.get("RATE_LIMIT_REQUESTS", "30"))
RATE_WINDOW = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))

CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8080,https://*.pages.dev,https://phillygasalerts.com"
).split(",")

RATE_LIMIT_EXEMPT_PATHS = {"/health", "/status"}

STATIC_CORS_ORIGINS = [origin for origin in CORS_ORIGINS if origin != "https://*.pages.dev"]
PAGES_DEV_CORS_REGEX = r"https://.*\.pages\.dev"

db_pool = None
rate_limit_store = defaultdict(list)
rate_limit_lock = Lock()


def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = pool.ThreadedConnectionPool(**DB_CONFIG)
    return db_pool


def check_rate_limit(client_ip: str) -> bool:
    current_time = time()
    with rate_limit_lock:
        client_requests = rate_limit_store[client_ip]
        client_requests[:] = [t for t in client_requests if current_time - t < RATE_WINDOW]
        
        if len(client_requests) >= RATE_LIMIT:
            return False
        
        client_requests.append(current_time)
        return True


class GasStation(BaseModel):
    station_name: str
    price_regular: float = Field(..., ge=0)
    address: str
    zip_code: str
    time: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_confidence: str = "unknown"
    geocode_source: Optional[str] = None
    has_reliable_location: bool = False

    @classmethod
    def from_db_row(cls, row):
        cached_coords = get_cached_coordinates(row['address'])
        lat = None
        lng = None
        location_confidence = "unknown"
        geocode_source = None

        if cached_coords:
            lat, lng = cached_coords
            location_confidence = "geocoded"
            geocode_source = "nominatim_cache"

        return cls(
            station_name=row['station_name'],
            price_regular=float(row['price_regular']),
            address=row['address'],
            zip_code=row['zip_code'],
            time=str(row['time']),
            lat=lat,
            lng=lng,
            location_confidence=location_confidence,
            geocode_source=geocode_source,
            has_reliable_location=lat is not None and lng is not None,
        )


class GasStationResponse(BaseModel):
    data: List[GasStation]
    count: int
    timestamp: str


class PriceStats(BaseModel):
    min_price: float
    max_price: float
    avg_price: float
    station_count: int
    price_count: int
    oldest_record: str
    newest_record: str


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in RATE_LIMIT_EXEMPT_PATHS:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too Many Requests",
                "message": f"Rate limit exceeded. Maximum {RATE_LIMIT} requests per {RATE_WINDOW} seconds.",
                "retry_after": RATE_WINDOW
            }
        )
    
    response = await call_next(request)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=STATIC_CORS_ORIGINS,
    allow_origin_regex=PAGES_DEV_CORS_REGEX,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }
    )


@app.get("/top-deals", response_model=GasStationResponse)
async def get_deals(response: Response):
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT DISTINCT ON (station_name, address) 
            station_name, price_regular, address, zip_code, time
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '24 hours'
        ORDER BY station_name, address, time DESC
        """
        cur.execute(query)
        results = cur.fetchall()
        
        sorted_deals = sorted(results, key=lambda x: x['price_regular'])[:10]
        
        cur.close()
        
        return GasStationResponse(
            data=[GasStation.from_db_row(deal) for deal in sorted_deals],
            count=len(sorted_deals),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    finally:
        if conn:
            db.putconn(conn)


@app.get("/prices", response_model=GasStationResponse)
async def get_all_prices(response: Response):
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT DISTINCT ON (station_name, address) 
            station_name, price_regular, address, zip_code, time
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '24 hours'
        ORDER BY station_name, address, time DESC
        """
        cur.execute(query)
        results = cur.fetchall()
        
        cur.close()
        
        return GasStationResponse(
            data=[GasStation.from_db_row(row) for row in results],
            count=len(results),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    finally:
        if conn:
            db.putconn(conn)


@app.get("/prices/{zip_code}", response_model=GasStationResponse)
async def get_prices_by_zip(response: Response, zip_code: str):
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT DISTINCT ON (station_name, address) 
            station_name, price_regular, address, zip_code, time
        FROM gas_prices
        WHERE zip_code = %s
          AND time > NOW() - INTERVAL '24 hours'
        ORDER BY station_name, address, time DESC
        """
        cur.execute(query, (zip_code,))
        results = cur.fetchall()
        
        cur.close()
        
        return GasStationResponse(
            data=[GasStation.from_db_row(row) for row in results],
            count=len(results),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    finally:
        if conn:
            db.putconn(conn)


@app.get("/stats")
async def get_stats():
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            MIN(price_regular) as min_price,
            MAX(price_regular) as max_price,
            ROUND(AVG(price_regular)::numeric, 3) as avg_price,
            COUNT(*) as station_count,
            MIN(time) as oldest_record,
            MAX(time) as newest_record
        FROM (
            SELECT DISTINCT ON (station_name, address) 
                price_regular, time
            FROM gas_prices
            WHERE time > NOW() - INTERVAL '24 hours'
            ORDER BY station_name, address, time DESC
        ) latest
        """
        cur.execute(query)
        result = cur.fetchone()
        
        cur.close()
        
        if result:
            return {
                "min_price": float(result['min_price']) if result['min_price'] else None,
                "max_price": float(result['max_price']) if result['max_price'] else None,
                "avg_price": float(result['avg_price']) if result['avg_price'] else None,
                "station_count": result['station_count'],
                "price_count": result['station_count'],
                "oldest_record": str(result['oldest_record']) if result['oldest_record'] else None,
                "newest_record": str(result['newest_record']) if result['newest_record'] else None,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        return {
            "min_price": None,
            "max_price": None,
            "avg_price": None,
            "station_count": 0,
            "price_count": 0,
            "oldest_record": None,
            "newest_record": None,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    finally:
        if conn:
            db.putconn(conn)


@app.get("/health")
async def health():
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        
        return {
            "status": "healthy",
            "service": "PhillyGasAlerts API",
            "version": "1.0.0",
            "rate_limit": f"{RATE_LIMIT}/{RATE_WINDOW}s"
        }
    finally:
        if conn:
            db.putconn(conn)


@app.get("/status")
async def get_status():
    db = get_db_pool()
    conn = None
    try:
        conn = db.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        uptime_seconds = (datetime.utcnow() - APP_START_TIME).total_seconds()
        
        cur.execute("SELECT MAX(time) as last_refresh FROM gas_prices")
        last_refresh_result = cur.fetchone()
        last_refresh = last_refresh_result['last_refresh'] if last_refresh_result and last_refresh_result['last_refresh'] else None
        
        cur.execute("SELECT COUNT(*) as total_records FROM gas_prices")
        total_records_result = cur.fetchone()
        total_records = total_records_result['total_records'] if total_records_result else 0
        
        cur.close()
        
        return {
            "server_uptime_seconds": uptime_seconds,
            "server_uptime_formatted": f"{int(uptime_seconds // 3600)}h {int((uptime_seconds % 3600) // 60)}m {int(uptime_seconds % 60)}s",
            "last_data_refresh": str(last_refresh) if last_refresh else None,
            "total_records": total_records,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    finally:
        if conn:
            db.putconn(conn)


@app.on_event("shutdown")
def shutdown_event():
    global db_pool
    if db_pool:
        db_pool.closeall()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
