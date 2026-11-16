import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Bookmark, Check, Clapperboard,
  Compass, Film, Heart, LoaderCircle, MessageCircle, Search, Send,
  Sparkles, Star, X, SlidersHorizontal, Trash2
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const MOODS = [
  { label: "Feel something", value: "emotional and moving", note: "A little catharsis", icon: "♡" },
  { label: "Get lost", value: "mind-bending science fiction mystery", note: "Twists & wonder", icon: "⌁" },
  { label: "Feel good", value: "uplifting feel-good comedy", note: "A brighter evening", icon: "✳" },
  { label: "Edge of seat", value: "suspenseful thriller", note: "No looking away", icon: "↗" },
  { label: "Escape reality", value: "fantasy adventure", note: "Somewhere else", icon: "✧" },
  { label: "Keep it light", value: "comforting easy watch", note: "Nothing too heavy", icon: "☼" },
];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

function MovieCard({ movie, reason, saved, onSave, onOpen, index = 0 }) {
  return (
    <article className="movie-card" style={{ "--card-index": index }}>
      <button className="poster-wrap" onClick={() => onOpen(movie)} aria-label={`Open ${movie.title}`}>
        {movie.poster_url
          ? <img className="poster" src={movie.poster_url} alt={movie.title} loading="lazy" />
          : <div className="poster poster-fallback"><Film size={30} /><span>Artwork unavailable</span></div>}
        <span className="poster-hover">Explore film <ArrowDownRight size={15} /></span>
      </button>
      <div className="movie-card-copy">
        <div className="movie-heading">
          <h3>{movie.title}</h3>
          {movie.rating != null && <span className="rating"><Star size={12} fill="currentColor" /> {Number(movie.rating).toFixed(1)}</span>}
        </div>
        <p className="movie-meta">{movie.year || "Year n/a"}{movie.genres?.length ? `  /  ${movie.genres.slice(0, 2).join(" · ")}` : ""}</p>
        {reason && <p className="match-reason">{reason}</p>}
        <button className={`save-link ${saved ? "saved" : ""}`} onClick={() => onSave(movie)}>
          {saved ? <Check size={13} /> : <Bookmark size={13} />} {saved ? "Saved" : "Add to watchlist"}
        </button>
      </div>
    </article>
  );
}

function MovieDialog({ movie, onClose, saved, onSave }) {
  if (!movie) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section className="movie-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="round-icon dialog-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {movie.poster_url && <img className="dialog-poster" src={movie.poster_url} alt="" />}
        <div className="dialog-body">
          <span className="kicker">THE FILM FILE</span>
          <h2>{movie.title}</h2>
          <p className="movie-meta">{movie.year || "Year unavailable"}{movie.rating != null ? `  /  ★ ${Number(movie.rating).toFixed(1)} TMDB` : ""}</p>
          <div className="genre-tags">{(movie.genres || []).map((genre) => <span key={genre}>{genre}</span>)}</div>
          <p className="dialog-overview">{movie.overview || "No synopsis is available for this title."}</p>
          <button className="button-primary" onClick={() => onSave(movie)}>
            {saved ? <Check size={16} /> : <Bookmark size={16} />}
            {saved ? "In your watchlist" : "Save to watchlist"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [reasons, setReasons] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mood, setMood] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiState, setApiState] = useState("checking");
  const [compareIds, setCompareIds] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const savedIds = useMemo(() => new Set(watchlist.map((item) => Number(item.movie_id))), [watchlist]);

  useEffect(() => {
    request("/api/health")
      .then(() => setApiState("online"))
      .catch(() => setApiState("offline"));
    request("/api/watchlist")
      .then((items) => setWatchlist(Array.isArray(items) ? items : []))
      .catch(() => {});
  }, []);

  async function searchMovies(value = query) {
    const term = value.trim();
    if (!term) return;
    setTab("discover"); setLoading(true); setError(""); setReasons({}); setQuery(term);
    try {
      const data = await request(`/api/movies/search?q=${encodeURIComponent(term)}`);
      setMovies(Array.isArray(data) ? data : []);
      if (!data.length) setError("No titles found. Try another search.");
    } catch (err) {
      setMovies([]); setError(err.message);
    } finally { setLoading(false); }
  }

  async function getMoodRecommendations(value) {
    setMood(value); setTab("discover"); setLoading(true); setError(""); setReasons({});
    try {
      const data = await request("/api/recommend/mood", {
        method: "POST", body: JSON.stringify({ mood: value, limit: 8 }),
      });
      const list = data.recommendations || [];
      setMovies(list.map((item) => item.movie));
      setReasons(Object.fromEntries(list.map((item) => [item.movie.id, item.reason])));
      if (!list.length) setError("No recommendations returned. Try another mood.");
    } catch (err) { setMovies([]); setError(err.message); }
    finally { setLoading(false); }
  }

  async function sendChat(event) {
    event?.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;
    setChatMessages((items) => [...items, { role: "user", text: message }]);
    setChatInput(""); setChatLoading(true); setError("");
    try {
      const data = await request("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
      setChatMessages((items) => [...items, {
        role: "assistant", text: data.reply || "Here are a few films to explore.", movies: data.movies || [],
      }]);
    } catch (err) {
      setChatMessages((items) => [...items, { role: "assistant", text: err.message, movies: [] }]);
    } finally { setChatLoading(false); }
  }

  async function toggleSave(movie) {
    const exists = savedIds.has(Number(movie.id));
    try {
      if (exists) {
        await request(`/api/watchlist/${movie.id}`, { method: "DELETE" });
        setWatchlist((items) => items.filter((item) => Number(item.movie_id) !== Number(movie.id)));
      } else {
        await request("/api/watchlist", {
          method: "POST",
          body: JSON.stringify({ movie_id: movie.id, title: movie.title, poster_url: movie.poster_url || null }),
        });
        setWatchlist((items) => [{ movie_id: movie.id, title: movie.title, poster_url: movie.poster_url }, ...items]);
      }
    } catch (err) { setError(err.message); }
  }

  function toggleCompare(movie) {
    setCompareIds((ids) => ids.includes(movie.id) ? ids.filter((id) => id !== movie.id) : ids.length < 2 ? [...ids, movie.id] : [ids[1], movie.id]);
  }

  async function compareMovies() {
    if (compareIds.length !== 2) return;
    setCompareLoading(true); setError("");
    try { setCompareResult(await request(`/api/movies/compare?a=${compareIds[0]}&b=${compareIds[1]}`)); }
    catch (err) { setError(err.message); }
    finally { setCompareLoading(false); }
  }

  const displayMovies = tab === "watchlist"
    ? watchlist.map((item) => ({ id: item.movie_id, title: item.title, poster_url: item.poster_url, genres: [], year: null, rating: null, overview: "" }))
    : movies;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <button className="brand" onClick={() => { setTab("discover"); setMovies([]); setError(""); }}>
          <span className="brand-mark"><Clapperboard size={19} /></span>
          <span>CINE<span className="brand-red">MATCH</span><small>THE ART OF FINDING FILMS</small></span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}><Compass size={15} /> Discover</button>
          <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}><Sparkles size={15} /> AI Studio</button>
          <button className={tab === "watchlist" ? "active" : ""} onClick={() => setTab("watchlist")}><Bookmark size={15} /> Watchlist <span className="nav-count">{watchlist.length}</span></button>
          <button className={tab === "compare" ? "active" : ""} onClick={() => setTab("compare")}><SlidersHorizontal size={15} /> Compare</button>
        </nav>
        <div className="topbar-right"><span className={`api-indicator ${apiState}`} /><span className="api-label">{apiState === "online" ? "API CONNECTED" : apiState === "offline" ? "API OFFLINE" : "CONNECTING"}</span><span className="edition">VOL. 01</span></div>
      </header>

      <main>
        {tab === "discover" && <>
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow-line"><span /> YOUR PERSONAL FILM FINDER</div>
              <h1>Some nights<br />deserve a <em>great film.</em></h1>
              <p className="hero-description">Not sure what to watch? Tell us the feeling you're chasing. We'll find the story.</p>
              <form className="search-form" onSubmit={(e) => { e.preventDefault(); searchMovies(); }}>
                <Search size={19} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a film, genre, actor or feeling..." aria-label="Search movies" />
                <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={19} />}</button>
              </form>
              <div className="quick-search"><span>TRY</span>{["Interstellar", "psychological thriller", "90s classics"].map((term) => <button key={term} onClick={() => searchMovies(term)}>{term}</button>)}</div>
            </div>
            <div className="hero-art" aria-label="Cinematic film reel artwork">
              <div className="art-ring ring-a" /><div className="art-ring ring-b" />
              <div className="art-stamp">A GOOD<br />STORY<br /><b>AWAITS.</b></div>
              <div className="art-index">CM / 001<br />EST. FOR THE CURIOUS</div>
              <div className="art-film"><Film size={88} strokeWidth={0.8} /></div>
            </div>
            <div className="hero-foot"><span>01 — DISCOVER</span><span>CURATED BY CURIOSITY <ArrowDownRight size={14} /></span></div>
          </section>

          <section className="mood-section">
            <div className="section-heading"><div><span className="kicker">START WITH A FEELING</span><h2>What's the <em>mood?</em></h2></div><span className="section-note">SIX WAYS INTO A STORY</span></div>
            <div className="mood-grid">
              {MOODS.map((item, index) => <button className={`mood-card mood-${index}`} key={item.label} onClick={() => getMoodRecommendations(item.value)}>
                <span className="mood-symbol">{item.icon}</span><span className="mood-label">{item.label}</span><span className="mood-note">{item.note}</span><ArrowUpRightIcon />
              </button>)}
            </div>
          </section>

          <section className="results-section" id="results">
            <div className="section-heading"><div><span className="kicker">{mood ? "YOUR MOOD, MATCHED" : query ? "SEARCH RESULTS" : "THE DISCOVERY ROOM"}</span><h2>{mood ? "Picked for this feeling." : query ? `Results for “${query}”` : "Find a film worth remembering."}</h2></div>{movies.length > 0 && <span className="result-count">{movies.length} TITLES</span>}</div>
            {loading && <div className="loading-state"><LoaderCircle className="spin" /> Finding your next film...</div>}
            {!loading && error && <div className="notice"><span>{error}</span><button onClick={() => setError("")}><X size={15} /></button></div>}
            {!loading && movies.length > 0 && <div className="movie-grid">{movies.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} reason={reasons[movie.id]} saved={savedIds.has(Number(movie.id))} onSave={toggleSave} onOpen={setSelected} />)}</div>}
            {!loading && movies.length === 0 && !error && <div className="empty-discovery"><Sparkles size={22} /><p>Your next favourite is out there.</p><span>Search for a title above or choose a mood to begin.</span></div>}
          </section>
        </>}

        {tab === "chat" && <section className="workspace-page">
          <div className="page-intro"><span className="kicker">CINEMATCH / AI STUDIO</span><h1>Talk films.<br /><em>Find your story.</em></h1><p>A natural-language movie guide, powered by your preferences and verified film data.</p></div>
          <div className="chat-panel">
            <div className="chat-top"><span className="assistant-orb"><Sparkles size={17} /></span><div><b>CineMatch Assistant</b><small>YOUR PERSONAL FILM CURATOR</small></div><span className="live-pill">READY</span></div>
            <div className="chat-thread">
              {chatMessages.length === 0 && <div className="chat-welcome"><span className="welcome-mark">✳</span><h2>What's on your mind?</h2><p>Give me a genre, a feeling, a film you loved — or something completely random.</p><div className="prompt-chips">{["Something like Inception","A warm film for a rainy day","Underrated sci-fi films"].map((p) => <button key={p} onClick={() => setChatInput(p)}>{p} <ArrowUpRightIcon /></button>)}</div></div>}
              {chatMessages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}><span className="message-avatar">{message.role === "user" ? "YOU" : "CM"}</span><div className="message-content"><p>{message.text}</p>{message.movies?.length > 0 && <div className="chat-movies">{message.movies.map((movie, i) => <MovieCard key={movie.id} movie={movie} index={i} saved={savedIds.has(Number(movie.id))} onSave={toggleSave} onOpen={setSelected} />)}</div>}</div></div>)}
              {chatLoading && <div className="chat-typing"><LoaderCircle className="spin" size={16} /> Thinking through the film shelves...</div>}
            </div>
            <form className="chat-compose" onSubmit={sendChat}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Describe the film you're looking for..." /><button disabled={chatLoading || !chatInput.trim()}><Send size={17} /></button></form>
            <p className="chat-footnote">CINEMATCH USES TMDB MOVIE DATA · AI SUGGESTIONS MAY VARY</p>
          </div>
        </section>}

        {tab === "watchlist" && <section className="workspace-page">
          <div className="page-intro"><span className="kicker">YOUR PRIVATE COLLECTION</span><h1>Saved for<br /><em>another night.</em></h1><p>A personal shelf of stories you don't want to forget.</p></div>
          {displayMovies.length ? <div className="movie-grid watchlist-grid">{displayMovies.map((movie, i) => <MovieCard key={movie.id} movie={movie} index={i} saved onSave={toggleSave} onOpen={setSelected} />)}</div> : <div className="empty-discovery"><Bookmark size={22} /><p>Your watchlist is a blank page.</p><span>Save films while you explore and they'll appear here.</span><button className="text-button" onClick={() => setTab("discover")}>Discover films <ArrowRight size={15} /></button></div>}
        </section>}

        {tab === "compare" && <section className="workspace-page">
          <div className="page-intro"><span className="kicker">THE DOUBLE FEATURE</span><h1>Two films.<br /><em>One decision.</em></h1><p>Search for two movies, then let CineMatch lay out the details side by side.</p></div>
          <form className="compare-search" onSubmit={(e) => { e.preventDefault(); searchMovies(query, true); }}><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search films to compare..." /><button className="button-primary">Find films</button></form>
          {movies.length > 0 && <div className="compare-pick"><p>SELECT TWO TITLES ({compareIds.length}/2)</p><div className="movie-grid">{movies.map((movie, i) => <button className={`compare-choice ${compareIds.includes(movie.id) ? "chosen" : ""}`} key={movie.id} onClick={() => toggleCompare(movie)}><img src={movie.poster_url || ""} alt="" /><span>{compareIds.includes(movie.id) ? <Check size={15} /> : "+"} {movie.title}</span></button>)}</div><button className="button-primary" disabled={compareIds.length !== 2 || compareLoading} onClick={compareMovies}>{compareLoading ? "Comparing..." : "Compare selected films"} <ArrowRight size={16} /></button></div>}
          {compareResult && <div className="comparison-result"><div className="comparison-posters">{compareResult.movies.map((movie) => <div key={movie.id}><img src={movie.poster_url || ""} alt="" /><b>{movie.title}</b><span>★ {movie.rating ?? "N/A"} · {movie.year ?? "Year n/a"}</span></div>)}</div><span className="kicker">CINEMATCH COMPARISON</span><p>{compareResult.summary}</p></div>}
        </section>}
      </main>

      <footer className="site-footer"><div className="footer-brand">CINE<span>MATCH</span><small>THE ART OF FINDING FILMS</small></div><p>For the love of a good story.</p><span>BUILT FOR THE CURIOUS · 2026</span></footer>
      <MovieDialog movie={selected} onClose={() => setSelected(null)} saved={selected ? savedIds.has(Number(selected.id)) : false} onSave={toggleSave} />
    </div>
  );
}

function ArrowUpRightIcon() { return <ArrowDownRight className="diagonal-arrow" size={16} />; }
