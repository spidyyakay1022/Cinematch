import os

import httpx

from backend.schemas import Movie

TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_READ_ACCESS_TOKEN = os.getenv("TMDB_READ_ACCESS_TOKEN")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")  # Backward compatibility for older local .env files.
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

GENRE_NAMES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    53: "Thriller", 10752: "War", 37: "Western",
}


def _tmdb_auth() -> tuple[dict, dict]:
    if TMDB_READ_ACCESS_TOKEN:
        return {"Authorization": f"Bearer {TMDB_READ_ACCESS_TOKEN}"}, {}
    if TMDB_API_KEY:
        return {}, {"api_key": TMDB_API_KEY}
    raise RuntimeError("TMDB_READ_ACCESS_TOKEN is not configured.")


def _to_movie(data: dict) -> Movie:
    poster = data.get("poster_path")
    genre_ids = data.get("genre_ids", [])
    genres = [GENRE_NAMES[g] for g in genre_ids if g in GENRE_NAMES]
    if data.get("genres"):
        genres = [g["name"] for g in data["genres"]]
    return Movie(
        id=data["id"],
        title=data.get("title") or "Unknown",
        year=(data.get("release_date") or "")[:4] or None,
        rating=data.get("vote_average"),
        overview=data.get("overview") or "",
        poster_url=f"{IMG_BASE}{poster}" if poster else None,
        genres=genres,
    )


async def search_movies(query: str) -> list[Movie]:
    headers, auth_params = _tmdb_auth()
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{TMDB_BASE}/search/movie",
            headers=headers,
            params={**auth_params, "query": query, "include_adult": "false"},
        )
        response.raise_for_status()
        return [_to_movie(item) for item in response.json().get("results", [])[:12]]


async def get_movie(movie_id: int) -> Movie | None:
    headers, auth_params = _tmdb_auth()
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{TMDB_BASE}/movie/{movie_id}",
            headers=headers,
            params=auth_params,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return _to_movie(response.json())


async def _gemini(prompt: str) -> str:
    if not GEMINI_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            GEMINI_URL,
            params={"key": GEMINI_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def compare_summary(a: Movie, b: Movie) -> str:
    if not GEMINI_KEY:
        return f"{a.title} ({a.rating}) vs {b.title} ({b.rating})."
    prompt = (
        f"Compare '{a.title}' and '{b.title}' using only these details. "
        f"Movie A overview: {a.overview or 'Unavailable'}. "
        f"Movie B overview: {b.overview or 'Unavailable'}. "
        "In three short sentences, compare their available themes and tone. "
        "Do not invent cast, awards, plot details, or streaming availability."
    )
    return await _gemini(prompt)
