# CineMatch AI Recommendation Engine

Member 3 module: natural-language movie discovery, mood interpretation, ranking, and grounded explanations.

## Design
- **TMDB is the source of truth** for titles, posters, descriptions, ratings, language, release dates, and genre IDs.
- **Gemini interprets the user's request** into structured preferences and writes short explanations.
- The local scoring layer ranks TMDB results. Gemini never supplies or invents movie records.
- If Gemini is unavailable, preference extraction falls back to simple keyword matching and explanations use a safe fallback.

## Setup
1. Copy the root `.env.example` to `.env`.
2. Add a TMDB API Read Access Token and Gemini API key.
3. Install dependencies: `pip install -r ai_engine/requirements.txt`.
4. Export the variables from `.env` into your shell (do not commit `.env`).

## Run
```bash
python ai_engine/recommender.py "I want a mind-bending science fiction movie under 130 minutes"
```

The script prints JSON containing interpreted preferences and ranked recommendations.

## Python integration
```python
from ai_engine.recommender import CineMatchEngine

engine = CineMatchEngine()
result = engine.recommend("Feel-good comedy in English, rated at least 7", limit=8)
```

## Recommendation scoring
The score is a normalized weighted match across the dimensions actually supplied:
- Genre match: 30%
- Mood/theme terms in TMDB overview: 25%
- Keyword match: 10%
- Rating quality: 10% (only activated when a minimum rating was requested)
- Query relevance: 25%

Weights are re-normalized when a dimension is not requested. Runtime, language, and minimum rating are also sent as TMDB discovery filters when provided.

## Integration contract
`CineMatchEngine.recommend(text, limit=10)` returns:
- `preferences`: parsed user preferences
- `count`: number of results
- `recommendations`: TMDB movie metadata plus `match_score`, `score_breakdown`, and `why_recommended`

Each recommendation includes TMDB's numeric movie ID. The backend can expose this result from a FastAPI route such as `POST /api/recommendations`.

## Notes
- Never expose API keys in frontend code or commit a real `.env`.
- TMDB image URLs should be constructed by the frontend using TMDB's documented image base URL and size.
- Add caching/rate limiting in the backend before a public deployment.
