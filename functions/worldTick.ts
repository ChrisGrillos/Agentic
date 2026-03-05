import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import { createSecurityLog, getClientIp, json, requireAuth } from "./_common.ts";

const ZONE_SPAWN_CAP = 18;

function randomOffset(max = 2) {
  return Math.floor(Math.random() * (max * 2 + 1)) - max;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  try {
    await requireAuth(base44).catch(() => null);

    const now = Date.now();

    const [spawns, monsters] = await Promise.all([
      base44.asServiceRole.entities.MonsterSpawn.list("-updated_date", 300).catch(() => []),
      base44.asServiceRole.entities.Monster.filter({ is_alive: true }, "-updated_date", 400).catch(() => []),
    ]);

    const aliveByZone: Record<string, number> = {};
    monsters.forEach((m: any) => {
      const z = String(m.zone_id || "unknown");
      aliveByZone[z] = (aliveByZone[z] || 0) + 1;
    });

    let respawned = 0;

    for (const spawn of spawns) {
      if (spawn.active_monster_id) continue;
      const zoneId = String(spawn.zone_id || "unknown");
      if ((aliveByZone[zoneId] || 0) >= ZONE_SPAWN_CAP) continue;

      const nextAt = new Date(spawn.next_respawn_at || 0).getTime();
      if (!Number.isFinite(nextAt) || nextAt > now) continue;

      const baseX = Number(spawn.x || 30);
      const baseY = Number(spawn.y || 25);
      const level = Number(spawn.level || 1);
      const maxHp = Number(spawn.max_hp || (40 + level * 15));

      const monster = await base44.asServiceRole.entities.Monster.create({
        name: spawn.monster_name || `${spawn.species || "beast"} ${Math.floor(Math.random() * 999)}`,
        species: spawn.species || "goblin",
        level,
        hp: maxHp,
        max_hp: maxHp,
        x: baseX + randomOffset(1),
        y: baseY + randomOffset(1),
        zone_id: zoneId,
        is_alive: true,
      });

      await base44.asServiceRole.entities.MonsterSpawn.update(spawn.id, {
        active_monster_id: monster.id,
        last_spawned_at: new Date().toISOString(),
        next_respawn_at: null,
      });

      aliveByZone[zoneId] = (aliveByZone[zoneId] || 0) + 1;
      respawned += 1;
    }

    // Lightweight autonomous agent loop
    const agents = await base44.asServiceRole.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 120).catch(() => []);
    const routines = await base44.asServiceRole.entities.AgentRoutine.list("-updated_date", 200).catch(() => []);

    let agentTicks = 0;
    for (const agent of agents.slice(0, 60)) {
      const routine = routines.find((r: any) => r.agent_id === agent.id);
      const action = routine?.mode || "roam";
      const dx = randomOffset(1);
      const dy = randomOffset(1);
      const updates: Record<string, unknown> = {
        x: Math.max(0, Number(agent.x || 0) + dx),
        y: Math.max(0, Number(agent.y || 0) + dy),
        status: action === "job" ? "working" : "roaming",
      };
      if (Math.random() < 0.15) {
        updates.last_message = action === "job" ? "Maintaining assigned duties." : "Roaming for opportunities.";
      }
      await base44.asServiceRole.entities.Character.update(agent.id, updates);
      agentTicks += 1;
    }

    await createSecurityLog(base44, {
      action: "world_tick",
      ip,
      result_json: { respawned, agent_ticks: agentTicks },
    });

    return json({ ok: true, respawned, agent_ticks: agentTicks });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "world_tick_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

