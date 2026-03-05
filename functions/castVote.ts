import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";
import {
  assertAllowedKeys,
  checkRateLimit,
  createSecurityLog,
  findIdempotentResult,
  getClientIp,
  mustString,
  nowMs,
  readJson,
  requireAuth,
  json,
  hoursBetween,
} from "./_common.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const ip = getClientIp(req);

  try {
    const user = await requireAuth(base44);
    const payload = await readJson(req) as Record<string, unknown>;
    assertAllowedKeys(payload, ["proposal_id", "character_id", "choice", "reasoning", "idempotency_key"]);

    const proposalId = mustString(payload.proposal_id, "proposal_id");
    const characterId = mustString(payload.character_id, "character_id");
    const choice = mustString(payload.choice, "choice");
    const reasoning = typeof payload.reasoning === "string" ? payload.reasoning.slice(0, 400) : "";
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    if (!["for", "against"].includes(choice)) throw new Error("Invalid choice");

    const previous = await findIdempotentResult(base44, user.id, "cast_vote_success", idempotencyKey);
    if (previous?.result_json) return json({ ok: true, replay: true, ...previous.result_json });

    const rate = await checkRateLimit(base44, {
      action: "cast_vote_attempt",
      actorUserId: user.id,
      ip,
      limit: 20,
      windowMs: 5 * 60 * 1000,
    });

    if (!rate.allowed) {
      await createSecurityLog(base44, {
        action: "cast_vote_blocked",
        actor_user_id: user.id,
        actor_email: user.email,
        ip,
        reason: "rate_limited",
        proposal_id: proposalId,
        character_id: characterId,
        idempotency_key: idempotencyKey,
      });
      return json({ ok: false, error: "Rate limit exceeded" }, 429);
    }

    await createSecurityLog(base44, {
      action: "cast_vote_attempt",
      actor_user_id: user.id,
      actor_email: user.email,
      ip,
      proposal_id: proposalId,
      character_id: characterId,
      idempotency_key: idempotencyKey,
    });

    const [proposal, character] = await Promise.all([
      base44.asServiceRole.entities.GovernanceProposal.get(proposalId),
      base44.asServiceRole.entities.Character.get(characterId),
    ]);

    if (!proposal || proposal.status !== "active") throw new Error("Proposal is not active");
    if (!character) throw new Error("Character not found");
    if (character.created_by !== user.email) throw new Error("Character ownership mismatch");

    const ageHours = hoursBetween(character.created_date, nowMs());
    if ((character.level || 1) < 2) throw new Error("Character must be level 2+");
    if (ageHours < 24) throw new Error("Character must be 24h old");

    const existing = await base44.asServiceRole.entities.Vote.filter({
      proposal_id: proposalId,
      character_id: characterId,
    }, "-created_date", 1);
    if (existing.length > 0) throw new Error("Already voted");

    const allVotes = await base44.asServiceRole.entities.Vote.filter({ proposal_id: proposalId }, "-created_date", 500);
    const aiVotes = allVotes.filter((v: any) => v.character_type === "ai_agent").length;
    if (character.type === "ai_agent") {
      const projected = ((aiVotes + 1) / (allVotes.length + 1)) * 100;
      if (projected > 30) throw new Error("AI vote cap reached");
    }

    const votingPower = Math.min(5, Number((1 + (character.level || 1) * 0.1).toFixed(2)));
    const vote = await base44.asServiceRole.entities.Vote.create({
      proposal_id: proposalId,
      character_id: characterId,
      character_name: character.name,
      character_type: character.type,
      choice,
      reasoning,
      voting_power: votingPower,
    });

    const proposalUpdates: Record<string, number> = {
      votes_for: (proposal.votes_for || 0) + (choice === "for" ? 1 : 0),
      votes_against: (proposal.votes_against || 0) + (choice === "against" ? 1 : 0),
      weighted_for: (proposal.weighted_for || 0) + (choice === "for" ? votingPower : 0),
      weighted_against: (proposal.weighted_against || 0) + (choice === "against" ? votingPower : 0),
    };

    await base44.asServiceRole.entities.GovernanceProposal.update(proposalId, proposalUpdates);

    const result = { vote_id: vote.id, proposal_updates: proposalUpdates };
    await createSecurityLog(base44, {
      action: "cast_vote_success",
      actor_user_id: user.id,
      actor_email: user.email,
      ip,
      proposal_id: proposalId,
      character_id: characterId,
      idempotency_key: idempotencyKey,
      result_json: result,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    await createSecurityLog(base44, {
      action: "cast_vote_error",
      ip,
      reason: String(error?.message || error),
    });
    return json({ ok: false, error: String(error?.message || error) }, 400);
  }
});

