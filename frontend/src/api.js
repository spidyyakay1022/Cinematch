const BASE = import.meta.env.VITE_API_URL || "";

// No login in v1: a random id is saved in the browser so the watchlist stays per-user.
export function getUserId() {
  try {
    let id = localStorage.getItem("cinematch_user");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("cinematch_user", id);
    }
    return id;
  } catch {
    return "guest";
  }
}

async function request(path, options = {}) {
  try {
    const res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json", "X-User-Id": getUserId() },
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

// Accepts either a plain array or { results: [...] } / { movies: [...] }
export function toList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.movies || data?.recommendations || data?.items || [];
}

// Converts TMDB-style or custom backend movie objects into one shape the UI uses.
export function normalizeMovie(m) {
  if (!m) return null;
  const poster =
    m.poster_url ||
    (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null);
  return {
    id: m.id ?? m.tmdb_movie_id,
    title: m.title || m.name || "Untitled",
    year: m.year || (m.release_date || "").slice(0, 4),
    rating: m.rating ?? m.vote_average,
    runtime: m.runtime,
    language: m.original_language || m.language,
    genres: (m.genres || []).map((g) => (typeof g === "string" ? g : g.name)),
    overview: m.overview,
    popularity: m.popularity,
    certification: m.certification,
    reason: m.reason || m.explanation,
    score: m.score,
    poster,
  };
}

export const api = {
  chat: (message, history) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  recommend: (prefs) =>
    request("/api/recommend", { method: "POST", body: JSON.stringify(prefs) }),
  searchMovies: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return request(`/api/movies/search?${qs}`);
  },
  getMovie: (id) => request(`/api/movies/${id}`),
  getSimilar: (id) => request(`/api/movies/${id}/similar`),
  compare: (ids) =>
    request("/api/compare", { method: "POST", body: JSON.stringify({ movie_ids: ids }) }),
  getWatchlist: () => request("/api/watchlist"),
  addToWatchlist: (movieId) =>
    request("/api/watchlist", { method: "POST", body: JSON.stringify({ tmdb_movie_id: movieId }) }),
  removeFromWatchlist: (movieId) => request(`/api/watchlist/${movieId}`, { method: "DELETE" }),
  // Not in the original endpoint list: agree this one with the backend developer.
  setWatched: (movieId, watched) =>
    request(`/api/watchlist/${movieId}`, { method: "PATCH", body: JSON.stringify({ watched_status: watched }) }),
  createGroup: (name) =>
    request("/api/group/create", { method: "POST", body: JSON.stringify({ group_name: name }) }),
  submitGroupPrefs: (groupId, prefs) =>
    request(`/api/group/${groupId}/preferences`, { method: "POST", body: JSON.stringify(prefs) }),
  groupRecommendations: (groupId) => request(`/api/group/${groupId}/recommendations`),
};
