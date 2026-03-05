import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { getSpecializations, BASE_CLASSES } from "@/components/shared/classDefinitions";
import { getCharacterAbilities } from "@/components/shared/classDefinitions";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

export default function SpecializationPicker({ character, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const classId = character.base_class || character.class;
  const level   = character.level || 1;
  const specs   = getSpecializations(classId);
  const current = character.specialization;
  const canSpecialize = level >= 5 && !current;

  const handlePick = async (specId) => {
    setSaving(true);
    const spec = BASE_CLASSES[classId]?.specializations?.[specId];
    if (!spec) return;

    // Apply stat bonuses from specialization
    const newStats = { ...(character.stats || {}) };
    for (const [stat, bonus] of Object.entries(spec.statBonuses || {})) {
      newStats[stat] = (newStats[stat] || 10) + bonus;
    }

    // Grant newly unlocked abilities
    const newAbilities = getCharacterAbilities(classId, specId, level);

    await base44.entities.Character.update(character.id, {
      specialization: specId,
      stats: newStats,
      abilities: newAbilities,
    });

    setSaving(false);
    setPicking(false);
    if (onUpdated) onUpdated();
  };

  if (specs.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="font-medium uppercase tracking-wider">
          Specialization
          {current && (
            <span className="ml-2 text-purple-400 capitalize font-bold">
              {BASE_CLASSES[classId]?.specializations?.[current]?.emoji}{" "}
              {BASE_CLASSES[classId]?.specializations?.[current]?.label}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {current ? (
            <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-3">
              {(() => {
                const spec = BASE_CLASSES[classId]?.specializations?.[current];
                return spec ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{spec.emoji}</span>
                      <span className="font-bold text-purple-300">{spec.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{spec.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(spec.statBonuses || {}).map(([s, v]) => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${v > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                          {s.slice(0,3).toUpperCase()} {v > 0 ? "+" : ""}{v}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          ) : canSpecialize ? (
            <>
              <p className="text-xs text-amber-400">🎉 You've reached level 5! Choose your specialization:</p>
              <div className="grid grid-cols-1 gap-2">
                {specs.map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => handlePick(spec.id)}
                    disabled={saving}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-600 rounded-lg p-3 text-left transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{spec.emoji}</span>
                      <span className="font-bold text-white text-sm">{spec.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{spec.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(spec.statBonuses || {}).map(([s, v]) => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${v > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                          {s.slice(0,3).toUpperCase()} {v > 0 ? "+" : ""}{v}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock className="w-3 h-3" />
              Reach level 5 to unlock a specialization. (Current: Lv.{level})
            </div>
          )}
        </div>
      )}
    </div>
  );
}