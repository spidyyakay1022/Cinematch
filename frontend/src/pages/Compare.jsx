import { useState } from "react";
import { api, toList, normalizeMovie } from "../api.js";
import { Loading, ErrorBox } from "../components/Status.jsx";

const ROWS = [
  ["Title", (m) => m.title],
  ["Release year", (m) => m.year || "—"],
  ["Genres", (m) => (m.genres.length ? m.genres.join(", ") : "—")],
  ["Rating", (m) => (m.rating ? Number(m.rating).toFixed(1) : "—")],
  ["Runtime", (m) => (m.runtime ? `${m.runtime} min` : "—")],
  ["Original language", (m) => (m.language ? m.language.toUpperCase() : "—")],
  ["Popularity", (m) => (m.popularity ? Math.round(m.popularity) : "—")],
  ["Overview", (m) => m.overview || "—"],
];

export default function Compare() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]);
  const [compared, setCompared] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");
    try {
      const data = await api.searchMovies({ query: query.trim() });
      setResults(toList(data).slice(0, 6).map(normalizeMovie));
    } catch (err) {
      setError(err.message);
    }
  }

  function pick(movie) {
    if (picked.find((p) => p.id === movie.id) || picked.length >= 2) return;
    setPicked([...picked, movie]);
  }

  async function runCompare() {
    setLoading(true);
    setError("");
    try {
      const data = await api.compare(picked.map((p) => p.id));
      setCompared(toList(data).map(normalizeMovie));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Compare movies</h1>
      <form className="search-row" onSubmit={search}>
        <input placeholder="Search a movie to add…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit">Search</button>
      </form>
      <ErrorBox message={error} />

      <div className="pick-list">
        {results.map((m) => (
          <div key={m.id} className="pick-item">
            <span>{m.title} {m.year && `(${m.year})`}</span>
            <button className="secondary" onClick={() => pick(m)} disabled={picked.length >= 2}>Select</button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 20 }}>Selected ({picked.length}/2)</h3>
      <div className="pick-list">
        {picked.map((m) => (
          <div key={m.id} className="pick-item">
            <span>{m.title}</span>
            <button className="secondary" onClick={() => setPicked(picked.filter((p) => p.id !== m.id))}>Remove</button>
          </div>
        ))}
      </div>
      <button style={{ marginTop: 12 }} disabled={picked.length !== 2 || loading} onClick={runCompare}>
        Compare
      </button>

      {loading && <Loading text="Comparing…" />}
      {compared.length === 2 && (
        <div style={{ overflowX: "auto" }}>
          <table className="compare-table">
            <thead>
              <tr><th></th>{compared.map((m) => <th key={m.id}>{m.title}</th>)}</tr>
            </thead>
            <tbody>
              {ROWS.slice(1).map(([label, get]) => (
                <tr key={label}>
                  <th>{label}</th>
                  {compared.map((m) => <td key={m.id}>{get(m)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
