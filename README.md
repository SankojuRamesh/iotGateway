# IoT Gateway Monitoring

A configuration-driven IoT Monitoring, Dashboard, Analytics, and Reporting platform. Devices, device types, metrics, dashboards, widgets, alerts, and reports are all defined from the UI/API at runtime — nothing is hardcoded in the frontend or backend.

## Stack

**Backend** — Python, Django, Django REST Framework, Django Channels (WebSockets), Celery, Redis, PostgreSQL, MQTT (paho-mqtt)
**Frontend** — React, TypeScript, Vite, Recharts, react-grid-layout
**Infra** — Docker Compose, Nginx, Postgres, Redis, Mosquitto (MQTT broker)

## Features

- **Auth & multi-tenancy** — JWT auth (register/login/logout/refresh/password reset), organizations, and 5-role RBAC (Super Admin, Org Admin, Manager, Operator, Viewer). All data is scoped to the caller's organization.
- **Device management** — CRUD for devices, sites, and device types; CSV import/export; telemetry history per device.
- **Dynamic metrics** — each device type defines its own metrics (key, display name, data type, unit, min/max, precision, aggregation) from the UI, not from code.
- **MQTT ingestion** — a standalone consumer subscribes to every configured device's topic, validates payloads against that device's metric definitions, normalizes values by type, and stores them.
- **Real-time updates** — telemetry pushes over WebSocket (Django Channels) to connected dashboard clients.
- **Dashboards** — drag-and-drop, resizable widgets (line/area/bar chart, gauge, stat card, table) bound to any device + metric.
- **Alerts & reports** — threshold-based alert rules with cooldowns (evaluated by Celery beat), and report/report-schedule models, all via API.
- **Background jobs** — Celery tasks for offline-device detection, telemetry rollups, and alert evaluation.

## Project layout

```
backend/
  config/            Django project: settings (base/dev/local/prod), ASGI, Celery app
  apps/
    accounts/        Users, Organizations, Memberships (roles), JWT auth
    sites/           Sites
    devices/         DeviceType, MetricDefinition, Device
    telemetry/       TelemetryReading, ingestion service, WebSocket consumer
    mqtt_ingest/      MQTT consumer (management command)
    dashboards/       Dashboard, Widget
    reports/          Report, ReportSchedule
    alerts/           AlertRule, AlertEvent
    events/           Audit/activity log
    common/           Org-scoping, permissions, pagination shared across apps
  tests/             pytest suite (runs against SQLite, no external services needed)

frontend/
  src/
    app/             Shell layout: sidebar, topbar, router, nav config
    features/        auth, devices, dashboards, telemetry, sites, alerts, reports, members
    components/ui/   Design-system primitives: Panel, Gauge, Badge, Table, Modal, etc.
    styles/theme.ts  Dark theme tokens + chart color palette

infra/
  nginx/             Reverse proxy config (routes /api, /ws, / to the right service)
  mosquitto/         MQTT broker config
docker-compose.yml
```

## Running it

### Option A — Docker Compose (all services)

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:8080
- Django admin: http://localhost:8080/admin/

Create a superuser:
```bash
docker compose exec backend python manage.py createsuperuser
```

Publish a test MQTT message (after creating a device with a matching topic):
```bash
docker compose exec mosquitto mosquitto_pub -t factory/pump/PUMP001 -m '{"current": 4.2}'
```

### Option B — No Docker (SQLite, no external services)

The backend defaults to `config.settings.local`, which needs nothing but Python — no Postgres, Redis, or MQTT broker required. It uses SQLite, an in-process WebSocket channel layer, and runs Celery tasks inline.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

```bash
cd frontend
npm install
npm run dev
```

Set `frontend/.env` (copy from `.env.example`) to point at wherever the backend is running, e.g.:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

In this mode there's no live MQTT broker, so simulate telemetry via the REST endpoint instead:
```
POST /api/telemetry/test-ingest/   { "device": "<uuid>", "payload": { "current": 4.2 } }
```
(Requires Manager role or above.)

### Tests

```bash
cd backend
pytest -q
```
Runs against SQLite — no Docker or Postgres needed here either.

## Notes

- `config.settings.dev` (Postgres/Redis/Mosquitto via Docker service names) is used automatically inside `docker compose` — the container's `.env` sets `DJANGO_SETTINGS_MODULE` explicitly, which overrides the bare-Python `local` default.
- Full drag-and-drop dashboard widgets, alert rules, and reports currently have complete backend models + APIs; the alert-rule and report *builder* UIs (as opposed to the dashboard builder, which is done) are still API-only.
- Android/mobile UI is not built yet — planned as a Capacitor wrap of the responsive web app in a future pass.
