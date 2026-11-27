"""CineMatch AI recommendation engine.

TMDB is the source of truth for movie metadata. Gemini only interprets requests
and writes explanations grounded in TMDB results.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from typing import Any

import httpx

TMDB_BASE = "https://api.themoviedb.org/3"
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


@dataclass
class Preferences:
    query: str = ""
    moods: list[str] = field(default_factory=list)
    genres: list[str] = field(default_factory=list)
    language: str | None = None
    max_runtime: int | None = None
    min_rating: float | None = None
    keywords: list[str] = field(default_factory=list)


# TMDB genre IDs. Keep IDs here so the engine does not need an extra lookup.
GENRES = {
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "science fiction": 878,
    "thriller": 53, "war": 10752, "western": 37,
}
MOOD_TERMS = {
    "happy": ["feel-good", "uplifting", "lighthearted"],
    "sad": ["emotional", "moving", "heartbreaking"],
    "romantic": ["love", "relationship", "romance"],
    "motivational": ["inspiring", "overcoming", "ambition"],
    "scary": ["suspenseful", "dark", "terrifying"],
    "mind-bending": ["mystery", "psychological", "twist"],
    "relaxed": ["calm", "comforting", "easy-going"],
    "adventurous": ["journey", "exploration", "discovery"],
}
LANGUAGES = {
    "bollywood": "hi", "hindi": "hi", "indian": "hi",
    "hollywood": "en", "english": "en", "korean": "ko",
    "k-drama": "ko", "japanese": "ja", "tamil": "ta",
    "telugu": "te", "malayalam": "ml", "french": "fr",
}


class CineMatchError(RuntimeError):
    """Raised when an external movie or AI service cannot be used."""


class CineMatchEngine:
    def __init__(
        self,
        tmdb_token: str | None = None,
        gemini_api_key: str | None = None,
        gemini_model: str | None = None,
        timeout: float = 20.0,
    ):
        self.tmdb_token = tmdb_token or os.getenv("TMDB_READ_ACCESS_TOKEN")
        self.tmdb_api_key = os.getenv("TMDB_API_KEY")
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.gemini_model = gemini_model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.timeout = timeout

    def _tmdb_get(self, path: str, params: dict[str, Any] | None = None) -> dict:
        if not self.tmdb_token and not self.tmdb_api_key:
            raise CineMatchError("TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY is not configured.")
        headers = ({"Authorization": f"Bearer {self.tmdb_token}", "Accept": "application/json"}
                   if self.tmdb_token else {})
        request_params = dict(params or {})
        if not self.tmdb_token and self.tmdb_api_key:
            request_params["api_key"] = self.tmdb_api_key
        try:
            response = httpx.get(
                f"{TMDB_BASE}{path}", headers=headers, params=request_params,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise CineMatchError(f"TMDB request failed: {exc}") from exc

    def _gemini(self, prompt: str, json_mode: bool = False) -> str:
        if not self.gemini_api_key:
            raise CineMatchError("GEMINI_API_KEY is not configured.")
        url = f"{GEMINI_BASE}/{self.gemini_model}:generateContent"
        body: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2},
        }
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"
        try:
            response = httpx.post(
                url, params={"key": self.gemini_api_key}, json=body,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
            raise CineMatchError(f"Gemini request failed: {exc}") from exc

    def understand(self, user_text: str) -> Preferences:
        """Convert a natural-language request into validated preference fields."""
        prompt = f"""Extract movie preferences from the user request.
Return JSON only with keys: query (string), moods (array of strings),
genres (array of strings), language (ISO 639-1 code or null),
max_runtime (integer minutes or null), min_rating (number 0-10 or null),
keywords (array of strings).
IMPORTANT: query must ONLY be a specific movie title if the user explicitly names
a title or asks for movies similar to a named title. Never put the full request,
genre, mood, or phrases like "recommend movies" in query.
Map Bollywood/Hindi to language "hi"; Tamil to "ta"; Telugu to "te";
Malayalam to "ml"; Korean to "ko"; Hollywood/English to "en".
Do not invent preferences. Use empty arrays and null when unspecified.
User request: {user_text!r}"""
        text = user_text.lower()
        extra_genres: list[str] = []
        extra_moods: list[str] = []
        extra_keywords: list[str] = []
        language_hint = next((code for label, code in LANGUAGES.items() if label in text), None)
        if re.search(r"\\banime\\b|\\bjapanese animation\\b", text):
            extra_genres.append("animation")
            language_hint = "ja"
        if re.search(r"\\bsuperheroes?\\b|\\bcomic book heroes?\\b", text):
            extra_genres.extend(["action", "adventure"])
            extra_keywords.append("superhero")
        if re.search(r"\\bsad\\b|\\bdepressed\\b|\\bheartbroken\\b|\\bfeeling low\\b", text):
            extra_genres.append("drama")
            extra_moods.append("sad")
        if re.search(r"\\bfunny\\b|\\bsomething funny\\b|\\bcomedy\\b", text):
            extra_genres.append("comedy")
        try:
            raw = self._gemini(prompt, json_mode=True)
            data = json.loads(raw)
            extracted_query = str(data.get("query") or "").strip()
            # Gemini must not turn a whole natural-language request into a title.
            explicit_title = re.search(
                r"(?:similar to|like)\s+([A-Z][A-Za-z0-9:' -]{1,50}?)(?:[.!?,]|$)",
                user_text,
            )
            if not explicit_title or extracted_query.lower() == user_text.lower():
                extracted_query = ""
            elif extracted_query and extracted_query.lower() not in user_text.lower():
                extracted_query = explicit_title.group(1).strip()
            return Preferences(
                query=extracted_query,
                moods=[x for x in dict.fromkeys([str(x).lower() for x in data.get("moods", [])] + extra_moods) if x in MOOD_TERMS or x in {"sad", "funny"}][:5],
                genres=[x for x in dict.fromkeys([str(x).lower() for x in data.get("genres", [])] + extra_genres) if x in GENRES][:8],
                language=language_hint or (data.get("language") if data.get("language") in set(LANGUAGES.values()) else None),
                max_runtime=self._positive_int(data.get("max_runtime")),
                min_rating=self._rating(data.get("min_rating")),
                keywords=list(dict.fromkeys([str(x).lower() for x in data.get("keywords", [])] + extra_keywords))[:8],
            )
        except (CineMatchError, json.JSONDecodeError, TypeError, AttributeError):
            # Deterministic fallback: never send the entire natural-language prompt
            # to TMDB as a title search (that caused generic/repeated results).
            text = user_text.lower()
            genres = [name for name in GENRES if re.search(rf"\b{re.escape(name)}\b", text)]
            moods = [name for name in MOOD_TERMS if name in text]
            if any(term in text for term in ("feeling low", "bad day", "sad", "down")):
                moods.append("sad")
            if any(term in text for term in ("funny", "laugh", "comedy")):
                genres.append("comedy")
            if any(term in text for term in ("scary", "frightening", "spooky")):
                genres.append("horror")
            language = language_hint
            # Only retain an explicitly named title after "like/similar to".
            title_match = re.search(r"(?:similar to|like)\s+([A-Z][A-Za-z0-9:' -]{1,50}?)(?:[.!?,]|$)", user_text)
            query = title_match.group(1).strip() if title_match else ""
            return Preferences(query=query, genres=list(dict.fromkeys(genres)),
                               moods=list(dict.fromkeys(moods)), language=language)

    @staticmethod
    def _positive_int(value: Any) -> int | None:
        try:
            number = int(value)
            return number if number > 0 else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _rating(value: Any) -> float | None:
        try:
            number = float(value)
            return min(10.0, max(0.0, number))
        except (TypeError, ValueError):
            return None

    def get_candidates(self, preferences: Preferences, limit: int = 40) -> list[dict]:
        """Fetch real movie records from TMDB discover/search endpoints."""
        params: dict[str, Any] = {
            "include_adult": "false", "sort_by": "popularity.desc",
            "page": 1,
        }
        genre_ids = [GENRES[g] for g in preferences.genres if g in GENRES]
        if genre_ids:
            params["with_genres"] = ",".join(map(str, genre_ids))
        if preferences.language:
            params["with_original_language"] = preferences.language
            if preferences.language in {"hi", "ta", "te", "ml"}:
                params["region"] = "IN"
        if preferences.max_runtime:
            params["with_runtime.lte"] = preferences.max_runtime
        if preferences.min_rating is not None:
            params["vote_average.gte"] = preferences.min_rating
        if "superhero" in preferences.keywords:
            params["with_keywords"] = "9715"

        if preferences.query.strip():
            # Search results are actual TMDB records; discover adds preference filtering.
            search = self._tmdb_get("/search/movie", {
                "query": preferences.query, "include_adult": "false", "page": 1,
            }).get("results", [])
            discovered = self._tmdb_get("/discover/movie", params).get("results", [])
            merged = {m["id"]: m for m in [*search, *discovered] if m.get("id")}
            candidates = list(merged.values())
        else:
            candidates = self._tmdb_get("/discover/movie", params).get("results", [])
        return candidates[: max(1, min(limit, 100))]

    @staticmethod
    def _score(movie: dict, prefs: Preferences) -> tuple[float, dict[str, float]]:
        title = (movie.get("title") or "").lower()
        overview = (movie.get("overview") or "").lower()
        text = f"{title} {overview}"
        movie_genres = set(movie.get("genre_ids") or [])
        wanted_genres = {GENRES[g] for g in prefs.genres if g in GENRES}
        genre = len(movie_genres & wanted_genres) / max(1, len(wanted_genres)) if wanted_genres else 0.0

        mood_words = [word for mood in prefs.moods for word in MOOD_TERMS.get(mood, [mood])]
        mood = sum(1 for word in mood_words if word in text) / max(1, len(mood_words)) if mood_words else 0.0
        keyword = sum(1 for word in prefs.keywords if word in text) / max(1, len(prefs.keywords)) if prefs.keywords else 0.0
        rating = min(1.0, float(movie.get("vote_average") or 0) / 10.0)
        query_words = [w for w in re.findall(r"[a-z0-9]+", prefs.query.lower()) if len(w) > 2]
        relevance = sum(1 for w in query_words if w in text) / max(1, len(query_words)) if query_words else 0.0

        # Re-normalize only the active preference dimensions.
        weights = {"genre": .30, "mood": .25, "keyword": .10, "rating": .10, "relevance": .25}
        active = {
            "genre": bool(wanted_genres), "mood": bool(mood_words),
            "keyword": bool(prefs.keywords), "rating": prefs.min_rating is not None,
            "relevance": bool(query_words),
        }
        active_weight = sum(weights[k] for k, enabled in active.items() if enabled)
        if not active_weight:
            active_weight = 1.0
            active["rating"] = True
        parts = {"genre": genre, "mood": mood, "keyword": keyword,
                 "rating": rating, "relevance": relevance}
        score = sum(parts[k] * weights[k] for k in parts if active.get(k)) / active_weight
        return round(score * 100, 2), parts

    def recommend(self, user_text: str, limit: int = 10) -> dict:
        prefs = self.understand(user_text)
        candidates = self.get_candidates(prefs)
        ranked = []
        for movie in candidates:
            score, breakdown = self._score(movie, prefs)
            ranked.append({
                "id": movie.get("id"),
                "title": movie.get("title") or "Untitled",
                "overview": movie.get("overview") or "",
                "release_date": movie.get("release_date"),
                "poster_path": movie.get("poster_path"),
                "vote_average": movie.get("vote_average"),
                "original_language": movie.get("original_language"),
                "genre_ids": movie.get("genre_ids", []),
                "match_score": score,
                "score_breakdown": breakdown,
            })
        ranked.sort(key=lambda item: (item["match_score"], item.get("vote_average") or 0), reverse=True)
        selected = ranked[: max(1, min(limit, 20))]
        if selected:
            # Reasons are deterministic and grounded in the actual TMDB record.
            for item in selected:
                names = [name for name, gid in GENRES.items() if gid in item.get("genre_ids", [])]
                matched = [name.title() for name in names if name in prefs.genres]
                if matched:
                    reason = "Matched your requested genre: " + ", ".join(matched) + "."
                elif prefs.language:
                    reason = f"Selected from {prefs.language.upper()}-language movie results on TMDB."
                else:
                    rating = item.get("vote_average")
                    reason = (f"TMDB user rating: {rating}/10." if rating is not None
                              else "Selected from TMDB results matching your request.")
                item["why_recommended"] = reason
        return {"preferences": prefs.__dict__, "count": len(selected), "recommendations": selected}

    def explain(self, movies: list[dict], prefs: Preferences) -> list[str]:
        """Ask Gemini to explain only the supplied, verified TMDB movie records."""
        compact = [{
            "title": m["title"], "overview": m["overview"],
            "genres": m.get("genre_ids", []), "rating": m.get("vote_average"),
            "release_date": m.get("release_date"),
        } for m in movies]
        prompt = f"""Write one concise, specific recommendation reason for each movie.
Use ONLY the supplied data. Do not add cast, awards, plot events, streaming services,
or facts not present in the data. If details are limited, say why the available
description/preferences make it a possible match. Return a JSON array of strings
in exactly the same order as the movies.
User preferences: {json.dumps(prefs.__dict__)}
TMDB movie records: {json.dumps(compact)}"""
        try:
            values = json.loads(self._gemini(prompt, json_mode=True))
            if isinstance(values, list) and len(values) == len(movies):
                return [str(x) for x in values]
        except (CineMatchError, json.JSONDecodeError, TypeError):
            pass
        return [
            f"Suggested based on your preferences; TMDB lists a rating of {m.get('vote_average', 'unavailable')}/10."
            for m in movies
        ]


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="CineMatch AI movie recommender")
    parser.add_argument("request", help="Describe the movie you want")
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()
    engine = CineMatchEngine()
    print(json.dumps(engine.recommend(args.request, args.limit), indent=2, ensure_ascii=False))
