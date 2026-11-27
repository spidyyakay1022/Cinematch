const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  try {
    const res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      let msg = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        if (typeof data.detail === "string") msg = data.detail;
      } catch {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("Cannot reach the server. Please check that the backend is running.");
    }
    throw e;
  }
}

export function toList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.movies || data?.recommendations || data?.items || [];
}

export function normalizeMovie(m) {
  if (!m) return null;
  const source = m.movie || m;
  return {
    id: source.id ?? source.movie_id ?? source.tmdb_movie_id,
    title: source.title || source.name || "Untitled",
    year: source.year || (source.release_date || "").slice(0, 4),
    rating: source.rating ?? source.vote_average,
    runtime: source.runtime,
    language: source.original_language || source.language,
    genres: (source.genres || []).map((g) => (typeof g === "string" ? g : g.name)),
    overview: source.overview,
    popularity: source.popularity,
    certification: source.certification,
    reason: m.reason || source.reason || source.explanation,
    score: source.score,
    poster: source.poster_url || (source.poster_path ? `https://image.tmdb.org/t/p/w500${source.poster_path}` : null),
  };
}

export const api = {
  chat: (message) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message }) }),
  recommend: (mood, limit = 8) =>
    request("/api/recommend/mood", { method: "POST", body: JSON.stringify({ mood, limit }) }),
  searchMovies: (query) =>
    request(`/api/movies/search?q=${encodeURIComponent(query)}`),
  getFeaturedMovies: (limit = 25) => request(`/api/movies/featured?limit=${limit}`),
  getMovie: (id) => request(`/api/movies/${id}`),
  compare: (ids) => {
    if (!Array.isArray(ids) || ids.length !== 2) throw new Error("Select exactly two movies to compare.");
    return request(`/api/movies/compare?a=${encodeURIComponent(ids[0])}&b=${encodeURIComponent(ids[1])}`);
  },
  getWatchlist: () => request("/api/watchlist"),
  addToWatchlist: (movie) =>
    request("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({
        movie_id: Number(movie.id),
        title: movie.title,
        poster_url: movie.poster || null,
      }),
    }),
  removeFromWatchlist: (movieId) =>
    request(`/api/watchlist/${movieId}`, { method: "DELETE" }),
};
