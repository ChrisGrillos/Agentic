export default function CombatCharCard({ name, emoji, level, className, hp, maxHP, isPlayer, isShaking, isFlashing }) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHP) * 100));
  const hpColor = hpPct > 60 ? "bg-green-500" : hpPct > 30 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div
      className={`w-44 flex-shrink-0 flex flex-col items-center justify-center p-3 border-r border-gray-800/50 transition-all duration-100
        ${isShaking ? "translate-x-1 -translate-y-0.5" : ""}
        ${isFlashing ? (isPlayer ? "bg-red-900/30" : "bg-red-900/30") : "bg-transparent"}`}
    >
      <div className="text-5xl mb-2 select-none" style={{ filter: isFlashing ? "brightness(1.8)" : "none" }}>
        {emoji}
      </div>
      <div className={`text-xs font-bold mb-1 ${isPlayer ? "text-amber-400" : "text-red-400"}`}>
        {name}
      </div>
      <div className="text-xs text-gray-500 mb-2">Lv.{level} {className}</div>
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>❤️</span><span>{hp}/{maxHP}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className={`${hpColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${hpPct}%` }} />
        </div>
      </div>
    </div>
  );
}