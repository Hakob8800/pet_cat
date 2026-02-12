# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Menu — a full-stack SaaS application for restaurant QR-code menus. Restaurant owners create menus and tables with QR codes; guests scan QR codes to view menus and place orders. Real-time order updates via WebSocket.

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.2, Spring Security (JWT/HS384), Spring Data JPA, Spring WebSocket (STOMP/SockJS), PostgreSQL 16, Maven
- **Frontend:** React 18, TypeScript 5.3, Vite 5, Tailwind CSS 3, React Router 6, React Hook Form + Zod, @dnd-kit (drag-drop), Axios, qrcode.react
- **Infrastructure:** Docker (multi-stage builds), Nginx (reverse proxy), Certbot (SSL), GitHub Actions CI/CD, GHCR

## Build & Run Commands

### Backend (from `backend/`)
```bash
export JAVA_HOME="/c/Users/User/.jdks/corretto-17.0.7"
export PATH="$JAVA_HOME/bin:$PATH"
mvn spring-boot:run              # Dev server on :8080
mvn test                         # Run all tests (uses H2 in-memory DB)
mvn test -Dtest=AuthServiceTest  # Run a single test class
mvn package -DskipTests          # Build JAR without tests
```

### Frontend (from `frontend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server on :5173 (proxies /api to :8080)
npm run build      # TypeScript check + Vite production build
```

### Docker
```bash
docker compose up -d                                    # Dev DB (PostgreSQL on :5432)
docker compose -f docker-compose.prod.yml up -d --build # Full production stack
```

## Architecture

```
Browser → Nginx :80/:443
           ├── /api/*  → Spring Boot :8080 → PostgreSQL
           ├── /ws     → Spring Boot WebSocket (STOMP)
           └── /*      → React static files (Vite build)
```

### Backend (`backend/src/main/java/com/qrmenu/`)

Standard layered Spring Boot: `controller/ → service/ → repository/ → entity/`. DTOs in `dto/`, security (JWT filter + util) in `security/`, config (SecurityConfig, WebSocketConfig, GlobalExceptionHandler) in `config/`.

Key controllers split by auth requirement:
- **Authenticated:** `RestaurantController`, `CategoryController`, `MenuItemController`, `TableController`, `FileUploadController`, `AdminOrderController`
- **Public (no auth):** `PublicMenuController` (`/api/menu/{slug}`), `PublicOrderController`, `PublicTableController`

### Frontend (`frontend/src/`)

- `api/client.ts` — Axios instance with JWT interceptor, all API methods
- `context/` — AuthContext (JWT + localStorage), CartContext (shopping cart)
- `hooks/useOrdersWebSocket.ts` — STOMP WebSocket for real-time order updates
- `lib/validations.ts` — Zod schemas for form validation
- `pages/admin/` — Dashboard, RestaurantEdit (settings + tables), MenuEdit (drag-drop), Orders (real-time)
- `pages/PublicMenu.tsx` — Guest-facing menu accessed via `/menu/{slug}?table={id}`

## Testing

Backend tests use JUnit 5 + Spring Boot Test with H2 in-memory database (profile `test`, config in `application-test.yml`). Tests are in `backend/src/test/java/com/qrmenu/`:
- **Unit tests:** `AuthServiceTest`, `OrderServiceTest` (Mockito-based)
- **Integration tests:** `AuthControllerIntegrationTest`, `OrderIntegrationTest`, `RestaurantControllerIntegrationTest` (MockMvc, @SpringBootTest)

CI runs `mvn test -B` with a PostgreSQL 16 service container.

## Key Design Decisions

- **Slug-based URLs** — restaurants identified by unique slug in public URLs
- **Position field** — categories and menu items use a `position` integer for drag-drop ordering, persisted via bulk reorder endpoints (`PUT .../reorder`)
- **File uploads** — stored to disk (`./uploads`), served via `/api/files/{filename}`, 5MB max (JPEG/PNG/WebP)
- **WebSocket** — STOMP over SockJS at `/ws`, order notifications pushed to admin panel
- **JWT** — HS384, 24h expiry, secret from `JWT_SECRET` env var (min 64 chars)
- **Ownership validation** — services verify restaurant belongs to authenticated user before mutations

## Environment Variables

See `.env.example`. Key variables: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `DOMAIN`.
