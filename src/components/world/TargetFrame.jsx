/**
 * TargetFrame — Dedicated MMORPG-style target/selection window.
 *
 * Displays the currently selected entity with:
 * - Identity (name, level, class/species)
 * - HP bar with color graduation
 * - Zone legality indicator (Safehold vs Frontier)
 * - Combat mode state badge
 * - Engage / Interact / Clear buttons
 *
 * This is the authoritative UI surface for the target system.
 * It reads from targetAuthority and combatMode.
 */

import { getHostilityClass, getZoneRuleSummary, canEngage } from "@/components/shared/targetAuthority";
import { COMBAT_MODE, COMBAT_MODE_UI } from "@/components/shared/combatMode";
import { Shield, Sword, X, User, Crosshair } from "lucide-react";

const HOSTILITY_STYLES = {
  hostile:     { border: "border-red-700",    name: "text-red-400",    icon: "⚔️" },
  pvp_flagged: { border: "border-orange-600", name: "text-orange-300", icon: "⚠️" },
  friendly:    { border: "border-blue-700",   name: "text-blue-300",   icon: "🧑" },
  neutral:     { border: "border-gray-600",   name: "text-gray-300",   icon: "🧩" },
  self:        { border: "border-amber-700",  name: "text-amber-400",  icon: "⭐" },
};

export default function TargetFrame({ target, myCharacter, combatMode, onEngage, onInteract, onClear, x, y }) {
  if (!target) return null;

  const entity = target.entity || target;
  const isMonster = !!entity.species;
  const hp     = entity.hp ?? entity.max_hp ?? 100;
  const maxHp  = entity.max_hp ?? 100;
  const hpPct  = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpColor = hpPct > 60 ? "bg-red-500" : hpPct > 30 ? "bg-orange-500" : "bg-red-800 animate-pulse";

  const hostility = getHostilityClass(myCharacter, entity, null);
  const style = HOSTILITY_STYLES[hostility] || HOSTILITY_STYLES.neutral;
  const zoneRule = getZoneRuleSummary(x ?? myCharacter?.x ?? 30, y ?? myCharacter?.y ?? 25);
  const engage = canEngage(myCharacter, entity, x ?? myCharacter?.x ?? 30, y ?? myCharacter?.y ?? 25);
  const modeUI = COMBAT_MODE_UI[combatMode] || COMBAT_MODE_UI[COMBAT_MODE.PEACEFUL];

  const subtitle = isMonster
    ? `${entity.species} · Lv.${entity.level || 1}`
    : `${entity.base_class || entity.class || "Unknown"} · ${entity.race || "Human"}`;

  return (
    <div className={`bg-gray-950/98 border rounded-xl shadow-2xl min-w-52 max-w-72 ${style.border}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 pt-2 pb-1.5 border-b ${style.border}/40`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{style.icon}</span>
          <div className="min-w-0">
            <div className={`font-black text-sm leading-tight truncate ${style.name}`}>
              {entity.name}
              {entity.level && <span className="ml-1 text-gray-500 font-normal text-xs">Lv.{entity.level}</span>}
            </div>
            <div className="text-gray-600 text-[10px] capitalize">{subtitle}</div>
          </div>
        </div>
        <button onClick={onClear}
          className="text-gray-700 hover:text-gray-400 ml-2 flex-shrink-0 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* HP Bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-gray-500 text-[10px]">HP</span>
          <div className="flex-1 bg-gray-900 rounded-full h-2 border border-gray-800">
            <div className={`${hpColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${hpPct}%` }} />
          </div>
          <span className="text-gray-400 text-[10px]">{hp}/{maxHp}</span>
        </div>

        {/* Mana / Energy if available */}
        {entity.energy !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px]">MP</span>
            <div className="flex-1 bg-gray-900 rounded-full h-1.5 border border-gray-800">
              <div className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, ((entity.energy ?? 0) / 100) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Zone Rule + Combat Mode */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${zoneRule.borderColor} ${zoneRule.color} ${zoneRule.bgColor}`}>
          {zoneRule.emoji} {zoneRule.label}
        </span>
        {modeUI.indicator && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${modeUI.border} ${modeUI.color} ${modeUI.bg} ${modeUI.pulse ? "animate-pulse" : ""}`}>
            {modeUI.indicator} {modeUI.label}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-3 pb-2.5 flex gap-1.5">
        {engage.legal && onEngage && (
          <button onClick={() => onEngage(entity)}
            className="flex-1 flex items-center justify-center gap-1 bg-red-900/60 hover:bg-red-800/80 border border-red-700 text-red-300 text-[11px] font-bold py-1 rounded-lg transition-colors">
            <Sword className="w-3 h-3" /> Attack
          </button>
        )}
        {!engage.legal && engage.blockedBySafe && (
          <div className="flex-1 flex items-center justify-center gap-1 bg-gray-900 border border-gray-700 text-gray-600 text-[11px] py-1 rounded-lg">
            <Shield className="w-3 h-3" /> Protected
          </div>
        )}
        {onInteract && !isMonster && (
          <button onClick={() => onInteract(entity)}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700 text-blue-300 text-[11px] font-bold py-1 rounded-lg transition-colors">
            <User className="w-3 h-3" /> Interact
          </button>
        )}
      </div>
    </div>
  );
}