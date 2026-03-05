/**
 * NPCEntities — Create actual 3D merchant/NPC entities in High Bastion.
 * These are visual-only game world objects, separate from the gameplay simulation.
 */

import * as THREE from "three";
import { POINTS_OF_INTEREST, getZoneAt, TILE_SIZE } from "@/components/shared/worldZones";

// ─── NPC VISUAL DEFINITIONS ───────────────────────────────────────────────────

const NPC_ROLES = {
  trader: { color: 0xd4a017, emoji: "💰", label: "Trader" },
  merchant: { color: 0x9a7050, emoji: "🏪", label: "Merchant" },
  herbalist: { color: 0x3a8a20, emoji: "🌿", label: "Herbalist" },
  healer: { color: 0xe8c0d0, emoji: "💚", label: "Healer" },
  quest_giver: { color: 0x7a7aaa, emoji: "❓", label: "Quest Giver" },
};

// ─── NPC MESH BUILDER ──────────────────────────────────────────────────────────

function buildNPCMesh(npcType) {
  const group = new THREE.Group();
  const role = NPC_ROLES[npcType] || NPC_ROLES.merchant;

  // Simpler NPC silhouette — smaller than player
  const bodyColor = role.color;
  const accentColor = 0xfbbf24;

  // Legs
  const legH = 0.35;
  const legW = 0.24;
  [-1, 1].forEach(side => {
    const legGeo = new THREE.BoxGeometry(legW, legH, legW);
    const legMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(side * legW * 1.5, legH * 0.5, 0);
    group.add(leg);
  });

  // Body
  const bodyH = 0.40;
  const bodyW = 0.28;
  const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.65);
  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = legH + bodyH * 0.5;
  group.add(body);

  // Accent belt
  const beltGeo = new THREE.BoxGeometry(bodyW + 0.03, 0.05, bodyW * 0.67);
  const beltMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = legH + bodyH * 0.15;
  group.add(belt);

  // Arms
  const armH = 0.36;
  const armW = 0.20;
  [-1, 1].forEach(side => {
    const armGeo = new THREE.BoxGeometry(armW, armH, armW);
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(side * (bodyW * 0.54), legH + bodyH * 0.55, 0);
    group.add(arm);
  });

  // Head
  const headSz = bodyW * 0.65;
  const headGeo = new THREE.BoxGeometry(headSz, headSz, headSz);
  const headMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const headY = legH + bodyH + headSz * 0.48;
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = headY;
  group.add(head);

  // Eyes
  [-1, 1].forEach(side => {
    const eyeGeo = new THREE.BoxGeometry(headSz * 0.16, headSz * 0.12, headSz * 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * headSz * 0.20, headY + headSz * 0.02, headSz * 0.42);
    group.add(eye);
  });

  // Shadow disc
  const shadowGeo = new THREE.CircleGeometry(bodyW * 0.55, 10);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  // Selection ring (for interaction hints)
  const ringOuter = bodyW * 0.70;
  const ringGeo = new THREE.RingGeometry(ringOuter - 0.06, ringOuter, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.018;
  ring.name = "npcRing";
  group.add(ring);

  // Nameplate label (separate DOM, handled by World)
  group.userData = { npcType, role, isNPC: true };

  return group;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export function createNPCEntities(scene) {
  const npcMeshes = {};

  // Find High Bastion NPCs from POIs
  const NPCs = POINTS_OF_INTEREST.filter(poi => {
    const zone = getZoneAt(poi.x, poi.y);
    return zone?.id === "high_bastion" && poi.npcType && ["trader", "merchant", "herbalist", "healer", "quest_giver"].includes(poi.npcType);
  });

  NPCs.forEach(poi => {
    const npcType = poi.npcType || "merchant";
    const mesh = buildNPCMesh(npcType);

    // Place at POI location
    const wx = poi.x * TILE_SIZE;
    const wz = poi.y * TILE_SIZE;
    mesh.position.set(wx, 0, wz);
    mesh.userData.poiId = poi.id;
    mesh.userData.poiName = poi.name;

    scene.add(mesh);
    npcMeshes[poi.id] = mesh;
  });

  return {
    meshes: npcMeshes,
    dispose() {
      Object.values(npcMeshes).forEach(mesh => scene.remove(mesh));
    },
    update(now) {
      Object.values(npcMeshes).forEach(mesh => {
        // Idle bob
        mesh.position.y = Math.sin(now * 0.0016 + mesh.position.x) * 0.03;

        // Gentle spin
        mesh.rotation.y += 0.003;

        // Pulse ring
        const ring = mesh.getObjectByName("npcRing");
        if (ring && ring.material) {
          ring.material.opacity = 0.2 + Math.sin(now * 0.003) * 0.15;
        }
      });
    },
  };
}

// ─── LIGHT INTERACTION HINT UI ────────────────────────────────────────────────

export function getNPCInteractionUI(npcId, npcMeshes) {
  const mesh = npcMeshes[npcId];
  if (!mesh) return null;

  const role = mesh.userData.role || NPC_ROLES.merchant;
  return {
    npcId,
    poiName: mesh.userData.poiName,
    npcType: mesh.userData.npcType,
    emoji: role.emoji,
    label: role.label,
  };
}