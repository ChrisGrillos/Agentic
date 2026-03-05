const LAYERS = [
  { id: "characters", label: "Characters", emoji: "🧑" },
  { id: "houses",     label: "Houses",     emoji: "🏠" },
  { id: "guilds",     label: "Guilds",     emoji: "⛺" },
  { id: "monsters",   label: "Monsters",   emoji: "👹" },
  { id: "pois",       label: "POIs",       emoji: "📍" },
  { id: "territory",  label: "Territory",  emoji: "🚩" },
];

export default function MapLayerToggles({ layers, onChange }) {
  const toggle = (id) => onChange(prev => ({ ...prev, [id]: !prev[id] }));
  return (
    <div className="flex flex-wrap gap-1">
      {LAYERS.map(l => (
        <button key={l.id} onClick={() => toggle(l.id)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all
            ${layers[l.id] ? "bg-amber-900/30 border-amber-700 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-600"}`}>
          {l.emoji} {l.label}
        </button>
      ))}
    </div>
  );
}