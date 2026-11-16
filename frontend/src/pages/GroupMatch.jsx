import { useState } from "react";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import { MOODS } from "../components/MoodPicker.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Science Fiction", "Thriller"];
const LANGUAGES = [["en", "English"], ["hi", "Hindi"], ["ja", "Japanese"], ["ko", "Korean"], ["fr", "French"], ["es", "Spanish"]];

export default function GroupMatch() {
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ member_name: "", preferred_genres: [], preferred_language: "en", preferred_mood: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create(e) {
    e.preventDefault();
    if (!groupName.trim()) return;
    setError("");
    try {
      const data = await api.createGroup(groupName.trim());
      setGroupId(data.group_id ?? data.id);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleGenre(g) {
    setForm((f) => ({
      ...f,
      preferred_genres: f.preferred_genres.includes(g)
        ? f.preferred_genres.filter((x) => x !== g)
        : [...f.preferred_genres, g],
    }));
  }

  async function addMember(e) {
    e.preventDefault();
    if (!form.member_name.trim() || form.preferred_genres.length === 0) {
      setError("Enter a name and pick at least one genre.");
      return;
    }
    setError("");
    try {
      await api.submitGroupPrefs(groupId, form);
      setMembers((prev) => [...prev, form]);
      setForm({ member_name: "", preferred_genres: [], preferred_language: "en", preferred_mood: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function getRecommendations() {
    setLoading(true);
    setError("");
    try {
      const data = await api.groupRecommendations(groupId);
      setResults(toList(data).map(normalizeMovie));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>GroupMatch</h1>
      <ErrorBox message={error} />

      {!groupId ? (
        <form className="card-box row" onSubmit={create}>
          <label style={{ flex: 1 }}>Group name
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Friday movie night" />
          </label>
          <button type="submit">Create session</button>
        </form>
      ) : (
        <>
          <p className="meta">Session: <strong>{groupName}</strong> · {members.length} member(s) added</p>
          <form className="card-box" onSubmit={addMember}>
            <h3>Add a member</h3>
            <div className="row">
              <label>Name
                <input value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
              </label>
              <label>Language
                <select value={form.preferred_language} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}>
                  {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>Mood
                <select value={form.preferred_mood} onChange={(e) => setForm({ ...form, preferred_mood: e.target.value })}>
                  <option value="">Any</option>
                  {MOODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <p className="meta" style={{ marginBottom: 6 }}>Favourite genres</p>
            <div className="chips">
              {GENRES.map((g) => (
                <button type="button" key={g} className={`chip ${form.preferred_genres.includes(g) ? "on" : ""}`} onClick={() => toggleGenre(g)}>
                  {g}
                </button>
              ))}
            </div>
            <button type="submit" style={{ marginTop: 14 }}>Add member</button>
          </form>

          {members.length > 0 && (
            <div className="pick-list">
              {members.map((m, i) => (
                <div key={i} className="pick-item">
                  <span><strong>{m.member_name}</strong> — {m.preferred_genres.join(", ")}</span>
                </div>
              ))}
            </div>
          )}

          <button style={{ marginTop: 16 }} disabled={members.length < 2 || loading} onClick={getRecommendations}>
            Get group recommendations
          </button>
          {members.length < 2 && <p className="meta">Add at least 2 members to compare preferences.</p>}

          {loading ? <Loading text="Finding movies everyone can enjoy…" /> : results.length > 0 && <MovieGrid movies={results} />}
        </>
      )}
    </>
  );
}
