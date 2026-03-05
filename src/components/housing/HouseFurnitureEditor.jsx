import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { FURNITURE, HOUSE_TIERS } from "@/components/shared/housingData";
import { Plus, Trash2 } from "lucide-react";

export default function HouseFurnitureEditor({ house, character, onUpdate }) {
  const [buying, setBuying] = useState(false);

  const tierInfo = HOUSE_TIERS[house.tier] || HOUSE_TIERS.hut;
  const placed = house.furniture || [];
  const slotsUsed = placed.length;

  const handleBuy = async (item) => {
    if (buying) return;
    if ((character.gold || 0) < item.cost) { alert(`Need ${item.cost} gold!`); return; }
    if (slotsUsed >= tierInfo.slots) { alert("No furniture slots left. Upgrade your home!"); return; }
    setBuying(true);

    const newFurniture = [...placed, { id: item.id, name: item.name, emoji: item.emoji, type: item.type, slot: slotsUsed, bonus: item.bonus, crafting_station: item.crafting_station || null }];
    const newStations = item.crafting_station
      ? [...new Set([...(house.crafting_stations || []), item.crafting_station])]
      : house.crafting_stations || [];

    const updated = await base44.entities.PlayerHouse.update(house.id, { furniture: newFurniture, crafting_stations: newStations });
    await base44.entities.Character.update(character.id, { gold: (character.gold || 0) - item.cost });
    onUpdate({ ...updated, crafting_stations: newStations });
    setBuying(false);
  };

  const handleRemove = async (idx) => {
    const removed = placed[idx];
    const newFurniture = placed.filter((_, i) => i !== idx);
    // Remove station if no more furniture provides it
    const newStations = (house.crafting_stations || []).filter(s =>
      newFurniture.some(f => f.crafting_station === s)
    );
    const updated = await base44.entities.PlayerHouse.update(house.id, { furniture: newFurniture, crafting_stations: newStations });
    onUpdate({ ...updated, crafting_stations: newStations });
  };

  const categories = ["all", "decoration", "storage", "crafting_station", "bed", "trophy"];
  const [filter, setFilter] = useState("all");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Placed furniture */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase font-medium mb-3">
          Placed Furniture ({slotsUsed}/{tierInfo.slots} slots)
        </h3>
        {placed.length === 0 && (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-600 text-sm">
            Your home is empty. Buy furniture from the catalog →
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {placed.map((item, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center group relative">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="text-xs font-medium text-white truncate">{item.name}</div>
              {item.bonus && <div className="text-xs text-green-400 mt-0.5 leading-tight">{item.bonus}</div>}
              <button onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">Furniture Catalog</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`text-xs px-2 py-1 rounded-lg border transition-all capitalize ${filter === cat ? "border-amber-600 bg-amber-900/30 text-amber-300" : "border-gray-700 text-gray-500"}`}>
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {FURNITURE.filter(f => filter === "all" || f.type === filter).map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="text-xs font-bold text-white">{item.name}</div>
                  {item.bonus && <div className="text-xs text-green-400">{item.bonus}</div>}
                  <div className="text-xs text-gray-600 capitalize">{item.type.replace(/_/g," ")}</div>
                </div>
              </div>
              <Button onClick={() => handleBuy(item)} disabled={buying || (character.gold || 0) < item.cost || slotsUsed >= tierInfo.slots}
                className="bg-amber-700 hover:bg-amber-600 text-xs px-3 py-1 h-auto font-bold gap-1">
                <Plus className="w-3 h-3" />{item.cost}g
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}