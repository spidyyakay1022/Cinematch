import { useState } from "react";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";
import { MOODS } from "../components/MoodPicker.jsx";
import { Loading, ErrorBox } from "../components/Status.jsx";

export default function GroupMatch() {
  const [groupDraft, setGroupDraft] = useState("");
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ member_name: "", preferred_mood: "Happy" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function create(e) {
    e.preventDefault();
    if (groupDraft.trim()) setGroupName(groupDraft.trim());
  }

  function addMember(e) {
    e.preventDefault();
    if (!form.member_name.trim()) {
      setError("Enter the member's name.");
      return;
    }
    setError("");
    setMembers((prev) => [...prev, { ...form, member_name: form.member_name.trim() }]);
    setForm({ member_name: "", preferred_mood: "Happy" });
    setResults([]);
  }

  async function getRecommendations() {
    setLoading(true);
    setError("");
    try {
      const moodCounts = members.reduce((counts, member) => {
        counts[member.preferred_mood] = (counts[member.preferred_mood] || 0) + 1;
        return counts;
      }, {});
      const commonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
      const data = await api.recommend(commonMood);
      setResults(toList(data).map(normalizeMovie));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <>
      <h1>GroupMatch</h1>
      <p className="meta">Frontend-only group session: member preferences stay in this browser. Recommendations use the backend's supported mood endpoint.</p>
      <ErrorBox message={error} />
      {!groupName ? (
        <form className="card-box row" onSubmit={create}>
          <label style={{ flex: 1 }}>Group name
            <input value={groupDraft} onChange={(e) => setGroupDraft(e.target.value)} placeholder="e.g. Friday movie night" />
          </label>
          <button type="submit">Start group</button>
        </form>
      ) : (
        <>
          <h3>{groupName}</h3>
          <form className="card-box" onSubmit={addMember}>
            <h3>Add a member</h3>
            <div className="row">
              <label>Name
                <input value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
              </label>
              <label>Mood
                <select value={form.preferred_mood} onChange={(e) => setForm({ ...form, preferred_mood: e.target.value })}>
                  {MOODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <button type="submit">Add member</button>
            </div>
          </form>
          {members.length > 0 && <div className="pick-list">{members.map((m, i) => <div className="pick-item" key={i}><span>{m.member_name} — {m.preferred_mood}</span></div>)}</div>}
          <button style={{ marginTop: 16 }} disabled={members.length < 2 || loading} onClick={getRecommendations}>Find a movie for the group</button>
          {members.length < 2 && <p className="meta">Add at least two members first.</p>}
          {loading ? <Loading text="Finding recommendations…" /> : <MovieGrid movies={results} empty="Group recommendations will appear here." />}
        </>
      )}
    </>
  );
}
