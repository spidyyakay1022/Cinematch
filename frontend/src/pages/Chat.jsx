import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, toList, normalizeMovie } from "../api.js";
import MovieGrid from "../components/MovieGrid.jsx";

const PROMPTS = [
  "Suggest a movie that will keep me thinking",
  "I want something like Interstellar",
  "Recommend a thriller under two hours",
  "Suggest a movie for a group of friends",
];

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm CineMatch. Tell me what kind of movie you want to watch." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const mood = location.state?.mood;
    if (mood && !startedRef.current) {
      startedRef.current = true;
      send(`I'm in a ${mood.toLowerCase()} mood. Suggest a movie.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text) {
    const message = text.trim();
    if (!message || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.chat(message);
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: data.reply || "Here is what I found.",
        movies: toList(data.movies).map(normalizeMovie),
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Sorry, ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>AI Chat</h1>
      <div className="chips" style={{ marginBottom: 12 }}>
        {PROMPTS.map((p) => <button key={p} className="chip" onClick={() => send(p)} disabled={loading}>{p}</button>)}
      </div>
      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            <div className={`bubble ${m.role}`}>{m.text}</div>
            {m.movies?.length > 0 && <div className="chat-movies"><MovieGrid movies={m.movies} /></div>}
          </div>
        ))}
        {loading && <div className="bubble assistant">Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input placeholder="Describe what you want to watch…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </>
  );
}
