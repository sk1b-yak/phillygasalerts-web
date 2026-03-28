#!/usr/bin/env python3
import httpx
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import pytz

sys.path.insert(0, '/opt/phillygasalerts/bot')
load_dotenv('/opt/phillygasalerts/bot/.env')

WEBHOOK_URL = os.environ.get('DISCORD_WEBHOOK_URL', '')
CHANNEL_ID = os.environ.get('DISCORD_CHANNEL_ID', '')

EST = pytz.timezone('America/New_York')
UTC = pytz.UTC


def get_current_est():
    """Get current time in EST"""
    return datetime.now(EST)


def format_est(dt=None, fmt="%Y-%m-%d %I:%M:%S %p %Z"):
    """Format datetime in EST timezone"""
    if dt is None:
        dt = get_current_est()
    elif dt.tzinfo is None:
        dt = UTC.localize(dt)
    est_dt = dt.astimezone(EST)
    return est_dt.strftime(fmt)


def send_discord_message(embed):
    """Send embed to Discord webhook"""
    payload = {"embeds": [embed]}
    try:
        response = httpx.post(WEBHOOK_URL, json=payload, timeout=30)
        return response.status_code == 204
    except Exception as e:
        print(f"Failed to send Discord message: {e}")
        return False


def send_scrape_notification(scraped_count, failed_zips, duration_seconds):
    """Send notification after each scrape"""
    from utils.database import get_total_stats, get_timezone_abbrev
    
    stats = get_total_stats()
    current_time = format_est()
    tz_abbrev = get_timezone_abbrev()
    
    embed = {
        "title": "📊 PhillyGasAlerts - Scrape Complete",
        "color": 3066993,
        "timestamp": datetime.now(EST).isoformat(),
        "fields": [
            {
                "name": "🕐 Time",
                "value": current_time,
                "inline": True
            },
            {
                "name": "📍 ZIPs Processed",
                "value": f"{30 - len(failed_zips)}/{30}",
                "inline": True
            },
            {
                "name": "⛽ Stations Found",
                "value": str(scraped_count),
                "inline": True
            },
            {
                "name": "💾 Total Records",
                "value": str(stats.get('total_records', 'N/A')),
                "inline": True
            },
            {
                "name": "⏱️ Duration",
                "value": f"{duration_seconds:.1f} seconds",
                "inline": True
            }
        ],
        "footer": {
            "text": f"PhillyGasAlerts | Times in {tz_abbrev}"
        }
    }
    
    if failed_zips:
        embed["fields"].append({
            "name": "⚠️ Failed ZIPs",
            "value": ", ".join(failed_zips[:5]) + ("..." if len(failed_zips) > 5 else ""),
            "inline": False
        })
    
    return send_discord_message(embed)


def send_daily_summary():
    """Send daily summary report"""
    from utils.database import get_daily_stats, get_top_stations, get_scrape_stats_for_day, get_total_stats, get_timezone_abbrev
    
    daily = get_daily_stats()
    stats = get_total_stats()
    tz_abbrev = get_timezone_abbrev()
    
    cheapest = get_top_stations(limit=3, cheapest=True)
    expensive = get_top_stations(limit=3, cheapest=False)
    scrapes = get_scrape_stats_for_day()
    
    embed = {
        "title": "📈 PhillyGasAlerts - Daily Report",
        "description": f"**{format_est('%B %d, %Y')}**",
        "color": 9807270,
        "timestamp": datetime.now(EST).isoformat(),
        "fields": [
            {
                "name": "📊 Today's Collection",
                "value": f"Records: **{daily.get('total_records', 0)}**\n"
                         f"Unique Stations: **{daily.get('unique_stations', 0)}**\n"
                         f"ZIP Codes: **{daily.get('zip_codes', 0)}**",
                "inline": True
            },
            {
                "name": "📉 Price Range",
                "value": f"Lowest: **${daily.get('min_price', 'N/A')}**\n"
                         f"Highest: **${daily.get('max_price', 'N/A')}**\n"
                         f"Average: **${daily.get('avg_price', 'N/A')}**",
                "inline": True
            },
            {
                "name": "💾 Total Database",
                "value": f"Total Records: **{stats.get('total_records', 0)}**\n"
                         f"Collection Started: {stats.get('first_record', 'N/A').strftime('%Y-%m-%d') if stats.get('first_record') else 'N/A'}",
                "inline": False
            }
        ],
        "footer": {
            "text": f"PhillyGasAlerts | Times in {tz_abbrev}"
        }
    }
    
    if cheapest:
        cheapest_text = "\n".join([f"{i+1}. {s['station_name']} - ${s['price_regular']}" for i, s in enumerate(cheapest)])
        embed["fields"].append({
            "name": "🏆 CHEAPEST",
            "value": cheapest_text,
            "inline": True
        })
    
    if expensive:
        expensive_text = "\n".join([f"{i+1}. {s['station_name']} - ${s['price_regular']}" for i, s in enumerate(expensive)])
        embed["fields"].append({
            "name": "💸 MOST EXPENSIVE",
            "value": expensive_text,
            "inline": True
        })
    
    if scrapes:
        scrape_text = f"{len(scrapes)} scrapes today"
        embed["fields"].append({
            "name": "🔄 Scrapes",
            "value": scrape_text,
            "inline": False
        })
    
    return send_discord_message(embed)


def send_alert(title, description, color=15158332):
    """Send alert notification"""
    from utils.database import get_timezone_abbrev
    tz_abbrev = get_timezone_abbrev()
    
    embed = {
        "title": title,
        "description": description,
        "color": color,
        "timestamp": datetime.now(EST).isoformat(),
        "footer": {
            "text": f"PhillyGasAlerts Health Check | Times in {tz_abbrev}"
        }
    }
    return send_discord_message(embed)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='PhillyGasAlerts Discord Reporter')
    parser.add_argument('--scrape', action='store_true', help='Send scrape notification')
    parser.add_argument('--daily', action='store_true', help='Send daily summary')
    parser.add_argument('--alert', type=str, help='Send alert with message')
    parser.add_argument('--scraped', type=int, default=0, help='Number of stations scraped')
    parser.add_argument('--failed', type=str, default='', help='Comma-separated failed ZIPs')
    parser.add_argument('--duration', type=float, default=0, help='Duration in seconds')
    
    args = parser.parse_args()
    
    if args.daily:
        print("Sending daily summary...")
        result = send_daily_summary()
        print(f"Daily summary sent: {result}")
    elif args.scrape:
        failed_zips = args.failed.split(',') if args.failed else []
        print(f"Sending scrape notification: {args.scraped} stations, {len(failed_zips)} failed, {args.duration:.1f}s")
        result = send_scrape_notification(args.scraped, failed_zips, args.duration)
        print(f"Scrape notification sent: {result}")
    elif args.alert:
        print(f"Sending alert: {args.alert}")
        result = send_alert("⚠️ ALERT", args.alert)
        print(f"Alert sent: {result}")
    else:
        print("No action specified. Use --scrape, --daily, or --alert")
