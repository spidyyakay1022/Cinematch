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
    api
      .searchMovies({ sort_by: "popularity" })
      .then((d) => setFeatured(toList(d).slice(0, 8).map(normalizeMovie)))
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
        <h1>Find your mood. Discover your movie.</h1>
        <p>Tell CineMatch what you feel like watching and get recommendations with reasons.</p>
        <form className="search-row" onSubmit={search}>
          <input
            placeholder="Search a movie, or try “something like Interstellar”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="card-box">
        <h2>How are you feeling?</h2>
        <MoodPicker onSelect={(mood) => navigate("/chat", { state: { mood } })} />
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Featured movies</h2>
        <ErrorBox message={error} />
        {loading ? <Loading /> : <MovieGrid movies={featured} empty="Featured movies will appear here." />}
      </section>
    </>
  );
}
