import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import "./MorphOrbInput.css";

const starterPrompts = [
  "Recommend a mind-bending movie",
  "Something funny for tonight",
  "A thriller under 2 hours",
];

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey movie lover! 🍿 Tell me your mood and I'll help you find something great to watch." },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text) {
    const message = text.trim();
    if (!message || loading) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const result = await api.chat(message);
      const movieTitles = (result.movies || result.recommendations || [])
        .map((movie) => movie.title || movie.name)
        .filter(Boolean);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.reply || "Here are a few ideas for your next movie night.",
          movies: movieTitles,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error.message || "I couldn't connect just now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="floating-chat">
      {open && (
        <section className="floating-chat-panel" aria-label="CineMatch chat assistant">
          <div className="floating-chat-header">
            <div className="floating-chat-avatar">✦</div>
            <div className="floating-chat-heading">
              <strong>CineMatch AI</strong>
              <span><i /> Your movie companion</span>
            </div>
            <button className="floating-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>

          <div className="floating-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`floating-chat-message ${message.role}`}>
                {message.text}
                {message.movies?.length > 0 && (
                  <div className="floating-chat-movie-list">
                    {message.movies.map((title) => <span key={title}>🎬 {title}</span>)}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="floating-chat-message assistant">Finding your next favourite…</div>}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="floating-chat-prompts">
              {starterPrompts.map((prompt) => (
                <button key={prompt} onClick={() => send(prompt)} disabled={loading}>{prompt}</button>
              ))}
            </div>
          )}

          <form className="floating-chat-form morph-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
            <input
              aria-label="Message CineMatch AI"
              placeholder="Ask anything about movies..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" className={`morph-orb-send ${loading ? "is-thinking" : ""}`} aria-label={loading ? "CineMatch is thinking" : "Send message"} disabled={loading || !input.trim()}><span className="morph-orb-core" /></button>
          </form>
          <p className="morph-composer-status" aria-live="polite">{loading ? "Thinking · Searching · Finding your next watch" : "AI movie companion · Press enter to send"}</p>
          <p className="floating-chat-note">Powered by your CineMatch movie assistant</p>
        </section>
      )}

      <button
        className={`floating-chat-launcher ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close CineMatch chat" : "Open CineMatch chat"}
        aria-expanded={open}
      >
        {open ? "×" : <><span className="launcher-spark">✦</span><span className="launcher-label">Chat with AI</span></>}
      </button>
    </div>
  );
}
