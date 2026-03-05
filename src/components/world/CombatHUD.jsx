/**
 * Combat HUD — Real-time combat state display with target frame, ability bar, cooldowns
 * Integrates with target locking and ability execution
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { getTargetInfo } from "@/components/shared/targetAuthority";

export default function CombatHUD({ character, activeTarget, abilities = [], cooldowns = {}, energy = null }) {
  if (!character) return null;

  const maxEnergy = 50 + ((character.stats?.wisdom || 10) * 2);
  const currentEnergy = energy ?? maxEnergy;
  const energyPercent = (currentEnergy / maxEnergy) * 100;

  const targetInfo = useMemo(() => {
    return activeTarget ? getTargetInfo(activeTarget) : null;
  }, [activeTarget]);

  return (
    <div className="fixed bottom-6 right-6 z-40 space-y-4">
      {/* Target Frame */}
      {targetInfo && (
        <motion.div
          className="bg-gray-900 border-2 border-red-700 rounded-lg p-3 w-56"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-amber-400">{targetInfo.name}</div>
            <div className="text-xs text-gray-500">Lv. {targetInfo.level}</div>
          </div>

          {/* Health Bar */}
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-1">HP</div>
            <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
              <motion.div
                className="bg-red-600 h-3"
                initial={{ width: "100%" }}
                animate={{ width: `${(targetInfo.hp / targetInfo.maxHp) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.floor(targetInfo.hp)} / {targetInfo.maxHp}
            </div>
          </div>

          {/* Target Type Badge */}
          <div className="flex gap-1">
            <span
              className={`text-xs px-2 py-1 rounded ${
                targetInfo.hostile ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"
              }`}
            >
              {targetInfo.hostile ? "Hostile" : "Friendly"}
            </span>
            {targetInfo.race && (
              <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                {targetInfo.race}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Energy Bar */}
      <motion.div
        className="bg-gray-900 border border-blue-700 rounded-lg p-3 w-56"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-blue-400">Energy</div>
          <div className="text-xs text-gray-500">
            {Math.floor(currentEnergy)} / {Math.floor(maxEnergy)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
          <motion.div
            className="bg-blue-600 h-3"
            initial={{ width: `${energyPercent}%` }}
            animate={{ width: `${energyPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Ability Hotbar */}
      <motion.div
        className="bg-gray-900 border border-amber-700 rounded-lg p-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xs text-gray-400 mb-2">Abilities</div>
        <div className="grid grid-cols-3 gap-2">
          {abilities.slice(0, 6).map((ability, idx) => {
            const cdRemaining = cooldowns[ability.id] || 0;
            const isOnCooldown = cdRemaining > 0;
            const energyCost = ability.energy_cost || 0;
            const hasEnergy = currentEnergy >= energyCost;

            return (
              <motion.button
                key={ability.id}
                className={`relative w-12 h-12 rounded border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  isOnCooldown
                    ? "bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed opacity-50"
                    : hasEnergy
                    ? "bg-amber-900 border-amber-600 text-amber-300 hover:bg-amber-800 cursor-pointer"
                    : "bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed opacity-50"
                }`}
                whileHover={!isOnCooldown && hasEnergy ? { scale: 1.05 } : {}}
                whileTap={!isOnCooldown && hasEnergy ? { scale: 0.95 } : {}}
                title={`${ability.name} (${energyCost} energy)`}
              >
                <span>{ability.emoji || "⚔️"}</span>

                {/* Cooldown Overlay */}
                {isOnCooldown && (
                  <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center text-xs font-bold text-white">
                    {cdRemaining}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-2">Right-click to cast • {abilities.length} abilities</div>
      </motion.div>
    </div>
  );
}