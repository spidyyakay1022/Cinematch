# CineMatch AI

An AI-powered movie discovery application combining natural-language preferences, mood-based recommendations, and verified movie metadata from TMDB.

## Project structure

- `ai_engine/` — Gemini-powered preference extraction, TMDB discovery, ranking, and recommendation explanations.
- `backend/` — FastAPI endpoints, TMDB search/details, Gemini comparison, and SQLite watchlist.
- `frontend/` — React + Vite application.

## Local setup

1. Copy `.env.example` to `.env` in the repository root, or create `backend/.env`. Add your own TMDB Read Access Token and Gemini API key. Never commit real credentials.
2. Install backend dependencies from the repository root:

   ```bash
   python -m pip install -r backend/requirements.txt -r ai_engine/requirements.txt
   ```

3. Start the backend from the repository root:

   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. In another terminal, start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```

5. Open the Vite URL (normally `http://localhost:5173`) and API docs at `http://localhost:8000/docs`.

The backend loads `backend/.env` regardless of the working directory used to launch Uvicorn. Process-level environment variables (such as Render settings) take precedence.

## Environment variables

- `TMDB_READ_ACCESS_TOKEN` — TMDB API Read Access Token (Bearer token).
- `GEMINI_API_KEY` — Google AI Studio API key.
- `GEMINI_MODEL` — optional Gemini model; defaults to `gemini-2.5-flash`.
- `FRONTEND_ORIGIN` — allowed frontend origin; comma-separated origins are supported.
- `DB_PATH` — optional SQLite database path.
- `VITE_API_URL` — frontend API base URL. Leave blank for local Vite proxying; set it to the deployed backend URL for production.

## API routes

- `GET /api/health` — reports whether required API credentials are configured.
- `GET /api/movies/search?q=...` — search TMDB movies.
- `GET /api/movies/{movie_id}` — fetch movie details.
- `GET /api/movies/compare?a=...&b=...` — compare two movies.
- `POST /api/recommend/mood` — get mood-based recommendations.
- `POST /api/chat` — natural-language movie discovery.
- `GET /api/watchlist` — list saved movies.
- `POST /api/watchlist` — add a movie to the watchlist.
- `DELETE /api/watchlist/{movie_id}` — remove a movie from the watchlist.

## AI and movie-data integrity

TMDB is the source of truth for movie records and metadata. Gemini interprets user requests and writes explanations grounded in TMDB records. API credentials remain server-side and must never be exposed in frontend code.

## Tests

Run offline unit tests from the repository root:

```bash
python -m unittest ai_engine.test_recommender backend.test_api_helpers
```

Live API checks require valid TMDB and Gemini credentials.

## Deployment

- `render.yaml` defines a free-tier Render blueprint for the FastAPI backend. During Render setup, provide `TMDB_READ_ACCESS_TOKEN`, `GEMINI_API_KEY`, and `FRONTEND_ORIGIN` as secret/environment values.
- Deploy the frontend on Vercel with project root `frontend` and set `VITE_API_URL` to the deployed backend URL.
- Set the backend `FRONTEND_ORIGIN` to the exact Vercel frontend origin.
- The included SQLite watchlist is suitable for demos, but a free web service may have an ephemeral filesystem. Use a persistent database before relying on watchlist data in production.
