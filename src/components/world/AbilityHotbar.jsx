/**
 * AbilityHotbar
 * 
 * EQ-style ability bar: 9 slots (numpad 1-9 / keyboard 1-9).
 * Shows ability icon, name, keybind, and cooldown overlay.
 * Also displays the locked target frame (RuneScape-style) when a target is selected.
 */

import { Swords, Zap, Shield, Heart, Crosshair } from "lucide-react";

const EFFECT_COLORS = {
  damage:  "border-red-600 bg-red-950/60",
  heal:    "border-green-600 bg-green-950/60",
  buff:    "border-blue-600 bg-blue-950/60",
  debuff:  "border-purple-600 bg-purple-950/60",
  utility: "border-yellow-600 bg-yellow-950/60",
};

const EFFECT_ICONS = {
  damage:  <Swords className="w-4 h-4" />,
  heal:    <Heart className="w-4 h-4" />,
  buff:    <Shield className="w-4 h-4" />,
  debuff:  <Zap className="w-4 h-4" />,
  utility: <Crosshair className="w-4 h-4" />,
};

function AbilitySlot({ ability, slot, cooldownMs, onClick }) {
  const color = EFFECT_COLORS[ability?.effect_type] || "border-gray-700 bg-gray-900/60";
  const icon  = EFFECT_ICONS[ability?.effect_type]  || <Swords className="w-4 h-4" />;

  const onCooldown = cooldownMs > 0;
  const totalCd = (ability?.cooldown_rounds || 0) * 1500;
  const cdPct  = totalCd > 0 ? cooldownMs / totalCd : 0;
  const cdSec  = Math.ceil(cooldownMs / 1000);

  return (
    <button
      onClick={() => onClick && onClick(slot)}
      title={ability ? `${ability.name}\n${ability.description || ""}` : "Empty slot"}
      className={`relative w-12 h-12 rounded border-2 flex flex-col items-center justify-center text-xs transition-all
        ${ability ? color : "border-gray-800 bg-gray-900/30 opacity-40"}
        ${onCooldown ? "opacity-60" : "hover:brightness-125 active:scale-95"}
      `}
    >
      {/* Cooldown sweep overlay */}
      {onCooldown && totalCd > 0 && (
        <div
          className="absolute inset-0 rounded bg-black/70 flex items-center justify-center z-10"
          style={{
            background: `conic-gradient(rgba(0,0,0,0.75) ${cdPct * 360}deg, transparent 0deg)`,
          }}
        >
          <span className="text-white text-xs font-bold z-20 relative">{cdSec}s</span>
        </div>
      )}

      {ability ? (
        <>
          <span className="text-base leading-none">{ability.emoji || icon}</span>
          <span className="text-gray-400 text-[9px] mt-0.5 truncate max-w-full px-0.5 leading-none">{ability.name?.slice(0, 6)}</span>
        </>
      ) : (
        <span className="text-gray-700 text-base">—</span>
      )}

      {/* Slot number */}
      <span className="absolute top-0.5 left-1 text-[8px] text-gray-600 font-mono">{slot + 1}</span>
    </button>
  );
}


export default function AbilityHotbar({ abilities = [], cooldowns = {}, onUseAbility, autoAttacking }) {
  // Show up to 9 slots. Target is displayed by the authoritative TargetFrame overlay in World.
  const slots = Array.from({ length: 9 }, (_, i) => abilities[i] || null);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex gap-1 bg-gray-950/80 border border-gray-800 rounded-lg px-2 py-1.5">
        {slots.map((ab, i) => (
          <AbilitySlot
            key={i}
            ability={ab}
            slot={i}
            cooldownMs={ab ? (cooldowns[ab.id] || 0) : 0}
            onClick={onUseAbility}
          />
        ))}
      </div>
      {autoAttacking && (
        <div className="text-[9px] text-red-500 font-mono animate-pulse">⚔ Auto-attacking</div>
      )}
      <div className="text-[9px] text-gray-700 font-mono">
        1-9 abilities · Tab target · Enter attack · Esc clear
      </div>
    </div>
  );
}