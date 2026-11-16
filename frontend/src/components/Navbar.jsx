import { NavLink, Link } from "react-router-dom";

const links = [
  ["/", "Home"],
  ["/chat", "AI Chat"],
  ["/discover", "Discover"],
  ["/compare", "Compare"],
  ["/watchlist", "My Watchlist"],
  ["/group", "GroupMatch"],
];

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">🎬 Cine<span>Match</span> AI</Link>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
        ))}
      </nav>
    </header>
  );
}
