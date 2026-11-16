export function Loading({ text = "Loading…" }) {
  return <p className="status">{text}</p>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="error">{message}</div>;
}
