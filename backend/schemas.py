from typing import Optional
from pydantic import BaseModel, Field


class Movie(BaseModel):
    id: int
    title: str
    year: Optional[str] = None
    rating: Optional[float] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None
    genres: list[str] = []


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


class ChatResponse(BaseModel):
    reply: str
    movies: list[Movie] = []


class WatchlistAdd(BaseModel):
    movie_id: int
    title: str
    poster_url: Optional[str] = None


class CompareResponse(BaseModel):
    movies: list[Movie]
    summary: str