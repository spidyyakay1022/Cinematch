import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MovieCard({ movie, onRemove, onToggleWatched }) {
  const [msg, setMsg] = useState("");

  async function save() {
    try {
      await api.addToWatchlist(movie.id);
      setMsg("Added to watchlist ✓");
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <article className="movie-card">
      {movie.poster ? (
        <img className="poster" src={movie.poster} alt={`${movie.title} poster`} loading="lazy" />
      ) : (
        <div className="poster">No poster</div>
      )}
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <div className="meta">
          {[movie.year, movie.rating ? `⭐ ${Number(movie.rating).toFixed(1)}` : null, movie.runtime ? `${movie.runtime} min` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {movie.genres?.length > 0 && <div className="meta">{movie.genres.join(", ")}</div>}
        {movie.reason && <div className="reason">{movie.reason}</div>}
        {typeof movie.score === "number" && (
          <div className="meta">Match score: {Math.round(movie.score <= 1 ? movie.score * 100 : movie.score)}%</div>
        )}
        <div className="card-actions">
          <Link className="btn secondary" to={`/movie/${movie.id}`}>Details</Link>
          {!onRemove && <button onClick={save}>+ Watchlist</button>}
          {onToggleWatched && (
            <button className="secondary" onClick={() => onToggleWatched(movie)}>
              {movie.watched ? "Mark unwatched" : "Mark watched"}
            </button>
          )}
          {onRemove && <button onClick={() => onRemove(movie)}>Remove</button>}
        </div>
        {msg && <div className="mini-msg">{msg}</div>}
      </div>
    </article>
  );
}
