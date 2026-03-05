import { useEffect, useRef, useCallback, useState } from "react";
import { drawEventOverlays } from "./EventOverlay.jsx";
import { ZONES, POINTS_OF_INTEREST, TERRAIN_COLORS, getTile, getZoneAt, getPOIAt, MAP_W, MAP_H } from "@/components/shared/worldZones";
import { buildPath, isPassable } from "@/components/shared/movementAuthority";

const TILE = 40; // rendered tile size
const VIEWPORT_W = 22; // tiles visible horizontally
const VIEWPORT_H = 16; // tiles visible vertically

const MONSTER_EMOJI = {
  goblin: "👺", orc: "👹", dragon: "🐉", skeleton: "💀",
  troll: "🧌", vampire: "🧛", werewolf: "🐺", wraith: "👻",
  basilisk: "🦎", kraken: "🦑"
};
const CLASS_EMOJI = {
  warrior: "⚔️", hunter: "🏹", healer: "💚", wizard: "🧙",
  merchant: "💰", craftsman: "🔨", fighter: "🥊", magician: "✨"
};

// Shade variants per terrain (offset by tiny amounts)
const SHADE_VARIANTS = {
  grass:  ["#2d5a27","#305e2a","#2a5624","#326228"],
  forest: ["#1a3d1a","#1c421c","#183818","#1e4420"],
  water:  ["#1a3d6e","#1c4275","#183860","#1e4478"],
  stone:  ["#4a4a4a","#4e4e4e","#464646","#525252"],
  sand:   ["#8b7355","#8e7859","#876f50","#92785c"],
  lava:   ["#8b2500","#932800","#822300","#9b2a00"],
  swamp:  ["#2a3d1a","#2c401c","#283a18","#2e421e"],
  plains: ["#4a5a20","#4d5e22","#47561e","#506224"],
};

function getTileColor(tile, x, y) {
  const variants = SHADE_VARIANTS[tile] || ["#2d5a27"];
  return variants[(x * 7 + y * 13) % variants.length];
}


export default function WorldMap({ myCharacter, allCharacters, monsters, worldObjects, onMove, activeEvents = [], onMonsterClick }) {
  const canvasRef  = useRef(null);
  const containerRef = useRef(null);
  // Camera in tile coords (top-left tile visible)
  const camRef     = useRef({ x: 20, y: 18 });
  const camTarget  = useRef({ x: 20, y: 18 });
  const zoomRef    = useRef(1);
  const rafRef     = useRef(null);
  const pathRef    = useRef([]);
  const movingRef  = useRef(false);
  const pendingPath = useRef([]);
  const bobRef     = useRef(0);
  const frameRef   = useRef(0);

  const [tooltip, setTooltip] = useState(null); // { x, y, content }
  const [pathPreview, setPathPreview] = useState([]); // [{x,y}]
  const [isMoving, setIsMoving] = useState(false);

  const charRef = useRef(myCharacter);
  charRef.current = myCharacter;

  const allCharsRef = useRef(allCharacters);
  allCharsRef.current = allCharacters;

  const monstersRef = useRef(monsters);
  monstersRef.current = monsters;

  const effectiveTile = () => Math.round(TILE * zoomRef.current);

  const worldToCanvas = (tx, ty) => {
    const ts = effectiveTile();
    return [(tx - camRef.current.x) * ts, (ty - camRef.current.y) * ts];
  };

  const canvasToWorld = (cx, cy) => {
    const ts = effectiveTile();
    return [
      Math.floor(cx / ts + camRef.current.x),
      Math.floor(cy / ts + camRef.current.y)
    ];
  };

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const ts = effectiveTile();
    const cam = camRef.current;
    bobRef.current = Math.sin(Date.now() / 400) * 3;

    ctx.clearRect(0, 0, W, H);

    const myChar = charRef.current;
    const myX = myChar?.x ?? 20;
    const myY = myChar?.y ?? 18;

    // Fog of war range in tiles
    const FOG_RANGE = 8;

    // Draw tiles
    const startX = Math.max(0, Math.floor(cam.x));
    const startY = Math.max(0, Math.floor(cam.y));
    const endX = Math.min(MAP_W, startX + VIEWPORT_W + 2);
    const endY = Math.min(MAP_H, startY + VIEWPORT_H + 2);

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = getTile(tx, ty);
        const color = getTileColor(tile, tx, ty);
        const [cx, cy] = worldToCanvas(tx, ty);

        // Fog of war
        const dist = Math.sqrt((tx - myX) ** 2 + (ty - myY) ** 2);
        const alpha = dist > FOG_RANGE ? 0.35 : 1;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, ts, ts);

        // Zone border check — draw if edge tile of zone
        const zone = getZoneAt(tx, ty);
        if (zone) {
          const onEdgeX = tx === zone.x || tx === zone.x + zone.w - 1;
          const onEdgeY = ty === zone.y || ty === zone.y + zone.h - 1;
          if (onEdgeX || onEdgeY) {
            ctx.strokeStyle = zone.color + "80"; // 50% opacity
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(cx + 0.5, cy + 0.5, ts - 1, ts - 1);
            ctx.setLineDash([]);
          }
        }

        ctx.globalAlpha = 1;
      }
    }

    // Zone name banners
    ZONES.forEach(zone => {
      const [cx, cy] = worldToCanvas(zone.x, zone.y);
      if (cx < -zone.w * ts || cx > W || cy < -ts * 2 || cy > H) return;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(cx + 2, cy + 2, zone.w * ts - 4, 16);
      ctx.font = `bold ${Math.max(9, ts * 0.25)}px sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${zone.emoji} ${zone.name}`, cx + 6, cy + 4);
      ctx.globalAlpha = 1;
    });

    // Event overlays
    const evCtx = { ...ctx };
    drawEventOverlays(ctx, activeEvents, ts, cam);

    // POIs
    POINTS_OF_INTEREST.forEach(poi => {
      const [cx, cy] = worldToCanvas(poi.x, poi.y);
      if (cx < -ts || cx > W + ts || cy < -ts || cy > H + ts) return;
      ctx.font = `${ts - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(poi.emoji, cx + ts / 2, cy + ts / 2);
    });

    // World objects
    worldObjects.forEach(obj => {
      const [cx, cy] = worldToCanvas(obj.x, obj.y);
      if (cx < -ts || cx > W + ts) return;
      ctx.font = `${ts - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.emoji || "🏠", cx + ts / 2, cy + ts / 2);
    });

    // Path preview dots
    const pPath = pendingPath.current;
    if (pPath.length > 0) {
      ctx.strokeStyle = "rgba(251,191,36,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      pPath.forEach(([px, py], i) => {
        const [cx, cy] = worldToCanvas(px, py);
        if (i === 0) ctx.moveTo(cx + ts / 2, cy + ts / 2);
        else ctx.lineTo(cx + ts / 2, cy + ts / 2);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      pPath.forEach(([px, py]) => {
        const [cx, cy] = worldToCanvas(px, py);
        ctx.fillStyle = "rgba(251,191,36,0.4)";
        ctx.beginPath();
        ctx.arc(cx + ts / 2, cy + ts / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Monsters
    monstersRef.current.filter(m => m.is_alive).forEach(m => {
      const [cx, cy] = worldToCanvas(m.x, m.y);
      if (cx < -ts || cx > W + ts || cy < -ts || cy > H + ts) return;
      ctx.font = `${ts - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(MONSTER_EMOJI[m.species] || "👾", cx + ts / 2, cy + ts / 2);
    });

    // Other characters
    allCharsRef.current.forEach(c => {
      if (!myChar || c.id === myChar.id) return;
      const [cx, cy] = worldToCanvas(c.x, c.y);
      if (cx < -ts || cx > W + ts || cy < -ts || cy > H + ts) return;
      ctx.font = `${ts - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.avatar_emoji || (c.type === "ai_agent" ? "🤖" : "🧑"), cx + ts / 2, cy + ts / 2);
      ctx.font = `${Math.max(8, ts * 0.22)}px sans-serif`;
      ctx.fillStyle = c.type === "ai_agent" ? "#67e8f9" : "#fbbf24";
      ctx.fillText(c.name, cx + ts / 2, cy + ts + 4);
    });

    // My character (bob + glow)
    if (myChar) {
      const [cx, cy] = worldToCanvas(myChar.x, myChar.y);
      const bob = bobRef.current;
      // Glow / radial light feel
      const grd = ctx.createRadialGradient(cx + ts/2, cy + ts/2, 0, cx + ts/2, cy + ts/2, ts * 2);
      grd.addColorStop(0, "rgba(251,191,36,0.12)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(cx - ts, cy - ts, ts * 4, ts * 4);

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + ts / 2, cy + ts / 2 + bob, ts / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `${ts}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(myChar.avatar_emoji || CLASS_EMOJI[myChar.class] || "🧑", cx + ts / 2, cy + ts / 2 + bob);
    }
  }, [worldObjects, activeEvents]);

  // Animation loop
  const animate = useCallback(() => {
    // Smooth camera lerp
    const speed = 0.12;
    camRef.current.x += (camTarget.current.x - camRef.current.x) * speed;
    camRef.current.y += (camTarget.current.y - camRef.current.y) * speed;

    draw();
    rafRef.current = requestAnimationFrame(animate);
  }, [draw]);

  // Center camera on character
  const centerCam = (charX, charY) => {
    const newCX = charX - VIEWPORT_W / 2;
    const newCY = charY - VIEWPORT_H / 2;
    camTarget.current.x = Math.max(0, Math.min(MAP_W - VIEWPORT_W, newCX));
    camTarget.current.y = Math.max(0, Math.min(MAP_H - VIEWPORT_H, newCY));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  // Follow character on move
  useEffect(() => {
    if (myCharacter) centerCam(myCharacter.x, myCharacter.y);
  }, [myCharacter?.x, myCharacter?.y]);

  // Step-by-step movement along path — sequential async to avoid race conditions
  const walkPath = useCallback(async (path) => {
    if (!path.length) { movingRef.current = false; setIsMoving(false); pendingPath.current = []; return; }
    movingRef.current = true;
    setIsMoving(true);

    for (let i = 0; i < path.length; i++) {
      if (!movingRef.current) break; // allow cancellation
      const [nx, ny] = path[i];
      pendingPath.current = path.slice(i + 1);

      if (onMove) {
        const result = await onMove(nx, ny);
        if (result === "combat") {
          movingRef.current = false;
          setIsMoving(false);
          pendingPath.current = [];
          return;
        }
      }
      centerCam(nx, ny);

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    movingRef.current = false;
    setIsMoving(false);
    pendingPath.current = [];
  }, [onMove]);

  const handleClick = (e) => {
    if (movingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [tx, ty] = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return;

    // Check monster click
    const monster = monstersRef.current.find(m => m.is_alive && m.x === tx && m.y === ty);
    if (monster && onMonsterClick) { onMonsterClick(monster); return; }

    if (!isPassable(tx, ty)) return;

    if (!charRef.current) return;
    const path = buildPath(charRef.current.x, charRef.current.y, tx, ty);
    if (path.length > 0) {
      pendingPath.current = path;
      walkPath(path);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [tx, ty] = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const monster = monstersRef.current.find(m => m.is_alive && m.x === tx && m.y === ty);
    if (monster && onMonsterClick) onMonsterClick(monster);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [tx, ty] = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) { setTooltip(null); return; }

    // Build tooltip content
    const zone = getZoneAt(tx, ty);
    const poi = getPOIAt(tx, ty);
    const monster = monstersRef.current.find(m => m.is_alive && m.x === tx && m.y === ty);
    const char = allCharsRef.current.find(c => c.x === tx && c.y === ty && c.id !== charRef.current?.id);

    const parts = [];
    if (zone) parts.push(`📍 ${zone.name} (Danger ${zone.danger}/7)`);
    if (poi) parts.push(`${poi.emoji} ${poi.name}`);
    if (monster) parts.push(`${MONSTER_EMOJI[monster.species] || "👾"} ${monster.name} Lv.${monster.level} HP:${monster.hp}/${monster.max_hp}`);
    if (char) parts.push(`${char.avatar_emoji || "🧑"} ${char.name} Lv.${char.level} ${char.base_class || char.class}`);

    if (parts.length > 0) {
      setTooltip({ screenX: e.clientX - rect.left, screenY: e.clientY - rect.top, lines: parts });
    } else {
      setTooltip(null);
    }

    // Show path preview on hover (not during movement)
    if (!movingRef.current && charRef.current && isPassable(tx, ty)) {
      const previewPath = buildPath(charRef.current.x, charRef.current.y, tx, ty);
      pendingPath.current = previewPath;
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    if (!movingRef.current) pendingPath.current = [];
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomRef.current = Math.max(0.5, Math.min(2, zoomRef.current + delta));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className={`w-full h-full ${isMoving ? "cursor-wait" : "cursor-crosshair"}`}
        style={{ imageRendering: "pixelated" }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-gray-900/95 border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-200 pointer-events-none max-w-52"
          style={{ left: tooltip.screenX + 12, top: tooltip.screenY - 10 }}
        >
          {tooltip.lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-gray-900/80 px-2 py-1 rounded pointer-events-none">
        {isMoving ? "⚡ Moving..." : "Click to move · Scroll to zoom · Right-click monsters to attack"}
      </div>
    </div>
  );
}