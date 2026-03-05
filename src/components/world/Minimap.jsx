import { useEffect, useRef } from "react";
import { MAP_W, MAP_H, getTile } from "@/components/shared/worldZones";
import { isPassable } from "@/components/shared/movementAuthority";

const MINI_W = 150;
const MINI_H = 120;
const TX = MINI_W / MAP_W;
const TY = MINI_H / MAP_H;

const TERRAIN_MINI = {
  grass: "#2d5a27", forest: "#1a3d1a", water: "#1a3d6e", stone: "#4a4a4a",
  sand: "#8b7355", lava: "#8b2500", swamp: "#2a3d1a", plains: "#4a5a20",
};

export default function Minimap({ myCharacter, allCharacters, monsters, onFastTravel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = MINI_W;
    canvas.height = MINI_H;
    const ctx = canvas.getContext("2d");

    // Terrain
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const tile = getTile(tx, ty);
        ctx.fillStyle = TERRAIN_MINI[tile] || "#2d5a27";
        ctx.fillRect(tx * TX, ty * TY, Math.ceil(TX), Math.ceil(TY));
      }
    }

    // Monsters — red dots
    monsters?.filter(m => m.is_alive).forEach(m => {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(m.x * TX - 1, m.y * TY - 1, 2.5, 2.5);
    });

    // Other characters
    allCharacters?.forEach(c => {
      if (c.id === myCharacter?.id) return;
      ctx.fillStyle = c.type === "ai_agent" ? "#22d3ee" : "#fbbf24";
      ctx.fillRect(c.x * TX - 1, c.y * TY - 1, 2.5, 2.5);
    });

    // Player — white dot + ring
    if (myCharacter) {
      const px = myCharacter.x * TX;
      const py = myCharacter.y * TY;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }, [myCharacter?.x, myCharacter?.y, allCharacters?.length, monsters?.length]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !onFastTravel) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const tx = Math.floor(mx / TX);
    const ty = Math.floor(my / TY);
    if (isPassable(tx, ty)) onFastTravel(tx, ty);
  };

  return (
    <div className="absolute top-2 right-2 z-20 border border-gray-700 rounded-lg overflow-hidden shadow-2xl"
      style={{ width: MINI_W, height: MINI_H }}>
      <canvas ref={canvasRef} onClick={handleClick} className="cursor-crosshair block"
        style={{ width: MINI_W, height: MINI_H }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-xs text-gray-500 text-center py-0.5 pointer-events-none">
        minimap · click to travel
      </div>
    </div>
  );
}