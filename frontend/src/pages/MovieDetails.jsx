import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, normalizeMovie } from "../api.js";
import { Loading, ErrorBox } from "../components/Status.jsx";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setMsg("");
    api.getMovie(id)
      .then((data) => setMovie(normalizeMovie(data)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    try {
      await api.addToWatchlist(movie);
      setMsg("Added to watchlist ✓");
    } catch (e) { setMsg(e.message); }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!movie) return null;

  return (
    <>
      <Link to="/discover">← Back to Discover</Link>
      <div className="details" style={{ marginTop: 16 }}>
        {movie.poster ? <img className="poster" src={movie.poster} alt={`${movie.title} poster`} /> : <div className="poster">No poster</div>}
        <div>
          <h1>{movie.title} {movie.year && <span className="meta">({movie.year})</span>}</h1>
          <p className="meta">{[movie.rating != null ? `⭐ ${Number(movie.rating).toFixed(1)}` : null, movie.runtime ? `${movie.runtime} min` : null, movie.language ? movie.language.toUpperCase() : null].filter(Boolean).join(" · ")}</p>
          {movie.genres.length > 0 && <div className="chips" style={{ marginBottom: 12 }}>{movie.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>}
          <p>{movie.overview || "No overview available."}</p>
          <p className="meta">Age rating: {movie.certification || "Not available"}</p>
          <button onClick={save}>+ Add to watchlist</button>
          {msg && <p className="mini-msg">{msg}</p>}
        </div>
      </div>
      <p className="meta" style={{ marginTop: 28 }}>Similar-movie recommendations are not provided by the current backend API.</p>
    </>
  );
}
