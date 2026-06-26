# Community Hero 🦸

> A hyperlocal civic issue reporting platform. Citizens report problems by photo — AI classifies and scores severity. Reports are geo-tagged, deduplicated against nearby similar reports, community-verified, tracked through a status pipeline, and surfaced on a public map + impact dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Maps | react-leaflet + OpenStreetMap |
| Backend | Node.js + Express |
| Database | Supabase (Postgres + PostGIS) |
| AI Vision | Google Gemini API (gemini-2.0-flash) |
| Charts | Recharts |

---

## Monorepo Structure

```
/
├── frontend/          # React + Vite frontend (deploy to Vercel)
├── backend/           # Express API (deploy to Render)
│   └── migrations/    # SQL files to run in Supabase
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A Supabase project (with PostGIS extension enabled)
- A Google Gemini API key

### 1. Supabase Setup
1. Go to your Supabase project → **Extensions** → enable **PostGIS**
2. Open **SQL Editor** and run the migration files in order:
   ```
   backend/migrations/001_schema.sql
   backend/migrations/002_functions.sql
   backend/migrations/003_seed.sql   ← optional, populates demo data
   ```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in .env with your Supabase and Gemini credentials
npm install
npm run dev       # starts on http://localhost:3001
```

Environment variables required in `backend/.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIza...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in .env with your Supabase public keys and backend URL
npm install
npm run dev       # starts on http://localhost:5173
```

Environment variables required in `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BACKEND_URL=http://localhost:3001
```

---

## Deployment

### Frontend → Vercel
- Set root directory to `frontend`
- Add the 3 `VITE_*` env vars in Vercel dashboard
- Build command: `npm run build`, output: `dist`

### Backend → Render
- Set root directory to `backend`
- Start command: `node server.js`
- Add all backend env vars in Render dashboard

---

## Key Features

- **📸 AI-Powered Classification** — Gemini 2.0 Flash with structured JSON output, 8s timeout, retry, and safe fallback
- **📍 Duplicate Detection** — PostGIS 50m radius + category match (no embeddings, fully explainable)
- **🗺️ Live Map** — react-leaflet with category-colored, severity-sized markers
- **👥 Community Verification** — 3+ confirmations auto-verify a report
- **📊 Impact Dashboard** — Recharts with trends, resolution rate, and AI predictive insights
- **🔔 Realtime Feed** — Supabase realtime notifications (graceful degradation)
- **⚡ Authority View** — One-click status advancement (`/authority`, no auth for demo)

---

## Demo Tips

- For the best AI demo, name your test photos after the category (e.g. `pothole.jpg`, `streetlight.jpg`) — the demo fallback cache will guarantee correct results even offline
- The `/authority` route lets you advance any report's status live in front of judges
- Seed data (NYC/Manhattan) pre-populates the map and dashboard at `003_seed.sql`
