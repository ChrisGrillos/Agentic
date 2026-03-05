export const COMBAT_INTENTS = {
  swing_left: "swing_left",
  swing_right: "swing_right",
  guard_left: "guard_left",
  guard_right: "guard_right",
  feint: "feint",
  ability_cast: "ability_cast",
  retreat: "retreat",
  attack: "attack",
};

export const INTENT_SET = new Set(Object.values(COMBAT_INTENTS));

export function normalizeVec(input) {
  const x = Number(input?.x || 0);
  const y = Number(input?.y || 0);
  const mag = Math.sqrt((x * x) + (y * y));
  if (!Number.isFinite(mag) || mag <= 0.0001) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

export function sideVector(side) {
  if (side === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

export function clampTs(ts) {
  const n = Number(ts || Date.now());
  return Number.isFinite(n) ? n : Date.now();
}
