import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  checkRateLimit,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  json,
  mustString,
  readJson,
  requireAuth,
} from "./_common.ts";

function isIsoDate(value: string) {
  const t = new Date(value).getTime();
  return Number.isFinite(t);
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
    assertAllowedKeys(payload, ["event_type", "entity_id", "timestamp", "metadata", "idempotency_key"]);

    const eventType = mustString(payload.event_type, "event_type");
    const entityId = mustString(payload.entity_id, "entity_id");
    const timestamp = mustString(payload.timestamp, "timestamp");
    const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    if (!isIsoDate(timestamp)) {
      throw new Error("Invalid timestamp");
    }

    const previous = await findIdempotentResult(base44, user.id, "creator_event_hook_success", idempotencyKey);
    if (previous?.result_json) {
      return json({ ok: true, result: previous.result_json, replay: true });
    }

    const rate = await checkRateLimit(base44, {
      action: "creator_event_hook_attempt",
      actorUserId: user.id,
      ip,
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rate.allowed) {
      await createSecurityLog(base44, {
        action: "creator_event_hook_blocked",
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role || "player",
        ip,
        reason: "rate_limited",
        idempotency_key: idempotencyKey,
      });
      return json({ ok: false, code: "rate_limited", error: "Rate limit exceeded" }, 429);
    }

    await createSecurityLog(base44, {
      action: "creator_event_hook_attempt",
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role || "player",
      ip,
      idempotency_key: idempotencyKey,
      reason: eventType,
    });

    const markerId = crypto.randomUUID();
    const result = {
      implemented: false,
      marker_id: markerId,
      event_type: eventType,
      entity_id: entityId,
      timestamp,
      metadata,
      message: "creatorEventHook stub accepted. Marker pipeline implementation is pending.",
    };

    await createSecurityLog(base44, {
      action: "creator_event_hook_success",
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role || "player",
      ip,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "creator_event_hook_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, code: "bad_request", error: String(error?.message || error) }, 400);
  }
});

