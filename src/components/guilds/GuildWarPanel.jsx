import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WAR_TRIGGERS } from "@/components/shared/housingData";
import { Sword, Shield, Flag, Handshake, Clock3, Hammer } from "lucide-react";
import gameService from "@/api/gameService";

const WAR_STATUS_STYLE = {
  peace:    { color: "text-green-400",  label: "Peace", emoji: "[peace]" },
  skirmish: { color: "text-yellow-400", label: "Skirmish", emoji: "[skirmish]" },
  war:      { color: "text-red-400",    label: "War", emoji: "[war]" },
  siege:    { color: "text-rose-500",   label: "Siege", emoji: "[siege]" },
};

export default function GuildWarPanel({ guild, allGuilds, isLeader, onUpdate }) {
  const [declaring, setDeclaring] = useState(false);
  const [targetGuild, setTargetGuild] = useState("");
  const [warTrigger, setWarTrigger] = useState(WAR_TRIGGERS[0].id);
  const [suing, setSuing] = useState(false);
  const [primeStartHour, setPrimeStartHour] = useState(Number(guild.siege_prime_start_utc ?? 20));
  const [primeDuration, setPrimeDuration] = useState(Number(guild.siege_prime_duration_hours ?? 3));
  const [declarationHours, setDeclarationHours] = useState(24);

  const status = WAR_STATUS_STYLE[guild.war_status || "peace"];
  const enemies = allGuilds.filter((g) => g.id !== guild.id);

  const handleSavePrimeWindow = async () => {
    if (!isLeader) return;
    const res = await gameService.siegeAction({
      action: "set_prime_window",
      guild_id: guild.id,
      prime_start_hour_utc: primeStartHour,
      prime_duration_hours: primeDuration,
    });
    onUpdate({ ...guild, ...(res.guild || {}) });
  };

  const handleDeclareSiege = async () => {
    if (!targetGuild || declaring || !isLeader) return;
    setDeclaring(true);
    const trigger = WAR_TRIGGERS.find((t) => t.id === warTrigger);
    const reason = trigger?.desc.replace("{zone}", guild.hall_zone || "contested lands") || "Territorial dispute";
    try {
      const res = await gameService.siegeAction({
        action: "declare_siege",
        guild_id: guild.id,
        enemy_guild_id: targetGuild,
        declaration_hours: declarationHours,
        reason,
      });
      onUpdate({ ...guild, ...(res.guild || {}) });
    } finally {
      setDeclaring(false);
    }
  };

  const handleLaunchSiegeRaid = async (component = "walls") => {
    const res = await gameService.siegeAction({
      action: "launch_siege_raid",
      guild_id: guild.id,
      component,
      damage: 180,
    });
    if (res?.enemy) {
      onUpdate({ ...guild, war_status: "siege" });
    }
  };

  const handleSueForPeace = async () => {
    if (suing) return;
    setSuing(true);
    try {
      await gameService.siegeAction({ action: "resolve_siege", guild_id: guild.id });
      onUpdate({ ...guild, war_status: "peace", at_war_with_guild_id: "", at_war_with_guild_name: "" });
    } finally {
      setSuing(false);
    }
  };

  const handleRebuild = async (component = "walls") => {
    const res = await gameService.siegeAction({
      action: "rebuild_component",
      guild_id: guild.id,
      component,
      rebuild_amount: 120,
    });
    onUpdate({ ...guild, ...(res.guild || {}) });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-indigo-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2"><Clock3 className="w-4 h-4" /> Prime-Time Vulnerability</h3>
        <p className="text-xs text-gray-500 mb-3">Set when your city can be sieged (UTC).</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Hour (UTC)</label>
            <input type="number" min={0} max={23} value={primeStartHour} onChange={(e) => setPrimeStartHour(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Duration (hours)</label>
            <input type="number" min={1} max={12} value={primeDuration} onChange={(e) => setPrimeDuration(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-indigo-700" onClick={handleSavePrimeWindow} disabled={!isLeader}>Save Window</Button>
      </div>

      <div className={`bg-gray-900 border rounded-2xl p-5 ${guild.war_status !== "peace" ? "border-red-800" : "border-gray-700"}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{status.emoji}</span>
          <div>
            <div className={`text-2xl font-black ${status.color}`}>{status.label}</div>
            {guild.at_war_with_guild_name && <div className="text-sm text-gray-400">vs {guild.at_war_with_guild_name}</div>}
          </div>
        </div>

        {guild.war_status === "siege" && (
          <div className="space-y-2">
            <div className="text-xs text-amber-400">Siege start: {guild.siege_starts_at ? new Date(guild.siege_starts_at).toLocaleString() : "pending"}</div>
            <div className="flex gap-2">
              <Button onClick={() => handleLaunchSiegeRaid("walls")} disabled={!isLeader} className="flex-1 bg-red-800 hover:bg-red-700 gap-1 font-bold">
                <Sword className="w-4 h-4" /> Hit Walls
              </Button>
              <Button onClick={() => handleLaunchSiegeRaid("gate")} disabled={!isLeader} className="flex-1 bg-red-900 hover:bg-red-800 gap-1 font-bold">
                <Shield className="w-4 h-4" /> Breach Gate
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleRebuild("walls")} variant="outline" className="flex-1 border-green-800 text-green-400 gap-1">
                <Hammer className="w-4 h-4" /> Rebuild Walls
              </Button>
              <Button onClick={handleSueForPeace} disabled={suing || !isLeader} variant="outline" className="flex-1 border-green-800 text-green-400 gap-1">
                <Handshake className="w-4 h-4" /> End Siege
              </Button>
            </div>
          </div>
        )}
      </div>

      {guild.war_status === "peace" && isLeader && (
        <div className="bg-gray-900 border border-red-900 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2"><Flag className="w-4 h-4" /> Declare Siege</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Target Guild</label>
              <select value={targetGuild} onChange={(e) => setTargetGuild(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Select enemy</option>
                {enemies.map((g) => <option key={g.id} value={g.id}>{g.name} [{g.tag}]</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Declaration Lead Time (hours)</label>
              <input type="number" min={1} max={72} value={declarationHours} onChange={(e) => setDeclarationHours(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Casus Belli</label>
              <div className="space-y-1.5">
                {WAR_TRIGGERS.map((t) => (
                  <button key={t.id} onClick={() => setWarTrigger(t.id)} className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${warTrigger === t.id ? "border-red-700 bg-red-900/20 text-red-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                    <strong>{t.label}:</strong> {t.desc.replace("{zone}", guild.hall_zone || "contested lands")}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleDeclareSiege} disabled={!targetGuild || declaring} className="w-full bg-red-800 hover:bg-red-700 font-bold gap-2 text-base">
              <Sword className="w-4 h-4" /> {declaring ? "Declaring..." : "Declare Siege"}
            </Button>
          </div>
        </div>
      )}

      {!isLeader && (
        <div className="text-center text-gray-600 text-sm py-8">Only guild leaders/officers can control siege actions.</div>
      )}
    </div>
  );
}
