# PhillyGasAlerts - Memory Checkpoint
**Last Updated:** March 26, 2026

---

## Project Overview
**PhillyGasAlerts** - Philadelphia gas price tracking system with public-facing map frontend

### Current Status
| Component | Status |
|-----------|--------|
| React Frontend | ✅ Deployed to Cloudflare Pages |
| GitHub Repo | ✅ sk1b-yak/phillygasalerts-web |
| Preview URL | ✅ https://deacabca.phillygasalerts-web.pages.dev/ |
| Custom Domain | ✅ phillygasalerts.com active |
| Hetzner Backend | ✅ Running in Docker (API, DB, Bot) |
| Cloudflare Account | ✅ Active (saqibsu@gmail.com) |
| Domain Registration | ✅ Google Domains (phillygasalerts.com) |
| DNS Management | ✅ Cloudflare |
| API Endpoints | ✅ /health, /prices, /prices/{zip}, /stats, /top-deals |
| Docker Migration | ✅ Completed (API + Bot containers) |
| Cloudflare Tunnel | ⏳ Pending setup |

---

## Architecture

### Current (Docker)
```
Cloudflare                          Hetzner (Host)
─────────────                       ───────────────────────────────────────────
Pages ────► React (static)        Opencode (god)
                                       │
                                       ▼
                                    Docker (host network)
                                    ├── philly_api (FastAPI) ✅
                                    ├── philly_bot (Discord) ✅
                                    ├── philly_db (TimescaleDB) ✅
                                    └── philly_redis (Dragonfly) ✅

                                   Host
                                    └── Opencode (managing Docker)
```

### Target (Full with Tunnel)
```
Cloudflare                          Hetzner (Host)
─────────────                       ───────────────────────────────────────────
Pages ────► React (static)        Opencode (god)
                                       │
                                       ▼
Tunnel ────► api.phillygasalerts.com  Host Network
                                          ├── philly_api (FastAPI)
                                          ├── philly_bot (Discord)
                                          ├── philly_tunnel (cloudflared) ✅
                                          ├── philly_db (Docker)
                                          └── philly_redis (Docker)
```
```

---

## Configuration

### Environment Files
| File | Purpose |
|------|---------|
| `/opt/phillygasalerts/app/.env` | Scraper + API config |
| `/opt/phillygasalerts/bot/.env` | Discord bot config |
| `/opt/phillygasalerts/.env` | Docker compose secrets |
| `/opt/phillygasalerts/web/.env` | Frontend API URL (local dev) |
| `/opt/phillygasalerts/web/.env.production` | Frontend API URL (production) |

### Credentials (Secured - Not in Repo)
| Setting | Location |
|---------|----------|
| DB Password | `.env` files |
| Zyla API Key | `bot/.env` |
| Discord Bot Token | `bot/.env` |
| Discord Webhook | `bot/.env` |
| Cloudflare Tunnel Token | `.env` (planned) |

### Cloudflare
| Setting | Value |
|---------|-------|
| Account Email | saqibsu@gmail.com |
| Account ID | ba19a897f79260c3837500abd49d31c0 |
| Nameservers | blair.ns.cloudflare.com, terry.ns.cloudflare.com |
| Pages Project | phillygasalerts |
| Domain | phillygasalerts.com |
| SSL | Active (Full) |
| Preview URL | https://deacabca.phillygasalerts-web.pages.dev/ |
| API Token | philgas_tun (expires Jan 31, 2027) |
| Tunnel ID | 67ad63cb-baf1-47e8-8486-eb625ce25a1f |
| Tunnel Protocol | HTTP2 (QUIC doesn't work with Hetzner) |

### Hetzner Server
| Setting | Value |
|---------|-------|
| Public IP | 65.109.57.95 |
| SSH Port | 2222 |
| WireGuard | 10.66.66.1/24 |
| API Port | 8080 (localhost only) |
| DB Port | 5432 (localhost only) |

### Discord
| Setting | Value |
|---------|-------|
| Channel ID | 1480185546730115112 |
| Bot Client ID | 1486632976854024232 |

### GitHub
| Setting | Value |
|---------|-------|
| Repository | https://github.com/sk1b-yak/phillygasalerts-web |
| Branch | main |

---

## 30 ZIP Codes (Current)
```
Center City: 19103, 19107
Fishtown/NoLibs: 19125, 19123
South Philly: 19145, 19146, 19147, 19148
Northeast: 19120, 19121, 19122, 19124
North Philly: 19130, 19131, 19132, 19133, 19134, 19135
West/Northwest: 19138, 19139, 19140, 19141, 19144
Southwest/Delco: 19142, 19143, 19153
Manayunk/Roxborough: 19128
Northeast Extended: 19136, 19126, 19149
```

---

## Cron Schedule (8 scrapes/day)
| UTC | EDT | Purpose |
|-----|-----|---------|
| 10:00 | 5:00 AM | Pre-rush |
| 10:30 | 5:30 AM | Pre-rush |
| 12:00 | 7:00 AM | Morning rush |
| 12:30 | 7:30 AM | Morning rush |
| 20:00 | 3:00 PM | Afternoon |
| 20:30 | 3:30 PM | Afternoon |
| 22:00 | 5:00 PM | Evening rush |
| 22:30 | 5:30 PM | Evening rush |

---

## Database Tables

### gas_prices
```sql
time TIMESTAMPTZ, local_time TIMESTAMPTZ, station_name TEXT, 
address TEXT, zip_code TEXT, price_regular NUMERIC
```

### station_reliability
Tracks station uptime/reliability.
```sql
station_name, address, zip_code, total_reports, successful_reports, 
failed_reports, last_seen, reliability_score
```

### failed_zip_tracking
Tracks ZIP codes that consistently return no data.
```sql
zip_code, fail_count, consecutive_fails, last_attempt, last_success
```

---

## Discord Bot Commands (DM to bot)
| Command | Description |
|---------|-------------|
| `!gas-help` | Show help |
| `!gas-stats` | Current stats |
| `!gas-top` | Cheapest stations |
| `!gas-expensive` | Most expensive |
| `!gas-map` | Generate price map |
| `!gas-zip <zip>` | Prices in ZIP |
| `!gas-trends` | Price trends |

---

## Accomplished Features
- [x] FastAPI server (port 8080)
- [x] PostgreSQL/TimescaleDB in Docker
- [x] Scraper for 30 ZIP codes
- [x] Health check monitoring (every 30 min)
- [x] Log rotation
- [x] Discord bot via DM
- [x] Interactive Folium maps (Discord)
- [x] Daily summary notifications
- [x] Station reliability tracking
- [x] ZIP failure tracking + auto-swap
- [x] DST-aware timezone (America/New_York)
- [x] Cloudflare account setup
- [x] Domain connected to Cloudflare
- [x] Cloudflare Pages project created
- [x] Custom domain (phillygasalerts.com) active
- [x] SSL/TLS enabled
- [x] React frontend built
- [x] React frontend deployed to Cloudflare Pages
- [x] GitHub repo created (sk1b-yak/phillygasalerts-web)
- [x] Frontend preview URL working
- [x] API endpoints added (/prices, /prices/{zip}, /stats)
- [x] CORS configured for Cloudflare Pages
- [x] Dockerfiles created (API + Bot)
- [x] docker-compose.yml created
- [x] Docker migration completed (API + Bot containers running)
- [x] Cloudflare Tunnel setup (HTTP2 protocol, api.phillygasalerts.com)
- [x] Connect frontend to backend API (via tunnel)

---

## Frontend Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18+ with Vite |
| Maps | React-Leaflet + Leaflet.js |
| Styling | Tailwind CSS |
| State | Zustand |
| HTTP | Axios |
| Icons | Lucide React |
| Build | Vite |
| Hosting | Cloudflare Pages |
| GitHub | sk1b-yak/phillygasalerts-web |
| API URL | https://api.phillygasalerts.com (production) |

### Design System: Philadelphia City Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Philadelphia Blue | #006BB6 | Primary |
| Philadelphia Gold | #FCD116 | Accents |
| Navy | #1B365D | Dark mode |
| Liberty Green | #6B9F4D | Success |
| Crimson | #C61E2E | Alerts |

---

## API Endpoints (Current)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/prices` | GET | All current prices (last 24h) |
| `/prices/{zip}` | GET | Prices by ZIP code |
| `/top-deals` | GET | Cheapest 10 stations |
| `/stats` | GET | Price statistics |

### Example Stats Response
```json
{
  "min_price": 3.77,
  "max_price": 4.89,
  "avg_price": 3.998,
  "station_count": 114,
  "price_count": 114,
  "oldest_record": "2026-03-26T10:30:06.352045+00:00",
  "newest_record": "2026-03-26T12:31:08.700272+00:00"
}
```

---

## Docker Architecture

### Files Created
| File | Purpose |
|------|---------|
| `app/Dockerfile` | FastAPI container |
| `bot/Dockerfile` | Discord bot container |
| `app/requirements.txt` | API dependencies |
| `bot/requirements.txt` | Bot dependencies |
| `docker-compose.yml` | Full stack orchestration |
| `.env` | Secrets for Docker |

### Container Configuration
```yaml
services:
  philly_api:
    build: ./app
    ports:
      - "127.0.0.1:8080:8080"
    depends_on:
      philly_db:
        condition: service_healthy
    networks:
      - philly_network

  philly_bot:
    build: ./bot
    depends_on:
      philly_db:
        condition: service_healthy
    networks:
      - philly_network

  philly_tunnel:
    image: cloudflare/cloudflared:latest
    networks:
      - philly_network
```

---

## Quick Commands

```bash
# Docker Management
docker ps                              # Show running containers
docker logs philly_api                 # API logs
docker logs philly_bot                 # Bot logs
docker restart philly_api              # Restart API
docker restart philly_bot              # Restart Bot

# Rebuild containers (after code changes)
cd /opt/phillygasalerts/app && docker build --network=host -t philly_api .
cd /opt/phillygasalerts/bot && docker build --network=host -t philly_bot .
docker stop philly_api philly_bot && docker rm philly_api philly_bot
docker run -d --name philly_api --network=host --restart unless-stopped --env-file /opt/phillygasalerts/.env -e DB_HOST=127.0.0.1 philly_api
docker run -d --name philly_bot --network=host --restart unless-stopped --env-file /opt/phillygasalerts/.env -e DB_HOST=127.0.0.1 philly_bot

# Check database
docker exec philly_db psql -U postgres -d phillygasalerts -c "SELECT COUNT(*) FROM gas_prices;"

# Check API
curl http://localhost:8080/health
curl http://localhost:8080/stats

# Run manual scrape (on host, not in container)
cd /opt/phillygasalerts/app && python3 scraper.py

# Tunnel Management
systemctl status philly-tunnel          # Check tunnel status
systemctl restart philly-tunnel         # Restart tunnel
journalctl -u philly-tunnel -n 20      # View tunnel logs
curl https://api.phillygasalerts.com/health  # Test tunneled API

# Current time (EDT)
TZ=America/New_York date '+%Y-%m-%d %H:%M:%S %Z'
```

---

## Known Issues
- Zyla API free trial has 50 requests total - use sparingly
- Bot commands only work via DM currently (not in server channels)
- Some ZIPs return no station data (tracked in failed_zip_tracking)
- QUIC protocol doesn't work with Hetzner - must use HTTP2 for tunnel
- Cloudflare Tunnel token expires Jan 31, 2027 - renewal needed before then

---

## Next Steps
1. ✅ Build React frontend with Leaflet map
2. ✅ Deploy to Cloudflare Pages (GitHub integration)
3. ✅ Add API endpoints
4. ✅ Configure CORS
5. ✅ Create Dockerfiles and compose
6. ✅ Docker migration (API + Bot containers)
7. ✅ Cloudflare Tunnel setup (api.phillygasalerts.com, HTTP2)
8. ✅ Connect frontend to backend API
9. ⏳ Test frontend with real data
10. ⏳ Set up token renewal reminder (Jan 2027)

---

## Project Structure
```
phillygasalerts/
├── app/                    # FastAPI backend
│   ├── main.py            # API server (with /prices, /stats)
│   ├── scraper.py         # Gas price scraper
│   ├── healthcheck.py     # Health monitoring
│   ├── Dockerfile         # Docker container
│   └── requirements.txt   # Dependencies
├── bot/                    # Discord bot
│   ├── main.py            # Bot commands
│   ├── discord_reporter.py
│   ├── map_generator.py   # Folium maps
│   ├── utils/database.py
│   ├── Dockerfile         # Docker container
│   └── requirements.txt   # Dependencies
├── infrastructure/         # Existing Docker infra
│   └── docker-compose.yml # DB + Redis
├── web/                   # React frontend
│   ├── src/
│   ├── dist/
│   ├── .env.production   # Production API URL
├── docker-compose.yml      # Main compose (API + Bot)
├── .env                    # Secrets (DB, Discord, Zyla)
├── /root/.cloudflared/     # Tunnel credentials (on Hetzner)
│   ├── config.yml
│   └── <uuid>.json
└── /etc/systemd/system/philly-tunnel.service  # Tunnel service
│   └── .gitignore
├── docker-compose.yml      # Main compose (all services)
├── .env                    # Secrets (not committed)
├── MEMORY.md
└── README.md
```
