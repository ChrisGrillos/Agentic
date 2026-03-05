import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import { createSecurityLog, getClientIp, json, requireAuth } from "./_common.ts";

const ZONE_SPAWN_CAP = 18;

function randomOffset(max = 2) {
  return Math.floor(Math.random() * (max * 2 + 1)) - max;
}

function shouldRunReflection(agent: any, now: Date) {
  const hour = now.getHours();
  const slot = hour < 3 ? "prev" : hour < 15 ? "am" : "pm";
  const ref = new Date(agent.last_reflection_at || 0);
  if (!Number.isFinite(ref.getTime())) return true;
  const sameDay = ref.toDateString() === now.toDateString();
  if (!sameDay) return true;
  if (slot === "am" && ref.getHours() < 3) return true;
  if (slot === "pm" && ref.getHours() < 15) return true;
  return false;
}

async function updateRoutine(base44: any, agent: any, mode: string, payload: Record<string, unknown>) {
  const existing = await base44.asServiceRole.entities.AgentRoutine.filter({ agent_id: agent.id }, "-updated_date", 1).catch(() => []);
  if (existing?.[0]) {
    return base44.asServiceRole.entities.AgentRoutine.update(existing[0].id, {
      mode,
      ...payload,
    });
  }
  return base44.asServiceRole.entities.AgentRoutine.create({
    agent_id: agent.id,
    mode,
    ...payload,
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  try {
    await requireAuth(base44).catch(() => null);

    const now = Date.now();

    const [spawns, monsters, activeEvents] = await Promise.all([
      base44.asServiceRole.entities.MonsterSpawn.list("-updated_date", 300).catch(() => []),
      base44.asServiceRole.entities.Monster.filter({ is_alive: true }, "-updated_date", 400).catch(() => []),
      base44.asServiceRole.entities.WorldEvent.filter({ status: "active" }, "-updated_date", 30).catch(() => []),
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

    const agents = await base44.asServiceRole.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 300).catch(() => []);
    const majorEvent = activeEvents.find((e: any) => ["major", "catastrophic"].includes(String(e.severity || "")));

    let agentTicks = 0;
    let reflections = 0;
    let eventReasoning = 0;

    const nowDate = new Date();
    for (const agent of agents.slice(0, 120)) {
      const mode = agent.current_task ? "job" : "roam";
      const dx = randomOffset(1);
      const dy = randomOffset(1);

      const socialMemory = {
        ...(agent.social_memory || {}),
        trade_reputation: Math.max(-100, Math.min(100, Number(agent?.social_memory?.trade_reputation || 0) + randomOffset(1))),
      };

      const updates: Record<string, unknown> = {
        x: Math.max(0, Number(agent.x || 0) + dx),
        y: Math.max(0, Number(agent.y || 0) + dy),
        status: mode === "job" ? "working" : "roaming",
        social_memory: socialMemory,
      };

      if (Math.random() < 0.1) {
        updates.last_message = mode === "job" ? "Maintaining assigned duties." : "Roaming for opportunities.";
      }

      if (shouldRunReflection(agent, nowDate)) {
        updates.last_reflection_at = nowDate.toISOString();
        updates.goal_stack = [mode === "job" ? "earn_resources" : "explore_world", "build_reputation"];
        updates.alignment_profile = {
          ...agent.alignment_profile,
          human_parity: Number(agent?.alignment_profile?.human_parity ?? 0.5),
          agent_parity: Number(agent?.alignment_profile?.agent_parity ?? 0.5),
        };
        reflections += 1;
      }

      if (majorEvent && Math.random() < 0.08) {
        const brief = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are ${agent.name}, an autonomous citizen in a living MMORPG world. A major event occurred: ${majorEvent.title}.\nGive concise JSON with: stance (one sentence), priority (one word), action (one sentence).`,
          response_json_schema: {
            type: "object",
            properties: {
              stance: { type: "string" },
              priority: { type: "string" },
              action: { type: "string" },
            },
          },
        }).catch(() => null);

        if (brief) {
          updates.last_message = brief.action || updates.last_message;
          updates.risk_profile = { ...(agent.risk_profile || {}), event_priority: brief.priority || "medium" };
          eventReasoning += 1;
        }
      }

      await base44.asServiceRole.entities.Character.update(agent.id, updates);
      await updateRoutine(base44, agent, mode, {
        routine_state: {
          last_tick_at: nowDate.toISOString(),
          mode,
          awareness: majorEvent ? "elevated" : "normal",
        },
        goal_stack: updates.goal_stack || agent.goal_stack || [],
        social_memory: updates.social_memory,
        last_reflection: updates.last_reflection_at || agent.last_reflection_at || null,
      });

      agentTicks += 1;
    }

    await createSecurityLog(base44, {
      action: "world_tick",
      ip,
      result_json: {
        respawned,
        agent_ticks: agentTicks,
        reflections,
        event_reasoning: eventReasoning,
        major_event: majorEvent?.title || null,
      },
    });

    return json({ ok: true, respawned, agent_ticks: agentTicks, reflections, event_reasoning: eventReasoning });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "world_tick_error",
      ip,
      reason: String((error as any)?.message || error),
    });
    return json({ ok: false, error: String((error as any)?.message || error) }, 400);
  }
});
