import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function assertAllowedKeys(payload: Record<string, unknown>, allowed: string[]) {
  const unknown = Object.keys(payload).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new Error(`Unknown fields: ${unknown.join(", ")}`);
  }
}

export function mustString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field}`);
  }
  return value.trim();
}

export function nowMs() {
  return Date.now();
}

export function hoursBetween(isoLike: string | undefined, now = Date.now()) {
  if (!isoLike) return 0;
  const t = new Date(isoLike).getTime();
  if (!Number.isFinite(t)) return 0;
  return (now - t) / (1000 * 60 * 60);
}

export function uniqueBy<T>(arr: T[], keyFn: (v: T) => string) {
  const m = new Map<string, T>();
  for (const item of arr) m.set(keyFn(item), item);
  return [...m.values()];
}

export async function createSecurityLog(base44: any, row: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.SecurityLog.create({
      timestamp: new Date().toISOString(),
      ...row,
    });
  } catch {
    // keep fail-open semantics
  }
}

export async function findIdempotentResult(base44: any, actorUserId: string, action: string, idempotencyKey?: string) {
  if (!idempotencyKey) return null;
  const logs = await base44.asServiceRole.entities.SecurityLog.filter({
    actor_user_id: actorUserId,
    action,
    idempotency_key: idempotencyKey,
  }, "-created_date", 1).catch(() => []);
  return logs?.[0] || null;
}

export function parseOwnerEmail() {
  return (Deno.env.get("OWNER_EMAIL") || "OWNER_EMAIL_HERE").toLowerCase();
}

export function hasRole(user: any, role: string) {
  return user?.role === role;
}

export function isOwner(user: any) {
  const email = String(user?.email || "").toLowerCase();
  return !!email && email === parseOwnerEmail();
}

export function isAdminOrGM(user: any) {
  return isOwner(user) || hasRole(user, "admin") || hasRole(user, "game_master");
}

export async function requireAuth(base44: any) {
  const ok = await base44.auth.isAuthenticated().catch(() => false);
  if (!ok) throw new Error("Unauthorized");
  return base44.auth.me();
}

export async function getRecentLogs(base44: any, action: string, sinceMs: number) {
  const all = await base44.asServiceRole.entities.SecurityLog.filter({ action }, "-created_date", 500).catch(() => []);
  const cutoff = Date.now() - sinceMs;
  return all.filter((row: any) => new Date(row.created_date || row.timestamp || 0).getTime() >= cutoff);
}

export async function checkRateLimit(base44: any, params: {
  action: string;
  actorUserId?: string;
  ip?: string;
  limit: number;
  windowMs: number;
}) {
  const logs = await getRecentLogs(base44, params.action, params.windowMs);
  const count = logs.filter((l: any) => {
    if (params.actorUserId && l.actor_user_id === params.actorUserId) return true;
    if (params.ip && l.ip === params.ip) return true;
    return false;
  }).length;
  return { allowed: count < params.limit, count };
}

export function pickCombatAbility(character: any, abilityId?: string) {
  const all = Array.isArray(character?.abilities) ? character.abilities : [];
  if (!abilityId) return all.find((a: any) => a?.type !== "passive") || null;
  return all.find((a: any) => a?.id === abilityId) || null;
}

