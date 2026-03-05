/**
 * CombatModeIndicator — Visible combat state badge shown in the world UI.
 * Appears next to the status bar when in combat or PvP prep.
 * Routes through combatMode.js authority.
 */

import { COMBAT_MODE, COMBAT_MODE_UI } from "@/components/shared/combatMode";
import { getZoneRuleSummary } from "@/components/shared/targetAuthority";

export default function CombatModeIndicator({ combatMode, characterX, characterY }) {
  const ui = COMBAT_MODE_UI[combatMode];
  const zone = getZoneRuleSummary(characterX ?? 30, characterY ?? 25);

  if (combatMode === COMBAT_MODE.PEACEFUL) {
    // Only show zone indicator in peaceful
    return (
      <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${zone.borderColor} ${zone.color} ${zone.bgColor}`}>
        {zone.emoji} {zone.label}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Zone */}
      <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${zone.borderColor} ${zone.color} ${zone.bgColor}`}>
        {zone.emoji} {zone.label}
      </div>
      {/* Combat mode */}
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${ui.border} ${ui.color} ${ui.bg} ${ui.pulse ? "animate-pulse" : ""}`}>
        {ui.indicator} {ui.label}
      </div>
    </div>
  );
}