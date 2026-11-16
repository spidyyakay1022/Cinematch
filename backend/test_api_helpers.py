import unittest

from backend.main import _to_movie, _to_recommendations


class BackendMappingTests(unittest.TestCase):
    def test_tmdb_movie_maps_to_api_schema(self):
        movie = _to_movie({
            "id": 550,
            "title": "Fight Club",
            "release_date": "1999-10-15",
            "vote_average": 8.4,
            "overview": "A short overview.",
            "poster_path": "/poster.jpg",
            "genre_ids": [18, 53],
        })
        self.assertEqual(movie.id, 550)
        self.assertEqual(movie.year, "1999")
        self.assertEqual(movie.genres, ["Drama", "Thriller"])
        self.assertTrue(movie.poster_url.endswith("/poster.jpg"))

    def test_recommendation_reason_is_preserved(self):
        result = _to_recommendations({
            "recommendations": [{
                "id": 550,
                "title": "Fight Club",
                "release_date": "1999-10-15",
                "vote_average": 8.4,
                "overview": "A short overview.",
                "poster_path": None,
                "genre_ids": [18],
                "why_recommended": "Matches the requested tone.",
            }]
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].movie.title, "Fight Club")
        self.assertEqual(result[0].reason, "Matches the requested tone.")


if __name__ == "__main__":
    unittest.main()
