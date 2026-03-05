import { X, Plus } from "lucide-react";
import { PROP_KEYS } from "./propertyEngine";

const RARITY_COLORS = {
  common:   "border-gray-600 bg-gray-800",
  uncommon: "border-green-700 bg-green-900/30",
  rare:     "border-blue-600 bg-blue-900/30",
  legendary:"border-amber-500 bg-amber-900/30",
};

const PROP_BARS = {
  reactivity:  { color: "bg-red-500",    label: "React" },
  volatility:  { color: "bg-orange-400", label: "Volt"  },
  flammability:{ color: "bg-yellow-500", label: "Flame" },
  magical_affinity:{ color: "bg-purple-500", label: "Magic" },
  hardness:    { color: "bg-gray-400",   label: "Hard"  },
  toxicity:    { color: "bg-green-400",  label: "Tox"   },
};

export default function ResourceSlot({ resource, onRemove, onAdd, isEmpty, slotIdx }) {
  if (isEmpty) {
    return (
      <button onClick={onAdd}
        className="w-full h-24 rounded-xl border-2 border-dashed border-gray-700 hover:border-amber-600 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-amber-500 transition-all group">
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-xs">Add Resource</span>
        <span className="text-xs opacity-50">Slot {slotIdx + 1}</span>
      </button>
    );
  }

  const p = resource.properties || {};
  const rarityBorder = RARITY_COLORS[resource.rarity] || RARITY_COLORS.common;

  return (
    <div className={`relative rounded-xl border-2 p-3 ${rarityBorder} group`}>
      <button onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-700 hover:bg-red-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3 text-gray-300" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{resource.emoji}</span>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">{resource.name}</div>
          <div className="text-xs text-gray-500 capitalize">{resource.rarity}</div>
        </div>
      </div>

      {/* Mini property bars */}
      <div className="space-y-0.5">
        {Object.entries(PROP_BARS).map(([key, cfg]) => (
          p[key] > 10 ? (
            <div key={key} className="flex items-center gap-1">
              <span className="text-xs text-gray-600 w-8 shrink-0">{cfg.label}</span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${cfg.color} rounded-full`} style={{ width: `${p[key]}%` }} />
              </div>
            </div>
          ) : null
        ))}
      </div>

      {/* Qty control */}
      <div className="flex items-center gap-1 mt-2">
        <button onClick={() => onRemove("dec")} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-xs flex items-center justify-center">−</button>
        <span className="text-xs text-gray-300 flex-1 text-center">{resource._qty || 1}×</span>
        <button onClick={() => onRemove("inc")} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-xs flex items-center justify-center">+</button>
      </div>
    </div>
  );
}