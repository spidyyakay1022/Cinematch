export const MOODS = [
  "Happy", "Sad", "Romantic", "Adventurous", "Curious",
  "Suspenseful", "Thought-provoking", "Relaxed", "Emotional", "Excited",
];

export default function MoodPicker({ selected, onSelect }) {
  return (
    <div className="chips">
      {MOODS.map((m) => (
        <button
          key={m}
          type="button"
          className={`chip ${selected === m ? "on" : ""}`}
          onClick={() => onSelect(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
