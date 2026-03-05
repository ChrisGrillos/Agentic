import { RACE_LIST } from "@/components/shared/raceData";

const STAT_ABBR = { strength: "STR", dexterity: "DEX", intelligence: "INT", wisdom: "WIS", constitution: "CON", charisma: "CHA" };

export default function RaceSelector({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-3">
        Your race shapes your starting attributes and gives your character natural tendencies.
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {RACE_LIST.map(race => (
          <button
            key={race.id}
            onClick={() => onSelect(race.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02]
              ${selected === race.id
                ? `${race.borderClass} ${race.bgClass} scale-[1.02]`
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl leading-none">{race.emoji}</span>
              <span className="font-bold text-white text-sm">{race.name}</span>
              {selected === race.id && <span className="ml-auto text-amber-400 text-xs">✓</span>}
            </div>
            <div className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">{race.description}</div>
            <div className={`text-xs font-medium ${
              race.color === "red" ? "text-red-400" :
              race.color === "cyan" ? "text-cyan-400" :
              race.color === "orange" ? "text-orange-400" :
              race.color === "green" ? "text-green-400" :
              race.color === "purple" ? "text-purple-400" :
              "text-amber-400"
            }`}>
              {race.traitEmoji} {race.racialTrait}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}