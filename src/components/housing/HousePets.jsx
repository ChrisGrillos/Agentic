import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { PET_SPECIES } from "@/components/shared/housingData";
import { getZoneAt } from "@/components/shared/worldZones";
import { Plus, Home as HomeIcon, User } from "lucide-react";

const MOOD_COLOR = { happy: "text-green-400", content: "text-gray-400", hungry: "text-orange-400", sad: "text-red-400", excited: "text-yellow-400" };
const MOOD_EMOJI = { happy: "😄", content: "😐", hungry: "😋", sad: "😢", excited: "🤩" };

export default function HousePets({ house, character, pets, onUpdate, onRefreshHouse }) {
  const [taming, setTaming] = useState(false);
  const [showTame, setShowTame] = useState(false);

  const currentZone = getZoneAt(character.x || 20, character.y || 20);
  const tamableHere = currentZone
    ? Object.entries(PET_SPECIES).filter(([, spec]) => spec.zone === currentZone.id)
    : [];
  const craftingSkill = character.skills?.crafting || 1;

  const handleTame = async (speciesId) => {
    const spec = PET_SPECIES[speciesId];
    if (!spec) return;
    const combatSkill = character.skills?.combat || 1;
    if (combatSkill < spec.tame_skill) { alert(`Need combat skill ${spec.tame_skill} to tame ${spec.name}!`); return; }
    setTaming(true);
    const petName = `${spec.name} #${Math.floor(Math.random()*1000)}`;
    const newPet = await base44.entities.Pet.create({
      name: petName, species: speciesId, emoji: spec.emoji,
      owner_character_id: character.id, owner_name: character.name,
      house_id: house.id, is_with_owner: true,
      level: 1, bond: 10, mood: "excited",
      stats: spec.stats, abilities: [spec.ability],
      tamed_at_zone: currentZone?.id || "", is_tamed: true,
    });
    onUpdate([...pets, newPet]);
    setTaming(false);
    setShowTame(false);
  };

  const handleToggleLocation = async (pet) => {
    const updated = await base44.entities.Pet.update(pet.id, { is_with_owner: !pet.is_with_owner });
    onUpdate(pets.map(p => p.id === pet.id ? updated : p));
  };

  const handleFeed = async (pet) => {
    const updated = await base44.entities.Pet.update(pet.id, { mood: "happy", bond: Math.min(100, (pet.bond || 0) + 5) });
    onUpdate(pets.map(p => p.id === pet.id ? updated : p));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-300">Your Companions ({pets.length})</h3>
        <Button onClick={() => setShowTame(s => !s)} variant="outline"
          className="border-green-900 text-green-400 gap-1 text-xs">
          <Plus className="w-3 h-3" /> Tame a Pet
        </Button>
      </div>

      {/* Tame panel */}
      {showTame && (
        <div className="bg-gray-900 border border-green-900 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 mb-3">
            You're in <strong className="text-white">{currentZone?.name || "unknown zone"}</strong>.
            Tamable creatures here:
          </p>
          {tamableHere.length === 0 && (
            <p className="text-xs text-gray-600">No tamable creatures in this zone. Explore elsewhere!</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {tamableHere.map(([id, spec]) => {
              const canTame = (character.skills?.combat || 1) >= spec.tame_skill;
              return (
                <div key={id} className={`border rounded-xl p-3 ${canTame ? "border-green-800 bg-green-900/10" : "border-gray-800 opacity-50"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{spec.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{spec.name}</div>
                      <div className="text-xs text-gray-500">Combat {spec.tame_skill} required</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-300 mb-2">{spec.ability}</div>
                  <Button onClick={() => handleTame(id)} disabled={!canTame || taming}
                    className="w-full bg-green-800 hover:bg-green-700 text-xs h-7 font-bold">
                    {taming ? "Taming..." : "Tame"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pet list */}
      {pets.length === 0 && !showTame && (
        <div className="text-center py-10 text-gray-600 text-sm">
          No pets yet. Explore zones and tame wildlife!
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pets.map(pet => {
          const spec = PET_SPECIES[pet.species] || {};
          return (
            <div key={pet.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{pet.emoji}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{pet.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{pet.species?.replace(/_/g," ")} • Lv.{pet.level}</div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${MOOD_COLOR[pet.mood] || "text-gray-400"}`}>
                  {MOOD_EMOJI[pet.mood]} {pet.mood}
                </div>
              </div>
              {/* Bond bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Bond</span>
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${pet.bond || 0}%` }} />
                </div>
                <span className="text-xs text-gray-500">{pet.bond || 0}</span>
              </div>
              {/* Stats */}
              <div className="flex gap-2 text-xs mb-3">
                {pet.stats?.attack_bonus > 0 && <span className="text-red-400">+{pet.stats.attack_bonus} ATK</span>}
                {pet.stats?.defense_bonus > 0 && <span className="text-blue-400">+{pet.stats.defense_bonus} DEF</span>}
                {pet.stats?.luck_bonus > 0 && <span className="text-yellow-400">+{pet.stats.luck_bonus} LCK</span>}
              </div>
              {/* Ability */}
              {pet.abilities?.[0] && (
                <div className="text-xs text-purple-300 mb-3 bg-purple-900/20 px-2 py-1 rounded">{pet.abilities[0]}</div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => handleFeed(pet)} className="flex-1 bg-green-900 hover:bg-green-800 text-xs h-7">
                  🥩 Feed
                </Button>
                <Button onClick={() => handleToggleLocation(pet)} variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 text-xs h-7 gap-1">
                  {pet.is_with_owner ? <><HomeIcon className="w-3 h-3" /> Send Home</> : <><User className="w-3 h-3" /> Bring Along</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}