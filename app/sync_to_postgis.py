#!/usr/bin/env python3
import os
import psycopg2
from psycopg2.extras import execute_values

TIMESCALE_CONFIG = {
    'host': os.environ.get('DB_HOST', 'db'),
    'port': int(os.environ.get('DB_PORT', '5432')),
    'dbname': os.environ.get('DB_NAME', 'phillygasalerts'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', 'PhillyGas2026!')
}

POSTGIS_CONFIG = {
    'host': os.environ.get('POSTGIS_HOST', 'postgis'),
    'port': int(os.environ.get('POSTGIS_PORT', '5432')),
    'dbname': os.environ.get('POSTGIS_DB', 'phillygas_postgis'),
    'user': os.environ.get('POSTGIS_USER', 'postgres'),
    'password': os.environ.get('POSTGIS_PASSWORD', 'PhillyGas2026!')
}

def sync_gas_stations():
    ts_conn = psycopg2.connect(**TIMESCALE_CONFIG)
    ts_cur = ts_conn.cursor()
    ts_cur.execute("""
        SELECT station_name, address, brand, lat, lng
        FROM gas_stations
        WHERE lat IS NOT NULL AND lng IS NOT NULL
    """)
    stations = ts_cur.fetchall()
    ts_cur.close()
    ts_conn.close()
    print(f"Fetched {len(stations)} stations from TimescaleDB")
    
    if not stations:
        print("No stations to sync")
        return
    
    pg_conn = psycopg2.connect(**POSTGIS_CONFIG)
    pg_cur = pg_conn.cursor()
    pg_cur.execute("TRUNCATE gas_stations RESTART IDENTITY CASCADE")
    
    insert_sql = """
        INSERT INTO gas_stations (station_name, address, brand, lat, lng, geom)
        VALUES %s
    """
    values = [
        (name, addr, brand, lat, lng, f'SRID=4326;POINT({lng} {lat})')
        for name, addr, brand, lat, lng in stations
    ]
    execute_values(pg_cur, insert_sql, values)
    pg_conn.commit()
    
    pg_cur.execute("SELECT COUNT(*) FROM gas_stations")
    count = pg_cur.fetchone()[0]
    pg_cur.close()
    pg_conn.close()
    
    print(f"Synced {count} stations to PostGIS")

def sync_price_zones():
    ts_conn = psycopg2.connect(**TIMESCALE_CONFIG)
    ts_cur = ts_conn.cursor()
    ts_cur.execute("""
        SELECT zip_code, MAX(price_regular), MIN(price_regular), 
               ROUND(AVG(price_regular)::numeric,3), 
               ROUND(STDDEV(price_regular)::numeric,3), 
               COUNT(DISTINCT station_name)
        FROM gas_prices 
        WHERE price_regular IS NOT NULL 
        GROUP BY zip_code
    """)
    price_data = ts_cur.fetchall()
    ts_cur.close()
    ts_conn.close()
    print(f"Fetched {len(price_data)} ZIP codes from TimescaleDB")
    
    if not price_data:
        print("No price data to sync")
        return
    
    pg_conn = psycopg2.connect(**POSTGIS_CONFIG)
    pg_cur = pg_conn.cursor()
    
    synced = 0
    warnings = 0
    
    for zip_code, max_price, min_price, avg_price, volatility, station_count in price_data:
        insert_sql = """
            INSERT INTO price_zones (zip_code, geom, max_price, min_price, avg_price, volatility, station_count, updated_at)
            SELECT %s, wkb_geometry, %s, %s, %s, %s, %s, NOW() 
            FROM price_zones_geo 
            WHERE zcta5ce20 = %s
            ON CONFLICT (zip_code) DO UPDATE 
            SET geom=EXCLUDED.geom, max_price=EXCLUDED.max_price, min_price=EXCLUDED.min_price, 
                avg_price=EXCLUDED.avg_price, volatility=EXCLUDED.volatility, station_count=EXCLUDED.station_count, 
                updated_at=NOW()
        """
        
        pg_cur.execute(insert_sql, (zip_code, max_price, min_price, avg_price, volatility, station_count, zip_code))
        
        if pg_cur.rowcount == 0:
            print(f"WARNING: No polygon geometry found for ZIP code {zip_code}")
            warnings += 1
        else:
            synced += 1
    
    pg_conn.commit()
    pg_cur.close()
    pg_conn.close()
    
    print(f"Synced {synced} price zones to PostGIS ({warnings} warnings)")

if __name__ == '__main__':
    sync_gas_stations()
    sync_price_zones()
