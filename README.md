# CineMatch AI

An AI-powered movie discovery project that combines natural-language preferences, mood-based recommendations, and verified movie metadata from TMDB.

## Project structure

- `ai_engine/` — Gemini-powered preference extraction, TMDB discovery, ranking, and recommendation explanations.
- `backend/` — FastAPI endpoints, movie search/comparison, and SQLite watchlist.
- `frontend/` — planned React + Vite application (not yet present in this repository).

## Backend setup

1. Create a local environment file by copying `.env.example` to `.env`.
2. Add your TMDB API Read Access Token and Gemini API key to `.env`. Never commit this file.
3. Install dependencies from the repository root:

   ```bash
   python -m pip install -r backend/requirements.txt -r ai_engine/requirements.txt
   ```

4. Start the API from the repository root:

   ```bash
   uvicorn backend.main:app --reload
   ```

5. Open the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Environment variables

- `TMDB_READ_ACCESS_TOKEN` — TMDB API Read Access Token (Bearer token).
- `GEMINI_API_KEY` — Google AI Studio API key.
- `GEMINI_MODEL` — optional Gemini model; defaults to `gemini-2.5-flash`.
- `FRONTEND_ORIGIN` — allowed frontend origin; comma-separated origins are supported.
- `DB_PATH` — optional SQLite database path.

## Main API routes

- `GET /api/health` — checks whether API credentials are configured.
- `GET /api/movies/search?q=...` — search TMDB movies.
- `GET /api/movies/{movie_id}` — fetch movie details.
- `GET /api/movies/compare?a=...&b=...` — compare two movies.
- `POST /api/recommend/mood` — get mood-based recommendations.
- `POST /api/chat` — natural-language movie discovery.
- `GET /api/watchlist` — list saved movies.
- `POST /api/watchlist` — add a movie to the watchlist.
- `DELETE /api/watchlist/{movie_id}` — remove a movie from the watchlist.

## AI and movie-data integrity

TMDB is the source of truth for movie records and metadata. Gemini interprets user requests and writes explanations based on the TMDB records returned by the recommendation engine. The backend calls the shared `CineMatchEngine` rather than maintaining a separate recommendation implementation.

## Tests

Run the offline recommendation-engine tests from the repository root:

```bash
python -m unittest ai_engine.test_recommender
```

Live API checks require valid TMDB and Gemini credentials. Do not paste API keys into issues, commits, or frontend code.

## Deployment status

The backend and frontend still require deployment configuration. The frontend directory is not yet included in this repository.
