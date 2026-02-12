# Production Deployment Guide

## Prerequisites
- VPS with Docker and Docker Compose installed
- Domain pointing to VPS IP
- Ports 80 and 443 open
- GitHub repository (for CI/CD)

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

## 7. CI/CD with GitHub Actions

### Setup GitHub Secrets

Go to repository **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or domain |
| `VPS_USER` | SSH username (e.g., `root` or `deploy`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |

### Workflows

**CI (`.github/workflows/ci.yml`):**
- Runs on every push and PR
- Backend: Maven tests with PostgreSQL service
- Frontend: TypeScript check + build
- Docker: Build test (no push)

**Deploy (`.github/workflows/deploy.yml`):**
- Runs on push to `main` branch
- Builds and pushes images to GitHub Container Registry
- SSHs into VPS and pulls latest images
- Restarts containers
- Runs health check

### Manual Trigger

Deploy can be triggered manually:
1. Go to **Actions** tab
2. Select **Deploy** workflow
3. Click **Run workflow**

### First-time VPS Setup for CI/CD

```bash
# On VPS: Install Docker login for GHCR
docker login ghcr.io -u YOUR_GITHUB_USERNAME

# Clone repo (first time only)
git clone https://github.com/YOUR_USERNAME/qrmenu /opt/qrmenu
cd /opt/qrmenu
cp .env.example .env
nano .env

# Use GHCR compose file
docker compose -f docker-compose.ghcr.yml up -d
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
