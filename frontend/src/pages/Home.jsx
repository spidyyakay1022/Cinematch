import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, toList, normalizeMovie } from "../api.js";
import MoodPicker from "../components/MoodPicker.jsx";
import MovieGrid from "../components/MovieGrid.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.searchMovies("Inception")
      .then((data) => setFeatured(toList(data).slice(0, 8).map(normalizeMovie)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function search(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Your personal movie universe</span>
        <h1>Every mood has a movie. <span>Find yours.</span></h1>
        <p>Meet your AI-powered movie companion. Describe the vibe, explore hidden gems, and discover what to watch next.</p>
        <form className="search-row" onSubmit={search}>
          <input aria-label="Search movie title" placeholder="Search a movie, genre, or title…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit">Explore movies ↗</button>
        </form>
        <div className="chips" style={{ marginTop: 18 }}>
          <button type="button" className="chip" onClick={() => navigate("/chat")}>✦ Ask CineMatch AI</button>
          <button type="button" className="chip" onClick={() => navigate("/discover")}>Browse discovery</button>
        </div>
      </section>

      <section className="card-box">
        <span className="eyebrow">Mood scanner</span>
        <h2 style={{ margin: "10px 0 6px" }}>What are you in the mood for?</h2>
        <p className="meta" style={{ marginTop: 0, marginBottom: 16 }}>Choose a feeling and let CineMatch find your next favourite.</p>
        <MoodPicker onSelect={(mood) => navigate("/chat", { state: { mood } })} />
      </section>

      <section style={{ marginTop: 38 }}>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Curated for discovery</span>
            <h2 style={{ margin: "9px 0 0" }}>Featured movie search</h2>
          </div>
          <button className="secondary" onClick={() => navigate("/discover")}>Explore all movies ↗</button>
        </div>
        <ErrorBox message={error} />
        {loading ? <Loading text="Loading featured titles…" /> : <MovieGrid movies={featured} empty="Search for a movie above to get started." />}
      </section>
    </>
  );
}
