/**
 * useAgentRecorder — Passive "stealth" recording for AI agents.
 * Renders the agent's world state to an off-screen canvas every ~100ms,
 * encodes frames to WebM via MediaRecorder from a canvas stream.
 * Agent is never aware; no HUD indicators shown to agent side.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getTile, TERRAIN_COLORS, TILE_SIZE, MAP_W, MAP_H, ZONES, POINTS_OF_INTEREST } from "@/components/shared/worldZones";

const RENDER_W = 640;
const RENDER_H = 480;
const VIEWPORT_TILES_W = Math.floor(RENDER_W / TILE_SIZE);
const VIEWPORT_TILES_H = Math.floor(RENDER_H / TILE_SIZE);

const MONSTER_EMOJI = { goblin: "👺", orc: "👹", dragon: "🐉", skeleton: "💀", troll: "🧌", vampire: "🧛", werewolf: "🐺", wraith: "👻" };
const CLASS_EMOJI   = { warrior: "⚔️", hunter: "🏹", healer: "💚", wizard: "🧙", merchant: "💰", craftsman: "🔨" };

function renderAgentFrame(ctx, agentData, worldState) {
  const { characters = [], monsters = [] } = worldState;
  const cx = Math.floor(agentData.x || 20);
  const cy = Math.floor(agentData.y || 20);

  // Viewport origin (camera centered on agent)
  const ox = Math.max(0, Math.min(cx - Math.floor(VIEWPORT_TILES_W / 2), MAP_W - VIEWPORT_TILES_W));
  const oy = Math.max(0, Math.min(cy - Math.floor(VIEWPORT_TILES_H / 2), MAP_H - VIEWPORT_TILES_H));

  ctx.clearRect(0, 0, RENDER_W, RENDER_H);

  // Terrain
  for (let ty = oy; ty < oy + VIEWPORT_TILES_H; ty++) {
    for (let tx = ox; tx < ox + VIEWPORT_TILES_W; tx++) {
      const tile = getTile(tx, ty);
      ctx.fillStyle = TERRAIN_COLORS[tile] || "#2d5a27";
      ctx.fillRect((tx - ox) * TILE_SIZE, (ty - oy) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.strokeRect((tx - ox) * TILE_SIZE, (ty - oy) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Zone labels
  ZONES.forEach(zone => {
    const zx = (zone.x - ox) * TILE_SIZE;
    const zy = (zone.y - oy) * TILE_SIZE;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(zx, zy, zone.w * TILE_SIZE, 12);
    ctx.font = "bold 8px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${zone.emoji} ${zone.name}`, zx + 2, zy + 1);
  });

  // POIs
  POINTS_OF_INTEREST.forEach(poi => {
    ctx.font = `${TILE_SIZE - 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(poi.emoji, (poi.x - ox) * TILE_SIZE + TILE_SIZE / 2, (poi.y - oy) * TILE_SIZE + TILE_SIZE / 2);
  });

  // Monsters
  monsters.filter(m => m.is_alive).forEach(m => {
    ctx.font = `${TILE_SIZE - 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(MONSTER_EMOJI[m.species] || "👾", (m.x - ox) * TILE_SIZE + TILE_SIZE / 2, (m.y - oy) * TILE_SIZE + TILE_SIZE / 2);
  });

  // Other characters
  characters.forEach(c => {
    if (c.id === agentData.id) return;
    ctx.font = `${TILE_SIZE - 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const px = (c.x - ox) * TILE_SIZE + TILE_SIZE / 2;
    const py = (c.y - oy) * TILE_SIZE + TILE_SIZE / 2;
    ctx.fillText(c.avatar_emoji || "🧑", px, py);
  });

  // The agent (centered, highlighted)
  const apx = (cx - ox) * TILE_SIZE + TILE_SIZE / 2;
  const apy = (cy - oy) * TILE_SIZE + TILE_SIZE / 2;
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(apx, apy, TILE_SIZE / 2 + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.font = `${TILE_SIZE}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(agentData.avatar_emoji || CLASS_EMOJI[agentData.class] || "🤖", apx, apy);

  // Agent name tag
  ctx.font = "bold 9px sans-serif";
  ctx.fillStyle = "#22d3ee";
  ctx.textAlign = "center";
  ctx.fillText(agentData.name || "Agent", apx, apy + TILE_SIZE + 2);

  // Status HUD (top-left overlay)
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, 200, 50);
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#22d3ee";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`${agentData.name || "Agent"} — Lv.${agentData.level || 1} ${(agentData.class || "").toUpperCase()}`, 6, 5);
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`HP: ${agentData.hp || 100}  XP: ${agentData.xp || 0}  Gold: ${agentData.gold || 0}`, 6, 20);
  ctx.fillText(`Pos: (${cx}, ${cy})  Status: ${agentData.status || "idle"}`, 6, 34);

  // Stealth indicator (subtle, bottom-right) - visible to viewer only
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(RENDER_W - 90, RENDER_H - 22, 88, 18);
  ctx.font = "9px monospace";
  ctx.fillStyle = "#22d3ee88";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("◉ STEALTH CAPTURE", RENDER_W - 4, RENDER_H - 4);
}

export default function useAgentRecorder() {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl]   = useState(null);
  const [error, setError]         = useState(null);
  const [duration, setDuration]   = useState(0);

  const canvasRef       = useRef(null);
  const mediaRecorderRef= useRef(null);
  const chunksRef       = useRef([]);
  const pollRef         = useRef(null);
  const timerRef        = useRef(null);
  const worldStateRef   = useRef({ characters: [], monsters: [] });
  const agentDataRef    = useRef(null);

  const ensureCanvas = () => {
    if (!canvasRef.current) {
      const c = document.createElement("canvas");
      c.width  = RENDER_W;
      c.height = RENDER_H;
      canvasRef.current = c;
    }
    return canvasRef.current;
  };

  const startRecording = useCallback(async (agentCharacter) => {
    setError(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);
    chunksRef.current = [];
    agentDataRef.current = agentCharacter;

    try {
      const canvas = ensureCanvas();
      const ctx = canvas.getContext("2d");

      // Initial world fetch
      const [characters, monsters] = await Promise.all([
        base44.entities.Character.list("-updated_date", 100),
        base44.entities.Monster.filter({ is_alive: true }),
      ]);
      worldStateRef.current = { characters, monsters };

      // Poll world state every 2s
      pollRef.current = setInterval(async () => {
        const [chars, mons] = await Promise.all([
          base44.entities.Character.list("-updated_date", 100),
          base44.entities.Monster.filter({ is_alive: true }),
        ]);
        // Refresh agent data too
        const freshAgent = chars.find(c => c.id === agentCharacter.id);
        if (freshAgent) agentDataRef.current = freshAgent;
        worldStateRef.current = { characters: chars, monsters: mons };
      }, 2000);

      // Subscribe to agent changes
      const unsubAgent = base44.entities.Character.subscribe(event => {
        if (event.id === agentCharacter.id && event.data) {
          agentDataRef.current = event.data;
        }
      });

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const stream = canvas.captureStream(15); // 15 fps
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecording(false);
        clearInterval(timerRef.current);
        clearInterval(pollRef.current);
        unsubAgent();
      };

      recorder.start(1000);
      setRecording(true);

      // Render loop
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
        renderAgentFrame(ctx, agentDataRef.current || agentCharacter, worldStateRef.current);
      }, 100);
    } catch (err) {
      setError(err.message || "Failed to start agent recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(pollRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);
    setError(null);
  }, [videoUrl]);

  return { recording, startRecording, stopRecording, videoBlob, videoUrl, error, duration, reset };
}