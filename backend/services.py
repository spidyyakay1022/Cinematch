import json
import os

import httpx

from schemas import Movie, Recommendation

TMDB_KEY = os.getenv("TMDB_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/w500"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)

MOCK_MOVIES = [
    Movie(id=27205, title="Inception", year="2010", rating=8.4,
          overview="A thief who steals secrets through dreams takes on one last job.",
          genres=["Sci-Fi", "Thriller"]),
    Movie(id=13, title="Forrest Gump", year="1994", rating=8.5,
          overview="The life story of a kind man who witnesses history.",
          genres=["Drama", "Romance"]),
    Movie(id=129, title="Spirited Away", year="2001", rating=8.5,
          overview="A girl enters a world of spirits to save her parents.",
          genres=["Animation", "Fantasy"]),
]


# ---------- TMDB (Member 4) ----------
def _to_movie(d: dict) -> Movie:
    poster = d.get("poster_path")
    return Movie(
        id=d["id"],
        title=d.get("title", "Unknown"),
        year=(d.get("release_date") or "")[:4] or None,
        rating=d.get("vote_average"),
        overview=d.get("overview"),
        poster_url=f"{IMG_BASE}{poster}" if poster else None,
        genres=[g["name"] for g in d.get("genres", [])],
    )


async def search_movies(query: str) -> list[Movie]:
    if not TMDB_KEY:
        q = query.lower()
        hits = [m for m in MOCK_MOVIES if q in m.title.lower()]
        return hits or MOCK_MOVIES
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{TMDB_BASE}/search/movie",
                             params={"api_key": TMDB_KEY, "query": query})
        r.raise_for_status()
        return [_to_movie(d) for d in r.json().get("results", [])[:12]]


async def get_movie(movie_id: int) -> Movie | None:
    if not TMDB_KEY:
        return next((m for m in MOCK_MOVIES if m.id == movie_id), None)
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{TMDB_BASE}/movie/{movie_id}",
                             params={"api_key": TMDB_KEY})
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return _to_movie(r.json())


# ---------- Gemini (Member 3) ----------
async def _gemini(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            GEMINI_URL,
            params={"key": GEMINI_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]


async def recommend_by_mood(mood: str, limit: int) -> list[Recommendation]:
    if not GEMINI_KEY:
        return [Recommendation(movie=m, reason=f"A good pick when you feel {mood}.")
                for m in MOCK_MOVIES[:limit]]
    prompt = (
        f"Suggest {limit} movies for someone feeling '{mood}'. "
        'Reply ONLY with JSON: [{"title": "...", "reason": "one sentence"}]'
    )
    text = (await _gemini(prompt)).strip().strip("`").removeprefix("json").strip()
    items = json.loads(text)
    results: list[Recommendation] = []
    for item in items[:limit]:
        found = await search_movies(item["title"])
        if found:
            results.append(Recommendation(movie=found[0], reason=item["reason"]))
    return results


async def chat_search(message: str) -> tuple[str, list[Movie]]:
    if not GEMINI_KEY:
        return ("Here are some movies you might like.", MOCK_MOVIES)
    prompt = (
        "You are a friendly movie assistant. Answer briefly and mention up to 3 "
        f"movie titles in quotes.\nUser: {message}"
    )
    reply = await _gemini(prompt)
    titles = [t for i, t in enumerate(reply.split('"')) if i % 2 == 1][:3]
    movies: list[Movie] = []
    for t in titles:
        found = await search_movies(t)
        if found:
            movies.append(found[0])
    return reply, movies


async def compare_summary(a: Movie, b: Movie) -> str:
    if not GEMINI_KEY:
        return f"{a.title} ({a.rating}) vs {b.title} ({b.rating})."
    prompt = (
        f"Compare the movies '{a.title}' and '{b.title}' in 3 short sentences "
        "covering tone, themes and who might prefer each."
    )
    return await _gemini(prompt)