import MovieCard from "./MovieCard.jsx";

export default function MovieGrid({ movies, empty = "No movies found.", ...cardProps }) {
  if (!movies || movies.length === 0) return <p className="status">{empty}</p>;
  return (
    <div className="grid">
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} {...cardProps} />
      ))}
    </div>
  );
}
