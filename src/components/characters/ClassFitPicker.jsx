import { getAllClassFits } from "@/components/shared/raceData";

const CLASSES = [
  { id: "warrior",   emoji: "⚔️",  label: "Warrior",   desc: "Frontline fighter, STR+CON"   },
  { id: "hunter",    emoji: "🏹",  label: "Hunter",    desc: "Ranged & tracking, DEX+WIS"   },
  { id: "healer",    emoji: "💚",  label: "Healer",    desc: "Keeps allies alive, WIS+INT"   },
  { id: "wizard",    emoji: "🧙",  label: "Wizard",    desc: "Powerful spells, INT+WIS"      },
  { id: "magician",  emoji: "✨",  label: "Magician",  desc: "Trickery & charm, INT+CHA"     },
  { id: "merchant",  emoji: "💰",  label: "Merchant",  desc: "Trade & negotiate, CHA+INT"    },
  { id: "craftsman", emoji: "🔨",  label: "Craftsman", desc: "Build & repair, DEX+STR"       },
  { id: "fighter",   emoji: "🥊",  label: "Fighter",   desc: "Raw brawler, STR+CON"          },
];

const FIT_STYLES = {
  strong: { label: "Strong Fit",  badge: "bg-green-700 text-green-200",  border: "border-green-600"  },
  viable: { label: "Viable",      badge: "bg-yellow-700 text-yellow-200", border: "border-yellow-700" },
  weak:   { label: "Weak Fit",    badge: "bg-gray-700 text-gray-400",    border: "border-gray-700"   },
};

export default function ClassFitPicker({ rolledStats, selected, onSelect }) {
  const fits = getAllClassFits(rolledStats);
  const fitMap = Object.fromEntries(fits.map(f => [f.id, f.fit]));

  // Sort: strong first, then viable, then weak
  const sorted = [...CLASSES].sort((a, b) => {
    const order = { strong: 0, viable: 1, weak: 2 };
    return order[fitMap[a.id]] - order[fitMap[b.id]];
  });

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-3">
        Based on your rolled attributes, some classes will feel more natural.
        You may choose any class regardless of fit.
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map(cls => {
          const fit = fitMap[cls.id] || "viable";
          const fitStyle = FIT_STYLES[fit];
          const isSelected = selected === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => onSelect(cls.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]
                ${isSelected
                  ? "border-amber-500 bg-amber-900/25"
                  : `${fitStyle.border} bg-gray-800/50 hover:bg-gray-800`}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{cls.emoji}</span>
                  <span className="font-bold text-white text-sm">{cls.label}</span>
                </div>
                {isSelected && <span className="text-amber-400 text-xs">✓</span>}
              </div>
              <div className="text-xs text-gray-500 mb-2">{cls.desc}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fitStyle.badge}`}>
                {fitStyle.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}