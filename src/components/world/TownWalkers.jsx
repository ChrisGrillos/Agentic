/**
 * TownWalkers — Visual-only ambient NPC silhouettes for safehold areas.
 *
 * SCOPE:
 *   - Pure Three.js geometry layer. No entity records, no authority, no AI.
 *   - NPCs wander within defined town bounds using simple deterministic patrol
 *     routes with occasional pauses.
 *   - Reuses the same low-poly silhouette language as player characters.
 *
 * AUTHORITY:
 *   - Does NOT touch movementAuthority, combatAuthority, or any entity.
 *   - Movement is local Three.js only, never synced to DB.
 */

import * as THREE from "three";
// worldZones imported for future zone-based patrol clamping (zone IDs: high_bastion, etc.)
import { ZONES } from "@/components/shared/worldZones";

// ─── TILE → WORLD COORDS (must match WorldScene3D convention) ─────────────────
const TILE_SIZE = 2;
function tw(tx) { return tx * TILE_SIZE; }
function th(ty) { return ty * TILE_SIZE; }

// ─── NPC VISUAL PALETTE ───────────────────────────────────────────────────────
// Muted, slightly desaturated so they read as background population
const NPC_PALETTES = [
  { body: 0x8a6a50, accent: 0xc8a060, height: 0.92 }, // peasant warm
  { body: 0x5a6a7a, accent: 0x88aabb, height: 1.00 }, // townsperson cool
  { body: 0x7a5a40, accent: 0xb07848, height: 0.76 }, // short stout
  { body: 0x6a8060, accent: 0xa0c080, height: 1.04 }, // tall slender
  { body: 0x9a7060, accent: 0xd49070, height: 0.88 }, // warm neutral
];

// ─── SPAWN POINTS ─────────────────────────────────────────────────────────────
// Manually placed near logical landmarks within town_center zone (x:22-38, y:18-32)
// Groups: gate area, market row, inn surroundings, temple plaza, road patrol
const SPAWN_CONFIGS = [
  // Near North Gate (gate POI is at ~30,18)
  { wx: tw(30) + 1.5,  wz: th(20) + 0.5,  palette: 0, role: "gate_guard",  patrol: "gate_n",   speed: 0.6  },
  { wx: tw(29) - 1.0,  wz: th(20) - 1.0,  palette: 2, role: "passerby",    patrol: "gate_n",   speed: 0.9  },
  { wx: tw(31) + 0.5,  wz: th(21) + 0.5,  palette: 4, role: "passerby",    patrol: "gate_n",   speed: 0.75 },

  // Market / shop row (market POI ~34,20; woodshop ~29,29)
  { wx: tw(34) - 1.0,  wz: th(20) + 1.5,  palette: 1, role: "merchant",    patrol: "market",   speed: 0.5  },
  { wx: tw(34) + 1.5,  wz: th(20) - 1.0,  palette: 3, role: "merchant",    patrol: "market",   speed: 0.55 },
  { wx: tw(33) + 0.5,  wz: th(21) + 0.8,  palette: 0, role: "shopper",     patrol: "market",   speed: 0.8  },
  { wx: tw(35) - 0.5,  wz: th(22) - 0.5,  palette: 2, role: "shopper",     patrol: "market",   speed: 0.7  },

  // Inn area (tavern POI ~24,26)
  { wx: tw(24) + 1.0,  wz: th(26) + 1.0,  palette: 4, role: "drinker",     patrol: "inn",      speed: 0.4  },
  { wx: tw(24) - 1.5,  wz: th(27) - 0.5,  palette: 1, role: "drinker",     patrol: "inn",      speed: 0.45 },
  { wx: tw(25) + 0.5,  wz: th(25) + 1.5,  palette: 3, role: "passerby",    patrol: "inn",      speed: 0.85 },

  // Temple plaza (temple POI ~36,28)
  { wx: tw(36) - 1.5,  wz: th(28) + 1.0,  palette: 2, role: "worshipper",  patrol: "temple",   speed: 0.35 },
  { wx: tw(36) + 1.0,  wz: th(28) - 1.5,  palette: 0, role: "worshipper",  patrol: "temple",   speed: 0.3  },
  { wx: tw(35) + 0.5,  wz: th(29) + 0.5,  palette: 4, role: "passerby",    patrol: "temple",   speed: 0.65 },

  // Road patrol / plaza wanderers (central)
  { wx: tw(30) + 0.0,  wz: th(24) + 0.0,  palette: 3, role: "wanderer",    patrol: "plaza",    speed: 0.7  },
  { wx: tw(28) + 1.0,  wz: th(26) + 0.5,  palette: 1, role: "wanderer",    patrol: "plaza",    speed: 0.75 },
  { wx: tw(32) - 0.5,  wz: th(25) - 1.0,  palette: 0, role: "wanderer",    patrol: "plaza",    speed: 0.65 },
];

// ─── PATROL BOUNDS (local wander boxes) ──────────────────────────────────────
// Each patrol zone is a rect [minX, maxX, minZ, maxZ] in world coords
const PATROL_BOUNDS = {
  gate_n:  [tw(28), tw(33), th(19), th(23)],
  market:  [tw(32), tw(37), th(19), th(23)],
  inn:     [tw(22), tw(27), th(24), th(28)],
  temple:  [tw(33), tw(38), th(26), th(31)],
  plaza:   [tw(26), tw(34), th(22), th(28)],
};

// ─── NPC MESH BUILDER ────────────────────────────────────────────────────────
// Simplified silhouette — slightly muted/darker than player meshes
function buildNPCMesh(palette) {
  const p  = NPC_PALETTES[palette % NPC_PALETTES.length];
  const h  = p.height;
  const bw = 0.28;
  const group = new THREE.Group();

  // Legs
  const legH = h * 0.34;
  const legW = bw * 0.30;
  [-1, 1].forEach(side => {
    const geo = new THREE.BoxGeometry(legW, legH, legW);
    const mat = new THREE.MeshLambertMaterial({ color: p.body });
    const leg = new THREE.Mesh(geo, mat);
    leg.position.set(side * bw * 0.17, legH * 0.5, 0);
    group.add(leg);
  });

  // Body
  const bodyH = h * 0.40;
  const bodyGeo = new THREE.BoxGeometry(bw, bodyH, bw * 0.68);
  const bodyMat = new THREE.MeshLambertMaterial({ color: p.body });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = legH + bodyH * 0.5;
  group.add(body);

  // Accent belt
  const beltGeo = new THREE.BoxGeometry(bw + 0.02, h * 0.05, bw * 0.70);
  const beltMat = new THREE.MeshLambertMaterial({ color: p.accent });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = legH + bodyH * 0.14;
  group.add(belt);

  // Arms (static, relaxed down)
  const armH = h * 0.36;
  const armW = bw * 0.23;
  [-1, 1].forEach(side => {
    const geo = new THREE.BoxGeometry(armW, armH, armW);
    const mat = new THREE.MeshLambertMaterial({ color: p.body });
    const arm = new THREE.Mesh(geo, mat);
    arm.position.set(side * (bw * 0.57), legH + bodyH * 0.58, 0);
    group.add(arm);
  });

  // Head
  const headSz = bw * 0.68;
  const headGeo = new THREE.BoxGeometry(headSz, headSz, headSz);
  const headMat = new THREE.MeshLambertMaterial({ color: p.body });
  const headY = legH + bodyH + headSz * 0.52;
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = headY;
  group.add(head);

  // Eyes (subtle)
  [-1, 1].forEach(side => {
    const eyeGeo = new THREE.BoxGeometry(headSz * 0.14, headSz * 0.10, headSz * 0.04);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221100 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * headSz * 0.20, headY + headSz * 0.04, headSz * 0.46);
    group.add(eye);
  });

  // Ground shadow disc
  const shadowGeo = new THREE.CircleGeometry(bw * 0.52, 8);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.20 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  // Slightly muted emissive to blend into scene
  group.traverse(child => {
    if (child.isMesh && child.material?.isMeshLambertMaterial) {
      child.material = child.material.clone();
      child.material.emissive = new THREE.Color(0x100808);
      child.material.emissiveIntensity = 0.06;
    }
  });

  return group;
}

// ─── SEEDED RANDOM ────────────────────────────────────────────────────────────
function seededRand(seed) {
  const s = ((seed * 2654435761) >>> 0) / 4294967296;
  return s;
}

// ─── CREATE WALKERS ───────────────────────────────────────────────────────────
/**
 * Create all visual NPC walkers and add them to the scene.
 * Returns an `update(now)` function to call each animation frame.
 */
export function createTownWalkers(scene) {
  const walkers = [];

  SPAWN_CONFIGS.forEach((cfg, idx) => {
    const bounds = PATROL_BOUNDS[cfg.patrol];
    if (!bounds) return;

    const mesh = buildNPCMesh(cfg.palette);
    mesh.position.set(cfg.wx, 0, cfg.wz);
    mesh.userData.isNPC = true;
    scene.add(mesh);

    // Deterministic initial phase offset so NPCs don't all move in sync
    const phaseOffset = seededRand(idx * 7 + 13) * 1000;

    walkers.push({
      mesh,
      cfg,
      bounds,
      // Current wander target
      targetX: cfg.wx,
      targetZ: cfg.wz,
      // State machine: 'walk' | 'pause'
      state: "pause",
      stateTimer: phaseOffset + seededRand(idx * 3 + 1) * 3000,
      pauseDuration: 1200 + seededRand(idx * 5 + 2) * 2800,
      // Leg swing phase
      legPhase: seededRand(idx * 11) * Math.PI * 2,
    });
  });

  // ── Update function (call every frame) ───────────────────────────────────
  function update(now) {
    walkers.forEach((w, idx) => {
      const { mesh, cfg, bounds } = w;
      const [minX, maxX, minZ, maxZ] = bounds;

      // State machine
      if (w.state === "pause") {
        if (now > w.stateTimer) {
          // Pick a new wander target within patrol bounds
          const ra = seededRand((idx * 17 + Math.floor(now / 4000)) % 9999);
          const rb = seededRand((idx * 23 + Math.floor(now / 3700)) % 9999);
          w.targetX = minX + ra * (maxX - minX);
          w.targetZ = minZ + rb * (maxZ - minZ);
          w.state = "walk";
        }
      } else {
        // Walk toward target
        const dx = w.targetX - mesh.position.x;
        const dz = w.targetZ - mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.12) {
          // Arrived — pause
          w.state = "pause";
          w.stateTimer = now + w.pauseDuration + seededRand((idx * 29 + Math.floor(now / 1000)) % 9999) * 1500;
        } else {
          const step = cfg.speed * 0.018; // world units per frame at ~60fps
          mesh.position.x += (dx / dist) * step;
          mesh.position.z += (dz / dist) * step;

          // Face direction of movement
          mesh.rotation.y = Math.atan2(dx, dz);
        }
      }

      // Idle bob (always) + leg swing (while walking)
      const isWalking = w.state === "walk" && Math.sqrt(
        (w.targetX - mesh.position.x) ** 2 +
        (w.targetZ - mesh.position.z) ** 2
      ) > 0.15;

      mesh.position.y = Math.sin(now * 0.0014 + w.legPhase) * 0.025;

      // Subtle arm swing while walking
      if (isWalking) {
        const swing = Math.sin(now * 0.006 + w.legPhase) * 0.18;
        const arms = mesh.children.filter((_, i) => i === 5 || i === 6); // arms by index
        if (arms.length >= 2) {
          arms[0].rotation.x =  swing;
          arms[1].rotation.x = -swing;
        }
      }
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function dispose() {
    walkers.forEach(w => {
      scene.remove(w.mesh);
      w.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    walkers.length = 0;
  }

  return { update, dispose, count: walkers.length };
}