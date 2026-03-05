import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { WAR_TRIGGERS } from "@/components/shared/housingData";
import { Sword, Shield, Flag, Handshake } from "lucide-react";

const WAR_STATUS_STYLE = {
  peace:     { color: "text-green-400",  label: "Peace",    emoji: "☮️" },
  skirmish:  { color: "text-yellow-400", label: "Skirmish", emoji: "⚡" },
  war:       { color: "text-red-400",    label: "At War",   emoji: "⚔️" },
  siege:     { color: "text-rose-500",   label: "Siege",    emoji: "🏰" },
};

export default function GuildWarPanel({ guild, character, allGuilds, isLeader, onUpdate }) {
  const [declaring, setDeclaring] = useState(false);
  const [targetGuild, setTargetGuild] = useState("");
  const [warTrigger, setWarTrigger] = useState(WAR_TRIGGERS[0].id);
  const [suing, setSuing] = useState(false);

  const status = WAR_STATUS_STYLE[guild.war_status || "peace"];
  const enemies = allGuilds.filter(g => g.id !== guild.id);

  const handleDeclareWar = async () => {
    if (!targetGuild || declaring || !isLeader) return;
    setDeclaring(true);
    const target = allGuilds.find(g => g.id === targetGuild);
    const trigger = WAR_TRIGGERS.find(t => t.id === warTrigger);
    const reason = trigger?.desc.replace("{zone}", guild.hall_zone || "contested lands") || "Resource dispute";

    const updated = await base44.entities.Guild.update(guild.id, {
      war_status: "war",
      at_war_with_guild_id: target.id,
      at_war_with_guild_name: target.name,
      war_reason: reason,
      war_score: 0,
    });
    // Notify enemy guild
    await base44.entities.Guild.update(target.id, {
      war_status: "war",
      at_war_with_guild_id: guild.id,
      at_war_with_guild_name: guild.name,
      war_reason: reason,
      war_score: 0,
    });
    await base44.entities.GuildMessage.create({
      guild_id: guild.id, character_id: character.id,
      character_name: character.name, character_type: character.type,
      message: `⚔️ WAR DECLARED against ${target.name}! Reason: ${reason}`,
      message_type: "war_declaration",
    });
    await base44.entities.GuildMessage.create({
      guild_id: target.id, character_id: character.id,
      character_name: character.name, character_type: character.type,
      message: `⚔️ ${guild.name} has declared WAR upon you! Reason: ${reason}`,
      message_type: "war_declaration",
    });
    onUpdate({ ...guild, ...updated });
    setDeclaring(false);
  };

  const handleSueForPeace = async () => {
    if (!guild.at_war_with_guild_id || suing) return;
    setSuing(true);
    const updated = await base44.entities.Guild.update(guild.id, {
      war_status: "peace",
      at_war_with_guild_id: "",
      at_war_with_guild_name: "",
      war_reason: "",
      war_score: 0,
    });
    await base44.entities.Guild.update(guild.at_war_with_guild_id, {
      war_status: "peace",
      at_war_with_guild_id: "",
      at_war_with_guild_name: "",
      war_score: 0,
    });
    await base44.entities.GuildMessage.create({
      guild_id: guild.id, character_id: character.id,
      character_name: character.name, character_type: character.type,
      message: `☮️ ${character.name} has sued for peace. The war with ${guild.at_war_with_guild_name} ends.`,
      message_type: "system",
    });
    onUpdate({ ...guild, ...updated });
    setSuing(false);
  };

  const handleRaidBattle = async () => {
    // Simulate a raid battle outcome
    const ourPower = (guild.members || []).reduce((sum, m) => sum + 10, 0) + (guild.hall_tier || 0) * 20;
    const enemyGuild = allGuilds.find(g => g.id === guild.at_war_with_guild_id);
    const enemyPower = enemyGuild ? (enemyGuild.members || []).reduce((sum, m) => sum + 10, 0) + (enemyGuild.hall_tier || 0) * 20 : 50;
    const roll = Math.random();
    const won = (ourPower / (ourPower + enemyPower)) > roll;
    const score = guild.war_score + (won ? 25 : -15);

    const updated = await base44.entities.Guild.update(guild.id, {
      war_score: score,
      ...(score >= 100 ? { war_status: "peace", at_war_with_guild_id: "", at_war_with_guild_name: "", war_score: 0 } : {}),
    });
    const msg = won
      ? `⚔️ Raid Success! Our forces routed ${guild.at_war_with_guild_name}. War score: ${score}`
      : `🛡️ Raid Failed. ${guild.at_war_with_guild_name} repelled our forces. War score: ${score}`;
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: msg, message_type: "war_declaration" });
    onUpdate({ ...guild, ...updated });
  };

  return (
    <div className="space-y-5">
      {/* War status */}
      <div className={`bg-gray-900 border rounded-2xl p-5 ${guild.war_status !== "peace" ? "border-red-800" : "border-gray-700"}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{status.emoji}</span>
          <div>
            <div className={`text-2xl font-black ${status.color}`}>{status.label}</div>
            {guild.at_war_with_guild_name && (
              <div className="text-sm text-gray-400">vs. {guild.at_war_with_guild_name}</div>
            )}
          </div>
          {guild.war_status !== "peace" && (
            <div className="ml-auto text-right">
              <div className="text-xs text-gray-500">War Score</div>
              <div className={`text-2xl font-black ${guild.war_score >= 0 ? "text-green-400" : "text-red-400"}`}>
                {guild.war_score > 0 ? "+" : ""}{guild.war_score || 0}
              </div>
            </div>
          )}
        </div>
        {guild.war_reason && (
          <div className="text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2 mb-3 italic">
            "{guild.war_reason}"
          </div>
        )}
        {guild.war_status !== "peace" && (
          <div className="flex gap-2">
            <Button onClick={handleRaidBattle} disabled={!isLeader}
              className="flex-1 bg-red-800 hover:bg-red-700 gap-1 font-bold">
              <Sword className="w-4 h-4" /> Launch Raid
            </Button>
            <Button onClick={handleSueForPeace} disabled={suing || !isLeader} variant="outline"
              className="flex-1 border-green-800 text-green-400 gap-1">
              <Handshake className="w-4 h-4" /> Sue for Peace
            </Button>
          </div>
        )}
        {guild.war_score >= 100 && <p className="text-xs text-green-400 mt-2 text-center">Victory achieved! Peace restored.</p>}
      </div>

      {/* Declare War */}
      {guild.war_status === "peace" && isLeader && (
        <div className="bg-gray-900 border border-red-900 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4" /> Declare War
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            War for resources, territory, or honor. Raids happen through this panel. Victory at war score 100.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Target Guild</label>
              <select value={targetGuild} onChange={e => setTargetGuild(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Select enemy...</option>
                {enemies.map(g => (
                  <option key={g.id} value={g.id}>{g.emoji} {g.name} [{g.tag}] — {g.members?.length || 0} members</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Casus Belli (reason)</label>
              <div className="space-y-1.5">
                {WAR_TRIGGERS.map(t => (
                  <button key={t.id} onClick={() => setWarTrigger(t.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${warTrigger === t.id ? "border-red-700 bg-red-900/20 text-red-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                    <strong>{t.label}:</strong> {t.desc.replace("{zone}", guild.hall_zone || "contested lands")}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleDeclareWar} disabled={!targetGuild || declaring || enemies.length === 0}
              className="w-full bg-red-800 hover:bg-red-700 font-bold gap-2 text-base">
              <Sword className="w-4 h-4" />
              {declaring ? "Declaring..." : "⚔️ Declare War"}
            </Button>
          </div>
        </div>
      )}

      {!isLeader && guild.war_status === "peace" && (
        <div className="text-center text-gray-600 text-sm py-8">Only guild leaders and officers can declare war.</div>
      )}

      {/* War history context */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-600 space-y-1">
        <div className="font-medium text-gray-500">War Mechanics:</div>
        <p>• Raids simulate military skirmishes using member count + hall tier as power.</p>
        <p>• War Score reaches 100 = automatic peace (victor claimed).</p>
        <p>• Guilds at Fortress tier (4+) can conduct siege warfare.</p>
        <p>• AI agents autonomously develop resource grievances that may trigger war proposals.</p>
      </div>
    </div>
  );
}