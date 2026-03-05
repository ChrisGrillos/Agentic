import { BASE_CLASSES, getCharacterAbilities } from "@/components/shared/classDefinitions";
import { Zap, Shield, Star, Lock } from "lucide-react";

const TYPE_STYLE = {
  active:   { color: "text-blue-400",   bg: "bg-blue-900/20",   border: "border-blue-800",   icon: Zap },
  passive:  { color: "text-green-400",  bg: "bg-green-900/20",  border: "border-green-800",  icon: Shield },
  ultimate: { color: "text-amber-400",  bg: "bg-amber-900/20",  border: "border-amber-800",  icon: Star },
};

export default function AbilitiesPanel({ character }) {
  const classId = character.base_class || character.class;
  const level   = character.level || 1;
  const specId  = character.specialization;

  const unlocked = getCharacterAbilities(classId, specId, level);

  // Also show locked abilities so players know what's coming
  const baseClass = BASE_CLASSES[classId];
  const allAbilities = [
    ...(baseClass?.baseAbilities || []),
    ...(specId && baseClass?.specializations?.[specId]
        ? baseClass.specializations[specId].abilities
        : [])
  ];

  const locked = allAbilities.filter(a => a.unlocked_at_level > level);

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">
        Abilities ({unlocked.length} unlocked)
      </div>

      {unlocked.length === 0 && (
        <div className="text-xs text-gray-600 italic">No abilities yet.</div>
      )}

      <div className="space-y-1.5">
        {unlocked.map(ability => {
          const style = TYPE_STYLE[ability.type] || TYPE_STYLE.active;
          const Icon  = style.icon;
          return (
            <div key={ability.id} className={`${style.bg} border ${style.border} rounded-lg px-2.5 py-1.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${style.color}`} />
                  <span className={`text-xs font-bold ${style.color}`}>{ability.name}</span>
                  <span className="text-xs bg-gray-800 text-gray-500 px-1 rounded capitalize">{ability.type}</span>
                </div>
                {ability.cooldown_rounds > 0 && (
                  <span className="text-xs text-gray-600">{ability.cooldown_rounds}cd</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{ability.description}</p>
            </div>
          );
        })}

        {locked.length > 0 && (
          <>
            <div className="text-xs text-gray-700 mt-2 mb-1">Upcoming:</div>
            {locked.slice(0, 2).map(ability => (
              <div key={ability.id} className="bg-gray-800/30 border border-gray-800 rounded-lg px-2.5 py-1.5 opacity-60">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-bold text-gray-500">{ability.name}</span>
                  <span className="text-xs text-gray-700">Lv.{ability.unlocked_at_level}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight">{ability.description}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}