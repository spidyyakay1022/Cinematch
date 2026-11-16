import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import MoodPicker from "../components/MoodPicker.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Science Fiction", "Thriller"];
const LANGUAGES = [["", "Any"], ["en", "English"], ["hi", "Hindi"], ["ja", "Japanese"], ["ko", "Korean"], ["fr", "French"], ["es", "Spanish"]];
const RUNTIMES = [["", "Any"], ["0-89", "Under 90 min"], ["90-120", "90–120 min"], ["121-999", "Over 120 min"]];

export default function Discover() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    genre: "",
    language: "",
    runtime: "",
    year: "",
    min_rating: "",
    mood: "",
    sort_by: "popularity",
  });
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  async function runSearch() {
    setLoading(true);
    setError("");
    const [minR, maxR] = filters.runtime ? filters.runtime.split("-") : ["", ""];
    try {
      const data = await api.searchMovies({
        query: filters.q,
        genre: filters.genre,
        language: filters.language,
        min_runtime: minR === "0" ? "" : minR,
        max_runtime: maxR === "999" ? "" : maxR,
        year: filters.year,
        min_rating: filters.min_rating,
        mood: filters.mood,
        sort_by: filters.sort_by,
      });
      setMovies(toList(data).map(normalizeMovie));
    } catch (e) {
      setError(e.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1>Discover</h1>
      <form
        className="card-box"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="row">
          <label style={{ flex: 1, minWidth: 200 }}>Search
            <input value={filters.q} onChange={set("q")} placeholder="Title or keywords" />
          </label>
          <label>Genre
            <select value={filters.genre} onChange={set("genre")}>
              <option value="">Any</option>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>Language
            <select value={filters.language} onChange={set("language")}>
              {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Runtime
            <select value={filters.runtime} onChange={set("runtime")}>
              {RUNTIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Release year
            <input type="number" min="1900" max="2100" value={filters.year} onChange={set("year")} style={{ width: 100 }} />
          </label>
          <label>Min rating
            <select value={filters.min_rating} onChange={set("min_rating")}>
              <option value="">Any</option>
              {[5, 6, 7, 8].map((r) => <option key={r} value={r}>{r}+</option>)}
            </select>
          </label>
          <label>Sort by
            <select value={filters.sort_by} onChange={set("sort_by")}>
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="year">Newest</option>
            </select>
          </label>
          <button type="submit">Apply</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <MoodPicker
            selected={filters.mood}
            onSelect={(m) => setFilters((f) => ({ ...f, mood: f.mood === m ? "" : m }))}
          />
        </div>
      </form>

      <ErrorBox message={error} />
      {loading ? <Loading text="Searching…" /> : <MovieGrid movies={movies} empty="No movies match these filters." />}
    </>
  );
}
