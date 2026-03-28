import os
import time
import httpx
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ZYLA_API_KEY = os.environ.get("ZYLA_API_KEY", "")
ZIP_CODES = os.environ.get("ZIP_CODES", "").split(",")
BATCH_SIZE = int(os.environ.get("SCRAPER_BATCH_SIZE", "10"))
BATCH_DELAY = int(os.environ.get("SCRAPER_BATCH_DELAY", "5"))
RETRY_ATTEMPTS = int(os.environ.get("SCRAPER_RETRY_ATTEMPTS", "3"))
RETRY_DELAY = int(os.environ.get("SCRAPER_RETRY_DELAY", "2"))

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "database": os.environ.get("DB_NAME", "phillygasalerts"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "port": os.environ.get("DB_PORT", "5432")
}

ZIP_CONSECUTIVE_FAIL_THRESHOLD = 3
ZIP_REPLACEMENT_CANDIDATES = [
    "19102", "19106", "19109", "19126", "19136", "19149", "19152", "19154",
    "19128", "19118", "19119", "19150", "19111", "19114", "19115", "19116"
]


def get_db_connection():
    import psycopg2
    return psycopg2.connect(**DB_CONFIG)


def update_station_reliability(station_name, address, zip_code, success):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if success:
            query = """
            INSERT INTO station_reliability (station_name, address, zip_code, total_reports, successful_reports, last_seen)
            VALUES (%s, %s, %s, 1, 1, %s)
            ON CONFLICT (station_name, address) DO UPDATE SET
                total_reports = station_reliability.total_reports + 1,
                successful_reports = station_reliability.successful_reports + 1,
                last_seen = %s,
                consecutive_fails = 0,
                updated_at = NOW()
            """
            cur.execute(query, (station_name, address, zip_code, datetime.now(), datetime.now()))
        else:
            query = """
            INSERT INTO station_reliability (station_name, address, zip_code, total_reports, failed_reports, last_failed)
            VALUES (%s, %s, %s, 1, 1, %s)
            ON CONFLICT (station_name, address) DO UPDATE SET
                total_reports = station_reliability.total_reports + 1,
                failed_reports = station_reliability.failed_reports + 1,
                last_failed = %s,
                reliability_score = CASE 
                    WHEN station_reliability.total_reports + 1 > 0 
                    THEN (station_reliability.successful_reports::NUMERIC / (station_reliability.total_reports + 1)) * 100 
                    ELSE 0 
                END,
                updated_at = NOW()
            """
            cur.execute(query, (station_name, address, zip_code, datetime.now(), datetime.now()))
        
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.debug(f"Failed to update station reliability: {e}")


def update_zip_tracking(zip_code, success):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if success:
            query = """
            INSERT INTO failed_zip_tracking (zip_code, last_attempt, last_success, consecutive_fails)
            VALUES (%s, %s, %s, 0)
            ON CONFLICT (zip_code) DO UPDATE SET
                last_attempt = %s,
                last_success = %s,
                consecutive_fails = 0
            """
            cur.execute(query, (zip_code, datetime.now(), datetime.now(), datetime.now(), datetime.now()))
        else:
            query = """
            INSERT INTO failed_zip_tracking (zip_code, fail_count, last_attempt, consecutive_fails)
            VALUES (%s, 1, %s, 1)
            ON CONFLICT (zip_code) DO UPDATE SET
                fail_count = failed_zip_tracking.fail_count + 1,
                last_attempt = %s,
                consecutive_fails = failed_zip_tracking.consecutive_fails + 1
            """
            cur.execute(query, (zip_code, datetime.now(), datetime.now()))
        
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.debug(f"Failed to update ZIP tracking: {e}")


def save_to_db(station, price, zip_code, address):
    import psycopg2
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        clean_price = float(price.replace('$', ''))
        now = datetime.now()
        
        insert_query = """
        INSERT INTO gas_prices (time, local_time, station_name, address, zip_code, price_regular)
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        cur.execute(insert_query, (now, now, station, address, zip_code, clean_price))
        
        conn.commit()
        cur.close()
        conn.close()
        
        update_station_reliability(station, address, zip_code, success=True)
        return True
    except Exception as e:
        logger.error(f"Database Error for {station}: {e}")
        update_station_reliability(station, address, zip_code, success=False)
        return False


def fetch_zip_with_retry(zipcode, attempt=1):
    headers = {"Authorization": f"Bearer {ZYLA_API_KEY}"}
    url = f"https://zylalabs.com/api/4808/gas+price+locator+api/5997/get+pices?zip={zipcode}&type=regular"
    
    try:
        response = httpx.get(url, headers=headers, timeout=15.0)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP Error for {zipcode} (attempt {attempt}): {e.response.status_code}")
        if attempt < RETRY_ATTEMPTS:
            time.sleep(RETRY_DELAY)
            return fetch_zip_with_retry(zipcode, attempt + 1)
        return None
    except Exception as e:
        logger.warning(f"Error for {zipcode} (attempt {attempt}): {e}")
        if attempt < RETRY_ATTEMPTS:
            time.sleep(RETRY_DELAY)
            return fetch_zip_with_retry(zipcode, attempt + 1)
        return None


def process_zip(zipcode):
    data = fetch_zip_with_retry(zipcode)
    
    if not data:
        logger.warning(f"Failed to fetch data for {zipcode} after {RETRY_ATTEMPTS} attempts")
        update_zip_tracking(zipcode, success=False)
        return 0
    
    update_zip_tracking(zipcode, success=True)
    
    gas_data = data.get("gas_prices", [])
    saved_count = 0
    
    if isinstance(gas_data, list):
        for item in gas_data:
            if isinstance(item, dict) and item.get("station"):
                s_name = item.get("station")
                s_price = item.get("price", "0.00")
                s_addr = item.get("address", "N/A")
                
                if save_to_db(s_name, s_price, zipcode, s_addr):
                    saved_count += 1
                    logger.debug(f"Saved: {s_name} @ {s_price} in {zipcode}")
    elif isinstance(gas_data, dict):
        logger.info(f"{zipcode}: Only average data available, no station-specific prices")
    
    return saved_count


def get_working_replacement_zips(current_zips):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT zip_code FROM failed_zip_tracking 
            WHERE zip_code NOT IN %s AND (consecutive_fails < %s OR consecutive_fails IS NULL)
            ORDER BY consecutive_fails ASC NULLS FIRST
            LIMIT %s
        """, (tuple(current_zips), ZIP_CONSECUTIVE_FAIL_THRESHOLD, 5))
        
        results = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        return results
    except Exception as e:
        logger.debug(f"Could not get replacement ZIPs: {e}")
        return []


def get_failing_zips():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT zip_code, consecutive_fails FROM failed_zip_tracking 
            WHERE consecutive_fails >= %s
            ORDER BY consecutive_fails DESC
        """, (ZIP_CONSECUTIVE_FAIL_THRESHOLD,))
        
        results = {row[0]: row[1] for row in cur.fetchall()}
        cur.close()
        conn.close()
        return results
    except Exception as e:
        logger.debug(f"Could not get failing ZIPs: {e}")
        return {}


def fetch_philly_gas_prices():
    start_time = datetime.now()
    logger.info(f"=== Starting Comprehensive Gas Price Collection ===")
    logger.info(f"Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Total ZIPs: {len(ZIP_CODES)}")
    logger.info(f"Batch size: {BATCH_SIZE}")
    logger.info(f"Retry attempts: {RETRY_ATTEMPTS}")
    
    failing_zips = get_failing_zips()
    if failing_zips:
        logger.warning(f"Detected failing ZIPs (3+ consecutive fails): {failing_zips}")
        replacements = get_working_replacement_zips(ZIP_CODES)
        if replacements:
            logger.info(f"Replacement ZIPs available: {replacements}")
    
    total_stations = 0
    total_zips = 0
    failed_zips = []
    
    for i in range(0, len(ZIP_CODES), BATCH_SIZE):
        batch = ZIP_CODES[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(ZIP_CODES) + BATCH_SIZE - 1) // BATCH_SIZE
        
        logger.info(f"--- Processing batch {batch_num}/{total_batches} ---")
        
        for zipcode in batch:
            zipcode = zipcode.strip()
            if not zipcode:
                continue
            
            stations = process_zip(zipcode)
            if stations > 0:
                total_stations += stations
                total_zips += 1
            else:
                failed_zips.append(zipcode)
            
            time.sleep(1)
        
        if i + BATCH_SIZE < len(ZIP_CODES):
            logger.info(f"--- Batch complete. Sleeping {BATCH_DELAY}s before next batch ---")
            time.sleep(BATCH_DELAY)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info(f"=== Collection Complete ===")
    logger.info(f"Duration: {duration:.1f} seconds")
    logger.info(f"ZIPs with data: {total_zips}/{len(ZIP_CODES)}")
    logger.info(f"Total stations saved: {total_stations}")
    
    if failed_zips:
        logger.warning(f"Failed ZIPs: {', '.join(failed_zips)}")
        if len(failed_zips) > len(ZIP_CODES) * 0.3:
            replacements = get_working_replacement_zips(ZIP_CODES)
            if replacements:
                logger.warning(f"High failure rate! Consider replacing with: {replacements[:3]}")
    
    logger.info(f"Next collection scheduled based on cron settings")


if __name__ == "__main__":
    fetch_philly_gas_prices()
