import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "database": os.environ.get("DB_NAME", "phillygasalerts"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "port": os.environ.get("DB_PORT", "5432")
}

EST = pytz.timezone('America/New_York')
UTC = pytz.UTC

def get_timezone_abbrev():
    """Get fixed timezone abbreviation (EST)"""
    return "EST"


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_current_est_time():
    """Get current time in EST/EDT (automatically handles DST)"""
    return datetime.now(EST)


def get_current_utc_time():
    """Get current UTC time"""
    return datetime.now(UTC)


def utc_to_est(dt):
    """Convert UTC datetime to EST"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = UTC.localize(dt)
    return dt.astimezone(EST)


def format_est_time(dt, format_str="%Y-%m-%d %I:%M:%S %p %Z"):
    """Format a datetime in EST"""
    if dt is None:
        return "N/A"
    est_dt = utc_to_est(dt)
    return est_dt.strftime(format_str)


def get_timezone_abbrev():
    """Get fixed timezone abbreviation (EST)"""
    return "EST"


def get_total_stats():
    """Get total database statistics"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT station_name) as unique_stations,
            COUNT(DISTINCT zip_code) as zip_codes,
            MIN(price_regular) as min_price,
            MAX(price_regular) as max_price,
            ROUND(AVG(price_regular)::numeric, 2) as avg_price,
            MIN(time) as first_record,
            MAX(time) as last_record
        FROM gas_prices
    """)
    result = cur.fetchone()
    cur.close()
    conn.close()
    return dict(result) if result else {}


def get_top_stations(limit=5, cheapest=True):
    """Get top cheapest or most expensive stations"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    order = "ASC" if cheapest else "DESC"
    cur.execute(f"""
        SELECT DISTINCT ON (station_name, address)
            station_name,
            address,
            zip_code,
            price_regular,
            time,
            local_time
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '24 hours'
        ORDER BY station_name, address, time DESC
        ORDER BY price_regular {order}
        LIMIT %s
    """, (limit,))
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]


def get_recent_records(hours=24, limit=100):
    """Get recent gas price records"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            station_name,
            address,
            zip_code,
            price_regular,
            time,
            local_time
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '%s hours'
        ORDER BY time DESC
        LIMIT %s
    """, (hours, limit))
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]


def get_price_by_zip():
    """Get average price by ZIP code"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            zip_code,
            COUNT(*) as record_count,
            ROUND(AVG(price_regular)::numeric, 2) as avg_price,
            MIN(price_regular) as min_price,
            MAX(price_regular) as max_price
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '24 hours'
        GROUP BY zip_code
        ORDER BY avg_price ASC
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]


def get_all_stations_with_location(limit=500):
    """Get all stations with address for geocoding"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT DISTINCT ON (station_name, address)
            station_name,
            address,
            zip_code,
            price_regular,
            time,
            local_time
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '48 hours'
        ORDER BY station_name, address, time DESC
        LIMIT %s
    """, (limit,))
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]


def get_daily_stats(date=None):
    """Get statistics for a specific date or today"""
    if date is None:
        date_filter = "CURRENT_DATE"
    else:
        date_filter = f"'{date}'"
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT station_name) as unique_stations,
            COUNT(DISTINCT zip_code) as zip_codes,
            MIN(price_regular) as min_price,
            MAX(price_regular) as max_price,
            ROUND(AVG(price_regular)::numeric, 2) as avg_price
        FROM gas_prices
        WHERE DATE(time) = {date_filter}
    """)
    result = cur.fetchone()
    cur.close()
    conn.close()
    return dict(result) if result else {}


def get_scrape_stats_for_day(date=None):
    """Get scrape statistics - counts records per hour"""
    if date is None:
        date_filter = "CURRENT_DATE"
    else:
        date_filter = f"'{date}'"
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT 
            DATE_TRUNC('hour', local_time) as hour,
            COUNT(*) as records
        FROM gas_prices
        WHERE DATE(local_time) = {date_filter}
        GROUP BY DATE_TRUNC('hour', local_time)
        ORDER BY hour
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]


def get_last_scrape_time():
    """Get the timestamp of the most recent record"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT MAX(local_time) FROM gas_prices")
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result[0] if result and result[0] else None


def get_volatility_stats():
    """Get price volatility by station"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            station_name,
            COUNT(*) as price_changes,
            MIN(price_regular) as min_price,
            MAX(price_regular) as max_price,
            ROUND((MAX(price_regular) - MIN(price_regular))::numeric, 2) as price_range
        FROM gas_prices
        WHERE time > NOW() - INTERVAL '7 days'
        GROUP BY station_name
        HAVING COUNT(*) > 1
        ORDER BY price_range DESC
        LIMIT 10
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in results]
