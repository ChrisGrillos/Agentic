/**
 * MOVEMENT AUTHORITY
 *
 * Single source of truth for all movement validation and pathfinding.
 * All input surfaces (WASD, click-to-move, 3D scene) MUST route through here.
 * No movement logic should exist in WorldMap, WorldScene3D, or useInputController.
 */

import { getTile, getZoneAt, MAP_W, MAP_H } from "./worldZones";
import { isSafeZone } from "./worldRules";

// ─── TILE VALIDATION ──────────────────────────────────────────────────────────

/**
 * Returns true if a tile is passable (not water, within bounds).
 */
export function isPassable(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
  return getTile(x, y) !== "water";
}

/**
 * Returns the movement cost of a tile (1 = normal, 2 = forest/swamp, 3 = stone/lava).
 */
export function moveCost(x, y) {
  const tile = getTile(x, y);
  if (tile === "forest" || tile === "swamp") return 2;
  if (tile === "stone"  || tile === "lava")  return 3;
  return 1;
}

// ─── ZONE CONTEXT ─────────────────────────────────────────────────────────────

/**
 * Returns { zone, isSafe } for a position.
 */
export function getMovementContext(x, y) {
  const zone = getZoneAt(x, y);
  return {
    zone,
    isSafe: isSafeZone(x, y),
    zoneId: zone?.id || null,
  };
}

// ─── PATHFINDER ───────────────────────────────────────────────────────────────

/**
 * BFS pathfinder. Returns array of [x, y] steps from (x0,y0) to (x1,y1),
 * not including start tile, or [] if unreachable.
 * Maximum path length capped at maxSteps to prevent lag on huge maps.
 */
export function buildPath(x0, y0, x1, y1, maxSteps = 60) {
  if (x0 === x1 && y0 === y1) return [];
  if (!isPassable(x1, y1)) return [];

  const key = (x, y) => `${x},${y}`;
  const queue = [[x0, y0]];
  const visited = new Set([key(x0, y0)]);
  const parent = {};
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length) {
    const [cx, cy] = queue.shift();

    if (cx === x1 && cy === y1) {
      // Reconstruct path
      const path = [];
      let cur = key(x1, y1);
      const start = key(x0, y0);
      while (cur !== start) {
        const [px, py] = cur.split(",").map(Number);
        path.unshift([px, py]);
        cur = parent[cur];
      }
      return path;
    }

    if (visited.size > maxSteps * 4) break; // Safety cap

    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      const k = key(nx, ny);
      if (visited.has(k)) continue;
      if (!isPassable(nx, ny)) continue;
      visited.add(k);
      parent[k] = key(cx, cy);
      queue.push([nx, ny]);
    }
  }

  return []; // Unreachable
}

// ─── STEP VALIDATION ──────────────────────────────────────────────────────────

/**
 * Validate a single step from (fromX, fromY) to (toX, toY).
 * Returns { valid: boolean, reason?: string }
 */
export function validateStep(fromX, fromY, toX, toY) {
  // Must be adjacent (no diagonal)
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  if (dx + dy !== 1) {
    return { valid: false, reason: "Not an adjacent tile" };
  }
  if (!isPassable(toX, toY)) {
    return { valid: false, reason: "Tile is not passable" };
  }
  return { valid: true };
}

// ─── ENERGY REGEN ON MOVEMENT ─────────────────────────────────────────────────

/**
 * Calculate energy regen for a single movement step (out of combat).
 */
export function movementEnergyRegen(character) {
  const wisdomMax = 50 + ((character.stats?.wisdom || 10) * 2);
  const current = character.energy ?? wisdomMax;
  const next = Math.min(wisdomMax, current + 5);
  return { energy: next, maxEnergy: wisdomMax };
}