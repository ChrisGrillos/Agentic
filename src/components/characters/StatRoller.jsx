import { useState, useEffect } from "react";
import { rollStatsForRace, getRace } from "@/components/shared/raceData";
import { Button } from "@/components/ui/button";

const STAT_INFO = {
  strength:     { abbr: "STR", emoji: "💪", color: "text-red-400",    bg: "bg-red-900/30"    },
  dexterity:    { abbr: "DEX", emoji: "🏹", color: "text-green-400",  bg: "bg-green-900/30"  },
  intelligence: { abbr: "INT", emoji: "🧠", color: "text-blue-400",   bg: "bg-blue-900/30"   },
  wisdom:       { abbr: "WIS", emoji: "👁️", color: "text-purple-400", bg: "bg-purple-900/30" },
  constitution: { abbr: "CON", emoji: "🛡️", color: "text-orange-400", bg: "bg-orange-900/30" },
  charisma:     { abbr: "CHA", emoji: "✨", color: "text-pink-400",   bg: "bg-pink-900/30"   },
};

const STAT_ORDER = ["strength", "dexterity", "intelligence", "wisdom", "constitution", "charisma"];

export default function StatRoller({ raceId, initialStats, rerollsLeft, onAccept, onReroll }) {
  const [rolling, setRolling] = useState(false);
  const [displayStats, setDisplayStats] = useState(initialStats);
  const race = getRace(raceId);

  // Update display when initialStats changes (reroll from parent)
  useEffect(() => {
    setDisplayStats(initialStats);
  }, [initialStats]);

  const handleReroll = () => {
    if (rerollsLeft <= 0 || rolling) return;
    setRolling(true);

    // Rapid-cycle animation
    let cycles = 0;
    const interval = setInterval(() => {
      setDisplayStats(rollStatsForRace(raceId));
      cycles++;
      if (cycles >= 8) {
        clearInterval(interval);
        const finalStats = rollStatsForRace(raceId);
        setDisplayStats(finalStats);
        setRolling(false);
        onReroll(finalStats);
      }
    }, 80);
  };

  const statTotal = STAT_ORDER.reduce((sum, s) => sum + (displayStats[s] || 0), 0);

  return (
    <div className="space-y-4">
      {/* Race context */}
      <div className={`flex items-center gap-2 p-3 rounded-xl ${race.bgClass} border ${race.borderClass}`}>
        <span className="text-2xl">{race.emoji}</span>
        <div>
          <div className="text-sm font-bold text-white">{race.name}</div>
          <div className="text-xs text-gray-400">{race.traitEmoji} {race.racialTrait}</div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {STAT_ORDER.map(stat => {
          const info = STAT_INFO[stat];
          const val = displayStats[stat] || 10;
          const [min, max] = race.statRanges[stat];
          const pct = Math.min(100, ((val - min) / Math.max(1, max - min)) * 100);
          return (
            <div key={stat} className={`${info.bg} rounded-xl p-3 border border-gray-700/50`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">{info.emoji} {info.abbr}</span>
                <span className={`text-xl font-black ${info.color} ${rolling ? "animate-pulse" : ""}`}>
                  {val}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  info.color.replace("text-", "bg-")}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-gray-600 mt-1">{min}–{max}</div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-gray-500">Total: <span className="text-white font-bold">{statTotal}</span></span>
        <span className="text-gray-500">Rerolls: <span className={`font-bold ${rerollsLeft > 0 ? "text-amber-400" : "text-gray-600"}`}>{rerollsLeft}</span> left</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleReroll}
          disabled={rerollsLeft <= 0 || rolling}
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400 disabled:opacity-40"
        >
          {rolling ? "🎲 Rolling..." : `🎲 Reroll (${rerollsLeft} left)`}
        </Button>
        <Button
          onClick={() => onAccept(displayStats)}
          disabled={rolling}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold"
        >
          ✓ Accept Stats
        </Button>
      </div>
    </div>
  );
}