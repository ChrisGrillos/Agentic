import { base44 } from "@/api/base44Client";

function withKey(payload = {}) {
  return {
    ...payload,
    idempotency_key: payload.idempotency_key || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
  };
}

async function invoke(name, payload, idempotencyKey) {
  const body = idempotencyKey ? withKey({ ...payload, idempotency_key: idempotencyKey }) : withKey(payload);
  const res = await base44.functions.invoke(name, body);
  if (!res?.ok) {
    throw new Error(res?.error || `${name} failed`);
  }
  return res;
}

export const gameService = {
  castVote: (payload) => invoke("castVote", payload),
  createProposal: (payload) => invoke("createProposal", payload),
  bulkAgentAction: (payload) => invoke("bulkAgentAction", payload),
  gmOverride: (payload) => invoke("gmOverride", payload),
  combatAction: (payload) => invoke("combatAction", payload),
  worldTick: (payload = {}) => invoke("worldTick", payload),
  siegeAction: (payload, idempotencyKey) => invoke("siegeAction", payload, idempotencyKey),
  creatorEventHook: (payload, idempotencyKey) => invoke("creatorEventHook", payload, idempotencyKey),
};

export default gameService;

