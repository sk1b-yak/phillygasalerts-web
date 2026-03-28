#!/usr/bin/env python3
import psycopg2
import httpx
import os
from datetime import datetime, timedelta

DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
WEBHOOK_URL = "https://discord.com/api/webhooks/1480185663260332214/-b7E1CzJqsAGOiVvrPnoTRLLU6Bf8ixsohnVFNwK7Z2Yh1vFsfgpNj7EFV6jPeKWoggX"

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "database": os.environ.get("DB_NAME", "phillygasalerts"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "port": os.environ.get("DB_PORT", "5432")
}

HEALTH_CHECK_HOURS = 4


def send_discord_alert(title, description, color=15158332):
    """Send alert to Discord webhook"""
    payload = {
        "embeds": [{
            "title": title,
            "description": description,
            "color": color,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "footer": {
                "text": "PhillyGasAlerts Health Check"
            }
        }]
    }
    try:
        response = httpx.post(WEBHOOK_URL, json=payload, timeout=10)
        return response.status_code == 204
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")
        return False


def check_database_health():
    """Check if new records exist in the last HEALTH_CHECK_HOURS hours"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        query = """
        SELECT COUNT(*) FROM gas_prices 
        WHERE time > NOW() - INTERVAL '%s hours'
        """
        cur.execute(query, (HEALTH_CHECK_HOURS,))
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return result[0] if result else 0
    except Exception as e:
        print(f"Database connection error: {e}")
        return -1


def run_health_check():
    """Main health check function"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    record_count = check_database_health()
    
    if record_count < 0:
        # Database error
        alert_msg = f"**Database Connection Failed**\n\nUnable to connect to database at {timestamp}\n\nError details: Check server logs"
        send_discord_alert("PhillyGasAlerts: DATABASE ERROR", alert_msg, 15158332)
        print(f"[{timestamp}] HEALTH CHECK FAILED: Database connection error")
        return False
    
    if record_count == 0:
        # No new records - critical alert
        alert_msg = f"**No gas prices recorded in the last {HEALTH_CHECK_HOURS} hours**\n\nLast check: {timestamp}\nRecords found: {record_count}\n\nPlease investigate immediately."
        send_discord_alert("PhillyGasAlerts: DATA GAP DETECTED", alert_msg, 15158332)
        print(f"[{timestamp}] HEALTH CHECK FAILED: No records in last {HEALTH_CHECK_HOURS} hours")
        return False
    
    # Healthy
    print(f"[{timestamp}] HEALTH CHECK PASSED: {record_count} new records in last {HEALTH_CHECK_HOURS} hours")
    return True


if __name__ == "__main__":
    run_health_check()
