import React, { useEffect, useState } from 'react'

type Movie = { id: number; title: string; year?: string | null; rating?: number | null; overview?: string; poster_url?: string | null; genres?: string[] }
const API = (import.meta.env.VITE_API_URL || 'https://cinematch-api-4o73.onrender.com').replace(/\\/$/, '')
const MOODS = [
  { label: '🎭 Drama & Thought-Provoking', query: 'Recommend a deeply thought-provoking drama that lingers in the mind' },
  { label: '⚡ Suspense & Thriller', query: 'I want a gripping edge-of-your-seat thriller under 2 hours' },
  { label: '🚀 Mind-Bending Sci-Fi', query: 'Give me complex cerebral sci-fi like Interstellar or Arrival' },
  { label: '🍿 Fun Movie Night', query: 'Suggest an entertaining comedy movie for a group of friends' },
  { label: '✨ Visually Stunning', query: 'Recommend a film with breathtaking cinematography and rich atmosphere' },
  { label: '💖 Emotional & Romantic', query: 'Looking for a heartfelt, poetic romance film' },
]

function MoviePosters({ movies, title }: { movies: Movie[]; title: string }) {
  if (!movies.length) return null
  return <section style={{ width: '100%', maxWidth: 1180, margin: '28px auto 42px', padding: '0 24px' }}>
    <div style={{ marginBottom: 18 }}>
      <div style={{ color: '#F2B8C0', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 7 }}>TMDB verified movie data</div>
      <h2 style={{ color: '#fff', fontSize: 25, fontWeight: 700 }}>{title} <span style={{ color: 'rgba(255,255,255,.48)', fontSize: 14, fontWeight: 400 }}>({movies.length} matches)</span></h2>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 16 }}>
      {movies.map(movie => <article key={movie.id} style={{ minWidth: 0, overflow: 'hidden', borderRadius: 13, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.09)' }}>
        {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', background: '#21172d' }} /> : <div style={{ aspectRatio: '2 / 3', display: 'grid', placeItems: 'center', color: '#aaa' }}>Poster unavailable</div>}
        <div style={{ padding: '10px 11px 12px' }}>
          <h3 style={{ color: '#fff', fontSize: 13, fontWeight: 650, lineHeight: 1.35, marginBottom: 5 }}>{movie.title}</h3>
          <p style={{ color: 'rgba(255,255,255,.58)', fontSize: 11 }}>{movie.year || '—'}{typeof movie.rating === 'number' ? ` · ★ ${movie.rating.toFixed(1)}` : ''}</p>
          {movie.genres?.length ? <p style={{ color: '#F2B8C0', fontSize: 10, marginTop: 5 }}>{movie.genres.slice(0, 3).join(' · ')}</p> : null}
          {movie.overview ? <p style={{ color: 'rgba(255,255,255,.56)', fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>{movie.overview.slice(0, 135)}{movie.overview.length > 135 ? '…' : ''}</p> : null}
        </div>
      </article>)}
    </div>
  </section>
}

export default function ChatbotPage() {
  const [message, setMessage] = useState('')
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [postersLoading, setPostersLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [recommendationTitle, setRecommendationTitle] = useState('Your recommendations')

  useEffect(() => {
    fetch(`${API}/api/movies/featured?limit=25`)
      .then(async response => { if (!response.ok) throw new Error(`Featured movies: ${response.status}`); return response.json() })
      .then(movies => setFeaturedMovies(Array.isArray(movies) ? movies : []))
      .catch(err => console.error('Featured posters failed to load:', err))
      .finally(() => setPostersLoading(false))
  }, [])

  const ask = async (prompt: string) => {
    const text = prompt.trim()
    if (text.length < 2 || loading) return
    setLoading(true); setError(''); setReply(''); setRecommendations([])
    setRecommendationTitle(text.length > 48 ? text.slice(0, 48) + '…' : text)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 60000)
    try {
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || payload.message || `Server error (${response.status})`)
      const movies: Movie[] = Array.isArray(payload.movies) ? payload.movies : []
      setRecommendations(movies)
      setReply(payload.reply || (movies.length ? `I found ${movies.length} matching movies.` : 'No strong matches found. Try a broader genre or mood.'))
      if (!movies.length) setError('No verified matches were returned. Try a broader request, such as a genre plus language.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg === 'The operation was aborted.' ? 'The recommendation request timed out. Please try again.' : msg)
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  const submit = (event: React.FormEvent) => { event.preventDefault(); void ask(message) }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #1c0e2a 0%, #0d0a22 65%, #05040d 100%)', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', position: 'relative', color: '#fff', overflowX: 'hidden' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, letterSpacing: '.22em', textTransform: 'uppercase' }}>CineMatch <span style={{ color: '#F2B8C0', fontWeight: 300, fontSize: 13 }}>AI</span></a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none', fontSize: 14 }}>Home</a>
          <a href="/chat" style={{ color: '#F2B8C0', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>AI Assistant</a>
        </div>
      </nav>
      <header style={{ textAlign: 'center', padding: '42px 20px 10px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(112,44,67,.35)', border: '1px solid rgba(242,184,192,.3)', padding: '5px 14px', borderRadius: 999, fontSize: 12, color: '#F2B8C0', marginBottom: 16 }}>● TMDB verified catalogue · AI-powered preference matching</div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(30px,4.5vw,48px)', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: 12 }}>Find Your Mood. <span style={{ background: 'linear-gradient(135deg,#F2B8C0 0%,#fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover Your Movie.</span></h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.6 }}>Tell CineMatch what you want to watch. Get up to 10 ranked real movies with posters, ratings and details.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 22 }}>
          {MOODS.map(m => <button key={m.query} type="button" onClick={() => setMessage(m.query)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.85)', padding: '8px 14px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer' }}>{m.label}</button>)}
        </div>
      </header>
      <main style={{ width: '100%', maxWidth: 900, margin: '30px auto 0', padding: '0 22px' }}>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(242,184,192,.25)', boxShadow: '0 15px 60px rgba(0,0,0,.25)' }}>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Mind-bending sci-fi like Interstellar, under 2 hours…" maxLength={1000} disabled={loading} style={{ flex: 1, minWidth: 0, padding: '13px 14px', background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: 15 }} />
          <button type="submit" disabled={loading || message.trim().length < 2} style={{ padding: '0 24px', borderRadius: 12, border: 0, background: loading ? '#92727c' : '#F2B8C0', color: '#180F3C', fontWeight: 750, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Finding…' : 'Recommend →'}</button>
        </form>
        {loading && <p role="status" style={{ textAlign: 'center', color: '#F2B8C0', marginTop: 20 }}>Understanding your preferences and searching verified TMDB movies…</p>}
        {reply && <p style={{ color: 'rgba(255,255,255,.85)', textAlign: 'center', marginTop: 22 }}>{reply}</p>}
        {error && <p role="alert" style={{ color: '#ffb6b6', textAlign: 'center', marginTop: 16 }}>{error}</p>}
      </main>
      <MoviePosters movies={recommendations} title={recommendationTitle} />
      <section style={{ width: '100%', maxWidth: 1180, margin: '35px auto 42px', padding: '0 24px' }}>
        <div style={{ marginBottom: 18 }}><div style={{ color: '#F2B8C0', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 7 }}>Explore the collection</div><h2 style={{ color: '#fff', fontSize: 25, fontWeight: 700 }}>Popular movies</h2></div>
        {postersLoading ? <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Loading movie posters…</p> : <MoviePosters movies={featuredMovies} title="Featured collection" />}
        {!postersLoading && !featuredMovies.length && <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Posters could not load. Refresh shortly.</p>}
      </section>
    </div>
  )
}
