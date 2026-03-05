import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Home, Shield, Sword, Package, Users } from "lucide-react";
import { RESOURCES } from "@/components/shared/craftingData";
import { GUILD_HALL_TIERS } from "@/components/shared/housingData";
import { ZONES } from "@/components/shared/worldZones";

// Scoring: how well does an agent's personality fit a guild?
function scoreGuildFit(agent, guild) {
  let score = 0;
  const traits = agent.agent_traits || {};
  const alignment = traits.ethical_alignment || "true_neutral";
  const motivation = (traits.motivation || "").toLowerCase();

  // War-like agents prefer guilds at war
  if (guild.war_status !== "peace" && (alignment.includes("chaotic") || motivation.includes("power") || motivation.includes("conquer"))) score += 30;
  // Peaceful agents avoid war guilds
  if (guild.war_status !== "peace" && alignment.includes("good")) score -= 20;
  // High-tier halls attract agents
  score += (guild.hall_tier || 0) * 10;
  // Smaller guilds easier to join (less intimidating)
  score += Math.max(0, 10 - (guild.members?.length || 0));
  // Leadership motivation → join as recruit to climb
  if (motivation.includes("lead") || motivation.includes("power")) score += 15;
  // Merchant/trade agents like wealthy guilds
  if ((agent.base_class === "merchant") && (guild.shared_gold || 0) > 200) score += 20;
  return score;
}

// Pick resources to contribute based on agent inventory
function pickContribution(agent, neededResources) {
  const inv = agent.inventory || [];
  for (const resId of Object.keys(neededResources)) {
    const item = inv.find(i => i.id === resId && (i.qty || 0) >= 5);
    if (item) return { resId, qty: Math.min(item.qty, 15) };
  }
  return null;
}

export default function AgentHousingGuildPanel({ agent, onRefresh }) {
  const [guilds, setGuilds]       = useState([]);
  const [houses, setHouses]       = useState([]);
  const [myGuild, setMyGuild]     = useState(null);
  const [log, setLog]             = useState([]);
  const [busy, setBusy]           = useState(false);
  const [action, setAction]       = useState(null); // which action is running

  useEffect(() => { loadData(); }, [agent.id]);

  const loadData = async () => {
    const [allGuilds, allHouses] = await Promise.all([
      base44.entities.Guild.filter({ status: "active" }),
      base44.entities.PlayerHouse.list("-created_date", 50),
    ]);
    setGuilds(allGuilds);
    setHouses(allHouses);
    const mine = allGuilds.find(g => g.members?.some(m => m.character_id === agent.id));
    setMyGuild(mine || null);
  };

  const addLog = (msg) => setLog(prev => [msg, ...prev.slice(0, 14)]);

  // ── JOIN A GUILD ──────────────────────────────────────────────────────────────
  const handleJoinGuild = async () => {
    setBusy(true); setAction("join");
    const available = guilds.filter(g => !g.members?.some(m => m.character_id === agent.id));
    if (available.length === 0) { addLog("❌ No available guilds to join."); setBusy(false); setAction(null); return; }

    // Score each guild and pick the best fit
    const scored = available.map(g => ({ guild: g, score: scoreGuildFit(agent, g) }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0].guild;

    const newMember = {
      character_id: agent.id, character_name: agent.name, character_type: "ai_agent",
      rank: "recruit", joined_at: new Date().toISOString(), contribution_gold: 0, contribution_resources: 0,
    };
    const updated = await base44.entities.Guild.update(best.id, { members: [...(best.members || []), newMember] });
    await base44.entities.GuildMessage.create({
      guild_id: best.id, character_id: agent.id, character_name: agent.name, character_type: "ai_agent",
      message: `${agent.name} (AI ${agent.base_class}) has joined the guild! Motivation: "${agent.agent_traits?.motivation || "adventure"}"`,
      message_type: "member_joined",
    });
    await base44.entities.Character.update(agent.id, {
      last_message: `Joined guild: ${best.name}`,
      status: "idle",
    });
    setMyGuild(updated);
    addLog(`✅ ${agent.name} joined ${best.emoji} ${best.name} [score: ${scored[0].score}]`);
    setGuilds(prev => prev.map(g => g.id === best.id ? updated : g));
    setBusy(false); setAction(null);
    onRefresh();
  };

  // ── CONTRIBUTE RESOURCES ──────────────────────────────────────────────────────
  const handleContributeResources = async () => {
    if (!myGuild) return;
    setBusy(true); setAction("contribute");
    const nextTier = GUILD_HALL_TIERS.find(t => t.tier === (myGuild.hall_tier || 0) + 1);
    if (!nextTier) { addLog("🏰 Guild hall is already at max tier!"); setBusy(false); setAction(null); return; }

    const contribution = pickContribution(agent, nextTier.cost);
    if (!contribution) {
      // Simulate gathering — agent goes out and gathers
      const zoneIds = Object.keys(nextTier.cost);
      const gatherRes = zoneIds[Math.floor(Math.random() * zoneIds.length)];
      const gathered = 5 + Math.floor((agent.skills?.resource_management || 1) / 5);
      const inv = [...(agent.inventory || [])];
      const idx = inv.findIndex(i => i.id === gatherRes);
      const res = RESOURCES[gatherRes];
      if (idx >= 0) inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 0) + gathered };
      else inv.push({ id: gatherRes, name: res?.name || gatherRes, emoji: res?.emoji || "📦", qty: gathered });
      await base44.entities.Character.update(agent.id, { inventory: inv, status: "farming",
        last_message: `Gathering ${res?.name || gatherRes} for guild hall upgrade` });
      addLog(`🌿 ${agent.name} went gathering ${res?.emoji || ""} ${gathered}x ${res?.name || gatherRes} for the guild`);
      setBusy(false); setAction(null); onRefresh(); return;
    }

    // Actually contribute from inventory
    const { resId, qty } = contribution;
    const newInv = [...(agent.inventory || [])];
    const invIdx = newInv.findIndex(i => i.id === resId);
    newInv[invIdx] = { ...newInv[invIdx], qty: newInv[invIdx].qty - qty };
    if (newInv[invIdx].qty <= 0) newInv.splice(invIdx, 1);

    const upgradeRes = { ...(myGuild.upgrade_resources || {}), [resId]: ((myGuild.upgrade_resources || {})[resId] || 0) + qty };
    const members = (myGuild.members || []).map(m =>
      m.character_id === agent.id ? { ...m, contribution_resources: (m.contribution_resources || 0) + qty } : m
    );
    const res = RESOURCES[resId];
    await Promise.all([
      base44.entities.Guild.update(myGuild.id, { upgrade_resources: upgradeRes, members }),
      base44.entities.Character.update(agent.id, { inventory: newInv,
        last_message: `Contributed ${qty}x ${res?.name || resId} to guild hall upgrade` }),
      base44.entities.GuildMessage.create({
        guild_id: myGuild.id, character_id: agent.id, character_name: agent.name, character_type: "ai_agent",
        message: `${agent.name} contributed ${qty}x ${res?.emoji || ""} ${res?.name || resId} toward ${nextTier.name} upgrade!`,
        message_type: "upgrade",
      }),
    ]);
    setMyGuild(prev => ({ ...prev, upgrade_resources: upgradeRes, members }));
    addLog(`✅ ${agent.name} contributed ${qty}x ${res?.name || resId} → ${myGuild.name}`);
    setBusy(false); setAction(null);
    onRefresh();
  };

  // ── VISIT A HOUSE ─────────────────────────────────────────────────────────────
  const handleVisitHouse = async () => {
    setBusy(true); setAction("visit");
    const visitable = houses.filter(h =>
      h.owner_character_id !== agent.id &&
      (h.is_public || (h.visitors_allowed || []).includes(agent.id))
    );
    if (visitable.length === 0) {
      addLog("🏠 No public houses to visit right now.");
      setBusy(false); setAction(null); return;
    }
    const target = visitable[Math.floor(Math.random() * visitable.length)];
    const bonuses = (target.furniture || []).filter(f => f.bonus).map(f => f.bonus);

    // AI "socializes" — uses LLM to generate a visit message
    const visitMsg = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${agent.name}, a ${agent.base_class} AI agent in "Agentic" MMO. 
You just visited ${target.owner_name}'s ${target.tier} home. The home has these features: ${bonuses.join(", ") || "basic furniture"}.
Write a short, in-character social message (1-2 sentences) you'd leave as a visitor note. Be friendly and personality-consistent.`,
    });

    await base44.entities.Character.update(agent.id, {
      x: target.x, y: target.y,
      last_message: `Visited ${target.owner_name}'s ${target.tier}. ${visitMsg?.slice(0, 100) || "Had a pleasant visit!"}`,
      status: "roaming",
    });
    addLog(`🏠 ${agent.name} visited ${target.owner_name}'s ${target.tier} at (${target.x},${target.y})`);
    if (visitMsg) addLog(`💬 "${visitMsg.slice(0, 80)}..."`);
    setBusy(false); setAction(null);
    onRefresh();
  };

  // ── WAR PARTICIPATION ─────────────────────────────────────────────────────────
  const handleWarParticipation = async () => {
    if (!myGuild || myGuild.war_status === "peace") {
      addLog("☮️ Guild is at peace — nothing to fight.");
      return;
    }
    setBusy(true); setAction("war");

    const isWarriorType = ["warrior", "hunter", "fighter"].includes(agent.base_class);
    const combatSkill = agent.skills?.combat || 1;

    if (isWarriorType || combatSkill > 10) {
      // Participate in raid
      const power = combatSkill * 2 + (agent.level || 1) * 5;
      const enemyGuild = guilds.find(g => g.id === myGuild.at_war_with_guild_id);
      const enemyPower = enemyGuild ? (enemyGuild.members?.length || 1) * 20 : 50;
      const won = (power / (power + enemyPower * 0.5)) > Math.random();
      const warScoreDelta = won ? 10 + Math.floor(combatSkill / 5) : -5;

      await Promise.all([
        base44.entities.Guild.update(myGuild.id, { war_score: (myGuild.war_score || 0) + warScoreDelta }),
        base44.entities.Character.update(agent.id, {
          skills: { ...(agent.skills || {}), combat: Math.min(100, combatSkill + (won ? 2 : 1)) },
          xp: (agent.xp || 0) + (won ? 40 : 15),
          last_message: `${won ? "Won" : "Lost"} a skirmish for ${myGuild.name} against ${myGuild.at_war_with_guild_name}`,
          status: "fighting",
        }),
        base44.entities.GuildMessage.create({
          guild_id: myGuild.id, character_id: agent.id, character_name: agent.name, character_type: "ai_agent",
          message: `${agent.name} ${won ? "🗡️ won" : "🛡️ survived"} a skirmish against ${myGuild.at_war_with_guild_name}! War score ${won ? "+" : ""}${warScoreDelta}`,
          message_type: "war_declaration",
        }),
      ]);
      addLog(`${won ? "⚔️ Victory!" : "🛡️ Survived"} ${agent.name} fought for ${myGuild.name} (score ${warScoreDelta > 0 ? "+" : ""}${warScoreDelta})`);
    } else {
      // Non-combat agents gather war resources instead
      const warRes = ["wood", "iron_ore", "stone"][Math.floor(Math.random() * 3)];
      const gathered = 3 + Math.floor((agent.skills?.resource_management || 1) / 8);
      const inv = [...(agent.inventory || [])];
      const idx = inv.findIndex(i => i.id === warRes);
      if (idx >= 0) inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 0) + gathered };
      else inv.push({ id: warRes, name: warRes, emoji: RESOURCES[warRes]?.emoji || "📦", qty: gathered });
      await base44.entities.Character.update(agent.id, {
        inventory: inv, status: "farming",
        last_message: `Gathering war supplies (${warRes}) for ${myGuild.name}`,
        xp: (agent.xp || 0) + 10,
      });
      addLog(`📦 ${agent.name} gathered ${gathered}x ${warRes} as war supplies for ${myGuild.name}`);
    }
    setBusy(false); setAction(null);
    onRefresh();
  };

  const inGuild = !!myGuild;

  return (
    <div className="bg-gray-900 border border-teal-900 rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Home className="w-4 h-4 text-teal-400" />
        <span className="text-sm font-bold text-teal-300">Housing & Guild Actions</span>
      </div>

      {/* Guild status */}
      <div className="mb-3 text-xs">
        {myGuild ? (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-lg">{myGuild.emoji}</span>
            <div>
              <span className="font-bold text-white">{myGuild.name}</span>
              <span className="text-gray-500 ml-2">[{myGuild.tag}]</span>
              {myGuild.war_status !== "peace" && <span className="ml-2 text-red-400">⚔️ At War</span>}
            </div>
          </div>
        ) : (
          <div className="text-gray-600 bg-gray-800/50 rounded-lg px-3 py-2">Not in any guild</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {!inGuild && (
          <Button size="sm" onClick={handleJoinGuild} disabled={busy}
            className="col-span-2 bg-teal-700 hover:bg-teal-600 text-xs h-8 gap-1">
            {action === "join" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
            Evaluate & Join Guild
          </Button>
        )}

        {inGuild && (
          <Button size="sm" onClick={handleContributeResources} disabled={busy}
            className="bg-purple-700 hover:bg-purple-600 text-xs h-8 gap-1">
            {action === "contribute" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
            Contribute Resources
          </Button>
        )}

        <Button size="sm" onClick={handleVisitHouse} disabled={busy}
          className="bg-amber-700 hover:bg-amber-600 text-xs h-8 gap-1">
          {action === "visit" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Home className="w-3 h-3" />}
          Visit a House
        </Button>

        {inGuild && myGuild?.war_status !== "peace" && (
          <Button size="sm" onClick={handleWarParticipation} disabled={busy}
            className="col-span-2 bg-red-800 hover:bg-red-700 text-xs h-8 gap-1">
            {action === "war" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sword className="w-3 h-3" />}
            Participate in War Effort
          </Button>
        )}
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800 space-y-1 max-h-36 overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className={`text-xs leading-relaxed ${
              l.startsWith("✅") || l.startsWith("⚔️") || l.startsWith("🏠") ? "text-green-400" :
              l.startsWith("❌") ? "text-red-400" :
              l.startsWith("💬") ? "text-amber-300 italic" :
              l.startsWith("🛡️") ? "text-blue-400" :
              "text-gray-400"}`}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}