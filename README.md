# 🎬 CineMatch AI

> **Stop scrolling. Start watching.**  
> An AI-powered movie discovery experience that helps you find what to watch through natural-language prompts, mood-based recommendations, movie search, comparisons, and a personal watchlist.

## 🌐 Project Links

| Resource | Link |
|---|---|
| **Live website (Vercel preview)** | https://cinematch-ai-preview.vercel.app |
| **GitHub repository** | https://github.com/spidyyakay1022/Cinematch |
| **Source code** | https://github.com/spidyyakay1022/Cinematch |
| **Deployment configuration PR** | https://github.com/spidyyakay1022/Cinematch/pull/12 |
| **Vercel project preview** | https://vercel.com/akay10/cinematch-ai-preview |

> **Deployment note:** The Vercel URL is a public frontend preview. The backend deployment and production API connection are not yet confirmed. Some features that require the backend may therefore be unavailable on the preview. Do not treat the preview as a fully integrated production release.

---

## ✨ What is CineMatch?

Choosing a movie can become a task of endless scrolling across platforms. CineMatch is designed to make that decision easier by bringing movie discovery tools into one focused experience.

Rather than acting as a general-purpose chatbot, CineMatch is built around the movie-discovery journey: users can search for films, explore recommendations based on a mood or natural-language request, compare titles, view movie information, and organise a watchlist.

## 🚀 Key Features

- **AI-powered movie discovery** — describe the kind of film you want in everyday language.
- **Mood-based recommendations** — explore movies based on the mood or viewing experience you're looking for.
- **Movie search** — find titles using movie metadata from TMDB.
- **Movie details** — view available information for a selected title.
- **Movie comparison** — compare two movies using the comparison endpoint.
- **AI movie chat** — ask for movie suggestions through a conversational interface.
- **Watchlist** — save movies to revisit later.

> Feature availability depends on the backend being deployed, configured, and connected to the frontend.

## 🧠 How It Works

1. **You describe your preference** — enter a title, genre, mood, or natural-language request.
2. **CineMatch processes the request** — the backend and recommendation engine interpret the request.
3. **Movie data is retrieved** — TMDB supplies movie records and metadata.
4. **Recommendations are presented** — the application returns matching movies and, where available, explanations to help with discovery.

### AI + Movie Data

CineMatch uses **Google Gemini** to interpret user requests and support recommendation explanations. **The Movie Database (TMDB)** provides movie metadata and records. TMDB is treated as the source of truth for movie information; Gemini is not used as a replacement movie database.

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | User interface and client-side experience |
| Backend | Python + FastAPI | API endpoints and application logic |
| AI | Google Gemini | Natural-language understanding and recommendation support |
| Movie data | TMDB API | Movie records and metadata |
| Database | SQLite | Watchlist/application data |
| Frontend hosting | Vercel | Public frontend preview |

## 🗂️ Repository Structure

```text
Cinematch/
├── ai_engine/       # Recommendation engine and AI integration
├── backend/         # FastAPI application, services, schemas and database
├── frontend/        # React + Vite application
├── .github/         # GitHub workflows
├── render.yaml      # Render Blueprint configuration
└── README.md
```

## ⚙️ Run CineMatch Locally

### Prerequisites

- Python 3.10+ (use a version compatible with the dependencies)
- Node.js and npm
- A TMDB API Read Access Token
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/spidyyakay1022/Cinematch.git
cd Cinematch
```

### 2. Configure backend environment variables

Create a local environment file using the example:

```bash
cp .env.example .env
```

Add your own credentials to the local `.env` file:

```env
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_ORIGIN=http://localhost:5173
DB_PATH=cinematch.db
```

**Never commit real API keys or secrets.** Keep them in local environment files or your hosting provider's secret environment-variable settings.

### 3. Install backend dependencies

From the repository root:

```bash
python -m pip install -r backend/requirements.txt -r ai_engine/requirements.txt
```

### 4. Start the backend

From the repository root:

```bash
uvicorn backend.main:app --reload --port 8000
```

Backend API: http://127.0.0.1:8000  
Interactive API docs: http://127.0.0.1:8000/docs  
Health endpoint: http://127.0.0.1:8000/api/health

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at http://localhost:5173.

For local development, the Vite configuration can proxy API requests to the local FastAPI backend. For a hosted frontend, configure the production API base URL instead; a Vite development proxy does not run on Vercel.

## 🔌 Main API Routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Root/API welcome endpoint |
| GET | `/api/health` | Check API configuration/health response |
| GET | `/api/movies/search?q=...` | Search movies |
| GET | `/api/movies/{movie_id}` | Get movie details |
| GET | `/api/movies/compare?a=...&b=...` | Compare two movies |
| POST | `/api/recommend/mood` | Request mood-based recommendations |
| POST | `/api/chat` | Natural-language movie discovery |
| GET | `/api/watchlist` | Retrieve watchlist |
| POST | `/api/watchlist` | Add a movie to watchlist |
| DELETE | `/api/watchlist/{movie_id}` | Remove a movie from watchlist |

## ☁️ Deployment

### Frontend — Vercel

The current public preview is:

**https://cinematch-ai-preview.vercel.app**

For a production frontend deployment:
1. Connect the GitHub repository to Vercel or configure the deployment workflow.
2. Set the frontend project/root directory to `frontend`.
3. Configure `VITE_API_URL` with the deployed backend's base URL.
4. Redeploy after changing environment variables.

### Backend — Render

A Render Blueprint configuration is included in `render.yaml`. Before deploying:
1. Grant Render access to the GitHub repository.
2. Create the service from the Blueprint.
3. Add `TMDB_READ_ACCESS_TOKEN`, `GEMINI_API_KEY`, and the correct `FRONTEND_ORIGIN` as environment variables.
4. Deploy and verify `/api/health` and the movie search endpoint.
5. Set the Vercel `VITE_API_URL` to the deployed backend URL and redeploy the frontend.

**Backend status:** No public CineMatch backend URL is currently documented here. Add it only after a successful deployment and API test.

**Database note:** SQLite is suitable for local development and demos. Check the hosting provider's filesystem persistence before relying on it for production watchlist storage; an ephemeral filesystem can lose database changes.

## 🧪 Tests

Run the offline recommendation-engine and API-helper tests from the repository root:

```bash
python -m unittest ai_engine.test_recommender backend.test_api_helpers
```

Live integration checks require valid TMDB and Gemini credentials and a reachable backend.

## 🔐 Security

- Do not commit `.env` files, API keys, access tokens, or private credentials.
- Use `.env.example` only for placeholder values.
- Store deployment secrets in Vercel/Render environment settings.
- Rotate any credential that may have been exposed in a commit or public repository history.

## 🛣️ Future Scope

Potential improvements include:
- Better preference learning and more personalised recommendations.
- Clear explanations for why a movie matches a user's request.
- Discovery of lesser-known films and hidden gems.
- Streaming availability information through a suitable provider/data integration.
- More robust user profiles and persistent watchlists.

These are future directions, not claims that the features are already implemented.

## 👥 Team

**Project:** CineMatch AI  
**Repository:** [spidyyakay1022/Cinematch](https://github.com/spidyyakay1022/Cinematch)

---

## 🎥 The CineMatch Promise

**Stop scrolling. Start watching.**  
Discover your next favourite movie with CineMatch AI.
