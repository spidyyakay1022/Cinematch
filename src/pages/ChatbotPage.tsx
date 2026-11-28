import React, { useEffect, useState } from 'react'
import MorphOrb from '../components/ui/ai-thinking-orb-and-input'

type Movie = { id: number; title: string; year?: string | null; rating?: number | null; overview?: string; poster_url?: string | null; genres?: string[] }

const API = import.meta.env.VITE_API_URL || 'https://cinematch-api-4o73.onrender.com'
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
      {movies.map((movie) => <article key={movie.id} style={{ minWidth: 0, overflow: 'hidden', borderRadius: 13, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.09)' }}>
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
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [postersLoading, setPostersLoading] = useState(true)
  const [recommendationTitle, setRecommendationTitle] = useState('Your recommendations')

  useEffect(() => {
    fetch(`${API}/api/movies/featured?limit=25`)
      .then(async (response) => { if (!response.ok) throw new Error(`Featured movies: ${response.status}`); return response.json() })
      .then((movies) => setFeaturedMovies(Array.isArray(movies) ? movies : []))
      .catch((error) => console.error('Featured posters failed to load:', error))
      .finally(() => setPostersLoading(false))
  }, [])

  const handleSubmit = async (text: string): Promise<string> => {
    setRecommendations([])
    setRecommendationTitle(text.length > 48 ? text.slice(0, 48) + '…' : text)
    try {
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || `Recommendation service returned ${response.status}`)
      const movies: Movie[] = Array.isArray(payload.movies) ? payload.movies : []
      setRecommendations(movies)
      if (!movies.length) return payload.reply || "I couldn't find enough verified matches. Try specifying a genre, language, mood, or runtime."
      return `I found ${movies.length} verified TMDB matches for your request. Their posters and details are shown below.`
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error'
      return `I couldn't reach the CineMatch recommendation server. Please try again. (${message})`
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #1c0e2a 0%, #0d0a22 65%, #05040d 100%)', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', position: 'relative', color: '#fff', overflowX: 'hidden' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', position: 'relative', zIndex: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, letterSpacing: '.22em', textTransform: 'uppercase' }}>CineMatch <span style={{ color: '#F2B8C0', fontWeight: 300, fontSize: 13 }}>AI</span></a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none', fontSize: 14 }}>Home</a>
          <a href="/chat" style={{ color: '#F2B8C0', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>AI Assistant</a>
          <a href="/auth" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', padding: '8px 20px', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>Account</a>
        </div>
      </nav>

      <header style={{ textAlign: 'center', padding: '36px 20px 10px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(112,44,67,.35)', border: '1px solid rgba(242,184,192,.3)', padding: '4px 14px', borderRadius: 999, fontSize: 12, color: '#F2B8C0', marginBottom: 14 }}>● TMDB verified catalogue · Gemini-powered preference understanding</div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: 12 }}>Find Your Mood. <span style={{ background: 'linear-gradient(135deg,#F2B8C0 0%,#fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover Your Movie.</span></h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.6 }}>Describe your mood, preferred genre, language, runtime or a movie you love. CineMatch ranks real movie records and displays their posters.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {MOODS.map((m) => <button key={m.query} onClick={() => setSelectedMood(m.query)} style={{ background: selectedMood === m.query ? 'rgba(242,184,192,.25)' : 'rgba(255,255,255,.05)', border: selectedMood === m.query ? '1px solid #F2B8C0' : '1px solid rgba(255,255,255,.1)', color: selectedMood === m.query ? '#F2B8C0' : 'rgba(255,255,255,.8)', padding: '7px 14px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>{m.label}</button>)}
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, minHeight: 460 }}>
        <MorphOrb onSubmit={handleSubmit} minThinkMs={1500} speed={1} />
      </div>
      <div style={{ textAlign: 'center', marginTop: -28 }}>
        {selectedMood && <button onClick={() => { void handleSubmit(selectedMood).then(() => {}); }} style={{ background: '#F2B8C0', color: '#180F3C', border: 0, borderRadius: 999, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Get recommendations for this mood</button>}
      </div>

      <MoviePosters movies={recommendations} title={recommendationTitle} />
      <section style={{ width: '100%', maxWidth: 1180, margin: '0 auto 42px', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div><div style={{ color: '#F2B8C0', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 7 }}>Explore the collection</div><h2 style={{ color: '#fff', fontSize: 25, fontWeight: 700 }}>Popular movies</h2></div>
          <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>TMDB catalogue</span>
        </div>
        {postersLoading ? <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Loading movie posters…</p> : <MoviePosters movies={featuredMovies} title="Featured collection" />}
        {!postersLoading && !featuredMovies.length && <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Posters could not load. The recommendation server may be waking up; refresh shortly.</p>}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, maxWidth: 1080, width: '100%', margin: '0 auto 36px', padding: '0 24px' }}>
        {[['🧠 Mood-based ranking','Matches your genre, mood, theme, language and rating preferences.'],['🎬 Verified movie records','Titles, release years, ratings, summaries and posters come from TMDB.'],['✨ Explainable matches','Recommendations are ranked from available metadata, not invented movie titles.']].map(([heading,body]) => <div key={heading} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '16px 20px' }}><div style={{ color: '#F2B8C0', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{heading}</div><p style={{ color: 'rgba(255,255,255,.55)', fontSize: 12.5, lineHeight: 1.5 }}>{body}</p></div>)}
      </section>
    </div>
  )
}
