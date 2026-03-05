import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import { calcAttackDamage, monsterCombatStats, playerCombatStats, xpReward, goldReward } from "./_combatCore.ts";
import {
  assertAllowedKeys,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  json,
  mustString,
  pickCombatAbility,
  readJson,
  requireAuth,
} from "./_common.ts";

function buildSessionPayload(character: any, monster: any) {
  return {
    status: "active",
    turn: "player",
    round: 1,
    actor_character_id: character.id,
    actor_name: character.name,
    actor_hp: Number(character.hp || 1),
    actor_max_hp: Number(character.max_hp || 100),
    actor_energy: Number(character.energy || 50),
    monster_id: monster.id,
    monster_name: monster.name,
    monster_species: monster.species,
    monster_hp: Number(monster.hp || 1),
    monster_max_hp: Number(monster.max_hp || monster.hp || 1),
    cooldowns: {},
    effects: [],
    combat_log: ["Combat engaged."],
    nonce: crypto.randomUUID(),
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);
  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;
    assertAllowedKeys(payload, ["action", "session_id", "character_id", "monster_id", "ability_id", "intent", "idempotency_key"]);

    const action = mustString(payload.action, "action");
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    const previous = await findIdempotentResult(base44, user.id, "combat_action_success", idempotencyKey);
    if (previous?.result_json) return json({ ok: true, replay: true, ...previous.result_json });

    if (action === "start") {
      const characterId = mustString(payload.character_id, "character_id");
      const monsterId = mustString(payload.monster_id, "monster_id");
      const [character, monster] = await Promise.all([
        base44.asServiceRole.entities.Character.get(characterId),
        base44.asServiceRole.entities.Monster.get(monsterId),
      ]);
      if (!character || character.created_by !== user.email) throw new Error("Character ownership mismatch");
      if (!monster || !monster.is_alive) throw new Error("Monster unavailable");

      const session = await base44.asServiceRole.entities.CombatSession.create(buildSessionPayload(character, monster));
      const result = { session, phase: "active" };

      await createSecurityLog(base44, {
        action: "combat_action_success",
        actor_user_id: user.id,
        actor_email: user.email,
        ip,
        idempotency_key: idempotencyKey,
        result_json: result,
      });
      return json({ ok: true, ...result });
    }

    const sessionId = mustString(payload.session_id, "session_id");
    const session = await base44.asServiceRole.entities.CombatSession.get(sessionId);
    if (!session || session.status !== "active") throw new Error("Combat session is not active");

    const [character, monster] = await Promise.all([
      base44.asServiceRole.entities.Character.get(session.actor_character_id),
      base44.asServiceRole.entities.Monster.get(session.monster_id),
    ]);
    if (!character || character.created_by !== user.email) throw new Error("Character ownership mismatch");
    if (!monster) throw new Error("Monster missing");

    let actorHp = Number(session.actor_hp || character.hp || 1);
    let actorEnergy = Number(session.actor_energy || character.energy || 50);
    let monsterHp = Number(session.monster_hp || monster.hp || 1);

    const combatLog = Array.isArray(session.combat_log) ? [...session.combat_log] : [];

    if (action === "retreat") {
      await base44.asServiceRole.entities.CombatSession.update(sessionId, {
        status: "retreated",
        combat_log: [...combatLog, "Player retreated."],
      });
      const result = { session_id: sessionId, status: "retreated" };
      return json({ ok: true, ...result });
    }

    const ability = pickCombatAbility(character, typeof payload.ability_id === "string" ? payload.ability_id : undefined) || {
      id: "basic_attack",
      name: "Basic Attack",
      effect_type: "damage",
      effect_magnitude: 100,
      energy_cost: 0,
    };

    const cost = Number(ability.energy_cost || 0);
    if (actorEnergy < cost) throw new Error("Not enough energy");

    actorEnergy -= cost;

    const playerStats = playerCombatStats(character);
    const monsterStats = monsterCombatStats(monster);

    const pHit = calcAttackDamage(playerStats, {
      ...monsterStats,
      hp: monsterHp,
    }, ability);

    if (pHit.evaded) {
      combatLog.push(`${monster.name} evaded ${ability.name}.`);
    } else {
      monsterHp = Math.max(0, monsterHp - pHit.damage);
      combatLog.push(`${character.name} used ${ability.name} for ${pHit.damage}${pHit.isCrit ? " (CRIT)" : ""}.`);
    }

    let status = "active";
    let reward: Record<string, number> = { xp: 0, gold: 0 };

    if (monsterHp <= 0) {
      status = "victory";
      reward = { xp: xpReward(monster), gold: goldReward(monster) };

      await base44.asServiceRole.entities.Monster.update(monster.id, {
        is_alive: false,
        hp: 0,
        respawn_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      const updates = {
        xp: Number(character.xp || 0) + reward.xp,
        gold: Number(character.gold || 0) + reward.gold,
        energy: actorEnergy,
        hp: actorHp,
      };

      await base44.asServiceRole.entities.Character.update(character.id, updates);

      const spawn = await base44.asServiceRole.entities.MonsterSpawn.filter({ active_monster_id: monster.id }, "-updated_date", 1).catch(() => []);
      if (spawn[0]) {
        await base44.asServiceRole.entities.MonsterSpawn.update(spawn[0].id, {
          active_monster_id: null,
          next_respawn_at: new Date(Date.now() + Number(spawn[0].respawn_seconds || 900) * 1000).toISOString(),
        });
      }
    } else {
      // Monster retaliation
      const mAbility = { name: "Strike", effect_magnitude: 95, effect_type: "damage" };
      const mHit = calcAttackDamage({ ...monsterStats, hp: monsterHp }, playerStats, mAbility);
      if (mHit.evaded) {
        combatLog.push(`${character.name} evaded retaliation.`);
      } else {
        actorHp = Math.max(0, actorHp - mHit.damage);
        combatLog.push(`${monster.name} retaliated for ${mHit.damage}${mHit.isCrit ? " (CRIT)" : ""}.`);
      }

      if (actorHp <= 0) {
        status = "defeat";
        const penaltyGold = Math.floor(Number(character.gold || 0) * 0.05);
        await base44.asServiceRole.entities.Character.update(character.id, {
          hp: Math.max(1, Math.floor(Number(character.max_hp || 100) * 0.5)),
          x: 30,
          y: 25,
          gold: Math.max(0, Number(character.gold || 0) - penaltyGold),
          energy: Math.max(10, actorEnergy),
        });
      } else {
        await base44.asServiceRole.entities.Character.update(character.id, {
          hp: actorHp,
          energy: actorEnergy,
        });
      }
    }

    const updatedSession = await base44.asServiceRole.entities.CombatSession.update(sessionId, {
      actor_hp: actorHp,
      actor_energy: actorEnergy,
      monster_hp: monsterHp,
      round: Number(session.round || 1) + 1,
      status: status === "active" ? "active" : "resolved",
      resolution: status,
      reward,
      combat_log: combatLog.slice(-60),
      last_intent: String(payload.intent || action),
      last_intent_at: new Date().toISOString(),
    });

    const result = { session: updatedSession, status, reward };

    await createSecurityLog(base44, {
      action: "combat_action_success",
      actor_user_id: user.id,
      actor_email: user.email,
      ip,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "combat_action_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

