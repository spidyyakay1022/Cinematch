import { useEffect, useState } from "react";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

const WATCHED_KEY = "cinematch_watched_movies";

function getWatchedIds() {
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]"); }
  catch { return []; }
}

function normalizeItem(item) {
  const movie = normalizeMovie(item);
  const id = movie.id ?? item.movie_id;
  return { ...movie, id, watched: getWatchedIds().includes(Number(id)) };
}

export default function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try { setMovies(toList(await api.getWatchlist()).map(normalizeItem)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function remove(movie) {
    try {
      await api.removeFromWatchlist(movie.id);
      setMovies((prev) => prev.filter((m) => m.id !== movie.id));
    } catch (e) { setError(e.message); }
  }

  function toggleWatched(movie) {
    const ids = getWatchedIds();
    const next = movie.watched ? ids.filter((id) => Number(id) !== Number(movie.id)) : [...ids, Number(movie.id)];
    localStorage.setItem(WATCHED_KEY, JSON.stringify(next));
    setMovies((prev) => prev.map((m) => m.id === movie.id ? { ...m, watched: !m.watched } : m));
  }

  const toWatch = movies.filter((m) => !m.watched);
  const watched = movies.filter((m) => m.watched);

  return (
    <>
      <h1>My Watchlist</h1>
      <p className="meta">Watched status is saved in this browser. The backend watchlist itself is shared by its current implementation.</p>
      <ErrorBox message={error} />
      {loading ? <Loading /> : <>
        <h2>To watch</h2>
        <MovieGrid movies={toWatch} empty="Nothing saved yet. Add movies from Discover or Chat." onRemove={remove} onToggleWatched={toggleWatched} />
        <h2 style={{ marginTop: 32 }}>Watched</h2>
        <MovieGrid movies={watched} empty="No watched movies yet." onRemove={remove} onToggleWatched={toggleWatched} />
      </>}
    </>
  );
}
