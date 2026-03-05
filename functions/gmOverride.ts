import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  createSecurityLog,
  getClientIp,
  isAdminOrGM,
  isOwner,
  mustString,
  readJson,
  requireAuth,
  json,
} from "./_common.ts";

function isOwnerOnlyAction(action: string) {
  return ["force_reset_world", "force_pause_world"].includes(action);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);
  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;
    assertAllowedKeys(payload, ["action", "target_id", "reason"]);

    const action = mustString(payload.action, "action");
    const targetId = typeof payload.target_id === "string" ? payload.target_id : "";
    const reason = typeof payload.reason === "string" ? payload.reason.slice(0, 500) : "";

    if (!isAdminOrGM(user)) throw new Error("Insufficient role");
    if (isOwnerOnlyAction(action) && !isOwner(user)) throw new Error("Owner-only action");

    let result: Record<string, unknown> = { action, target_id: targetId };

    if (action === "resolve_event") {
      await base44.asServiceRole.entities.WorldEvent.update(targetId, { status: "resolved", outcome: "[GM Override] Manually resolved." });
    } else if (action === "pass_proposal") {
      await base44.asServiceRole.entities.GovernanceProposal.update(targetId, { status: "passed" });
    } else if (action === "reject_proposal") {
      await base44.asServiceRole.entities.GovernanceProposal.update(targetId, { status: "rejected" });
    } else if (action === "clear_proposal_votes") {
      const votes = await base44.asServiceRole.entities.Vote.filter({ proposal_id: targetId }, "-created_date", 500);
      await Promise.all(votes.map((v: any) => base44.asServiceRole.entities.Vote.delete(v.id)));
      await base44.asServiceRole.entities.GovernanceProposal.update(targetId, {
        votes_for: 0,
        votes_against: 0,
        weighted_for: 0,
        weighted_against: 0,
      });
      result.cleared_votes = votes.length;
    } else if (action === "delete_agent") {
      await base44.asServiceRole.entities.Character.delete(targetId);
    } else if (action === "reset_agent_to_town") {
      const agent = await base44.asServiceRole.entities.Character.get(targetId);
      await base44.asServiceRole.entities.Character.update(targetId, {
        x: 30,
        y: 25,
        status: "idle",
        hp: agent?.max_hp || 100,
      });
    } else {
      throw new Error("Unknown override action");
    }

    await createSecurityLog(base44, {
      action: "gm_override",
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      ip,
      reason,
      override_action: action,
      target_id: targetId,
      result_json: result,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "gm_override_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

