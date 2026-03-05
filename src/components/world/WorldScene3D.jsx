/**
 * WorldScene3D — Visual presentation layer only.
 * Authority (movement, combat, targeting) stays in pages/World.jsx.
 * This file: Three.js canvas, camera, terrain, character meshes, DOM overlays.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { getTile, getZoneAt, MAP_W, MAP_H, ZONES, POINTS_OF_INTEREST } from "@/components/shared/worldZones";
import { buildPath, isPassable } from "@/components/shared/movementAuthority";
import { useAmbientWorld, AmbientHUDWidget } from "./AmbientWorld";
import { createTownWalkers } from "./TownWalkers";
import { createNPCEntities } from "./NPCEntities";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TILE_SIZE   = 2;

// ─── TERRAIN PALETTE ─────────────────────────────────────────────────────────

const TERRAIN_3D = {
  grass:  { color: 0x3a6b32, height: 0.14 },
  forest: { color: 0x1e4020, height: 0.20 },
  water:  { color: 0x193f6e, height: 0.04 },
  stone:  { color: 0x555555, height: 0.22 },
  sand:   { color: 0xa08060, height: 0.10 },
  lava:   { color: 0x8b2200, height: 0.18 },
  swamp:  { color: 0x2e4422, height: 0.10 },
  plains: { color: 0x5a6e28, height: 0.12 },
};

// Zone-border accent color for visual separation
const ZONE_BORDER_COLORS = {
  high_bastion:      0xd4a017,
  the_thornwild:     0x163a16,
  kharum_deep:       0x444444,
  greyfen_reach:     0x1a3010,
  the_ashen_march:   0x6d8420,
  vale_of_cinders:   0x7a1800,
  the_sunken_crown:  0x3a5a6e,
};

// ─── RACE VISUALS ─────────────────────────────────────────────────────────────

const RACE_VISUALS = {
  human:      { height: 1.00, bodyW: 0.32, color: 0xd4a77a, accent: 0xfbbf24, headScale: 1.0,  beard: false, ears: false, shoulders: false },
  elf:        { height: 1.08, bodyW: 0.26, color: 0xb8d99a, accent: 0x67e8f9, headScale: 0.95, beard: false, ears: true,  shoulders: false },
  dwarf:      { height: 0.70, bodyW: 0.42, color: 0xb07030, accent: 0xfb923c, headScale: 1.18, beard: true,  ears: false, shoulders: false },
  halfling:   { height: 0.58, bodyW: 0.28, color: 0xd8b870, accent: 0x86efac, headScale: 1.12, beard: false, ears: true,  shoulders: false },
  orc:        { height: 1.10, bodyW: 0.46, color: 0x5a7a4e, accent: 0xef4444, headScale: 1.06, beard: false, ears: false, shoulders: false },
  half_giant: { height: 1.40, bodyW: 0.58, color: 0x8090a0, accent: 0xa855f7, headScale: 0.88, beard: false, ears: false, shoulders: true  },
};

const MONSTER_VISUALS = {
  goblin:   { color: 0x44bb60, height: 0.55, bodyW: 0.30 },
  orc:      { color: 0x5a7a4e, height: 1.05, bodyW: 0.46 },
  dragon:   { color: 0xcc2200, height: 1.50, bodyW: 0.65 },
  skeleton: { color: 0xdde8ee, height: 0.90, bodyW: 0.26 },
  troll:    { color: 0x706050, height: 1.25, bodyW: 0.52 },
  vampire:  { color: 0x8822cc, height: 1.00, bodyW: 0.30 },
  werewolf: { color: 0x7a3d10, height: 1.12, bodyW: 0.44 },
  wraith:   { color: 0x5055cc, height: 0.95, bodyW: 0.28 },
  basilisk: { color: 0x558800, height: 0.72, bodyW: 0.52 },
  kraken:   { color: 0x1040b8, height: 1.35, bodyW: 0.68 },
};

// ─── VISUAL STATE SYSTEM ─────────────────────────────────────────────────────
// Tracks per-entity timed visual reactions. entityStates[id] = { state, expiresAt, phase }
const entityStates = {};

export function triggerEntityState(entityId, state, durationMs = 400) {
  entityStates[entityId] = { state, expiresAt: Date.now() + durationMs, phase: 0 };
}

// Called from outside (e.g. CombatOverlay) to drive visual reactions
// States: 'attack' | 'cast' | 'hurt' | 'death'

function applyEntityStateVisuals(mesh, entityId, now) {
  const es = entityStates[entityId];
  if (!es) return;

  const elapsed = now - (es.expiresAt - (
    es.state === "death" ? 1200 :
    es.state === "cast"  ? 800  : 400
  ));
  const total = es.expiresAt - (es.expiresAt - (
    es.state === "death" ? 1200 :
    es.state === "cast"  ? 800  : 400
  ));
  const t = Math.min(1, elapsed / Math.max(1, es.expiresAt - (now - 999999))); // will compute below

  if (now > es.expiresAt) {
    // Reset
    mesh.rotation.z = 0;
    mesh.scale.setScalar(1);
    mesh.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        try { child.material.emissive.setHex(mesh.userData.baseEmissive ?? 0x000000); } catch(e) {}
        child.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity ?? 0;
      }
    });
    if (es.state === "death") delete entityStates[entityId];
    else delete entityStates[entityId];
    return;
  }

  const dur = es.state === "death" ? 1200 : es.state === "cast" ? 800 : 400;
  const p   = Math.min(1, elapsed / dur);

  if (es.state === "attack") {
    // Quick forward lunge + orange flash
    const lunge = Math.sin(p * Math.PI) * 0.28;
    mesh.position.z -= lunge * 0.5;
    mesh.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        try { child.material.emissive.setHex(0xff5500); } catch(e) {}
        child.material.emissiveIntensity = (1 - p) * 0.9;
      }
    });
  } else if (es.state === "cast") {
    // Slow pulse up/down + blue glow
    mesh.position.y += Math.sin(p * Math.PI * 3) * 0.06;
    mesh.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        try { child.material.emissive.setHex(0x4499ff); } catch(e) {}
        child.material.emissiveIntensity = 0.5 + Math.sin(p * Math.PI * 4) * 0.4;
      }
    });
  } else if (es.state === "hurt") {
    // Recoil backward + red flash + tilt
    mesh.rotation.z = Math.sin(p * Math.PI * 3) * 0.3;
    mesh.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        try { child.material.emissive.setHex(0xff0000); } catch(e) {}
        child.material.emissiveIntensity = (1 - p) * 1.2;
      }
    });
  } else if (es.state === "death") {
    // Tilt sideways + sink into ground + fade emissive dark
    mesh.rotation.z = p * Math.PI * 0.5; // fall over
    mesh.position.y = -p * 0.8;          // sink
    mesh.scale.setScalar(1 - p * 0.3);   // shrink slightly
    mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.material.emissive) {
          try { child.material.emissive.setHex(0x220000); } catch(e) {}
          child.material.emissiveIntensity = 0.2;
        }
        if (child.material.opacity !== undefined && child.material.transparent) {
          child.material.opacity = Math.max(0.1, 1 - p);
        }
      }
    });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function tileToWorld(tx, ty) {
  return new THREE.Vector3(tx * TILE_SIZE, 0, ty * TILE_SIZE);
}

function lerp3(v, target, t) {
  v.lerp(target, t);
}

// ─── MESH BUILDERS ────────────────────────────────────────────────────────────

function buildCharacterMesh(raceId, isAI = false, isMonster = false, monsterSpecies = null) {
  const group = new THREE.Group();

  let vis;
  if (isMonster && monsterSpecies) {
    vis = MONSTER_VISUALS[monsterSpecies] || MONSTER_VISUALS.goblin;
  } else {
    vis = RACE_VISUALS[raceId] || RACE_VISUALS.human;
  }

  const h  = vis.height;
  const bw = vis.bodyW;
  const bodyColor   = vis.color;
  const accentColor = isMonster ? 0xdd3333 : (isAI ? 0x22ccdd : (vis.accent || 0xfbbf24));

  // ── Legs ──
  const legH = h * 0.35;
  const legW = bw * 0.32;
  [-1, 1].forEach(side => {
    const legGeo = new THREE.BoxGeometry(legW, legH, legW);
    const legMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(side * bw * 0.18, legH * 0.5, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // ── Body ──
  const bodyH = h * 0.42;
  const bodyGeo = new THREE.BoxGeometry(bw, bodyH, bw * 0.70);
  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = legH + bodyH * 0.5;
  body.castShadow = true;
  group.add(body);

  // ── Accent strip (belt / armor) ──
  const beltGeo = new THREE.BoxGeometry(bw + 0.04, h * 0.06, bw * 0.72);
  const beltMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const belt    = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = legH + bodyH * 0.15;
  group.add(belt);

  // ── Arms ──
  const armH = h * 0.38;
  const armW = bw * 0.26;
  [-1, 1].forEach(side => {
    const armGeo = new THREE.BoxGeometry(armW, armH, armW);
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(side * (bw * 0.60), legH + bodyH * 0.60, 0);
    arm.castShadow = true;
    group.add(arm);
  });

  // ── Head ──
  const headS = vis.headScale || 1.0;
  const headSz = bw * 0.72 * headS;
  const headGeo = new THREE.BoxGeometry(headSz, headSz, headSz);
  const headMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const headY   = legH + bodyH + headSz * 0.52;
  const head    = new THREE.Mesh(headGeo, headMat);
  head.position.y = headY;
  head.castShadow = true;
  group.add(head);

  // ── Eyes (two small dark cubes) ──
  [-1, 1].forEach(side => {
    const eyeGeo = new THREE.BoxGeometry(headSz * 0.16, headSz * 0.12, headSz * 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: isMonster ? 0xff2200 : 0x111111 });
    const eye    = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * headSz * 0.22, headY + headSz * 0.04, headSz * 0.48);
    group.add(eye);
  });

  // ── Race-specific geometry ──
  if (vis.beard) {
    const bGeo = new THREE.BoxGeometry(headSz * 0.68, headSz * 0.44, headSz * 0.36);
    const bMat = new THREE.MeshLambertMaterial({ color: 0xc87820 });
    const beard = new THREE.Mesh(bGeo, bMat);
    beard.position.set(0, headY - headSz * 0.38, headSz * 0.28);
    group.add(beard);
  }
  if (vis.ears) {
    [-1, 1].forEach(side => {
      const eGeo = new THREE.ConeGeometry(0.04, 0.18, 4);
      const eMat = new THREE.MeshLambertMaterial({ color: bodyColor });
      const ear  = new THREE.Mesh(eGeo, eMat);
      ear.position.set(side * headSz * 0.56, headY + headSz * 0.12, 0);
      ear.rotation.z = side * Math.PI / 2.1;
      group.add(ear);
    });
  }
  if (vis.shoulders) {
    [-1, 1].forEach(side => {
      const sGeo = new THREE.BoxGeometry(0.22, 0.16, 0.22);
      const sMat = new THREE.MeshLambertMaterial({ color: accentColor });
      const sh   = new THREE.Mesh(sGeo, sMat);
      sh.position.set(side * (bw * 0.58), legH + bodyH * 0.85, 0);
      group.add(sh);
    });
  }

  // Monster species extras
  if (isMonster) {
    if (monsterSpecies === "dragon") {
      // Wing stubs
      [-1, 1].forEach(side => {
        const wGeo = new THREE.BoxGeometry(0.60, 0.10, 0.35);
        const wMat = new THREE.MeshLambertMaterial({ color: 0x991100 });
        const wing = new THREE.Mesh(wGeo, wMat);
        wing.position.set(side * (bw * 0.80), legH + bodyH * 0.70, -0.10);
        wing.rotation.z = side * 0.45;
        group.add(wing);
      });
    }
    if (monsterSpecies === "skeleton") {
      // Ribcage lines — visual accent only
      [0.14, 0, -0.14].forEach(oy => {
        const rGeo = new THREE.BoxGeometry(bw * 0.88, 0.03, bw * 0.68);
        const rMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const rib  = new THREE.Mesh(rGeo, rMat);
        rib.position.set(0, legH + bodyH * 0.50 + oy, bw * 0.36);
        group.add(rib);
      });
    }
    if (monsterSpecies === "wraith") {
      // Ghost wisp bottom (elongated downward block, semi-transparent)
      const wispGeo = new THREE.CylinderGeometry(bw * 0.28, bw * 0.08, h * 0.38, 6);
      const wispMat = new THREE.MeshLambertMaterial({ color: 0x4444aa, transparent: true, opacity: 0.55 });
      const wisp    = new THREE.Mesh(wispGeo, wispMat);
      wisp.position.y = -h * 0.10;
      group.add(wisp);
    }
  }

  // ── Ground shadow disc ──
  const shadowGeo = new THREE.CircleGeometry(bw * 0.60, 10);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
  const shadow    = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  // ── Selection ring (initially hidden) ──
  const ringOuter = bw * 0.80;
  const ringGeo = new THREE.RingGeometry(ringOuter - 0.08, ringOuter, 28);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isMonster ? 0xff4444 : (isAI ? 0x22ccdd : 0xfbbf24),
    side: THREE.DoubleSide, transparent: true, opacity: 0
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.022;
  ring.name = "selectionRing";
  group.add(ring);

  // ── World-space HP bar (billboarded in animate) ──
  const barW = bw * 1.5;
  const barH = 0.08;
  const hpY  = legH + bodyH + headSz + 0.32;

  const bgGeo  = new THREE.PlaneGeometry(barW, barH);
  const bgMat  = new THREE.MeshBasicMaterial({ color: 0x1f2937, side: THREE.DoubleSide });
  const hpBg   = new THREE.Mesh(bgGeo, bgMat);
  hpBg.position.y = hpY;
  hpBg.name = "hpBarBg";
  group.add(hpBg);

  const fillGeo  = new THREE.PlaneGeometry(barW, barH);
  const fillMat  = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
  const hpFill   = new THREE.Mesh(fillGeo, fillMat);
  hpFill.position.y = hpY;
  hpFill.position.z = 0.001;
  hpFill.name = "hpBarFill";
  group.add(hpFill);

  return group;
}

// ─── TERRAIN BUILDER ─────────────────────────────────────────────────────────

function buildTerrain(scene, cx, cy) {
  const group = new THREE.Group();
  group.name = "terrain";

  const RANGE = 32;
  const x0 = Math.max(0, cx - RANGE), x1 = Math.min(MAP_W, cx + RANGE);
  const y0 = Math.max(0, cy - RANGE), y1 = Math.min(MAP_H, cy + RANGE);

  // Track which zones have border-painted edges
  const zoneBorderMeshes = [];

  for (let ty = y0; ty < y1; ty++) {
    for (let tx = x0; tx < x1; tx++) {
      const tileName = getTile(tx, ty);
      const td = TERRAIN_3D[tileName] ?? TERRAIN_3D.grass;
      const geo  = new THREE.BoxGeometry(TILE_SIZE, td.height, TILE_SIZE);
      const mat  = new THREE.MeshLambertMaterial({ color: td.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(tx * TILE_SIZE, td.height * 0.5 - 0.10, ty * TILE_SIZE);
      mesh.receiveShadow = true;
      mesh.userData = { tx, ty, tile: tileName };
      group.add(mesh);

      // Road: horizontal bands through golden_plains + town paths
      const zone = getZoneAt(tx, ty);
      if (zone?.id === "the_ashen_march" && (tx % 4 === 0 || ty % 4 === 0)) {
        const roadGeo = new THREE.BoxGeometry(TILE_SIZE, 0.03, TILE_SIZE);
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
        const road    = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(tx * TILE_SIZE, td.height - 0.07, ty * TILE_SIZE);
        group.add(road);
      }

      // Town cobble overlay
      if (zone?.id === "high_bastion") {
        const cobGeo = new THREE.BoxGeometry(TILE_SIZE - 0.12, 0.025, TILE_SIZE - 0.12);
        const cobMat = new THREE.MeshLambertMaterial({ color: 0x5a5044 });
        const cob    = new THREE.Mesh(cobGeo, cobMat);
        cob.position.set(tx * TILE_SIZE, td.height - 0.06, ty * TILE_SIZE);
        group.add(cob);
      }
    }
  }

  // Zone border lines — thin raised strips on zone edges for visual separation
  ZONES.forEach(zone => {
    const borderColor = ZONE_BORDER_COLORS[zone.id] ?? 0x888888;
    // Top/bottom edges
    [zone.y, zone.y + zone.h - 1].forEach(ty => {
      for (let tx = zone.x; tx < zone.x + zone.w; tx++) {
        if (tx < x0 || tx >= x1 || ty < y0 || ty >= y1) return;
        const td = TERRAIN_3D[getTile(tx, ty)] ?? TERRAIN_3D.grass;
        const bGeo = new THREE.BoxGeometry(TILE_SIZE, 0.05, 0.12);
        const bMat = new THREE.MeshBasicMaterial({ color: borderColor, transparent: true, opacity: 0.6 });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(tx * TILE_SIZE, td.height - 0.03, ty * TILE_SIZE);
        group.add(bMesh);
      }
    });
    // Left/right edges
    [zone.x, zone.x + zone.w - 1].forEach(tx => {
      for (let ty = zone.y; ty < zone.y + zone.h; ty++) {
        if (tx < x0 || tx >= x1 || ty < y0 || ty >= y1) return;
        const td = TERRAIN_3D[getTile(tx, ty)] ?? TERRAIN_3D.grass;
        const bGeo = new THREE.BoxGeometry(0.12, 0.05, TILE_SIZE);
        const bMat = new THREE.MeshBasicMaterial({ color: borderColor, transparent: true, opacity: 0.6 });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(tx * TILE_SIZE, td.height - 0.03, ty * TILE_SIZE);
        group.add(bMesh);
      }
    });
  });

  // Props / POI markers
  POINTS_OF_INTEREST.forEach(poi => {
    if (poi.x < x0 || poi.x >= x1 || poi.y < y0 || poi.y >= y1) return;
    addPropMesh(group, poi);
  });

  // ── Ambient prop scatter (deterministic using tile hash) ──────────────────
  // We use a seeded pseudo-random so props are stable across re-renders
  for (let ty = y0; ty < y1; ty++) {
    for (let tx = x0; tx < x1; tx++) {
      const tileName = getTile(tx, ty);
      const zone = getZoneAt(tx, ty);
      const td = TERRAIN_3D[tileName] ?? TERRAIN_3D.grass;
      const baseY = td.height - 0.05;
      const wx = tx * TILE_SIZE;
      const wz = ty * TILE_SIZE;

      // Seeded hash: avoid Math.random() to keep stable across re-renders
      const h1 = (tx * 2477 + ty * 8191) % 10000 / 10000;
      const h2 = (tx * 5381 + ty * 1373) % 10000 / 10000;
      const h3 = (tx * 3571 + ty * 6257) % 10000 / 10000;

      // Skip POI tiles
      const hasPOI = POINTS_OF_INTEREST.some(p => p.x === tx && p.y === ty);
      if (hasPOI) continue;

      if (zone?.id === "the_thornwild" && h1 < 0.28) {
        // Scattered trees + stumps
        const offX = (h2 - 0.5) * 1.2;
        const offZ = (h3 - 0.5) * 1.2;
        if (h1 < 0.18) {
          addTree(group, wx + offX, baseY, wz + offZ);
        } else {
          // Stump
          const sGeo = new THREE.CylinderGeometry(0.10, 0.14, 0.22, 6);
          const sMat = new THREE.MeshLambertMaterial({ color: 0x3a2510 });
          const stump = new THREE.Mesh(sGeo, sMat);
          stump.position.set(wx + offX, baseY + 0.11, wz + offZ);
          group.add(stump);
        }
      } else if (zone?.id === "greyfen_reach" && h1 < 0.22) {
        const offX = (h2 - 0.5) * 1.1;
        const offZ = (h3 - 0.5) * 1.1;
        if (h1 < 0.10) {
          // Dead tree (bare trunk, no foliage)
          const tGeo = new THREE.CylinderGeometry(0.06, 0.10, 1.0 + h2 * 0.6, 5);
          const tMat = new THREE.MeshLambertMaterial({ color: 0x2a1e10 });
          const trunk = new THREE.Mesh(tGeo, tMat);
          trunk.position.set(wx + offX, baseY + 0.5, wz + offZ);
          trunk.rotation.z = (h3 - 0.5) * 0.3;
          group.add(trunk);
        } else {
          // Reed / stone
          const rGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.55, 4);
          const rMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
          const reed = new THREE.Mesh(rGeo, rMat);
          reed.position.set(wx + offX, baseY + 0.27, wz + offZ);
          group.add(reed);
        }
      } else if ((zone?.id === "the_ashen_march" || zone?.id === "kharum_deep") && h1 < 0.14) {
        const offX = (h2 - 0.5) * 1.3;
        const offZ = (h3 - 0.5) * 1.3;
        if (zone?.id === "kharum_deep" || h1 < 0.07) {
          // Rock
          const sz = 0.12 + h2 * 0.14;
          const rGeo = new THREE.DodecahedronGeometry(sz, 0);
          const rMat = new THREE.MeshLambertMaterial({ color: zone?.id === "kharum_deep" ? 0x666666 : 0x7a6a50 });
          const rock = new THREE.Mesh(rGeo, rMat);
          rock.position.set(wx + offX, baseY + sz * 0.5, wz + offZ);
          rock.rotation.set(h1 * 2, h2 * 3, h3 * 2);
          group.add(rock);
        } else {
          // Shrub / tuft
          const fGeo = new THREE.SphereGeometry(0.13 + h2 * 0.08, 5, 4);
          const fMat = new THREE.MeshLambertMaterial({ color: 0x4a6020 });
          const shrub = new THREE.Mesh(fGeo, fMat);
          shrub.scale.y = 0.55;
          shrub.position.set(wx + offX, baseY + 0.07, wz + offZ);
          group.add(shrub);
        }
      } else if (tileName === "grass" && !zone && h1 < 0.08) {
        // Sparse grass tufts in neutral tiles
        const offX = (h2 - 0.5) * 1.4;
        const offZ = (h3 - 0.5) * 1.4;
        const fGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
        const fMat = new THREE.MeshLambertMaterial({ color: 0x3a5520 });
        for (let g = 0; g < 3; g++) {
          const tuft = new THREE.Mesh(fGeo, fMat);
          const ga = (g / 3) * Math.PI * 2;
          tuft.position.set(wx + offX + Math.cos(ga) * 0.15, baseY + 0.14, wz + offZ + Math.sin(ga) * 0.15);
          tuft.rotation.z = (h1 - 0.5) * 0.4;
          group.add(tuft);
        }
      }
    }
  }

  // ── Town walls / gate perimeter ───────────────────────────────────────────
  const townZone = ZONES.find(z => z.id === "high_bastion");
  if (townZone) {
    buildTownWalls(group, townZone);
  }

  scene.add(group);
  return group;
}

// ─── TOWN WALLS ──────────────────────────────────────────────────────────────

function buildTownWalls(group, zone) {
  const wallH = 1.0;
  const wallThick = 0.28;
  const wallColor = 0x7a6a54;
  const parapetColor = 0x6a5a44;
  const towerColor = 0x8a7a64;

  const x0w = zone.x * TILE_SIZE - TILE_SIZE * 0.5;
  const x1w = (zone.x + zone.w) * TILE_SIZE - TILE_SIZE * 0.5;
  const z0w = zone.y * TILE_SIZE - TILE_SIZE * 0.5;
  const z1w = (zone.y + zone.h) * TILE_SIZE - TILE_SIZE * 0.5;
  const wallY = 0.12 + wallH * 0.5;

  const td = TERRAIN_3D.grass;
  const baseY = td.height - 0.05;

  // Helper: add a wall segment
  const addWall = (cx, cy, cz, lenX, lenZ) => {
    const wGeo = new THREE.BoxGeometry(lenX, wallH, lenZ);
    const wMat = new THREE.MeshLambertMaterial({ color: wallColor });
    const wall = new THREE.Mesh(wGeo, wMat);
    wall.position.set(cx, cy, cz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Parapet crenellations
    const crenW = lenX > lenZ ? lenX : lenZ;
    const isHoriz = lenX > lenZ;
    const count = Math.floor(crenW / (TILE_SIZE * 0.8));
    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) continue; // every other one
      const cGeo = new THREE.BoxGeometry(
        isHoriz ? TILE_SIZE * 0.32 : wallThick + 0.1,
        wallH * 0.35,
        isHoriz ? wallThick + 0.1 : TILE_SIZE * 0.32
      );
      const cMat = new THREE.MeshLambertMaterial({ color: parapetColor });
      const cren = new THREE.Mesh(cGeo, cMat);
      const offset = (i / (count - 1) - 0.5) * crenW * 0.85;
      cren.position.set(
        cx + (isHoriz ? offset : 0),
        cy + wallH * 0.5 + wallH * 0.175,
        cz + (isHoriz ? 0 : offset)
      );
      group.add(cren);
    }
  };

  // Helper: corner tower
  const addTower = (tx, tz) => {
    const tGeo = new THREE.BoxGeometry(0.9, wallH + 0.5, 0.9);
    const tMat = new THREE.MeshLambertMaterial({ color: towerColor });
    const tower = new THREE.Mesh(tGeo, tMat);
    tower.position.set(tx, baseY + (wallH + 0.5) * 0.5, tz);
    tower.castShadow = true;
    group.add(tower);
    // Tower top battlement
    const ttGeo = new THREE.BoxGeometry(1.1, 0.25, 1.1);
    const ttMat = new THREE.MeshLambertMaterial({ color: parapetColor });
    const ttop = new THREE.Mesh(ttGeo, ttMat);
    ttop.position.set(tx, baseY + wallH + 0.5 + 0.12, tz);
    group.add(ttop);
  };

  const midX = (x0w + x1w) / 2;
  const midZ = (z0w + z1w) / 2;
  const lenX = x1w - x0w;
  const lenZ = z1w - z0w;

  // North wall (with gate gap at center)
  const gateGap = TILE_SIZE * 2.4;
  addWall(midX - (gateGap / 2 + lenX * 0.25) * 0.5, baseY + wallY, z0w, lenX * 0.5 - gateGap * 0.5 - 0.2, wallThick);
  addWall(midX + (gateGap / 2 + lenX * 0.25) * 0.5, baseY + wallY, z0w, lenX * 0.5 - gateGap * 0.5 - 0.2, wallThick);
  // South wall
  addWall(midX, baseY + wallY, z1w, lenX, wallThick);
  // West wall
  addWall(x0w, baseY + wallY, midZ, wallThick, lenZ);
  // East wall
  addWall(x1w, baseY + wallY, midZ, wallThick, lenZ);

  // Corner towers
  addTower(x0w, z0w);
  addTower(x1w, z0w);
  addTower(x0w, z1w);
  addTower(x1w, z1w);

  // Gate arch — two pillars + lintel at north center
  const gx = midX;
  const gz = z0w;
  const pillarH = wallH + 0.7;

  [-1, 1].forEach(side => {
    const pGeo = new THREE.BoxGeometry(0.4, pillarH, 0.4);
    const pMat = new THREE.MeshLambertMaterial({ color: 0x9a8870 });
    const pillar = new THREE.Mesh(pGeo, pMat);
    pillar.position.set(gx + side * (gateGap / 2), baseY + pillarH * 0.5, gz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Lintel beam
  const lGeo = new THREE.BoxGeometry(gateGap + 0.4, 0.28, 0.44);
  const lMat = new THREE.MeshLambertMaterial({ color: 0x7a6850 });
  const lintel = new THREE.Mesh(lGeo, lMat);
  lintel.position.set(gx, baseY + pillarH + 0.14, gz);
  group.add(lintel);

  // Gate sign block (small colored plaque)
  const sgGeo = new THREE.BoxGeometry(gateGap * 0.55, 0.30, 0.12);
  const sgMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
  const sg = new THREE.Mesh(sgGeo, sgMat);
  sg.position.set(gx, baseY + pillarH + 0.46, gz);
  group.add(sg);
}

// ─── PROP BUILDER ────────────────────────────────────────────────────────────

function addPropMesh(group, poi) {
  const wx = poi.x * TILE_SIZE;
  const wz = poi.y * TILE_SIZE;
  const td = TERRAIN_3D[getTile(poi.x, poi.y)] ?? TERRAIN_3D.grass;
  const baseY = td.height - 0.05;

  if (poi.type === "crafting_station" || poi.type === "npc") {
    // Simple tall block = building
    const bGeo = new THREE.BoxGeometry(1.4, 1.6, 1.4);
    const bMat = new THREE.MeshLambertMaterial({ color: 0x706050 });
    const bldg = new THREE.Mesh(bGeo, bMat);
    bldg.position.set(wx, baseY + 0.80, wz);
    bldg.castShadow = true;
    group.add(bldg);
    // Roof
    const rGeo = new THREE.ConeGeometry(1.1, 0.7, 4);
    const rMat = new THREE.MeshLambertMaterial({ color: 0x8b3a2a });
    const roof = new THREE.Mesh(rGeo, rMat);
    roof.position.set(wx, baseY + 1.95, wz);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  } else if (poi.type === "shop") {
    const sGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
    const sMat = new THREE.MeshLambertMaterial({ color: 0x8b6030 });
    const shop = new THREE.Mesh(sGeo, sMat);
    shop.position.set(wx, baseY + 0.60, wz);
    shop.castShadow = true;
    group.add(shop);
    // Sign post
    const postGeo = new THREE.BoxGeometry(0.06, 0.8, 0.06);
    const signPostMat = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
    const post = new THREE.Mesh(postGeo, signPostMat);
    post.position.set(wx + 0.95, baseY + 1.25, wz);
    group.add(post);
    const signGeo = new THREE.BoxGeometry(0.40, 0.22, 0.05);
    const signMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(wx + 0.95, baseY + 1.68, wz);
    group.add(sign);
  } else if (poi.type === "rest") {
    // Inn — warm glow color
    const iGeo = new THREE.BoxGeometry(2.0, 1.4, 2.0);
    const iMat = new THREE.MeshLambertMaterial({ color: 0x9a7050 });
    const inn  = new THREE.Mesh(iGeo, iMat);
    inn.position.set(wx, baseY + 0.70, wz);
    inn.castShadow = true;
    group.add(inn);
    const rGeo = new THREE.ConeGeometry(1.5, 0.8, 4);
    const rMat = new THREE.MeshLambertMaterial({ color: 0xaa4422 });
    const roof = new THREE.Mesh(rGeo, rMat);
    roof.position.set(wx, baseY + 1.70, wz);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  } else if (poi.type === "heal_station") {
    // Temple — white pillar
    const pGeo = new THREE.CylinderGeometry(0.30, 0.34, 2.0, 8);
    const pMat = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
    [-0.7, 0.7].forEach(ox => {
      const pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.set(wx + ox, baseY + 1.0, wz);
      group.add(pillar);
    });
    const capGeo = new THREE.BoxGeometry(2.2, 0.18, 1.2);
    const capMat = new THREE.MeshLambertMaterial({ color: 0xd8d0c0 });
    const cap    = new THREE.Mesh(capGeo, capMat);
    cap.position.set(wx, baseY + 2.10, wz);
    group.add(cap);
  } else if (poi.type === "resource_node") {
    // Ore node or tree cluster
    const zone = getZoneAt(poi.x, poi.y);
    if (poi.resource === "wheat" || zone?.id === "the_ashen_march") {
      // Wheat bunches
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const wGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.9, 4);
        const wMat = new THREE.MeshLambertMaterial({ color: 0xd4aa30 });
        const stalk = new THREE.Mesh(wGeo, wMat);
        stalk.position.set(wx + Math.cos(angle) * 0.35, baseY + 0.45, wz + Math.sin(angle) * 0.35);
        group.add(stalk);
      }
    } else {
      // Ore rock cluster
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const size = 0.28 + Math.random() * 0.16;
        const rGeo = new THREE.DodecahedronGeometry(size, 0);
        const rMat = new THREE.MeshLambertMaterial({ color: 0x887060 });
        const rock = new THREE.Mesh(rGeo, rMat);
        rock.position.set(wx + Math.cos(angle) * 0.42, baseY + size * 0.6, wz + Math.sin(angle) * 0.42);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(rock);
      }
    }
  } else if (poi.type === "mystery" || poi.type === "dungeon") {
    // Standing stone / ruin column
    const sGeo = new THREE.BoxGeometry(0.5, 2.4, 0.5);
    const sMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
    const stone = new THREE.Mesh(sGeo, sMat);
    stone.position.set(wx, baseY + 1.2, wz);
    stone.rotation.y = 0.3;
    stone.castShadow = true;
    group.add(stone);
    // Cap stone
    const cGeo = new THREE.BoxGeometry(0.75, 0.25, 0.75);
    const cMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const cap  = new THREE.Mesh(cGeo, cMat);
    cap.position.set(wx, baseY + 2.52, wz);
    group.add(cap);
  }

  // Tree clusters for forest zone POIs
  if (poi.zone === "the_thornwild" || poi.zone === "greyfen_reach") {
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + 0.5;
      const r = 0.8 + i * 0.2;
      addTree(group, wx + Math.cos(angle) * r, baseY, wz + Math.sin(angle) * r);
    }
  }
}

function addTree(group, wx, baseY, wz) {
  const trunkH = 0.7 + Math.random() * 0.4;
  const tGeo   = new THREE.CylinderGeometry(0.07, 0.12, trunkH, 5);
  const tMat   = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
  const trunk  = new THREE.Mesh(tGeo, tMat);
  trunk.position.set(wx, baseY + trunkH * 0.5, wz);
  group.add(trunk);

  const foliageColor = 0x1e4020;
  [[0, trunkH + 0.30, 0.55], [0, trunkH + 0.62, 0.38], [0, trunkH + 0.88, 0.24]].forEach(([oy, cy2, r]) => {
    const fGeo = new THREE.ConeGeometry(r, r * 1.2, 6);
    const fMat = new THREE.MeshLambertMaterial({ color: foliageColor });
    const foliage = new THREE.Mesh(fGeo, fMat);
    foliage.position.set(wx + oy, baseY + cy2, wz);
    group.add(foliage);
  });
}

// ─── HP BAR BILLBOARD ────────────────────────────────────────────────────────

function billboardHpBar(mesh, entity, camera, showBars) {
  const bg   = mesh.getObjectByName("hpBarBg");
  const fill = mesh.getObjectByName("hpBarFill");
  if (!bg || !fill || !bg.material || !fill.material) return;

  if (!showBars) { bg.visible = false; fill.visible = false; return; }
  bg.visible = fill.visible = true;

  if (bg.quaternion && camera.quaternion) bg.quaternion.copy(camera.quaternion);
  if (fill.quaternion && camera.quaternion) fill.quaternion.copy(camera.quaternion);

  const hp    = entity.hp ?? entity.max_hp ?? 100;
  const maxHp = entity.max_hp ?? 100;
  const pct   = Math.max(0.001, Math.min(1, hp / maxHp));
  fill.scale.x = pct;
  const barW = bg.geometry?.parameters?.width ?? 1.5;
  fill.position.x = (pct - 1) * (barW / 2);
  if (fill.material?.color) {
    fill.material.color.setHex(pct > 0.6 ? 0x22c55e : pct > 0.3 ? 0xf59e0b : 0xef4444);
  }
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function WorldScene3D({
  myCharacter,
  allCharacters,
  monsters,
  worldObjects,
  activeEvents,
  onMove,
  onMonsterClick,
  sceneSettings = {},
  getCurrentZoomConfig = () => ({ distance: 24, height: 28, angle: 0.62, fov: 42 }),
}) {
  const mountRef     = useRef(null);
  const sceneRef     = useRef(null);
  const cameraRef    = useRef(null);
  const rendererRef  = useRef(null);
  const rafRef       = useRef(null);
  const sunLightRef  = useRef(null);
  const ambLightRef  = useRef(null);
  const fogRef       = useRef(null);
  const terrainRef   = useRef(null);

  const playerPosRef    = useRef(null);
  const playerTargetRef = useRef(null);

  const charMeshesRef    = useRef({});
  const monsterMeshesRef = useRef({});
  const townWalkersRef   = useRef(null);
  const npcEntitiesRef   = useRef(null);

  const [nameplates, setNameplates] = useState([]);

  const myCharRef          = useRef(myCharacter);  myCharRef.current = myCharacter;
  const allCharsRef        = useRef(allCharacters); allCharsRef.current = allCharacters;
  const monstersRef        = useRef(monsters);      monstersRef.current = monsters;
  const onMoveRef          = useRef(onMove);        onMoveRef.current = onMove;
  const onMonsterClickRef  = useRef(onMonsterClick); onMonsterClickRef.current = onMonsterClick;

  const movingRef      = useRef(false);
  const pendingPathRef = useRef([]);

  const settings = { showNameplates: true, showHealthBars: true, cameraDistance: 1.0, ...sceneSettings };

  // ─── INIT ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c1a);
    scene.fog = new THREE.FogExp2(0x060c1a, 0.014);
    sceneRef.current = scene;
    fogRef.current = scene.fog;

    const aspect = mount.clientWidth / mount.clientHeight;
    const zoomConfig = getCurrentZoomConfig();
    const camera = new THREE.PerspectiveCamera(zoomConfig.fov || 42, aspect, 0.1, 400);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffeedd, 0.55);
    scene.add(ambient);
    ambLightRef.current = ambient;

    const sun = new THREE.DirectionalLight(0xfff2cc, 1.3);
    sun.position.set(25, 50, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 220;
    sun.shadow.camera.left  = -80;
    sun.shadow.camera.right =  80;
    sun.shadow.camera.top   =  80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);
    sunLightRef.current = sun;

    // Hemisphere sky/ground fill
    const hemi = new THREE.HemisphereLight(0x80a0ff, 0x2a3a10, 0.35);
    scene.add(hemi);

    // Build terrain
    const cx = myCharacter?.x ?? 30;
    const cy = myCharacter?.y ?? 25;
    terrainRef.current = buildTerrain(scene, cx, cy);

    // Spawn visual-only town walker NPCs
    townWalkersRef.current = createTownWalkers(scene);

    // Create 3D merchant/NPC entities in High Bastion
    npcEntitiesRef.current = createNPCEntities(scene);

    // Resize
    const onResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Animate
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const myChar = myCharRef.current;
      const now = Date.now();

      if (myChar) {
        const wp = tileToWorld(myChar.x, myChar.y);
        if (!playerPosRef.current) {
          playerPosRef.current = wp.clone();
          playerTargetRef.current = wp.clone();
        }
        lerp3(playerPosRef.current, playerTargetRef.current, 0.16);

        const px = playerPosRef.current.x;
        const pz = playerPosRef.current.z;
        
        // Get current zoom config with smooth interpolation
        const zoom = getCurrentZoomConfig();
        const dist = zoom.distance;
        const height = zoom.height;
        const angle = zoom.angle;

        // Classic 3/4 MMO camera with dynamic angle and height based on zoom
        camera.position.set(
          px - Math.sin(angle) * dist,
          height,
          pz + Math.cos(angle) * dist
        );
        camera.lookAt(px, 0, pz);
        camera.fov = zoom.fov;
        camera.updateProjectionMatrix();

        const myMesh = charMeshesRef.current[myChar.id];
        if (myMesh) {
          myMesh.position.x = playerPosRef.current.x;
          myMesh.position.z = playerPosRef.current.z;
          myMesh.position.y = Math.sin(now * 0.0018) * 0.04; // idle bob

          // Face direction of movement
          const dx = playerTargetRef.current.x - myMesh.position.x;
          const dz = playerTargetRef.current.z - myMesh.position.z;
          if (Math.abs(dx) + Math.abs(dz) > 0.05) {
            myMesh.rotation.y = Math.atan2(dx, dz);
          }

          // Player selection ring pulse
          const ring = myMesh.getObjectByName("selectionRing");
          if (ring && ring.material) ring.material.opacity = 0.55 + Math.sin(now * 0.004) * 0.28;

          // Player state reactions
          if (!entityStates[myChar.id]) myMesh.position.y = Math.sin(now * 0.0018) * 0.04;
          applyEntityStateVisuals(myMesh, myChar.id, now);

          billboardHpBar(myMesh, myChar, camera, settings.showHealthBars);
        }
      }

      // Other chars
      allCharsRef.current.forEach(c => {
        if (myChar && c.id === myChar.id) return;
        const mesh = charMeshesRef.current[c.id];
        if (!mesh) return;
        const target = tileToWorld(c.x, c.y);
        mesh.position.lerp(new THREE.Vector3(target.x, 0, target.z), 0.12);
        if (!entityStates[c.id]) mesh.position.y = Math.sin(now * 0.0018 + c.id.charCodeAt(0)) * 0.04;
        applyEntityStateVisuals(mesh, c.id, now);
        billboardHpBar(mesh, c, camera, settings.showHealthBars);
      });

      // Monsters
      monstersRef.current.forEach(m => {
        if (!m.is_alive) return;
        const mesh = monsterMeshesRef.current[m.id];
        if (!mesh) return;
        if (!entityStates[m.id]) {
          mesh.position.y = Math.sin(now * 0.0024 + m.id.charCodeAt(0)) * 0.06;
          mesh.rotation.y = Math.sin(now * 0.0010 + m.id.charCodeAt(0)) * 0.18;
        }
        applyEntityStateVisuals(mesh, m.id, now);
        billboardHpBar(mesh, m, camera, settings.showHealthBars);

        const ring = mesh.getObjectByName("selectionRing");
        if (ring && ring.material) ring.material.opacity = 0.25 + Math.sin(now * 0.003 + m.id.charCodeAt(0)) * 0.18;
      });

      // Animate visual NPC walkers
      if (townWalkersRef.current) townWalkersRef.current.update(now);

      // Update NPC entities
      if (npcEntitiesRef.current) npcEntitiesRef.current.update(now);

      updateNameplateDom(camera, renderer);
      try {
        renderer.render(scene, camera);
      } catch(e) {
        console.error("Render error:", e);
      }
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      if (townWalkersRef.current) townWalkersRef.current.dispose();
      if (npcEntitiesRef.current) npcEntitiesRef.current.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line

  // ─── SYNC PLAYER ───────────────────────────────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !myCharacter) return;
    if (!charMeshesRef.current[myCharacter.id]) {
      const mesh = buildCharacterMesh(myCharacter.race || "human", false, false);
      const wp   = tileToWorld(myCharacter.x, myCharacter.y);
      mesh.position.copy(wp);
      mesh.userData = { charId: myCharacter.id, isMe: true };
      scene.add(mesh);
      charMeshesRef.current[myCharacter.id] = mesh;
      playerPosRef.current    = wp.clone();
      playerTargetRef.current = wp.clone();
      // Show own ring
      const ring = mesh.getObjectByName("selectionRing");
      if (ring && ring.material) ring.material.opacity = 0.7;
    }
  }, [myCharacter?.id]); // eslint-disable-line

  useEffect(() => {
    if (!myCharacter || !playerTargetRef.current) return;
    const wp = tileToWorld(myCharacter.x, myCharacter.y);
    playerTargetRef.current.set(wp.x, 0, wp.z);
  }, [myCharacter?.x, myCharacter?.y]); // eslint-disable-line

  // ─── SYNC OTHER CHARS ──────────────────────────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const existing = new Set(Object.keys(charMeshesRef.current));

    allCharacters.forEach(c => {
      if (myCharacter && c.id === myCharacter.id) return;
      if (!charMeshesRef.current[c.id]) {
        const isAI = c.type === "ai_agent";
        const mesh = buildCharacterMesh(c.race || "human", isAI, false);
        const wp   = tileToWorld(c.x, c.y);
        mesh.position.copy(wp);
        mesh.userData = { charId: c.id, isAI };
        if (isAI) {
          mesh.traverse(child => {
            if (child.isMesh && !["hpBarBg","hpBarFill"].includes(child.name) && child.material) {
              child.material = child.material.clone();
              child.material.emissive = new THREE.Color(0x0e7490);
              child.material.emissiveIntensity = 0.18;
            }
          });
        }
        scene.add(mesh);
        charMeshesRef.current[c.id] = mesh;
      }
      existing.delete(c.id);
    });

    existing.forEach(id => {
      if (myCharacter && id === myCharacter.id) return;
      const m = charMeshesRef.current[id];
      if (m) { scene.remove(m); delete charMeshesRef.current[id]; }
    });
  }, [allCharacters]); // eslint-disable-line

  // ─── SYNC MONSTERS ─────────────────────────────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const existing = new Set(Object.keys(monsterMeshesRef.current));

    monsters.forEach(m => {
      if (!m.is_alive) {
        if (monsterMeshesRef.current[m.id]) {
          scene.remove(monsterMeshesRef.current[m.id]);
          delete monsterMeshesRef.current[m.id];
        }
        return;
      }
      if (!monsterMeshesRef.current[m.id]) {
        const mesh = buildCharacterMesh(null, false, true, m.species);
        const wp   = tileToWorld(m.x, m.y);
        mesh.position.copy(wp);
        mesh.userData = { monsterId: m.id, isMonster: true };
        mesh.traverse(child => {
          if (child.isMesh && !["hpBarBg","hpBarFill"].includes(child.name) && child.material) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(0x5a0000);
            child.material.emissiveIntensity = 0.14;
          }
        });
        scene.add(mesh);
        monsterMeshesRef.current[m.id] = mesh;
        // Show monster ring immediately
        const ring = mesh.getObjectByName("selectionRing");
        if (ring && ring.material) ring.material.opacity = 0.35;
      }
      existing.delete(m.id);
    });

    existing.forEach(id => {
      const m = monsterMeshesRef.current[id];
      if (m) { scene.remove(m); delete monsterMeshesRef.current[id]; }
    });
  }, [monsters]); // eslint-disable-line

  // ─── AMBIENT WORLD ─────────────────────────────────────────────────────────

  const { gameHour, timeLabel, weatherLabel } = useAmbientWorld(sceneRef, sunLightRef, ambLightRef, fogRef);

  // ─── NAMEPLATE DOM ─────────────────────────────────────────────────────────

  function updateNameplateDom(camera, renderer) {
    if (!settings.showNameplates) { setNameplates([]); return; }
    const plates = [];
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;

    const project = (worldPos) => {
      const v = worldPos.clone().project(camera);
      return { x: (v.x + 1) / 2 * w, y: -(v.y - 1) / 2 * h, behind: v.z > 1 };
    };

    const myChar = myCharRef.current;
    if (myChar && playerPosRef.current) {
      const lp = playerPosRef.current.clone();
      lp.y += (RACE_VISUALS[myChar.race || "human"] || RACE_VISUALS.human).height + 0.7;
      const { x, y, behind } = project(lp);
      if (!behind) plates.push({ id: myChar.id, name: myChar.name, x, y, type: "me", level: myChar.level || 1, sub: myChar.base_class || myChar.class });
    }

    allCharsRef.current.forEach(c => {
      if (myChar && c.id === myChar.id) return;
      const mesh = charMeshesRef.current[c.id];
      if (!mesh) return;
      const lp = mesh.position.clone();
      lp.y += (RACE_VISUALS[c.race || "human"] || RACE_VISUALS.human).height + 0.7;
      const { x, y, behind } = project(lp);
      if (!behind) plates.push({ id: c.id, name: c.name, x, y, type: c.type === "ai_agent" ? "ai" : "player", level: c.level || 1, sub: c.base_class || c.class });
    });

    monstersRef.current.filter(m => m.is_alive).forEach(m => {
      const mesh = monsterMeshesRef.current[m.id];
      if (!mesh) return;
      const lp = mesh.position.clone();
      lp.y += (MONSTER_VISUALS[m.species] || MONSTER_VISUALS.goblin).height + 0.70;
      const { x, y, behind } = project(lp);
      if (!behind) plates.push({ id: m.id, name: m.name, x, y, type: "monster", level: m.level || 1, sub: m.species, hp: m.hp, maxHp: m.max_hp });
    });

    setNameplates(plates);
  }

  // ─── CLICK HANDLING ───────────────────────────────────────────────────────

  const handleCanvasClick = useCallback((e) => {
    const renderer = rendererRef.current;
    const camera   = cameraRef.current;
    const scene    = sceneRef.current;
    if (!renderer || !camera || !scene) return;

    const rect  = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1
    );

    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);

    // NPCs first (High Bastion traders/merchants)
    if (npcEntitiesRef.current) {
      const npcHits = ray.intersectObjects(Object.values(npcEntitiesRef.current.meshes), true);
      if (npcHits.length > 0) {
        let obj = npcHits[0].object;
        while (obj.parent && !obj.userData.isNPC) obj = obj.parent;
        if (obj.userData.poiId && obj.userData.npcType) {
          // Trigger NPC interaction in World.jsx
          // This would call a handler passed from World
          console.log("[WorldScene3D] NPC clicked:", obj.userData.poiName, obj.userData.npcType);
        }
      }
    }

    // Monsters next
    const mHits = ray.intersectObjects(Object.values(monsterMeshesRef.current), true);
    if (mHits.length > 0) {
      let obj = mHits[0].object;
      while (obj.parent && !obj.userData.monsterId) obj = obj.parent;
      if (obj.userData.monsterId && onMonsterClickRef.current) {
        const monster = monstersRef.current.find(m => m.id === obj.userData.monsterId);
        if (monster) { onMonsterClickRef.current(monster); return; }
      }
    }

    // Other characters
    const cHits = ray.intersectObjects(
      Object.values(charMeshesRef.current).filter(m => !m.userData.isMe), true
    );
    if (cHits.length > 0) {
      let obj = cHits[0].object;
      while (obj.parent && !obj.userData.charId) obj = obj.parent;
      // Character targeting handled at World level via onMonsterClick-equivalent
      return;
    }

    // Terrain → move
    const terrain = terrainRef.current;
    if (!terrain) return;
    const tHits = ray.intersectObjects(terrain.children, false);
    if (tHits.length > 0) {
      const { tx, ty } = tHits[0].object.userData;
      if (tx === undefined || !isPassable(tx, ty)) return;
      const myChar = myCharRef.current;
      if (!myChar) return;
      if (movingRef.current) { movingRef.current = false; pendingPathRef.current = []; }
      const path = buildPath(myChar.x, myChar.y, tx, ty);
      if (path.length > 0) walkPath(path);
    }
  }, []); // eslint-disable-line

  const walkPath = useCallback(async (path) => {
    if (!path.length) { movingRef.current = false; return; }
    movingRef.current = true;
    for (let i = 0; i < path.length; i++) {
      if (!movingRef.current) break;
      const [nx, ny] = path[i];
      pendingPathRef.current = path.slice(i + 1);
      if (playerTargetRef.current) {
        const wp = tileToWorld(nx, ny);
        playerTargetRef.current.set(wp.x, 0, wp.z);
      }
      if (onMoveRef.current) {
        const result = await onMoveRef.current(nx, ny);
        if (result === "combat") { movingRef.current = false; pendingPathRef.current = []; return; }
      }
      await new Promise(r => setTimeout(r, 175));
    }
    movingRef.current = false;
    pendingPathRef.current = [];
  }, []); // eslint-disable-line

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const nameplateStyle = {
    me:      "text-amber-200 border-amber-600 bg-black/90 shadow-sm shadow-amber-900/40",
    player:  "text-sky-200   border-sky-700   bg-black/90 shadow-sm shadow-sky-900/40",
    ai:      "text-cyan-200  border-cyan-700  bg-black/90 shadow-sm shadow-cyan-900/40",
    monster: "text-red-300   border-red-800   bg-black/90 shadow-sm shadow-red-900/40",
  };

  return (
    <div className="w-full h-full relative bg-gray-950 overflow-hidden">
      {/* Three.js mount */}
      <div
        ref={mountRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
        style={{ cursor: "crosshair" }}
      />

      {/* DOM nameplates */}
      {settings.showNameplates && nameplates.map(plate => (
        <div
          key={plate.id}
          className="absolute pointer-events-none select-none text-center"
          style={{ left: plate.x, top: plate.y, transform: "translate(-50%, -100%)" }}
        >
          <div className={`text-[11px] font-bold px-2 py-0.5 rounded border leading-tight whitespace-nowrap ${nameplateStyle[plate.type] || "text-gray-300 border-gray-700 bg-black/90"}`}>
            {plate.type === "me" && <span className="mr-1 text-[9px]">▶</span>}
            <span>{plate.name}</span>
            {plate.level && <span className="ml-1.5 opacity-55 text-[9px] font-normal">Lv.{plate.level}</span>}
            {plate.sub && <span className="ml-1 opacity-35 text-[9px] capitalize font-normal">· {plate.sub}</span>}
          </div>
          {/* Mini HP bar under nameplate for monsters */}
          {plate.type === "monster" && plate.maxHp && (
            <div className="w-full mt-0.5 h-1.5 bg-gray-900/90 rounded-full overflow-hidden border border-gray-700/50">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max(2, Math.min(100, (plate.hp / plate.maxHp) * 100))}%`,
                  backgroundColor: plate.hp / plate.maxHp > 0.6 ? "#22c55e" : plate.hp / plate.maxHp > 0.3 ? "#f59e0b" : "#ef4444"
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Zone identity banner — shows when in a named zone */}
      <ZoneBanner myCharacter={myCharacter} />

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-[10px] text-gray-600 bg-gray-900/70 px-2 py-1 rounded pointer-events-none">
        Click terrain to move · Click entities to target
      </div>

      {/* Day/night widget */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <AmbientHUDWidget gameHour={gameHour} timeLabel={timeLabel} weatherLabel={weatherLabel} />
      </div>
    </div>
  );
}

// ─── ZONE BANNER ─────────────────────────────────────────────────────────────

function ZoneBanner({ myCharacter }) {
  const [banner, setBanner] = useState(null);
  const lastZoneRef = useRef(null);

  useEffect(() => {
    if (!myCharacter) return;
    const zone = getZoneAt(myCharacter.x, myCharacter.y);
    const zoneId = zone?.id ?? null;
    if (zoneId !== lastZoneRef.current) {
      lastZoneRef.current = zoneId;
      if (zone) {
        setBanner(zone);
        const t = setTimeout(() => setBanner(null), 4000);
        return () => clearTimeout(t);
      } else {
        setBanner(null);
      }
    }
  }, [myCharacter?.x, myCharacter?.y]); // eslint-disable-line

  if (!banner) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none
      flex flex-col items-center gap-1 animate-pulse"
      style={{ animationDuration: "3s" }}>
      <div className="text-4xl">{banner.emoji}</div>
      <div className="text-white font-black text-lg tracking-widest uppercase drop-shadow-lg"
        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
        {banner.name}
      </div>
      <div className="text-gray-400 text-xs tracking-wide max-w-xs text-center"
        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
        {banner.description?.slice(0, 80)}…
      </div>
    </div>
  );
}