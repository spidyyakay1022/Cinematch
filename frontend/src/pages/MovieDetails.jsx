import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setMsg("");
    api
      .getMovie(id)
      .then((d) => setMovie(normalizeMovie(d)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api
      .getSimilar(id)
      .then((d) => setSimilar(toList(d).slice(0, 8).map(normalizeMovie)))
      .catch(() => setSimilar([]));
  }, [id]);

  async function save() {
    try {
      await api.addToWatchlist(movie.id);
      setMsg("Added to watchlist ✓");
    } catch (e) {
      setMsg(e.message);
    }
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
          <p className="meta">
            {[movie.rating ? `⭐ ${Number(movie.rating).toFixed(1)}` : null, movie.runtime ? `${movie.runtime} min` : null, movie.language ? movie.language.toUpperCase() : null]
              .filter(Boolean).join(" · ")}
          </p>
          {movie.genres.length > 0 && (
            <div className="chips" style={{ marginBottom: 12 }}>
              {movie.genres.map((g) => <span key={g} className="chip">{g}</span>)}
            </div>
          )}
          <p>{movie.overview || "No overview available."}</p>
          <p className="meta">Age rating: {movie.certification || "Not available"}</p>
          <button onClick={save}>+ Add to watchlist</button>
          {msg && <p className="mini-msg">{msg}</p>}
        </div>
      </div>

      <h2 style={{ marginTop: 32 }}>Similar movies</h2>
      <MovieGrid movies={similar} empty="No similar movies found." />
    </>
  );
}
