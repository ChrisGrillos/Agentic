import { useState } from "react";
import { CONDITION_PRESETS } from "./propertyEngine";

const CONTAINERS = [
  { id: "open_crucible", label: "Open Crucible", emoji: "🫕" },
  { id: "glass_vial",    label: "Glass Vial",    emoji: "🧪" },
  { id: "iron_vessel",   label: "Iron Vessel",   emoji: "⚙️"  },
  { id: "stone_mortar",  label: "Stone Mortar",  emoji: "🪨"  },
  { id: "arcane_bowl",   label: "Arcane Bowl",   emoji: "✨" },
];

export default function ConditionPanel({ conditions, onChange }) {
  const [preset, setPreset] = useState(null);

  const applyPreset = (p) => {
    setPreset(p.name);
    onChange({ ...conditions, heat: p.heat, pressure: p.pressure, duration: p.duration, catalyst: p.catalyst });
  };

  const sliderClass = "w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-700";

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-4 space-y-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conditions</div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {CONDITION_PRESETS.map(p => (
          <button key={p.name} onClick={() => applyPreset(p)}
            className={`text-xs px-2 py-1 rounded-lg border transition-all flex items-center gap-1
              ${preset === p.name ? "border-amber-500 bg-amber-900/40 text-amber-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
            <span>{p.emoji}</span>{p.name}
          </button>
        ))}
      </div>

      {/* Sliders */}
      {[
        { key: "heat",     label: "Heat",     emoji: "🔥", color: "accent-red-500"    },
        { key: "pressure", label: "Pressure", emoji: "🔩", color: "accent-blue-400"   },
        { key: "duration", label: "Duration", emoji: "⏳", color: "accent-amber-400"  },
      ].map(({ key, label, emoji, color }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">{emoji} {label}</span>
            <span className="text-xs font-bold text-gray-300">{conditions[key] || 0}</span>
          </div>
          <input type="range" min={0} max={100} value={conditions[key] || 0}
            onChange={e => onChange({ ...conditions, [key]: Number(e.target.value) })}
            className={`${sliderClass} ${color}`} />
        </div>
      ))}

      {/* Container */}
      <div>
        <div className="text-xs text-gray-500 mb-1.5">Container</div>
        <div className="grid grid-cols-3 gap-1">
          {CONTAINERS.map(c => (
            <button key={c.id} onClick={() => onChange({ ...conditions, container: c.id })}
              className={`text-xs py-1.5 rounded-lg border flex flex-col items-center gap-0.5 transition-all
                ${conditions.container === c.id ? "border-amber-600 bg-amber-900/30 text-amber-300" : "border-gray-700 text-gray-600 hover:border-gray-500"}`}>
              <span>{c.emoji}</span>
              <span className="text-xs leading-tight">{c.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catalyst text */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Catalyst (optional)</div>
        <input
          type="text"
          placeholder="e.g. moonstone dust, salt, ash…"
          value={conditions.catalyst || ""}
          onChange={e => onChange({ ...conditions, catalyst: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-amber-600 outline-none"
        />
      </div>
    </div>
  );
}