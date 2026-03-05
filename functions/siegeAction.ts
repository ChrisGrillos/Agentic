import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  isAdminOrGM,
  json,
  mustString,
  readJson,
  requireAuth,
} from "./_common.ts";

const ALLOWED_ACTIONS = ["declare", "start_phase", "damage_objective", "repair_objective", "end_phase"];
const GM_ONLY_ACTIONS = ["start_phase", "damage_objective", "repair_objective", "end_phase"];
const OFFICER_RANKS = ["leader", "officer"];

function objectiveDelta(objectiveId: string, requestedAmount?: number) {
  if (Number.isFinite(requestedAmount) && (requestedAmount as number) > 0) {
    return Math.floor(requestedAmount as number);
  }
  if (objectiveId === "wall") return 12;
  if (objectiveId === "gate") return 20;
  if (objectiveId === "core") return 35;
  return 10;
}

async function actorCanDeclare(base44: any, user: any, guild: any) {
  if (isAdminOrGM(user)) return true;

  const chars = await base44.asServiceRole.entities.Character.filter({
    created_by: user.email,
    type: "human",
  }, "-created_date", 20).catch(() => []);

  const idSet = new Set(chars.map((c: any) => c.id));
  const members = Array.isArray(guild?.members) ? guild.members : [];
  const rank = members.find((m: any) => idSet.has(m.character_id))?.rank;

  return OFFICER_RANKS.includes(String(rank || ""));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  if (req.method !== "POST") {
    return json({ ok: false, code: "method_not_allowed", error: "Method not allowed" }, 405);
  }

  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;

    assertAllowedKeys(payload, [
      "action_type",
      "city_id",
      "guild_id",
      "target_guild_id",
      "objective_id",
      "amount",
      "reason",
      "idempotency_key",
    ]);

    const actionType = mustString(payload.action_type, "action_type");
    const cityId = typeof payload.city_id === "string" ? payload.city_id : "";
    const guildId = typeof payload.guild_id === "string" ? payload.guild_id : "";
    const targetGuildId = typeof payload.target_guild_id === "string" ? payload.target_guild_id : "";
    const objectiveId = typeof payload.objective_id === "string" ? payload.objective_id : "";
    const amount = typeof payload.amount === "number" ? payload.amount : undefined;
    const reason = typeof payload.reason === "string" ? payload.reason.slice(0, 240) : "";
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    if (!ALLOWED_ACTIONS.includes(actionType)) {
      await createSecurityLog(base44, {
        action: "siege_action_blocked",
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role || "player",
        ip,
        reason: "invalid_action_type",
        idempotency_key: idempotencyKey,
      });
      return json({ ok: false, code: "invalid_action_type", error: "Invalid action_type" }, 400);
    }

    if (GM_ONLY_ACTIONS.includes(actionType) && !isAdminOrGM(user)) {
      await createSecurityLog(base44, {
        action: "siege_action_blocked",
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role || "player",
        ip,
        reason: "insufficient_permissions",
        idempotency_key: idempotencyKey,
      });
      return json({ ok: false, code: "forbidden", error: "Insufficient permissions" }, 403);
    }

    const previous = await findIdempotentResult(base44, user.id, `siege_action_success_${actionType}`, idempotencyKey);
    if (previous?.result_json) {
      return json({ ok: true, result: previous.result_json, replay: true });
    }

    if (!guildId) throw new Error("Invalid guild_id");

    const guild = await base44.asServiceRole.entities.Guild.get(guildId);
    if (!guild) throw new Error("Guild not found");

    let result: Record<string, unknown> = {
      implemented: true,
      action_type: actionType,
      city_id: cityId || null,
      guild_id: guildId,
      objective_id: objectiveId || null,
    };

    if (actionType === "declare") {
      if (!targetGuildId) throw new Error("Invalid target_guild_id");
      if (targetGuildId === guildId) throw new Error("Cannot target same guild");

      const targetGuild = await base44.asServiceRole.entities.Guild.get(targetGuildId);
      if (!targetGuild) throw new Error("Target guild not found");

      const canDeclare = await actorCanDeclare(base44, user, guild);
      if (!canDeclare) throw new Error("Only officers/leaders can declare siege intent");

      if (guild.war_status !== "peace" || targetGuild.war_status !== "peace") {
        throw new Error("One of the guilds is already in conflict");
      }

      const warReason = reason || `Siege declaration from ${guild.name} against ${targetGuild.name}`;

      await Promise.all([
        base44.asServiceRole.entities.Guild.update(guild.id, {
          war_status: "war",
          at_war_with_guild_id: targetGuild.id,
          at_war_with_guild_name: targetGuild.name,
          war_reason: warReason,
          war_score: 0,
        }),
        base44.asServiceRole.entities.Guild.update(targetGuild.id, {
          war_status: "war",
          at_war_with_guild_id: guild.id,
          at_war_with_guild_name: guild.name,
          war_reason: warReason,
          war_score: 0,
        }),
      ]);

      await Promise.all([
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: guild.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] Declared against ${targetGuild.name}. War has begun.`,
          message_type: "war_declaration",
        }),
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: targetGuild.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] ${guild.name} declared siege intent. Prepare defenses.`,
          message_type: "war_declaration",
        }),
      ]);

      result = {
        ...result,
        target_guild_id: targetGuild.id,
        status: "war",
        message: "Siege declared. Conflict moved to war state.",
      };
    } else if (actionType === "start_phase") {
      if (!guild.at_war_with_guild_id) throw new Error("Guild has no active enemy");

      const enemy = await base44.asServiceRole.entities.Guild.get(guild.at_war_with_guild_id);
      if (!enemy) throw new Error("Enemy guild not found");

      await Promise.all([
        base44.asServiceRole.entities.Guild.update(guild.id, { war_status: "siege" }),
        base44.asServiceRole.entities.Guild.update(enemy.id, { war_status: "siege" }),
      ]);

      await Promise.all([
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: guild.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] Phase started against ${enemy.name}.`,
          message_type: "war_declaration",
        }),
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: enemy.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] ${guild.name} initiated live siege phase.`,
          message_type: "war_declaration",
        }),
      ]);

      result = {
        ...result,
        target_guild_id: enemy.id,
        status: "siege",
        message: "Siege phase started.",
      };
    } else if (actionType === "damage_objective") {
      if (!guild.at_war_with_guild_id) throw new Error("Guild has no active enemy");
      if (guild.war_status !== "siege") throw new Error("Guild is not in siege phase");

      const enemy = await base44.asServiceRole.entities.Guild.get(guild.at_war_with_guild_id);
      if (!enemy) throw new Error("Enemy guild not found");

      const delta = objectiveDelta(objectiveId, amount);
      const nextScore = Number(guild.war_score || 0) + delta;

      await base44.asServiceRole.entities.Guild.update(guild.id, { war_score: nextScore });

      await Promise.all([
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: guild.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] Objective ${objectiveId || "unknown"} damaged for +${delta} war score.`,
          message_type: "war_declaration",
        }),
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: enemy.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: `[SIEGE] ${guild.name} damaged objective ${objectiveId || "unknown"}.`,
          message_type: "war_declaration",
        }),
      ]);

      if (nextScore >= 100) {
        const enemyHallTier = Math.max(0, Number(enemy.hall_tier || 0) - (objectiveId === "core" ? 1 : 0));

        await Promise.all([
          base44.asServiceRole.entities.Guild.update(guild.id, {
            war_status: "peace",
            at_war_with_guild_id: "",
            at_war_with_guild_name: "",
            war_reason: "",
            war_score: 0,
          }),
          base44.asServiceRole.entities.Guild.update(enemy.id, {
            war_status: "peace",
            at_war_with_guild_id: "",
            at_war_with_guild_name: "",
            war_reason: "",
            war_score: 0,
            hall_tier: enemyHallTier,
          }),
        ]);

        await Promise.all([
          base44.asServiceRole.entities.GuildMessage.create({
            guild_id: guild.id,
            character_id: "",
            character_name: "System",
            character_type: "human",
            message: `[SIEGE] Victory achieved over ${enemy.name}. Conflict resolved.`,
            message_type: "war_declaration",
          }),
          base44.asServiceRole.entities.GuildMessage.create({
            guild_id: enemy.id,
            character_id: "",
            character_name: "System",
            character_type: "human",
            message: `[SIEGE] ${guild.name} won the siege. Peace enforced after structural losses.`,
            message_type: "war_declaration",
          }),
        ]);

        result = {
          ...result,
          target_guild_id: enemy.id,
          status: "resolved_victory",
          objective_delta: delta,
          war_score: nextScore,
          enemy_hall_tier_after: enemyHallTier,
          message: "Siege objective damage resolved the conflict.",
        };
      } else {
        result = {
          ...result,
          target_guild_id: enemy.id,
          status: "siege",
          objective_delta: delta,
          war_score: nextScore,
          message: "Objective damage applied.",
        };
      }
    } else if (actionType === "repair_objective") {
      if (guild.war_status !== "siege") throw new Error("Guild is not in siege phase");

      const delta = objectiveDelta(objectiveId, amount);
      const nextScore = Math.max(0, Number(guild.war_score || 0) - delta);

      await base44.asServiceRole.entities.Guild.update(guild.id, { war_score: nextScore });
      await base44.asServiceRole.entities.GuildMessage.create({
        guild_id: guild.id,
        character_id: "",
        character_name: "System",
        character_type: "human",
        message: `[SIEGE] Objective ${objectiveId || "unknown"} repaired. War score -${delta}.`,
        message_type: "war_declaration",
      });

      result = {
        ...result,
        status: "siege",
        objective_delta: -delta,
        war_score: nextScore,
        message: "Objective repair applied.",
      };
    } else if (actionType === "end_phase") {
      if (!guild.at_war_with_guild_id) throw new Error("Guild has no active enemy");

      const enemy = await base44.asServiceRole.entities.Guild.get(guild.at_war_with_guild_id);
      if (!enemy) throw new Error("Enemy guild not found");

      await Promise.all([
        base44.asServiceRole.entities.Guild.update(guild.id, { war_status: "war" }),
        base44.asServiceRole.entities.Guild.update(enemy.id, { war_status: "war" }),
      ]);

      await Promise.all([
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: guild.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: "[SIEGE] Phase ended. Conflict remains in war state.",
          message_type: "war_declaration",
        }),
        base44.asServiceRole.entities.GuildMessage.create({
          guild_id: enemy.id,
          character_id: "",
          character_name: "System",
          character_type: "human",
          message: "[SIEGE] Active siege phase ended. War continues.",
          message_type: "war_declaration",
        }),
      ]);

      result = {
        ...result,
        target_guild_id: enemy.id,
        status: "war",
        message: "Siege phase ended; reverted to war state.",
      };
    }

    await createSecurityLog(base44, {
      action: `siege_action_success_${actionType}`,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role || "player",
      ip,
      reason,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "siege_action_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, code: "bad_request", error: String(error?.message || error) }, 400);
  }
});
