export default function MapLegend({ guilds, guildColorMap, GUILD_BORDER_COLORS }) {
  const controllingGuilds = guilds.filter(g => g.hall_tier >= 3 && g.hall_zone);
  if (controllingGuilds.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 bg-gray-900/90 border border-gray-700 rounded-xl p-3 text-xs space-y-1.5 max-w-[180px]">
      <div className="font-bold text-gray-400 mb-2">Guild Territories</div>
      {controllingGuilds.map(g => {
        const ci = guildColorMap[g.id] ?? 0;
        return (
          <div key={g.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm border-2 shrink-0" style={{ borderColor: GUILD_BORDER_COLORS[ci], backgroundColor: GUILD_BORDER_COLORS[ci] + "44" }} />
            <span className="text-gray-300 truncate">{g.emoji} {g.name}</span>
            {g.war_status !== "peace" && <span className="text-red-400">⚔️</span>}
          </div>
        );
      })}
      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-700">
        <div className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-500/20 shrink-0" />
        <span className="text-red-400">Contested</span>
      </div>
    </div>
  );
}