import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load environment files relative to this file, not the process working
# directory. This supports both:
#   - repository-root .env
#   - backend/.env
# Existing process environment variables take precedence.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(BACKEND_DIR / ".env", override=False)

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.recommender import CineMatchEngine
from backend import db, services
from backend.schemas import (
    ChatRequest, ChatResponse, CompareResponse, Movie, MoodRequest,
    Recommendation, RecommendationResponse, WatchlistAdd,
)

engine = CineMatchEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(
    title="CineMatch AI API",
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def upstream_error(e: Exception) -> HTTPException:
    message = str(e)
    if "not configured" in message:
        return HTTPException(status_code=503, detail=message)
    return HTTPException(status_code=502, detail=f"Upstream service error: {message}")


def _to_movie(item: dict) -> Movie:
    genre_names = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
        80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
        14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
        9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
        53: "Thriller", 10752: "War", 37: "Western",
    }
    poster_path = item.get("poster_path")
    return Movie(
        id=item["id"],
        title=item.get("title") or "Untitled",
        year=(item.get("release_date") or "")[:4] or None,
        rating=item.get("vote_average"),
        overview=item.get("overview") or "",
        poster_url=f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None,
        genres=[genre_names[g] for g in item.get("genre_ids", []) if g in genre_names],
    )


def _to_recommendations(result: dict) -> list[Recommendation]:
    recommendations = []
    for item in result.get("recommendations", []):
        recommendations.append(Recommendation(
            movie=_to_movie(item),
            reason=item.get("why_recommended") or "Matched against your movie preferences.",
        ))
    return recommendations


@app.get("/", tags=["System"])
async def root():
    """Basic API landing page with links to interactive documentation."""
    return {
        "name": "CineMatch AI API",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "tmdb": bool(os.getenv("TMDB_READ_ACCESS_TOKEN") or os.getenv("TMDB_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.get("/api/movies/search", response_model=list[Movie])
async def search(q: str = Query(..., min_length=1)):
    try:
        return await services.search_movies(q)
    except (httpx.HTTPError, RuntimeError) as e:
        raise upstream_error(e)


@app.get("/api/movies/compare", response_model=CompareResponse)
async def compare(a: int, b: int):
    try:
        movie_a, movie_b = await services.get_movie(a), await services.get_movie(b)
        if not movie_a or not movie_b:
            raise HTTPException(404, "One or both movies not found")
        summary = await services.compare_summary(movie_a, movie_b)
    except (httpx.HTTPError, RuntimeError) as e:
        raise upstream_error(e)
    return CompareResponse(movies=[movie_a, movie_b], summary=summary)


@app.get("/api/movies/featured", response_model=list[Movie])
async def featured(limit: int = Query(20, ge=1, le=40)):
    try:
        return await services.featured_movies(limit)
    except (httpx.HTTPError, RuntimeError) as e:
        raise upstream_error(e)


@app.get("/api/movies/{movie_id}", response_model=Movie)
async def movie_detail(movie_id: int):
    try:
        movie = await services.get_movie(movie_id)
    except (httpx.HTTPError, RuntimeError) as e:
        raise upstream_error(e)
    if not movie:
        raise HTTPException(404, "Movie not found")
    return movie


@app.post("/api/recommend/mood", response_model=RecommendationResponse)
async def recommend_mood(req: MoodRequest):
    try:
        result = await run_in_threadpool(engine.recommend, req.mood, req.limit)
        return RecommendationResponse(recommendations=_to_recommendations(result))
    except Exception as e:
        raise upstream_error(e)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = await run_in_threadpool(engine.recommend, req.message, 8)
        movies = _to_recommendations(result)
        if movies:
            reply = f"I found {len(movies)} movies that match your request."
        else:
            reply = "I couldn't find a strong match. Try changing your mood, genre, or language."
        return ChatResponse(reply=reply, movies=[item.movie for item in movies])
    except Exception as e:
        raise upstream_error(e)


@app.get("/api/watchlist")
async def list_watchlist():
    return db.get_watchlist()


@app.post("/api/watchlist", status_code=201)
async def add_watchlist(item: WatchlistAdd):
    db.add_to_watchlist(item.movie_id, item.title, item.poster_url)
    return {"message": "Added to watchlist"}


@app.delete("/api/watchlist/{movie_id}")
async def delete_watchlist(movie_id: int):
    if not db.remove_from_watchlist(movie_id):
        raise HTTPException(404, "Movie not in watchlist")
    return {"message": "Removed from watchlist"}
