import unittest

from ai_engine.recommender import CineMatchEngine, Preferences


class RecommendationScoringTests(unittest.TestCase):
    def setUp(self):
        self.engine = CineMatchEngine(tmdb_token="test-token", gemini_api_key="test-key")

    def test_genre_match_scores_higher_than_non_match(self):
        prefs = Preferences(genres=["science fiction"])
        matching = {"genre_ids": [878], "overview": "", "title": "", "vote_average": 7.0}
        other = {"genre_ids": [35], "overview": "", "title": "", "vote_average": 7.0}
        match_score, _ = self.engine._score(matching, prefs)
        other_score, _ = self.engine._score(other, prefs)
        self.assertGreater(match_score, other_score)

    def test_mood_and_keyword_are_used(self):
        prefs = Preferences(moods=["romantic"], keywords=["friendship"])
        movie = {
            "genre_ids": [], "title": "A story of friendship",
            "overview": "A romantic journey about two people.",
            "vote_average": 8.0,
        }
        score, parts = self.engine._score(movie, prefs)
        self.assertGreater(score, 0)
        self.assertGreater(parts["mood"], 0)
        self.assertEqual(parts["keyword"], 1.0)

    def test_rating_parser_clamps_range(self):
        self.assertEqual(self.engine._rating(15), 10.0)
        self.assertEqual(self.engine._rating(-2), 0.0)
        self.assertIsNone(self.engine._rating("not-a-number"))

    def test_runtime_parser_rejects_invalid_values(self):
        self.assertEqual(self.engine._positive_int("120"), 120)
        self.assertIsNone(self.engine._positive_int(-1))
        self.assertIsNone(self.engine._positive_int("unknown"))


if __name__ == "__main__":
    unittest.main()
