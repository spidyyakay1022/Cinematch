import { useEffect, useState } from "react";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

function normalizeItem(item) {
  const base = normalizeMovie(item.movie || item);
  return { ...base, id: base.id ?? item.tmdb_movie_id, watched: item.watched_status ?? item.watched ?? false };
}

export default function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setMovies(toList(await api.getWatchlist()).map(normalizeItem));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(movie) {
    try {
      await api.removeFromWatchlist(movie.id);
      setMovies((prev) => prev.filter((m) => m.id !== movie.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleWatched(movie) {
    try {
      await api.setWatched(movie.id, !movie.watched);
      setMovies((prev) => prev.map((m) => (m.id === movie.id ? { ...m, watched: !m.watched } : m)));
    } catch (e) {
      setError(e.message);
    }
  }

  const toWatch = movies.filter((m) => !m.watched);
  const watched = movies.filter((m) => m.watched);

  return (
    <>
      <h1>My Watchlist</h1>
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : (
        <>
          <h2>To watch</h2>
          <MovieGrid movies={toWatch} empty="Nothing saved yet. Add movies from Discover or Chat." onRemove={remove} onToggleWatched={toggleWatched} />
          <h2 style={{ marginTop: 32 }}>Watched</h2>
          <MovieGrid movies={watched} empty="No watched movies yet." onRemove={remove} onToggleWatched={toggleWatched} />
        </>
      )}
    </>
  );
}
