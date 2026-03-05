import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  isAdminOrGM,
  readJson,
  requireAuth,
  json,
} from "./_common.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;
    assertAllowedKeys(payload, ["action", "agent_ids", "task", "to_x", "to_y", "idempotency_key"]);

    const action = String(payload.action || "");
    const agentIds = Array.isArray(payload.agent_ids) ? payload.agent_ids.map(String).filter(Boolean) : [];
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;
    if (!action || agentIds.length === 0) throw new Error("Invalid bulk action payload");

    const previous = await findIdempotentResult(base44, user.id, "bulk_agent_action_success", idempotencyKey);
    if (previous?.result_json) return json({ ok: true, replay: true, ...previous.result_json });

    const agents = await Promise.all(agentIds.map((id) => base44.asServiceRole.entities.Character.get(id)));
    const allowed = agents.filter((a) => a && (a.created_by === user.email || isAdminOrGM(user)));
    const skipped = agentIds.filter((id) => !allowed.some((a) => a.id === id));

    let updated = 0;
    let deleted = 0;

    if (action === "move_to_town") {
      await Promise.all(allowed.map((agent) =>
        base44.asServiceRole.entities.Character.update(agent.id, {
          x: Number(payload.to_x ?? 30),
          y: Number(payload.to_y ?? 25),
          status: "idle",
        })
      ));
      updated = allowed.length;
    } else if (action === "assign_task") {
      const task = String(payload.task || "").slice(0, 60);
      await Promise.all(allowed.map((agent) =>
        base44.asServiceRole.entities.Character.update(agent.id, {
          status: "assigned_task",
          current_task: task,
        })
      ));
      updated = allowed.length;
    } else if (action === "delete") {
      await Promise.all(allowed.map((agent) => base44.asServiceRole.entities.Character.delete(agent.id)));
      deleted = allowed.length;
    } else {
      throw new Error("Unknown action");
    }

    const result = { action, updated, deleted, skipped_ids: skipped };
    await createSecurityLog(base44, {
      action: "bulk_agent_action_success",
      actor_user_id: user.id,
      actor_email: user.email,
      ip,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "bulk_agent_action_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

