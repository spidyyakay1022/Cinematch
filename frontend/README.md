# CineMatch frontend

React + Vite frontend for the CineMatch AI FastAPI backend.

## Run locally

From the repository root:

```bash
python -m pip install -r backend/requirements.txt -r ai_engine/requirements.txt
npm --prefix frontend install
cp frontend/.env.example frontend/.env
npm --prefix frontend run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` to the FastAPI base URL. The backend must allow the frontend origin using `FRONTEND_ORIGIN` (default: `http://localhost:5173`).

## Included screens

- Editorial discovery homepage with film search and mood recommendations
- AI Studio chat using `POST /api/chat`
- Movie detail dialog
- Watchlist connected to the backend
- Two-title comparison using `GET /api/movies/compare`

Movie metadata and posters are loaded from the backend/TMDB. Gemini and TMDB credentials belong only in the backend environment, never in browser code.
