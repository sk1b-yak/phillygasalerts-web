# PhillyGasAlerts

Real-time Philadelphia gas price tracking with an interactive map and Discord notifications.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## Overview

PhillyGasAlerts collects gas prices from 30 Philadelphia-area ZIP codes and provides:
- **Interactive Map** - Real-time prices visualized on a Leaflet map
- **Discord Bot** - Price alerts and commands via DM
- **API** - Programmatic access to gas price data
- **Daily Reports** - Price trends delivered to Discord

## Live Sites

**Frontend:** https://phillygasalerts.com
**Preview:** https://deacabca.phillygasalerts-web.pages.dev/

**Backend:** Private (Hetzner + Cloudflare Tunnel)

## Architecture

```
Cloudflare (Security + Hosting)
├── WAF Protection
├── DDoS Mitigation
├── SSL/TLS
├── Pages (Frontend)
│   └── sk1b-yak/phillygasalerts-web (GitHub)
└── Tunnel (API Proxy)
    └── api.phillygasalerts.com

Hetzner (Backend - Docker)
├── philly_api (FastAPI)
├── philly_bot (Discord)
├── philly_tunnel (cloudflared) [planned]
├── philly_db (TimescaleDB)
└── philly_redis (Dragonfly)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- Cloudflare account

### Frontend Development

```bash
# Clone repo
git clone https://github.com/sk1b-yak/phillygasalerts-web.git
cd phillygasalerts-web

# Install and run
npm install
npm run dev

# Build for production
npm run build
```

### Backend (Hetzner Server)

```bash
# Docker Compose (recommended)
cd /opt/phillygasalerts
docker compose up -d --build

# Check logs
docker logs philly_api
docker logs philly_bot

# Run scraper manually
cd /opt/phillygasalerts/app && python3 scraper.py

# Check API
curl http://localhost:8080/health
```

## Features

### Map Features
- [x] Price-colored markers (blue→gold→red gradient)
- [x] Marker clustering for dense areas
- [x] Station popup with details
- [x] ZIP code search
- [x] Price sorting (cheapest/most expensive)
- [x] Dark mode support
- [x] Mobile responsive design

### Data Features
- [x] 30 Philadelphia ZIP codes
- [x] 8 scrapes per day (commute hours)
- [x] Station reliability tracking
- [x] Failed ZIP detection and auto-swap
- [x] Historical price data (TimescaleDB)

### Notifications
- [x] Discord bot commands
- [x] Daily price summaries
- [x] Scrape completion alerts

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/prices` | GET | All current prices (last 24h) |
| `/prices/{zip}` | GET | Prices by ZIP code |
| `/top-deals` | GET | Cheapest 10 stations |
| `/stats` | GET | Price statistics |

## Design System

### Philadelphia City Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Philadelphia Blue | `#006BB6` | Primary buttons, headers |
| Philadelphia Gold | `#FCD116` | Accents, highlights |
| Navy | `#1B365D` | Dark mode primary |
| Liberty Green | `#6B9F4D` | Success states |
| Crimson | `#C61E2E` | Alerts, expensive |

### Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700

## Tech Stack

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18+ with Vite |
| Maps | React-Leaflet + Leaflet.js |
| Styling | Tailwind CSS |
| State | Zustand |
| Icons | Lucide React |
| Hosting | Cloudflare Pages |
| Git | sk1b-yak/phillygasalerts-web |

### Backend
| Layer | Technology |
|-------|------------|
| API | FastAPI (Python) |
| Database | PostgreSQL/TimescaleDB (Docker) |
| Cache | Dragonfly (Docker) |
| Bot | Discord.py |
| Hosting | Hetzner Cloud |
| Security | Cloudflare |
| Tunnel | Cloudflare Tunnel (planned) |

## Project Structure

```
phillygasalerts/
├── app/                    # FastAPI backend
│   ├── main.py            # API server
│   ├── scraper.py         # Gas price scraper
│   ├── healthcheck.py     # Health monitoring
│   └── .env              # Secrets
├── bot/                    # Discord bot
│   ├── main.py            # Bot commands
│   ├── discord_reporter.py # Notifications
│   ├── map_generator.py   # Folium maps
│   ├── utils/database.py  # DB queries
│   └── .env              # Secrets
├── infrastructure/         # Base Docker infra
│   └── docker-compose.yml # DB + Redis
├── web/                   # React frontend
│   ├── src/              # React components
│   ├── dist/             # Build output
│   └── .env              # API URL
├── docker-compose.yml      # Main compose (planned)
├── MEMORY.md              # Project memory
└── README.md             # This file
```

## 30 ZIP Codes

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

## Cron Schedule

8 scrapes per day during commute hours:

| EDT | Purpose |
|-----|---------|
| 5:00 AM | Pre-rush |
| 5:30 AM | Pre-rush |
| 7:00 AM | Morning rush |
| 7:30 AM | Morning rush |
| 3:00 PM | Afternoon |
| 3:30 PM | Afternoon |
| 5:00 PM | Evening rush |
| 5:30 PM | Evening rush |

## Discord Commands

DM these commands to the bot:

| Command | Description |
|---------|-------------|
| `!gas-help` | Show all commands |
| `!gas-stats` | Current statistics |
| `!gas-top` | Top 5 cheapest stations |
| `!gas-expensive` | Top 5 most expensive |
| `!gas-map` | Generate price map |
| `!gas-zip <zip>` | Prices in a specific ZIP |
| `!gas-trends` | Recent price trends |

## Deployment

### Frontend (Cloudflare Pages)
Connected to GitHub repo: sk1b-yak/phillygasalerts-web

Auto-deploys on push to main branch.

### Backend (Docker on Hetzner)
```bash
# Build and start
cd /opt/phillygasalerts
docker compose up -d --build

# Stop
docker compose down

# Restart service
docker compose restart philly_api
```

## Environment Variables

### app/.env
```bash
DB_HOST=philly_db
DB_NAME=phillygasalerts
DB_USER=postgres
DB_PASSWORD=<secret>
DB_PORT=5432
CORS_ORIGINS=https://*.pages.dev,https://phillygasalerts.com
```

### bot/.env
```bash
DB_HOST=philly_db
DISCORD_BOT_TOKEN=<secret>
DISCORD_CHANNEL_ID=<channel id>
DISCORD_WEBHOOK_URL=<webhook url>
ZYLA_API_KEY=<secret>
```

## Costs

| Service | Monthly Cost |
|---------|--------------|
| Cloudflare Pages | $0 (Free tier) |
| Cloudflare Tunnel | $0 (Free tier) |
| Cloudflare WAF | $0 (Free tier) |
| Hetzner Server | ~$5-10/month |
| Domain | ~$1/month |
| **Total** | **~$6-11/month** |

## Roadmap

- [x] Cloudflare Pages deployment
- [x] GitHub integration
- [ ] Docker migration (API + Bot)
- [ ] Cloudflare Tunnel for API
- [ ] Connect frontend to backend
- [ ] User accounts (optional)
- [ ] Price alerts (email/SMS)
- [ ] AdSense integration
- [ ] PWA support (offline)
- [ ] Price history charts
- [ ] Mobile app

## License

MIT License - See LICENSE file for details.

---

Built with ❤️ for Philadelphia drivers
