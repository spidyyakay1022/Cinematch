from typing import Any, Optional
from pydantic import BaseModel, Field


class Movie(BaseModel):
    id: int
    title: str
    year: Optional[str] = None
    rating: Optional[float] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None
    genres: list[str] = Field(default_factory=list)


class MoodRequest(BaseModel):
    mood: str = Field(..., min_length=2, examples=["happy", "need a good cry"])
    limit: int = Field(5, ge=1, le=10)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, examples=["a thriller like Inception"])


class Recommendation(BaseModel):
    movie: Movie
    reason: str


class RecommendationResponse(BaseModel):
    recommendations: list[Recommendation]


class EngineRecommendationRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=2,
        description="Describe the kind of movie you want in natural language.",
        examples=["I want a mind-bending science fiction movie under 130 minutes"],
    )
    limit: int = Field(10, ge=1, le=20)


class EngineMovieRecommendation(BaseModel):
    id: int
    title: str
    overview: str = ""
    release_date: Optional[str] = None
    poster_path: Optional[str] = None
    vote_average: Optional[float] = None
    original_language: Optional[str] = None
    genre_ids: list[int] = Field(default_factory=list)
    match_score: float
    score_breakdown: dict[str, float] = Field(default_factory=dict)
    why_recommended: str = ""


class EngineRecommendationResponse(BaseModel):
    preferences: dict[str, Any]
    count: int
    recommendations: list[EngineMovieRecommendation]


class ChatResponse(BaseModel):
    reply: str
    movies: list[Movie] = Field(default_factory=list)


class WatchlistAdd(BaseModel):
    movie_id: int
    title: str
    poster_url: Optional[str] = None


class CompareResponse(BaseModel):
    movies: list[Movie]
    summary: str
