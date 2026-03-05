import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { GUILD_HALL_TIERS } from "@/components/shared/housingData";
import { ZONES } from "@/components/shared/worldZones";
import { ArrowUpCircle, MapPin } from "lucide-react";

const RES_EMOJI = { wood: "🪵", stone: "🪨", iron_ore: "⚙️", gold_ore: "✨" };

export default function GuildHallPanel({ guild, character, isLeader, onUpdate }) {
  const [contributing, setContributing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [foundingTown, setFoundingTown] = useState(false);
  const [townName, setTownName] = useState("");

  const currentTier = GUILD_HALL_TIERS.find(t => t.tier === (guild.hall_tier || 0));
  const nextTier    = GUILD_HALL_TIERS.find(t => t.tier === (guild.hall_tier || 0) + 1);
  const upgradeRes  = guild.upgrade_resources || { wood: 0, stone: 0, iron_ore: 0, gold_ore: 0 };

  const canUpgrade = nextTier && (() => {
    for (const [res, needed] of Object.entries(nextTier.cost)) {
      if ((upgradeRes[res] || 0) < needed) return false;
    }
    if ((guild.members || []).length < nextTier.members_needed) return false;
    return true;
  })();

  const handleContribute = async (resId) => {
    if (contributing) return;
    const inv = character.inventory || [];
    const idx = inv.findIndex(i => i.id === resId);
    if (idx < 0) { alert(`You don't have any ${resId.replace(/_/g," ")}!`); return; }
    setContributing(true);
    const qty = Math.min(inv[idx].qty || 1, 10);
    const newInv = [...inv];
    newInv[idx] = { ...newInv[idx], qty: (newInv[idx].qty || 0) - qty };
    if (newInv[idx].qty <= 0) newInv.splice(idx, 1);

    const newResources = { ...upgradeRes, [resId]: (upgradeRes[resId] || 0) + qty };
    const members = (guild.members || []).map(m =>
      m.character_id === character.id ? { ...m, contribution_resources: (m.contribution_resources || 0) + qty } : m
    );
    const updated = await base44.entities.Guild.update(guild.id, { upgrade_resources: newResources, members });
    await base44.entities.Character.update(character.id, { inventory: newInv });
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: `${character.name} contributed ${qty}x ${resId.replace(/_/g," ")} toward the hall upgrade!`, message_type: "upgrade" });
    onUpdate({ ...guild, ...updated, upgrade_resources: newResources, members });
    setContributing(false);
  };

  const handleUpgrade = async () => {
    if (!nextTier || !canUpgrade || upgrading || !isLeader) return;
    setUpgrading(true);
    const newResources = {};
    for (const [res, val] of Object.entries(upgradeRes)) {
      newResources[res] = Math.max(0, (val || 0) - (nextTier.cost[res] || 0));
    }
    const zone = ZONES.find(z => z.id === "town_center") || ZONES[0];
    const updated = await base44.entities.Guild.update(guild.id, {
      hall_tier: nextTier.tier,
      upgrade_resources: newResources,
      hall_x: guild.hall_x || zone.x + 5,
      hall_y: guild.hall_y || zone.y + 3,
      hall_zone: guild.hall_zone || "town_center",
    });
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: `🏰 The guild hall has been upgraded to ${nextTier.name}!`, message_type: "upgrade" });
    onUpdate({ ...guild, ...updated, hall_tier: nextTier.tier, upgrade_resources: newResources });
    setUpgrading(false);
  };

  const handleFoundTown = async () => {
    if (!townName.trim() || !isLeader || foundingTown) return;
    setFoundingTown(true);
    const updated = await base44.entities.Guild.update(guild.id, { town_founded: true, town_name: townName.trim() });
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: `🏘️ The town of "${townName}" has been founded! A new settlement rises in Agentica!`, message_type: "system" });
    onUpdate({ ...guild, ...updated, town_founded: true, town_name: townName.trim() });
    setFoundingTown(false);
  };

  return (
    <div className="space-y-5">
      {/* Current hall */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{currentTier?.emoji || "🏕️"}</span>
          <div>
            <h2 className="text-xl font-black text-white">{guild.name}'s {currentTier?.name || "Camp"}</h2>
            <p className="text-gray-400 text-sm">{currentTier?.desc}</p>
            {guild.hall_zone && (
              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {guild.hall_zone.replace(/_/g," ")} ({guild.hall_x}, {guild.hall_y})
              </p>
            )}
          </div>
        </div>
        {guild.town_founded && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 text-amber-300 text-sm font-bold">
            🏘️ Town of {guild.town_name} — Established
          </div>
        )}
        {guild.keep_founded && (
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-3 text-gray-300 text-sm font-bold mt-2">
            🏰 Keep Fortified
          </div>
        )}
      </div>

      {/* Upgrade panel */}
      {nextTier && (
        <div className="bg-gray-900 border border-purple-900 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-purple-300 mb-1">
            Upgrade to: {nextTier.emoji} {nextTier.name}
          </h3>
          <p className="text-xs text-gray-500 mb-4">{nextTier.desc}</p>

          <div className="text-xs text-gray-500 mb-1">Requires {nextTier.members_needed} members (have {guild.members?.length || 0})</div>

          <div className="space-y-2 mb-4">
            {Object.entries(nextTier.cost).map(([res, needed]) => {
              const have = upgradeRes[res] || 0;
              const pct = Math.min(100, (have / needed) * 100);
              return (
                <div key={res}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{RES_EMOJI[res]} {res.replace(/_/g," ")}</span>
                    <span className={have >= needed ? "text-green-400" : "text-red-400"}>{have}/{needed}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contribute resources */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Contribute from inventory:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(nextTier.cost).map(res => {
                const hasInInv = (character.inventory || []).some(i => i.id === res && (i.qty || 0) > 0);
                return (
                  <Button key={res} onClick={() => handleContribute(res)} disabled={contributing || !hasInInv}
                    className="bg-gray-700 hover:bg-gray-600 text-xs gap-1 h-8">
                    {RES_EMOJI[res]} Contribute {res.replace(/_/g," ")}
                  </Button>
                );
              })}
            </div>
          </div>

          {isLeader && (
            <Button onClick={handleUpgrade} disabled={!canUpgrade || upgrading}
              className="w-full bg-purple-700 hover:bg-purple-600 font-bold gap-1">
              <ArrowUpCircle className="w-4 h-4" />
              {upgrading ? "Upgrading..." : `Upgrade to ${nextTier.name}`}
            </Button>
          )}
          {!isLeader && <p className="text-xs text-gray-600 text-center">Only leaders/officers can trigger upgrades.</p>}
        </div>
      )}

      {/* Found town (tier 3+) */}
      {(guild.hall_tier || 0) >= 3 && !guild.town_founded && isLeader && (
        <div className="bg-gray-900 border border-amber-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🏘️ Found a Town</h3>
          <p className="text-xs text-gray-500 mb-3">Your keep is strong enough to establish a permanent settlement.</p>
          <div className="flex gap-2">
            <input value={townName} onChange={e => setTownName(e.target.value)} placeholder="Town name..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
            <Button onClick={handleFoundTown} disabled={!townName.trim() || foundingTown}
              className="bg-amber-600 hover:bg-amber-500 font-bold">
              {foundingTown ? "Founding..." : "Found"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}