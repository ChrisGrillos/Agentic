import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  checkRateLimit,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  mustString,
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
    assertAllowedKeys(payload, [
      "title",
      "description",
      "category",
      "cycle_number",
      "voting_ends_at",
      "proposed_by_character_id",
      "idempotency_key",
    ]);

    const title = mustString(payload.title, "title").slice(0, 120);
    const description = mustString(payload.description, "description").slice(0, 2000);
    const category = mustString(payload.category, "category");
    const characterId = mustString(payload.proposed_by_character_id, "proposed_by_character_id");
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    const prior = await findIdempotentResult(base44, user.id, "create_proposal_success", idempotencyKey);
    if (prior?.result_json) return json({ ok: true, replay: true, ...prior.result_json });

    const rate = await checkRateLimit(base44, {
      action: "create_proposal_attempt",
      actorUserId: user.id,
      ip,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rate.allowed) return json({ ok: false, error: "Rate limit exceeded" }, 429);

    const character = await base44.asServiceRole.entities.Character.get(characterId);
    if (!character) throw new Error("Character not found");
    if (character.created_by !== user.email) throw new Error("Character ownership mismatch");

    const proposal = await base44.asServiceRole.entities.GovernanceProposal.create({
      title,
      description,
      proposed_by_character_id: character.id,
      proposed_by_name: character.name,
      category,
      status: "active",
      votes_for: 0,
      votes_against: 0,
      weighted_for: 0,
      weighted_against: 0,
      voting_ends_at: typeof payload.voting_ends_at === "string" ? payload.voting_ends_at : undefined,
      cycle_number: Number(payload.cycle_number || 1),
    });

    const result = { proposal_id: proposal.id };
    await createSecurityLog(base44, {
      action: "create_proposal_success",
      actor_user_id: user.id,
      actor_email: user.email,
      ip,
      character_id: character.id,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "create_proposal_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

