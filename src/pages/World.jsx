import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import gameService from "@/api/gameService";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import WorldMap from "@/components/world/WorldMap.jsx";
import WorldScene3D from "@/components/world/WorldScene3D.jsx";
import ViewToggle from "@/components/world/ViewToggle.jsx";
import ChatDock from "@/components/chat/ChatDock.jsx";
import CharacterHUD from "@/components/world/CharacterHUD.jsx";
import NPCPanel from "@/components/world/NPCPanel.jsx";
import GroupWindow from "@/components/world/GroupWindow.jsx";
// TravelEncounterModal removed â€” monsters are 3D entities on the map (MMO-style)
import ZoneInfoPanel from "@/components/world/ZoneInfoPanel.jsx";
import CombatOverlay from "@/components/combat/CombatOverlay.jsx";
import Minimap from "@/components/world/Minimap.jsx";
import TargetFrame from "@/components/world/TargetFrame.jsx";
import CombatModeIndicator from "@/components/world/CombatModeIndicator.jsx";
import { getZoneAt, getPOIAt } from "@/components/shared/worldZones";
import { isPassable, movementEnergyRegen } from "@/components/shared/movementAuthority";
import { initiateCombat } from "@/components/combat/authorizedCombatEngine";
import { RESOURCES } from "@/components/shared/craftingData";
import InventoryPanel from "@/components/inventory/InventoryPanel.jsx";
import { Button } from "@/components/ui/button";
import { checkAchievements } from "@/components/shared/achievementData";
import useInputController from "@/components/world/useInputController.jsx";
import { useZoomController, ZOOM_LEVELS } from "@/components/world/useZoomController";
import AbilityHotbar from "@/components/world/AbilityHotbar.jsx";
import { COMBAT_MODE } from "@/components/shared/combatMode";
import { isSafeZone } from "@/components/shared/worldRules";
import { getTileEffects } from "@/components/shared/worldEventEffects";

export default function World() {
  const [user, setUser] = useState(null);
  const [myCharacter, setMyCharacter] = useState(null);
  const [allCharacters, setAllCharacters] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [worldObjects, setWorldObjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Encounters are now initiated by clicking 3D monsters directly (no random encounters)
  const [viewPos, setViewPos] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [fastTravelTarget, setFastTravelTarget] = useState(null);
  const [fastTravelProgress, setFastTravelProgress] = useState(0);
  const fastTravelRef = useRef(null);
  const [viewMode, setViewMode] = useState("3d"); // "map" | "3d"
  const [sceneSettings, setSceneSettings] = useState({ showNameplates: true, showHealthBars: true, cameraDistance: 1.0 });
  const [npcDialogue, setNpcDialogue] = useState(null); // { npcType, zoneName }
  
  // â”€â”€â”€ ZOOM CONTROLLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { getCurrentZoomConfig, zoomLevel } = useZoomController();

  // â”€â”€â”€ AUTHORITATIVE TARGET STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Single source of truth. No parallel lockedTarget / combatMonster / selectedTarget concepts.
  // { entity, type: "monster"|"player"|"ai_agent"|"npc" }
  const [activeTarget, setActiveTarget] = useState(null);
  // Combat is open when the combat overlay is visible (entity engaged)
  const [combatMonster, setCombatMonster] = useState(null);

  useEffect(() => {
    loadWorld();
    const interval = setInterval(loadCharacters, 5000);
    const worldInterval = setInterval(() => { gameService.worldTick().catch(() => {}); }, 30000);
    return () => { clearInterval(interval); clearInterval(worldInterval); };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "i" || e.key === "I") setShowInventory(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!myCharacter) return;
    const unsub = base44.entities.ChatMessage.subscribe(event => {
      if (event.type === "create") {
        setMessages(prev => [...prev.slice(-49), event.data]);
      }
    });
    return unsub;
  }, [myCharacter?.id]);

  const loadWorld = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);

    const [chars, mons, objs, msgs, events] = await Promise.all([
      base44.entities.Character.list("-updated_date", 100),
      base44.entities.Monster.filter({ is_alive: true }),
      base44.entities.WorldObject.list(),
      base44.entities.ChatMessage.list("-created_date", 40),
      base44.entities.WorldEvent.filter({ status: "active" }),
    ]);

    setAllCharacters(chars);
    setMonsters(mons);
    setWorldObjects(objs);
    setMessages(msgs.reverse());
    setActiveEvents(events);

    if (u) {
      // Use active_character_id from user profile, fall back to first human character
      let mine = null;
      if (u.active_character_id) {
        mine = chars.find(c => c.id === u.active_character_id && c.type === "human");
      }
      if (!mine) {
        mine = chars.find(c => c.created_by === u.email && c.type === "human");
      }
      if (mine) {
        setMyCharacter(mine);
        base44.entities.Character.update(mine.id, { is_online: true });
      }
    }
    setLoading(false);
  };

  const loadCharacters = async () => {
    const chars = await base44.entities.Character.list("-updated_date", 100);
    setAllCharacters(chars);
    if (user) {
      let mine = null;
      if (user.active_character_id) {
        mine = chars.find(c => c.id === user.active_character_id && c.type === "human");
      }
      if (!mine) {
        mine = chars.find(c => c.created_by === user.email && c.type === "human");
      }
      if (mine) setMyCharacter(mine);
    }
  };



  const cancelFastTravel = useCallback(() => {
    if (fastTravelRef.current) clearInterval(fastTravelRef.current);
    setFastTravelTarget(null);
    setFastTravelProgress(0);
  }, []);

  const requestFastTravel = useCallback((tx, ty) => {
    if (combatMonster || fastTravelTarget) return;
    if (!isPassable(tx, ty)) return;

    setFastTravelTarget({ x: tx, y: ty });
    setFastTravelProgress(0);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      setFastTravelProgress(Math.min(100, (elapsed / 3000) * 100));

      if (elapsed >= 3000) {
        clearInterval(interval);
        setMyCharacter(prev => {
          if (!prev) return prev;
          const updated = { ...prev, x: tx, y: ty };
          setAllCharacters(all => all.map(c => c.id === prev.id ? updated : c));
          base44.entities.Character.update(prev.id, { x: tx, y: ty });
          return updated;
        });
        setFastTravelTarget(null);
        setFastTravelProgress(0);
      }
    }, 100);

    fastTravelRef.current = interval;
  }, [combatMonster, fastTravelTarget]);

  // â”€â”€â”€ Combat start ref â€” breaks the handleMove â†” startCombat circular dep â”€â”€
  const startCombatRef = useRef(null);

  // â”€â”€â”€ Authoritative combat start â€” ALL paths route through here â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Sources: walk-onto-monster, click-monster â†’ engage button, Tab+Enter, ability hotbar.
  const startCombat = useCallback((monster) => {
    if (!monster || !myCharacter) return;
    const zone = getZoneAt(myCharacter.x, myCharacter.y);
    const validation = initiateCombat(myCharacter, monster, zone);
    if (!validation.success) {
      console.warn("[CombatAuthority] Blocked:", validation.reason);
      return;
    }
    setActiveTarget({ entity: monster, type: "monster" });
    setCombatMonster(monster);
  }, [myCharacter]);

  // Keep ref in sync so handleMove's closure (captured at definition time) can call latest startCombat
  useEffect(() => { startCombatRef.current = startCombat; }, [startCombat]);

  const handleMove = useCallback(async (newX, newY) => {
    if (!myCharacter) return;
    cancelFastTravel();

    if (!isPassable(newX, newY)) return;

    const zone = getZoneAt(newX, newY);
    const poi  = getPOIAt(newX, newY);
    setViewPos({ x: newX, y: newY });

    // Gather resource from POI resource nodes
    let inventoryUpdates = null;
    if (poi?.type === "resource_node" && poi.resource) {
      const res = RESOURCES[poi.resource];
      if (res) {
        const inv = [...(myCharacter.inventory || [])];
        const idx = inv.findIndex(i => i.id === poi.resource);
        const qty = 1 + Math.floor(Math.random() * 2);
        if (idx >= 0) inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 0) + qty };
        else inv.push({ id: poi.resource, name: res.name, emoji: res.emoji, qty });
        inventoryUpdates = inv;
      }
    }

    // NPC dialogue on POI visit
    try {
      if (poi && (poi.type === "npc" || ["rest","shop","mystery","heal_station","crafting_station"].includes(poi.type))) {
        const npcTypeMap = { rest: "merchant", shop: "trader", mystery: "witch", heal_station: "herbalist", crafting_station: "miner" };
        const npcType = poi?.npcType || npcTypeMap[poi?.type] || "merchant";
        if (npcType) {
          setNpcDialogue({ npcType, zoneName: zone?.name || "Unknown" });
        }
      }
    } catch (error) {
      console.error("[World] NPC dialogue error:", error, { poi, zone });
    }

    // POI rest/heal
    let hpUpdate = null;
    if (poi?.type === "rest" && poi.hp_restore) {
      hpUpdate = Math.min(myCharacter.max_hp || 100, (myCharacter.hp || 100) + poi.hp_restore);
    }
    if (poi?.type === "heal_station") {
      hpUpdate = myCharacter.max_hp || 100;
    }

    // Authority: energy regen on movement (out of combat)
    const { energy: newEnergy } = movementEnergyRegen(myCharacter);

    const tileFx = getTileEffects(activeEvents, newX, newY);
    const updates = { x: newX, y: newY, energy: Math.max(0, newEnergy - tileFx.energyPenalty) };
    if (tileFx.healPerMove > 0) {
      updates.hp = Math.min(myCharacter.max_hp || 100, ((hpUpdate ?? myCharacter.hp) || 0) + tileFx.healPerMove);
    }
    if (inventoryUpdates) updates.inventory = inventoryUpdates;
    if (hpUpdate !== null) updates.hp = hpUpdate;

    const updated = { ...myCharacter, ...updates };
    setMyCharacter(updated);
    setAllCharacters(prev => prev.map(c => c.id === myCharacter.id ? updated : c));
    await base44.entities.Character.update(myCharacter.id, updates);

    // Walk-onto-monster â†’ authoritative combat via ref (avoids stale closure)
    const monsterOnTile = monsters.find(m => m.is_alive && m.x === newX && m.y === newY);
    if (monsterOnTile) {
      startCombatRef.current?.(monsterOnTile);
      return "combat";
    }

    // No random encounters â€” monsters are 3D entities on the map
  }, [myCharacter, monsters, cancelFastTravel, activeEvents]);

  // â”€â”€â”€ Input controller (WASD, hotkeys, Tab-target, auto-attack) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const characterAbilities = myCharacter?.abilities || [];
  const { lockedTarget, lockTarget, clearTarget, autoAttacking, cooldowns } =
    useInputController({
      myCharacter,
      monsters,
      onMove: handleMove,
      onStartCombat: startCombat,
      abilities: characterAbilities,
      enabled: !combatMonster && !showInventory && !npcDialogue,
    });

  // â”€â”€â”€ Authoritative target selection (click-path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Tab-cycling â†’ lockTarget (in useInputController) â†’ lockedTarget state â†’ effect below.
  // Click-path â†’ selectTarget â†’ setActiveTarget + lockTarget (keep controller in sync).
  const selectTarget = useCallback((entity, type = "monster") => {
    setActiveTarget({ entity, type });
    lockTarget(type === "monster" ? entity : null);
  }, [lockTarget]);

  const clearActiveTarget = useCallback(() => {
    setActiveTarget(null);
  }, []);

  // Sync Tab-cycled lockedTarget into authoritative activeTarget
  useEffect(() => {
    if (!lockedTarget) return;
    setActiveTarget(prev =>
      prev?.entity?.id === lockedTarget.id ? prev : { entity: lockedTarget, type: "monster" }
    );
  }, [lockedTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€â”€ Combat mode (derived from authoritative state) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const combatMode = !!combatMonster ? COMBAT_MODE.ACTIVE : COMBAT_MODE.PEACEFUL;

  const handleSendMessage = async (text, channel = "global") => {
    if (!myCharacter || !text.trim()) return;
    await base44.entities.ChatMessage.create({
      character_id: myCharacter.id,
      character_name: myCharacter.name,
      character_type: myCharacter.type,
      character_class: myCharacter.class,
      message: text,
      channel,
      x: myCharacter.x,
      y: myCharacter.y
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400 text-xl font-bold">
        Loading Agentic World...
      </div>
    );
  }

  if (!myCharacter) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-gray-400">You need a character to enter the world.</p>
        <Link to={createPageUrl("Characters")}>
          <button className="bg-amber-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-amber-600">
            Create Character
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <CharacterHUD
        character={myCharacter}
        onInventory={() => setShowInventory(true)}
        onUpdateCharacter={(updated) => {
          setMyCharacter(updated);
          setAllCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
      />
      <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 relative">
        {/* View toggle overlay */}
        <ViewToggle
          mode={viewMode}
          onChange={setViewMode}
          settings={sceneSettings}
          onSettingsChange={setSceneSettings}
        />

        {/* Classic 2D map (always mounted for minimap data, hidden in 3D mode) */}
        <div className={viewMode === "map" ? "w-full h-full" : "hidden"}>
          <WorldMap
            myCharacter={myCharacter}
            allCharacters={allCharacters}
            monsters={monsters}
            worldObjects={worldObjects}
            onMove={handleMove}
            activeEvents={activeEvents}
            onMonsterClick={(monster) => selectTarget(monster, "monster")}
          />
        </div>

        {/* 3D model-based world scene */}
         {viewMode === "3d" && myCharacter && (
           <WorldScene3D
             myCharacter={myCharacter}
             allCharacters={allCharacters}
             monsters={monsters}
             worldObjects={worldObjects}
             activeEvents={activeEvents}
             onMove={handleMove}
             onMonsterClick={(monster) => selectTarget(monster, "monster")}
             sceneSettings={sceneSettings}
             getCurrentZoomConfig={getCurrentZoomConfig}
           />
         )}

        <Minimap
          myCharacter={myCharacter}
          allCharacters={allCharacters}
          monsters={monsters}
          onFastTravel={requestFastTravel}
        />
        {fastTravelTarget && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30
              bg-gray-900/95 border border-amber-600 rounded-xl px-6 py-4 text-center pointer-events-auto"
              onClick={cancelFastTravel}>
              <p className="text-sm text-amber-400 font-bold mb-2">âš¡ Fast Traveling...</p>
              <div className="w-48 bg-gray-800 rounded-full h-3 mb-2">
                <div className="bg-amber-500 h-3 rounded-full transition-all"
                  style={{ width: `${fastTravelProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mb-2">
                To ({fastTravelTarget.x}, {fastTravelTarget.y}) Â· Click to cancel
              </p>
              <Button size="sm" variant="outline" className="border-gray-700 text-xs"
                onClick={e => { e.stopPropagation(); cancelFastTravel(); }}>Cancel</Button>
          </div>
        )}

        {/* Ability hotbar â€” bottom-center */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <AbilityHotbar
            abilities={characterAbilities}
            cooldowns={cooldowns}
            onUseAbility={(slot) => {
              const ab = characterAbilities[slot];
              if (ab && activeTarget?.entity) startCombat(activeTarget.entity);
            }}
            autoAttacking={autoAttacking}
          />
        </div>

        {/* Group window â€” top-left */}
        <GroupWindow
          myCharacter={myCharacter}
          allCharacters={allCharacters}
          onMoveFollower={null}
        />

        {/* Target frame â€” top-center, authoritative, single instance */}
        {activeTarget && myCharacter && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[25] pointer-events-auto">
            <TargetFrame
              target={activeTarget}
              myCharacter={myCharacter}
              combatMode={combatMode}
              x={myCharacter.x}
              y={myCharacter.y}
              onEngage={(entity) => startCombat(entity)}
              onInteract={null}
              onClear={() => { clearTarget(); clearActiveTarget(); }}
            />
          </div>
        )}

        {/* Zone info â€” bottom-left */}
        {viewPos && (
          <div className="absolute bottom-8 left-2 w-56">
            <ZoneInfoPanel x={viewPos.x} y={viewPos.y} />
          </div>
        )}

        {/* Combat mode indicator â€” bottom-right, single instance */}
        {myCharacter && (
          <div className="absolute bottom-24 right-2 z-20 pointer-events-none">
            <CombatModeIndicator
              combatMode={combatMode}
              characterX={myCharacter.x}
              characterY={myCharacter.y}
            />
          </div>
        )}
      {/* Controls hint + Zoom level */}
      <div className="absolute bottom-2 left-2 text-[10px] text-gray-600 bg-gray-900/70 px-2 py-1 rounded pointer-events-none">
        Click terrain to move Â· Scroll to zoom
        {viewMode === "3d" && <div className="text-xs text-amber-500 mt-1">Zoom: {ZOOM_LEVELS[Math.round(zoomLevel)]?.label || "Normal"}</div>}
      </div>
      </div>
      <ChatDock messages={messages} onSend={handleSendMessage} myCharacter={myCharacter} />
      </div>

    {combatMonster && myCharacter && (
      <CombatOverlay
        character={myCharacter}
        monster={combatMonster}
        onClose={() => { setCombatMonster(null); clearActiveTarget(); clearTarget(); }}
        onVictory={async () => {
          await loadWorld();
          const refreshed = await base44.entities.Character.get(myCharacter.id).catch(() => null);
          if (refreshed) {
            const achievementUpdates = checkAchievements(refreshed, myCharacter);
            if (Object.keys(achievementUpdates).length > 0) {
              await base44.entities.Character.update(myCharacter.id, achievementUpdates);
            }
          }
          setCombatMonster(null);
          clearActiveTarget();
          clearTarget();
        }}
        onDefeat={async () => {
          await loadWorld();
          setCombatMonster(null);
          clearActiveTarget();
          clearTarget();
        }}
      />
    )}

    {showInventory && myCharacter && (
      <InventoryPanel
        open={showInventory}
        onClose={() => setShowInventory(false)}
        character={myCharacter}
        onUpdate={(updated) => {
          setMyCharacter(updated);
          setAllCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
      />
    )}

    {npcDialogue && myCharacter && (
      <NPCPanel
        npcType={npcDialogue.npcType}
        zoneName={npcDialogue.zoneName}
        character={myCharacter}
        onClose={() => setNpcDialogue(null)}
        onInteract={(updates) => {
          const updated = { ...myCharacter, ...updates };
          setMyCharacter(updated);
          setAllCharacters(prev => prev.map(c => c.id === myCharacter.id ? updated : c));
          try {
            handleSendMessage(`ðŸ—£ï¸ Interacted with ${npcDialogue.npcType} in ${npcDialogue.zoneName}.`);
          } catch(e) {
            console.error("[World] Chat message error:", e);
          }
        }}
      />
    )}

    {/* Random encounter modal removed â€” monsters are persistent 3D world entities */}
  </div>
  );
}




