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

const VALID_INTENTS = new Set([
  "swing_left",
  "swing_right",
  "guard_left",
  "guard_right",
  "feint",
  "ability_cast",
  "attack",
  "retreat",
]);

function normalizeVec(input: any) {
  const x = Number(input?.x || 0);
  const y = Number(input?.y || 0);
  const mag = Math.sqrt((x * x) + (y * y));
  if (!Number.isFinite(mag) || mag <= 0.0001) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

function sideFromIntent(intent: string) {
  if (intent.includes("left")) return "left";
  if (intent.includes("right")) return "right";
  return null;
}

function expectedSideVec(side: string) {
  return side === "left" ? { x: -1, y: 0 } : { x: 1, y: 0 };
}

function angleBonus(side: string, vec: { x: number; y: number }) {
  if (!side) return 0;
  const expected = expectedSideVec(side);
  const dot = (vec.x * expected.x) + (vec.y * expected.y);
  if (dot >= 0.8) return 0.2;
  if (dot >= 0.5) return 0.1;
  if (dot <= -0.2) return -0.12;
  return 0;
}

function inRange(character: any, monster: any) {
  const dx = Math.abs(Number(character?.x || 0) - Number(monster?.x || 0));
  const dy = Math.abs(Number(character?.y || 0) - Number(monster?.y || 0));
  return (dx + dy) <= 1;
}

function buildSessionPayload(character: any, monster: any) {
  const nextSide = Math.random() < 0.5 ? "left" : "right";
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
    next_monster_swing_side: nextSide,
    next_monster_windup_at: new Date(Date.now() + 1200).toISOString(),
    guard_state: null,
    guard_vector: null,
    guard_at: null,
    nonce: crypto.randomUUID(),
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;
    assertAllowedKeys(payload, [
      "action",
      "session_id",
      "character_id",
      "monster_id",
      "ability_id",
      "intent",
      "mouse_vector",
      "guard_vector",
      "timestamp",
      "idempotency_key",
    ]);

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
      if (!inRange(character, monster)) throw new Error("Target out of range");

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
    if (!inRange(character, monster)) throw new Error("Target out of range");

    const now = Date.now();
    const ts = Number(payload.timestamp || now);
    if (Math.abs(now - ts) > 5000) {
      await createSecurityLog(base44, {
        action: "combat_action_blocked",
        actor_user_id: user.id,
        actor_email: user.email,
        ip,
        reason: "stale_or_future_timestamp",
        target_id: sessionId,
      });
      throw new Error("Invalid timing");
    }

    const intentRaw = String(payload.intent || (action === "retreat" ? "retreat" : "attack"));
    if (!VALID_INTENTS.has(intentRaw)) throw new Error("Invalid intent");

    let actorHp = Number(session.actor_hp || character.hp || 1);
    let actorEnergy = Number(session.actor_energy || character.energy || 50);
    let monsterHp = Number(session.monster_hp || monster.hp || 1);
    const combatLog = Array.isArray(session.combat_log) ? [...session.combat_log] : [];

    if (action === "retreat" || intentRaw === "retreat") {
      const updated = await base44.asServiceRole.entities.CombatSession.update(sessionId, {
        status: "retreated",
        combat_log: [...combatLog, "Player retreated."],
        last_intent: "retreat",
        last_intent_at: new Date().toISOString(),
      });
      return json({ ok: true, session: updated, status: "retreated" });
    }

    const mouseVec = normalizeVec(payload.mouse_vector);
    const guardVec = normalizeVec(payload.guard_vector || payload.mouse_vector);

    let guardState = session.guard_state || null;
    let guardAt = session.guard_at || null;
    let guardVector = session.guard_vector || null;

    const playerStats = playerCombatStats(character);
    const monsterStats = monsterCombatStats(monster);

    let didPlayerAttack = false;

    if (intentRaw === "guard_left" || intentRaw === "guard_right") {
      guardState = sideFromIntent(intentRaw);
      guardAt = new Date().toISOString();
      guardVector = guardVec;
      combatLog.push(`${character.name} holds ${guardState} guard.`);
    } else {
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

      if (intentRaw === "feint") {
        const feintDamage = Math.max(1, Math.floor((ability.effect_magnitude || 40) * 0.35));
        monsterHp = Math.max(0, monsterHp - feintDamage);
        combatLog.push(`${character.name} feinted and chipped ${monster.name} for ${feintDamage}.`);
        didPlayerAttack = true;
      } else {
        const swingSide = sideFromIntent(intentRaw);
        const sideMult = swingSide ? (1 + angleBonus(swingSide, mouseVec)) : 1;
        const tunedAbility = { ...ability, effect_magnitude: Math.max(1, Math.floor((ability.effect_magnitude || 100) * sideMult)) };

        const pHit = calcAttackDamage(playerStats, { ...monsterStats, hp: monsterHp }, tunedAbility);
        if (pHit.evaded) {
          combatLog.push(`${monster.name} evaded ${ability.name}.`);
        } else {
          monsterHp = Math.max(0, monsterHp - pHit.damage);
          combatLog.push(`${character.name} ${intentRaw.replace("_", " ")} hit for ${pHit.damage}${pHit.isCrit ? " (CRIT)" : ""}.`);
          didPlayerAttack = true;
        }
      }
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

      await base44.asServiceRole.entities.Character.update(character.id, {
        xp: Number(character.xp || 0) + reward.xp,
        gold: Number(character.gold || 0) + reward.gold,
        energy: actorEnergy,
        hp: actorHp,
      });

      const spawn = await base44.asServiceRole.entities.MonsterSpawn.filter({ active_monster_id: monster.id }, "-updated_date", 1).catch(() => []);
      if (spawn[0]) {
        await base44.asServiceRole.entities.MonsterSpawn.update(spawn[0].id, {
          active_monster_id: null,
          next_respawn_at: new Date(Date.now() + Number(spawn[0].respawn_seconds || 900) * 1000).toISOString(),
        });
      }
    } else {
      const telegraphSide = session.next_monster_swing_side || (Math.random() < 0.5 ? "left" : "right");
      const windupAt = new Date(session.next_monster_windup_at || new Date()).getTime();
      const guardTs = guardAt ? new Date(guardAt).getTime() : 0;
      const parryTiming = guardTs > 0 && Math.abs(guardTs - windupAt) <= 700;
      const parrySide = guardState && guardState === telegraphSide;
      let mitigation = 0;

      if (parrySide && parryTiming) {
        const exp = expectedSideVec(telegraphSide);
        const gv = normalizeVec(guardVector || guardVec);
        const dot = (gv.x * exp.x) + (gv.y * exp.y);
        mitigation = dot > 0.8 ? 0.85 : dot > 0.5 ? 0.65 : 0.45;
        combatLog.push(`${character.name} parried ${telegraphSide} swing.`);
      }

      const mAbility = { name: `${telegraphSide} slash`, effect_magnitude: 95, effect_type: "damage" };
      const mHit = calcAttackDamage({ ...monsterStats, hp: monsterHp }, playerStats, mAbility);
      if (mHit.evaded) {
        combatLog.push(`${character.name} evaded retaliation.`);
      } else {
        const finalDamage = Math.max(0, Math.floor(mHit.damage * (1 - mitigation)));
        actorHp = Math.max(0, actorHp - finalDamage);
        combatLog.push(`${monster.name} telegraphed ${telegraphSide} strike for ${finalDamage}${mitigation > 0 ? " (mitigated)" : ""}.`);
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

    const nextTelegraph = Math.random() < 0.5 ? "left" : "right";
    const updatedSession = await base44.asServiceRole.entities.CombatSession.update(sessionId, {
      actor_hp: actorHp,
      actor_energy: actorEnergy,
      monster_hp: monsterHp,
      round: Number(session.round || 1) + 1,
      status: status === "active" ? "active" : "resolved",
      resolution: status,
      reward,
      combat_log: combatLog.slice(-70),
      guard_state: guardState,
      guard_vector: guardVector,
      guard_at: guardAt,
      next_monster_swing_side: nextTelegraph,
      next_monster_windup_at: new Date(Date.now() + 1200).toISOString(),
      last_intent: intentRaw,
      last_intent_at: new Date().toISOString(),
      last_mouse_vector: mouseVec,
      last_guard_vector: guardVec,
      did_player_attack: didPlayerAttack,
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
      reason: String((error as any)?.message || error),
    });
    return json({ ok: false, error: String((error as any)?.message || error) }, 400);
  }
});
