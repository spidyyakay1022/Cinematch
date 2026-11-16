import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import MoodPicker from "../components/MoodPicker.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Science Fiction", "Thriller"];

export default function Discover() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [mood, setMood] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      let found;
      if (mood) {
        found = toList(await api.recommend(mood)).map((item) => normalizeMovie(item));
      } else {
        if (!query.trim()) {
          setMovies([]);
          setLoading(false);
          return;
        }
        found = toList(await api.searchMovies(query.trim())).map(normalizeMovie);
      }
      const filtered = found.filter((movie) => {
        const genreMatch = !genre || movie.genres.some((g) => g.toLowerCase() === genre.toLowerCase());
        const yearMatch = !year || String(movie.year || "") === year;
        const ratingMatch = !minRating || Number(movie.rating || 0) >= Number(minRating);
        return genreMatch && yearMatch && ratingMatch;
      });
      setMovies(filtered);
    } catch (e) {
      setError(e.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runSearch(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  return (
    <>
      <h1>Discover</h1>
      <form className="card-box" onSubmit={runSearch}>
        <div className="row">
          <label style={{ flex: 1, minWidth: 200 }}>Movie title
            <input value={query} onChange={(e) => { setQuery(e.target.value); setMood(""); }} placeholder="Search a movie title" />
          </label>
          <label>Genre
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">Any genre</option>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>Release year
            <input type="number" min="1900" max="2100" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 110 }} />
          </label>
          <label>Minimum rating
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any</option>
              {[5, 6, 7, 8].map((r) => <option key={r} value={r}>{r}+</option>)}
            </select>
          </label>
          <button type="submit">Apply filters</button>
        </div>
        <p className="meta" style={{ marginTop: 14 }}>Or get recommendations by mood</p>
        <MoodPicker selected={mood} onSelect={(value) => { setMood(mood === value ? "" : value); }} />
      </form>
      <ErrorBox message={error} />
      {loading ? <Loading text="Searching…" /> : <MovieGrid movies={movies} empty="Enter a movie title or choose a mood to see results." />}
    </>
  );
}
