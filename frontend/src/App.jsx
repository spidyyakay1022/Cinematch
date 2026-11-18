import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import FloatingChatbot from "./components/FloatingChatbot.jsx";
import NebulaBackground from "./components/NebulaBackground.jsx";
import Home from "./pages/Home.jsx";
import Chat from "./pages/Chat.jsx";
import Discover from "./pages/Discover.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import Compare from "./pages/Compare.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import GroupMatch from "./pages/GroupMatch.jsx";

export default function App() {
  return (
    <>
      <NebulaBackground />
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/group" element={<GroupMatch />} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
      <FloatingChatbot />
      <footer className="footer">
        CineMatch AI · Movie data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </>
  );
}
