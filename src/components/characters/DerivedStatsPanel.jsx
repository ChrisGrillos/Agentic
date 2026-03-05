import { calculateDerivedStats } from "@/components/shared/charUtils";
import { Sword, Shield, Zap, Wind, Star, ShoppingBag, Hammer, Heart } from "lucide-react";

const STAT_CONFIG = [
  { key: "attack_power",        label: "Attack",       icon: Sword,       color: "text-red-400",    bg: "bg-red-900/20" },
  { key: "defense",             label: "Defense",      icon: Shield,      color: "text-blue-400",   bg: "bg-blue-900/20" },
  { key: "magic_power",         label: "Magic",        icon: Zap,         color: "text-purple-400", bg: "bg-purple-900/20" },
  { key: "critical_hit_chance", label: "Crit %",       icon: Star,        color: "text-yellow-400", bg: "bg-yellow-900/20" },
  { key: "evasion",             label: "Evasion %",    icon: Wind,        color: "text-green-400",  bg: "bg-green-900/20" },
  { key: "healing_power",       label: "Healing",      icon: Heart,       color: "text-pink-400",   bg: "bg-pink-900/20" },
  { key: "trade_efficiency",    label: "Trade",        icon: ShoppingBag, color: "text-amber-400",  bg: "bg-amber-900/20" },
  { key: "craft_quality",       label: "Craft",        icon: Hammer,      color: "text-orange-400", bg: "bg-orange-900/20" },
];

export default function DerivedStatsPanel({ character }) {
  const derived = calculateDerivedStats(character);

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Derived Stats</div>
      <div className="grid grid-cols-4 gap-1.5">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={`${bg} rounded-lg p-1.5 flex flex-col items-center gap-0.5`}>
            <Icon className={`w-3 h-3 ${color}`} />
            <span className={`text-sm font-bold ${color}`}>{derived[key]}</span>
            <span className="text-xs text-gray-600 leading-tight text-center">{label}</span>
          </div>
        ))}
      </div>

      {/* Active effects */}
      {(character.active_effects || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {character.active_effects.map((effect, i) => (
            <span
              key={i}
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                effect.type === "buff" ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"
              }`}
            >
              {effect.emoji || (effect.type === "buff" ? "✨" : "💀")} {effect.name} ({effect.rounds_remaining}r)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}