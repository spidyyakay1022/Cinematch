import sys
import unittest
from pathlib import Path
from unittest.mock import patch

# main.py imports db/services as backend-local modules. Add backend/ for tests
# launched from the repository root.
BACKEND_DIR = str(Path(__file__).resolve().parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException

from main import recommend_personalized
from schemas import EngineRecommendationRequest
from ai_engine.recommender import CineMatchError


class FakeEngine:
    def recommend(self, message, limit):
        return {
            "preferences": {"query": message, "genres": ["science fiction"]},
            "count": 1,
            "recommendations": [
                {
                    "id": 123,
                    "title": "Example Movie",
                    "overview": "A test overview.",
                    "release_date": "2020-01-01",
                    "poster_path": "/example.jpg",
                    "vote_average": 8.1,
                    "original_language": "en",
                    "genre_ids": [878],
                    "match_score": 92.5,
                    "score_breakdown": {"genre": 1.0, "relevance": 0.9},
                    "why_recommended": "Matches the requested science-fiction genre.",
                }
            ],
        }


class PersonalizedRecommendationRouteTests(unittest.TestCase):
    @patch("main.CineMatchEngine", return_value=FakeEngine())
    def test_route_returns_engine_result(self, engine_class):
        request = EngineRecommendationRequest(
            message="A science fiction movie", limit=3
        )
        response = recommend_personalized(request)

        self.assertEqual(response["count"], 1)
        self.assertEqual(response["recommendations"][0]["id"], 123)
        engine_class.assert_called_once_with()

    @patch("main.CineMatchEngine")
    def test_unconfigured_engine_returns_503(self, engine_class):
        engine_class.return_value.recommend.side_effect = CineMatchError(
            "TMDB_READ_ACCESS_TOKEN is not configured."
        )
        request = EngineRecommendationRequest(message="A comedy")
        with self.assertRaises(HTTPException) as raised:
            recommend_personalized(request)
        self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
