import { NavLink, Link } from "react-router-dom";

const links = [
  ["/", "Home"],
  ["/chat", "AI Chat"],
  ["/discover", "Discover"],
  ["/compare", "Compare"],
  ["/watchlist", "Watchlist"],
  ["/group", "GroupMatch"],
];

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo" aria-label="CineMatch AI home">
        <span className="logo-mark" aria-hidden="true">▶</span>
        Cine<span>Match</span> AI
      </Link>
      <nav aria-label="Main navigation">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
        ))}
      </nav>
    </header>
  );
}
