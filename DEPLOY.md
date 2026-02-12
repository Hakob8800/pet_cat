# Production Deployment Guide

## Prerequisites
- VPS with Docker and Docker Compose installed
- Domain pointing to VPS IP
- Ports 80 and 443 open

## 1. Setup

```bash
# Clone repository
git clone <repo-url> /opt/qrmenu
cd /opt/qrmenu

# Create .env from example
cp .env.example .env

# Edit .env with your values
nano .env
```

**Generate JWT secret:**
```bash
openssl rand -base64 64
```

## 2. Build & Run

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

## 3. Database Migration

First run with `ddl-auto: update` to create tables, then switch to `validate`.

Or run migrations manually:
```bash
docker exec -it qrmenu-postgres psql -U qrmenu_user -d qrmenu
```

## 4. SSL Setup (Let's Encrypt)

```bash
# Initial certificate (replace your-domain.com)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# Update nginx config
# 1. Edit nginx/conf.d/default.conf
# 2. Uncomment HTTPS server block
# 3. Replace your-domain.com with actual domain
# 4. Uncomment HTTP redirect block

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 5. Maintenance

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Database backup
docker exec qrmenu-postgres pg_dump -U qrmenu_user qrmenu > backup.sql

# Database restore
cat backup.sql | docker exec -i qrmenu-postgres psql -U qrmenu_user -d qrmenu
```

## 6. Update Frontend API URL

Edit `frontend/src/api/client.ts`:
```typescript
const api = axios.create({
  baseURL: '/api',  // Relative URL works with nginx proxy
})
```

## Architecture

```
Internet
    │
    ▼
┌─────────┐
│  Nginx  │ :80/:443
└────┬────┘
     │
     ├──────────────┬─────────────────┐
     │              │                 │
     ▼              ▼                 ▼
┌─────────┐   ┌──────────┐   ┌──────────────┐
│Frontend │   │ Backend  │   │  WebSocket   │
│  :80    │   │  /api/*  │   │    /ws/*     │
└─────────┘   └────┬─────┘   └──────┬───────┘
                   │                │
                   └───────┬────────┘
                           │
                           ▼
                    ┌────────────┐
                    │ PostgreSQL │
                    │   :5432    │
                    └────────────┘
                    (internal only)
```
