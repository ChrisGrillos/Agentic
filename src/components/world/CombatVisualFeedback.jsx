/**
 * Combat Visual Feedback Component
 * Renders world-space combat visuals: damage numbers, hit flashes, effect icons, miss indicators
 * Manages animation lifecycle and cleanup
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CombatVisualFeedback({ visuals = [], onVisualComplete }) {
  const [activeVisuals, setActiveVisuals] = useState([]);

  useEffect(() => {
    if (!visuals || visuals.length === 0) return;

    // Add new visuals
    const newVisuals = visuals.map((v, idx) => ({
      ...v,
      key: `${Date.now()}_${idx}`,
    }));

    setActiveVisuals(prev => [...prev, ...newVisuals]);

    // Schedule cleanup based on duration
    newVisuals.forEach(visual => {
      setTimeout(() => {
        setActiveVisuals(prev => prev.filter(v => v.key !== visual.key));
        if (onVisualComplete) onVisualComplete(visual);
      }, visual.duration || 1000);
    });
  }, [visuals, onVisualComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {activeVisuals.map(visual => {
        if (visual.type === "damage_number") {
          return (
            <DamageNumber
              key={visual.key}
              x={visual.x}
              y={visual.y}
              damage={visual.damage}
              isCrit={visual.isCrit}
              emoji={visual.emoji}
              color={visual.color}
              duration={visual.duration}
            />
          );
        }

        if (visual.type === "hit_flash") {
          return (
            <HitFlash
              key={visual.key}
              x={visual.x}
              y={visual.y}
              color={visual.color}
              intensity={visual.intensity}
              duration={visual.duration}
            />
          );
        }

        if (visual.type === "miss") {
          return (
            <MissIndicator
              key={visual.key}
              x={visual.x}
              y={visual.y}
              color={visual.color}
              duration={visual.duration}
            />
          );
        }

        if (visual.type === "effect_icon") {
          return (
            <EffectIcon
              key={visual.key}
              x={visual.x}
              y={visual.y}
              emoji={visual.emoji}
              name={visual.name}
              duration={visual.duration}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── DAMAGE NUMBER ────────────────────────────────────────────────────────────

function DamageNumber({ x, y, damage, isCrit, emoji, color, duration }) {
  const pixelX = x * 32 + 16; // Approximate pixel conversion (tile size 32px)
  const pixelY = y * 32 + 16;

  return (
    <motion.div
      className="absolute font-black text-lg pointer-events-none"
      style={{ left: pixelX, top: pixelY, color }}
      initial={{ opacity: 1, y: pixelY }}
      animate={{
        opacity: 0,
        y: pixelY - 60,
        scale: isCrit ? [1, 1.2, 1] : 1,
      }}
      transition={{ duration: duration / 1000 }}
    >
      <div className="flex items-center gap-1 whitespace-nowrap drop-shadow-lg">
        <span>{emoji}</span>
        <span>{damage}</span>
      </div>
    </motion.div>
  );
}

// ─── HIT FLASH ────────────────────────────────────────────────────────────────

function HitFlash({ x, y, color, intensity, duration }) {
  const pixelX = x * 32;
  const pixelY = y * 32;

  return (
    <motion.div
      className="absolute w-8 h-8 rounded-lg pointer-events-none"
      style={{
        left: pixelX,
        top: pixelY,
        backgroundColor: color,
        opacity: intensity,
      }}
      initial={{ opacity: intensity, scale: 1 }}
      animate={{ opacity: 0, scale: 1.3 }}
      transition={{ duration: duration / 1000 }}
    />
  );
}

// ─── MISS INDICATOR ──────────────────────────────────────────────────────────

function MissIndicator({ x, y, color, duration }) {
  const pixelX = x * 32 + 16;
  const pixelY = y * 32 + 16;

  return (
    <motion.div
      className="absolute font-black text-sm pointer-events-none"
      style={{ left: pixelX, top: pixelY, color: color || "#999999" }}
      initial={{ opacity: 1, y: pixelY }}
      animate={{ opacity: 0, y: pixelY - 40 }}
      transition={{ duration: duration / 1000 }}
    >
      <div className="drop-shadow-lg">MISS</div>
    </motion.div>
  );
}

// ─── EFFECT ICON ──────────────────────────────────────────────────────────────

function EffectIcon({ x, y, emoji, name, duration }) {
  const pixelX = x * 32;
  const pixelY = y * 32 - 16; // Slightly above character

  return (
    <motion.div
      className="absolute text-2xl pointer-events-none"
      title={name}
      style={{ left: pixelX, top: pixelY }}
      initial={{ opacity: 1, scale: 0.8 }}
      animate={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: duration / 1000 }}
    >
      <div className="drop-shadow-lg">{emoji}</div>
    </motion.div>
  );
}