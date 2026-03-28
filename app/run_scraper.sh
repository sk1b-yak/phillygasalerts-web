#!/bin/bash
# PhillyGasAlerts Scraper Script
# Runs scraper and sends Discord notification

cd /app

START_TIME=$(date +%s)

# Run the scraper
/usr/local/bin/python3 scraper.py >> /app/scraper.log 2>&1
SCRAPER_EXIT=$?

# Sync data to PostGIS for 3D tiles
/usr/local/bin/python3 sync_to_postgis.py >> /app/scraper.log 2>&1

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get failed ZIPs from log
FAILED_ZIPS=$(grep -i "Failed ZIPs:" /app/scraper.log | tail -1 | sed 's/.*Failed ZIPs: //' | tr -d '\n')

# Get scraped count (approximate from last scrape)
/usr/local/bin/python3 /app/bot/discord_reporter.py \
    --scrape \
    --scraped 78 \
    --failed "$FAILED_ZIPS" \
    --duration $DURATION

exit $SCRAPER_EXIT
