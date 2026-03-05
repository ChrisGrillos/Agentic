import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ZONES, POINTS_OF_INTEREST, TERRAIN_COLORS, getTile, MAP_W, MAP_H, TILE_SIZE } from "@/components/shared/worldZones";
import { HOUSE_TIERS, GUILD_HALL_TIERS } from "@/components/shared/housingData";
import MapLegend from "@/components/worldmap/MapLegend";
import MapInfoPanel from "@/components/worldmap/MapInfoPanel";
import MapLayerToggles from "@/components/worldmap/MapLayerToggles";

// Guild banner colors (cycle through for different guilds)
const GUILD_COLORS = [
  "rgba(239,68,68,0.22)", "rgba(59,130,246,0.22)", "rgba(34,197,94,0.22)",
  "rgba(168,85,247,0.22)", "rgba(249,115,22,0.22)", "rgba(20,184,166,0.22)",
];
const GUILD_BORDER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#14b8a6"
];

const MONSTER_EMOJI = {
  goblin:"👺",orc:"👹",dragon:"🐉",skeleton:"💀",
  troll:"🧌",vampire:"🧛",werewolf:"🐺",wraith:"👻",basilisk:"🦎",kraken:"🦑"
};

export default function WorldMapView() {
  const canvasRef = useRef(null);
  const [characters, setCharacters]   = useState([]);
  const [houses, setHouses]           = useState([]);
  const [guilds, setGuilds]           = useState([]);
  const [monsters, setMonsters]       = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [selected, setSelected]       = useState(null); // { type, data }
  const [layers, setLayers]           = useState({ characters: true, houses: true, guilds: true, monsters: true, pois: true, territory: true });
  const [loading, setLoading]         = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    const [chars, allHouses, allGuilds, allMonsters] = await Promise.all([
      base44.entities.Character.list("-updated_date", 100),
      base44.entities.PlayerHouse.list("-created_date", 200),
      base44.entities.Guild.filter({ status: "active" }),
      base44.entities.Monster.filter({ is_alive: true }),
    ]);
    setCharacters(chars);
    setHouses(allHouses);
    setGuilds(allGuilds);
    setMonsters(allMonsters);
    if (u) {
      const mine = chars.find(c => c.created_by === u.email && c.type === "human");
      setMyCharacter(mine || null);
    }
    setLoading(false);
  };

  // Build guild → color index map
  const guildColorMap = {};
  guilds.forEach((g, i) => { guildColorMap[g.id] = i % GUILD_COLORS.length; });

  // Build zone → controlling guild map
  const zoneGuildMap = {};
  guilds.forEach(g => {
    if (g.hall_zone && g.hall_tier >= 3) {
      zoneGuildMap[g.hall_zone] = g;
    }
  });

  // Build zone → contested (two+ guilds at war overlapping)
  const contestedZones = new Set();
  guilds.forEach(g => {
    if (g.war_status !== "peace" && g.hall_zone) {
      contestedZones.add(g.hall_zone);
    }
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Terrain
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const tile = getTile(tx, ty);
        ctx.fillStyle = TERRAIN_COLORS[tile] || "#2d5a27";
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Guild territory overlays
    if (layers.territory) {
      ZONES.forEach(zone => {
        const controller = zoneGuildMap[zone.id];
        const contested = contestedZones.has(zone.id);
        if (controller) {
          const ci = guildColorMap[controller.id] ?? 0;
          ctx.fillStyle = contested ? "rgba(239,68,68,0.30)" : GUILD_COLORS[ci];
          ctx.fillRect(zone.x * TILE_SIZE, zone.y * TILE_SIZE, zone.w * TILE_SIZE, zone.h * TILE_SIZE);
          // Border
          ctx.strokeStyle = contested ? "#ef4444" : GUILD_BORDER_COLORS[ci];
          ctx.lineWidth = contested ? 3 : 2;
          ctx.setLineDash(contested ? [6, 3] : []);
          ctx.strokeRect(zone.x * TILE_SIZE + 1, zone.y * TILE_SIZE + 1, zone.w * TILE_SIZE - 2, zone.h * TILE_SIZE - 2);
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          // War flame indicator
          if (contested) {
            ctx.font = "14px serif";
            ctx.textAlign = "center";
            ctx.fillText("⚔️", (zone.x + zone.w / 2) * TILE_SIZE, (zone.y + zone.h / 2) * TILE_SIZE);
          }
        }
      });
    }

    // Zone labels
    ZONES.forEach(zone => {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(zone.x * TILE_SIZE, zone.y * TILE_SIZE, zone.w * TILE_SIZE, 14);
      ctx.font = "bold 9px sans-serif";
      ctx.fillStyle = zoneGuildMap[zone.id] ? "#fde68a" : "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${zone.emoji} ${zone.name}`, zone.x * TILE_SIZE + 3, zone.y * TILE_SIZE + 2);
    });

    // POIs
    if (layers.pois) {
      POINTS_OF_INTEREST.forEach(poi => {
        ctx.font = `${TILE_SIZE - 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(poi.emoji, poi.x * TILE_SIZE + TILE_SIZE / 2, poi.y * TILE_SIZE + TILE_SIZE / 2);
      });
    }

    // Guild halls on map
    if (layers.guilds) {
      guilds.filter(g => g.hall_x != null && g.hall_y != null && g.hall_tier > 0).forEach(g => {
        const hallTier = GUILD_HALL_TIERS.find(t => t.tier === g.hall_tier);
        const px = g.hall_x * TILE_SIZE + TILE_SIZE / 2;
        const py = g.hall_y * TILE_SIZE + TILE_SIZE / 2;
        const ci = guildColorMap[g.id] ?? 0;
        // Highlight ring
        ctx.strokeStyle = GUILD_BORDER_COLORS[ci];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, TILE_SIZE / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.font = `${TILE_SIZE - 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hallTier?.emoji || "⛺", px, py);
        ctx.font = "7px sans-serif";
        ctx.fillStyle = "#fde68a";
        ctx.fillText(`[${g.tag || g.name.slice(0, 3).toUpperCase()}]`, px, py + TILE_SIZE);
      });
    }

    // Houses
    if (layers.houses) {
      houses.forEach(h => {
        if (h.x == null || h.y == null) return;
        const tier = HOUSE_TIERS[h.tier] || HOUSE_TIERS.hut;
        ctx.font = `${TILE_SIZE - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tier.emoji, h.x * TILE_SIZE + TILE_SIZE / 2, h.y * TILE_SIZE + TILE_SIZE / 2);
        // Public badge
        if (h.is_public) {
          ctx.fillStyle = "#4ade80";
          ctx.font = "6px sans-serif";
          ctx.fillText("●", h.x * TILE_SIZE + TILE_SIZE - 3, h.y * TILE_SIZE + 3);
        }
      });
    }

    // Monsters
    if (layers.monsters) {
      monsters.filter(m => m.is_alive).forEach(m => {
        ctx.font = `${TILE_SIZE - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(MONSTER_EMOJI[m.species] || "👾", m.x * TILE_SIZE + TILE_SIZE / 2, m.y * TILE_SIZE + TILE_SIZE / 2);
      });
    }

    // Characters
    if (layers.characters) {
      characters.filter(c => !myCharacter || c.id !== myCharacter.id).forEach(c => {
        if (c.x == null || c.y == null) return;
        const px = c.x * TILE_SIZE + TILE_SIZE / 2;
        const py = c.y * TILE_SIZE + TILE_SIZE / 2;
        if (c.type === "ai_agent") {
          ctx.strokeStyle = "#67e8f9";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(px, py, TILE_SIZE / 2, 0, Math.PI * 2); ctx.stroke();
          ctx.lineWidth = 1;
        }
        ctx.font = `${TILE_SIZE - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.avatar_emoji || (c.type === "ai_agent" ? "🤖" : "🧑"), px, py);
      });
    }

    // My character (highlighted)
    if (myCharacter && myCharacter.x != null) {
      const px = myCharacter.x * TILE_SIZE + TILE_SIZE / 2;
      const py = myCharacter.y * TILE_SIZE + TILE_SIZE / 2;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, py, TILE_SIZE / 2 + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.font = `${TILE_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(myCharacter.avatar_emoji || "🧑", px, py);
    }
  }, [characters, houses, guilds, monsters, myCharacter, layers, zoneGuildMap, contestedZones, guildColorMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = MAP_W * TILE_SIZE;
    canvas.height = MAP_H * TILE_SIZE;
    draw();
  }, [draw]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const ty = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    // Check what's at this tile (priority: character > house > guild hall > poi > zone)
    const charHere = characters.find(c => c.x === tx && c.y === ty);
    if (charHere) { setSelected({ type: "character", data: charHere }); return; }

    const houseHere = houses.find(h => h.x === tx && h.y === ty);
    if (houseHere) { setSelected({ type: "house", data: houseHere }); return; }

    const guildHere = guilds.find(g => g.hall_x === tx && g.hall_y === ty);
    if (guildHere) { setSelected({ type: "guild", data: guildHere }); return; }

    const poiHere = POINTS_OF_INTEREST.find(p => p.x === tx && p.y === ty);
    if (poiHere) { setSelected({ type: "poi", data: poiHere }); return; }

    const zone = ZONES.find(z => tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h);
    if (zone) {
      const controller = zoneGuildMap[zone.id] || null;
      const contested = contestedZones.has(zone.id);
      setSelected({ type: "zone", data: { zone, controller, contested } });
      return;
    }
    setSelected(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400">Loading world map...</div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Home")} className="text-gray-600 hover:text-amber-400 text-xs">← Home</Link>
          <h1 className="text-lg font-black text-amber-400">🗺️ World Map</h1>
          <span className="text-xs text-gray-500">{characters.length} characters · {houses.length} houses · {guilds.length} guilds</span>
        </div>
        <MapLayerToggles layers={layers} onChange={setLayers} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map canvas */}
        <div className="flex-1 overflow-auto bg-gray-950 relative">
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            className="cursor-crosshair"
            style={{ imageRendering: "pixelated" }}
          />
          <MapLegend guilds={guilds} guildColorMap={guildColorMap} GUILD_BORDER_COLORS={GUILD_BORDER_COLORS} />
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <MapInfoPanel
            selected={selected}
            myCharacter={myCharacter}
            guilds={guilds}
            onClose={() => setSelected(null)}
          />
        </div>
      </div>
    </div>
  );
}