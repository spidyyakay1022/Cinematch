from pydantic import BaseModel, Field


class Movie(BaseModel):
    id: int
    title: str
    year: str | None = None
    rating: float | None = None
    overview: str | None = None
    poster_url: str | None = None
    genres: list[str] = Field(default_factory=list)


class MoodRequest(BaseModel):
    mood: str = Field(..., min_length=2, max_length=120)
    limit: int = Field(5, ge=1, le=10)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000)


class Recommendation(BaseModel):
    movie: Movie
    reason: str


class RecommendationResponse(BaseModel):
    recommendations: list[Recommendation] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    movies: list[Movie] = Field(default_factory=list)


class WatchlistAdd(BaseModel):
    movie_id: int
    title: str = Field(..., min_length=1, max_length=250)
    poster_url: str | None = None


class CompareResponse(BaseModel):
    movies: list[Movie]
    summary: str
