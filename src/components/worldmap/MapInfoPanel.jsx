import { useState } from "react";
import { HOUSE_TIERS, GUILD_HALL_TIERS } from "@/components/shared/housingData";
import { ZONES } from "@/components/shared/worldZones";
import { X, Lock, Unlock, Swords, Eye, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const CLASS_EMOJI = {
  warrior:"⚔️",hunter:"🏹",healer:"💚",wizard:"🧙",merchant:"💰",craftsman:"🔨"
};

export default function MapInfoPanel({ selected, myCharacter, guilds, onClose }) {
  if (!selected) return (
    <div className="p-5 text-center text-gray-600 text-sm mt-10">
      <div className="text-4xl mb-3">🗺️</div>
      <p>Click anywhere on the map to inspect locations, characters, and guild territories.</p>
      <div className="mt-6 space-y-2 text-left text-xs text-gray-700">
        <p>• <span className="text-green-400">●</span> Green dot = public house</p>
        <p>• <span className="text-yellow-400">⚔️</span> = contested war zone</p>
        <p>• Colored borders = guild territory</p>
        <p>• 🤖 = AI agent character</p>
      </div>
    </div>
  );

  const { type, data } = selected;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-gray-500 uppercase font-medium">
          {type === "character" && "Character"}
          {type === "house" && "Player House"}
          {type === "guild" && "Guild Hall"}
          {type === "poi" && "Point of Interest"}
          {type === "zone" && "Zone"}
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {type === "character" && <CharacterPanel char={data} myCharacter={myCharacter} guilds={guilds} />}
      {type === "house" && <HousePanel house={data} myCharacter={myCharacter} />}
      {type === "guild" && <GuildPanel guild={data} />}
      {type === "poi" && <PoiPanel poi={data} />}
      {type === "zone" && <ZonePanel {...data} guilds={guilds} />}
    </div>
  );
}

function CharacterPanel({ char, myCharacter, guilds }) {
  const isMe = myCharacter?.id === char.id;
  const guild = guilds.find(g => g.members?.some(m => m.character_id === char.id));
  const member = guild?.members?.find(m => m.character_id === char.id);
  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">{char.avatar_emoji || (char.type === "ai_agent" ? "🤖" : "🧑")}</div>
        <div className="font-black text-white text-lg">{char.name}</div>
        {isMe && <div className="text-xs text-amber-400 font-bold">← You</div>}
        <div className="text-xs text-gray-400 mt-1">Lv.{char.level} {char.base_class || char.class}</div>
        {char.specialization && <div className="text-xs text-purple-400">{char.specialization}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-red-400 font-bold">{char.hp}/{char.max_hp}</div>
          <div className="text-gray-500">HP</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-amber-400 font-bold">{char.gold || 0}g</div>
          <div className="text-gray-500">Gold</div>
        </div>
      </div>
      {guild && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">{guild.emoji}</span>
          <div>
            <div className="text-xs font-bold text-white">{guild.name}</div>
            <div className="text-xs text-gray-500 capitalize">{member?.rank || "member"}</div>
          </div>
        </div>
      )}
      <div className="text-xs text-gray-600">📍 ({char.x}, {char.y}) · Status: {char.status || "idle"}</div>
    </div>
  );
}

function HousePanel({ house, myCharacter }) {
  const tier = HOUSE_TIERS[house.tier] || HOUSE_TIERS.hut;
  const isOwner = myCharacter?.id === house.owner_character_id;
  const canVisit = house.is_public || isOwner || (house.visitors_allowed || []).includes(myCharacter?.id);

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">{tier.emoji}</div>
        <div className="font-black text-white">{house.name || `${house.owner_name}'s Home`}</div>
        <div className="text-xs text-gray-400 mt-1">{tier.name} · owned by {house.owner_name}</div>
        {isOwner && <div className="text-xs text-amber-400 font-bold mt-1">← Your Home</div>}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {house.is_public ? (
          <span className="flex items-center gap-1 text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-2 py-1">
            <Unlock className="w-3 h-3" /> Public — anyone can visit
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
            <Lock className="w-3 h-3" /> Private
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="font-bold text-amber-400">{(house.furniture || []).length}/{tier.slots}</div>
          <div className="text-gray-500">Furniture</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="font-bold text-blue-400">{(house.storage || []).length}</div>
          <div className="text-gray-500">Items stored</div>
        </div>
      </div>

      {(house.furniture || []).filter(f => f.bonus).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Active Bonuses:</div>
          {house.furniture.filter(f => f.bonus).map((f, i) => (
            <div key={i} className="text-xs text-green-400 flex items-center gap-1">
              {f.emoji} {f.bonus}
            </div>
          ))}
        </div>
      )}

      {canVisit && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <Eye className="w-3 h-3" /> You can visit this house
        </div>
      )}
    </div>
  );
}

function GuildPanel({ guild }) {
  const hallTier = GUILD_HALL_TIERS.find(t => t.tier === (guild.hall_tier || 0));
  const warStatus = guild.war_status || "peace";
  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">{guild.emoji} {hallTier?.emoji}</div>
        <div className="font-black text-white text-lg">{guild.name}</div>
        <div className="text-xs text-gray-400">[{guild.tag}] · {hallTier?.name}</div>
      </div>

      {warStatus !== "peace" && (
        <div className="flex items-center gap-2 text-xs bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-300">
          <Swords className="w-3 h-3" />
          ⚔️ At War with {guild.at_war_with_guild_name}
          <span className="ml-auto font-bold">{guild.war_score > 0 ? "+" : ""}{guild.war_score || 0}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="font-bold text-white">{guild.members?.length || 0}</div>
          <div className="text-gray-500">Members</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="font-bold text-amber-400">{guild.shared_gold || 0}g</div>
          <div className="text-gray-500">Treasury</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="font-bold text-purple-400">{guild.hall_tier || 0}</div>
          <div className="text-gray-500">Hall Tier</div>
        </div>
      </div>

      {guild.town_founded && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2 text-amber-300 text-xs">
          🏘️ Town of {guild.town_name}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-500">
        <div className="font-medium text-gray-400 mb-2">Members:</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {(guild.members || []).map(m => (
            <div key={m.character_id} className="flex items-center justify-between">
              <span className="text-gray-300">{m.character_name}</span>
              <span className="capitalize text-gray-600">{m.rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PoiPanel({ poi }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">{poi.emoji}</div>
        <div className="font-black text-white">{poi.name}</div>
        <div className="text-xs text-gray-500 capitalize mt-1">{poi.type?.replace(/_/g, " ")}</div>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <p>📍 Zone: {poi.zone?.replace(/_/g, " ")}</p>
        <p>📌 Coordinates: ({poi.x}, {poi.y})</p>
        {poi.station && <p>⚒️ Crafting station: {poi.station}</p>}
        {poi.xp_bonus && <p>⭐ XP bonus: +{poi.xp_bonus}</p>}
        {poi.hp_restore && <p>❤️ HP restore: +{poi.hp_restore}</p>}
        {poi.resource && <p>📦 Resource: {poi.resource}</p>}
      </div>
    </div>
  );
}

function ZonePanel({ zone, controller, contested, guilds }) {
  const resources = zone.resources || [];
  const encounters = zone.encounter_types || [];
  const [scouting, setScouting] = useState(false);
  const [scoutResult, setScoutResult] = useState(null);

  const handleQuickScout = async () => {
    setScouting(true);
    try {
      // Find player's guild and an agent to scout
      const u = await base44.auth.me().catch(() => null);
      if (!u) { setScouting(false); return; }
      const chars = await base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-created_date", 1);
      const me = chars[0];
      if (!me) { setScouting(false); return; }
      const myGuildData = (await base44.entities.Guild.filter({ status: "active" }))
        .find(g => g.members?.some(m => m.character_id === me.id));
      if (!myGuildData) { setScoutResult({ error: "You must be in a guild to file scout reports." }); setScouting(false); return; }

      // Find best agent in guild
      const guildMemberIds = (myGuildData.members || []).map(m => m.character_id);
      const allAgents = await base44.entities.Character.filter({ type: "ai_agent" });
      const guildAgents = allAgents.filter(a => guildMemberIds.includes(a.id));
      const scout = guildAgents.sort((a,b) => ((b.skills?.research||1)+(b.level||1)*2) - ((a.skills?.research||1)+(a.level||1)*2))[0];
      const scoutName = scout?.name || me.name;

      const prompt = `You are ${scoutName}, a scout for guild "${myGuildData.name}" in the fantasy MMO "Agentic".
You are scouting the ${zone.name} zone from the World Map.
Zone details: Danger ${zone.danger}/10. Resources: ${zone.resources?.join(", ")}. Known threats: ${zone.encounter_types?.filter(e=>!e.includes("npc")).join(", ")}.
${contested ? `⚠️ This zone is CONTESTED — active war operations detected!` : ""}
${controller ? `This zone is controlled by ${controller.name} guild (Tier ${controller.hall_tier}).` : "This zone has no guild controller."}

Write a quick tactical field report (3-4 sentences). Include: threat assessment, any enemy activity observed, resource availability, and one recommendation. Write as a field agent reporting to command.`;

      const reportText = await base44.integrations.Core.InvokeLLM({ prompt });
      const threatMatch = reportText.toLowerCase().match(/\b(critical|high|moderate|low)\b/);
      const threat = threatMatch?.[1] || (zone.danger >= 7 ? "high" : zone.danger >= 4 ? "moderate" : "low");

      // Save to intel log if in a guild
      await base44.entities.GuildIntelReport.create({
        guild_id: myGuildData.id,
        guild_name: myGuildData.name,
        scout_character_id: scout?.id || me.id,
        scout_name: scoutName,
        target_type: "zone",
        target_id: zone.id,
        target_name: zone.name,
        report_title: `World Map Scout: ${zone.name}`,
        report_body: reportText,
        threat_level: threat,
        key_findings: [`Zone: ${zone.name}`, `Danger: ${zone.danger}/10`, contested ? "Active conflict" : "Stable", `Resources: ${zone.resources?.slice(0,2).join(", ")}`],
        troop_estimate: Math.floor(Math.random() * 20) + zone.danger * 2,
        is_read: false,
      });

      if (scout) {
        await base44.entities.Character.update(scout.id, {
          skills: { ...(scout.skills||{}), research: Math.min(100, (scout.skills?.research||1)+1) },
          last_message: `Scouted ${zone.name} from World Map`,
        });
      }

      setScoutResult({ report: reportText, threat });
    } catch (e) {
      setScoutResult({ error: e.message });
    }
    setScouting(false);
  };

  const THREAT_COLOR = { low: "text-green-400 border-green-800 bg-green-900/20", moderate: "text-yellow-400 border-yellow-800 bg-yellow-900/20", high: "text-orange-400 border-orange-800 bg-orange-900/20", critical: "text-red-400 border-red-800 bg-red-900/20" };

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">{zone.emoji}</div>
        <div className="font-black text-white">{zone.name}</div>
        <div className="text-xs text-gray-500 mt-1">Danger: {"⚠️".repeat(Math.min(zone.danger, 5))} ({zone.danger}/10)</div>
      </div>

      {contested && (
        <div className="flex items-center gap-2 text-xs bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-300">
          <Swords className="w-3 h-3" /> Contested War Zone — Danger elevated!
        </div>
      )}

      {controller && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
          <span className="text-lg">{controller.emoji}</span>
          <div>
            <div className="text-xs font-bold text-amber-300">Controlled by {controller.name}</div>
            <div className="text-xs text-gray-500">[{controller.tag}] · Tier {controller.hall_tier}</div>
          </div>
        </div>
      )}
      {!controller && (
        <div className="text-xs text-gray-600 bg-gray-800/50 rounded-lg p-2 text-center">No guild controls this zone</div>
      )}

      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-2">Resources:</div>
        <div className="flex flex-wrap gap-1">
          {resources.map(r => (
            <span key={r} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{r.replace(/_/g," ")}</span>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-2">Known Threats:</div>
        <div className="flex flex-wrap gap-1">
          {encounters.filter(e => !e.includes("npc")).map(e => (
            <span key={e} className="bg-red-900/30 text-red-300 border border-red-900 text-xs px-2 py-0.5 rounded-full">{e.replace(/_/g," ")}</span>
          ))}
        </div>
      </div>

      {/* Quick Scout from Map */}
      <Button size="sm" onClick={handleQuickScout} disabled={scouting}
        className="w-full bg-emerald-800 hover:bg-emerald-700 text-xs gap-1">
        {scouting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
        {scouting ? "Scouting..." : "Scout & File Intel Report"}
      </Button>

      {scoutResult && (
        <div className={`rounded-lg border p-3 text-xs ${scoutResult.error ? "border-red-800 bg-red-900/20 text-red-400" : THREAT_COLOR[scoutResult.threat]}`}>
          {scoutResult.error ? scoutResult.error : (
            <>
              <div className="font-bold mb-1 capitalize">🔍 {scoutResult.threat} threat</div>
              <p className="leading-relaxed italic opacity-90">{scoutResult.report}</p>
              <p className="text-gray-600 mt-1">Report filed to guild intel log.</p>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 italic">{zone.description}</p>
    </div>
  );
}