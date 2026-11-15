import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()  # must run before services/db read the environment

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import db
import services
from schemas import (
    ChatRequest, ChatResponse, CompareResponse, Movie, MoodRequest,
    RecommendationResponse, WatchlistAdd,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="CineMatch AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)


def upstream_error(e: Exception) -> HTTPException:
    return HTTPException(status_code=502, detail=f"Upstream service error: {e}")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "tmdb": bool(services.TMDB_KEY),
        "gemini": bool(services.GEMINI_KEY),
    }


# ---------- Movies ----------
@app.get("/api/movies/search", response_model=list[Movie])
async def search(q: str = Query(..., min_length=1)):
    try:
        return await services.search_movies(q)
    except httpx.HTTPError as e:
        raise upstream_error(e)


@app.get("/api/movies/compare", response_model=CompareResponse)
async def compare(a: int, b: int):
    try:
        movie_a, movie_b = await services.get_movie(a), await services.get_movie(b)
        if not movie_a or not movie_b:
            raise HTTPException(404, "One or both movies not found")
        summary = await services.compare_summary(movie_a, movie_b)
    except httpx.HTTPError as e:
        raise upstream_error(e)
    return CompareResponse(movies=[movie_a, movie_b], summary=summary)


@app.get("/api/movies/{movie_id}", response_model=Movie)
async def movie_detail(movie_id: int):
    try:
        movie = await services.get_movie(movie_id)
    except httpx.HTTPError as e:
        raise upstream_error(e)
    if not movie:
        raise HTTPException(404, "Movie not found")
    return movie


# ---------- AI ----------
@app.post("/api/recommend/mood", response_model=RecommendationResponse)
async def recommend_mood(req: MoodRequest):
    try:
        recs = await services.recommend_by_mood(req.mood, req.limit)
    except (httpx.HTTPError, ValueError, KeyError) as e:
        raise upstream_error(e)
    return RecommendationResponse(recommendations=recs)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        reply, movies = await services.chat_search(req.message)
    except (httpx.HTTPError, ValueError, KeyError) as e:
        raise upstream_error(e)
    return ChatResponse(reply=reply, movies=movies)


# ---------- Watchlist ----------
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