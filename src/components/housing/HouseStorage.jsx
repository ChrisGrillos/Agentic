import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { HOUSE_TIERS } from "@/components/shared/housingData";
import { RESOURCES } from "@/components/shared/craftingData";
import { ArrowDown, ArrowUp } from "lucide-react";

export default function HouseStorage({ house, character, onUpdate }) {
  const [transferring, setTransferring] = useState(false);
  const tierInfo = HOUSE_TIERS[house.tier] || HOUSE_TIERS.hut;
  const houseStorage = house.storage || [];
  const charInv = character.inventory || [];

  const moveToHouse = async (item, idx) => {
    if (transferring) return;
    if (houseStorage.length >= tierInfo.max_storage) { alert("House storage full!"); return; }
    setTransferring(true);
    const newCharInv = charInv.filter((_, i) => i !== idx);
    const existingIdx = houseStorage.findIndex(s => s.id === item.id && s.quality === item.quality);
    let newStorage;
    if (existingIdx >= 0 && item.category === "consumable") {
      newStorage = houseStorage.map((s, i) => i === existingIdx ? { ...s, qty: (s.qty || 1) + (item.qty || 1) } : s);
    } else {
      newStorage = [...houseStorage, item];
    }
    const updated = await base44.entities.PlayerHouse.update(house.id, { storage: newStorage });
    await base44.entities.Character.update(character.id, { inventory: newCharInv });
    onUpdate({ ...updated, _charInventory: newCharInv });
    setTransferring(false);
  };

  const moveToChar = async (item, idx) => {
    if (transferring) return;
    setTransferring(true);
    const newStorage = houseStorage.filter((_, i) => i !== idx);
    const existingIdx = charInv.findIndex(c => c.id === item.id && c.quality === item.quality);
    let newCharInv;
    if (existingIdx >= 0 && item.category === "consumable") {
      newCharInv = charInv.map((c, i) => i === existingIdx ? { ...c, qty: (c.qty || 1) + (item.qty || 1) } : c);
    } else {
      newCharInv = [...charInv, item];
    }
    const updated = await base44.entities.PlayerHouse.update(house.id, { storage: newStorage });
    await base44.entities.Character.update(character.id, { inventory: newCharInv });
    onUpdate({ ...updated, _charInventory: newCharInv });
    setTransferring(false);
  };

  const ItemRow = ({ item, idx, actionLabel, onAction, actionIcon: Icon, actionColor }) => {
    const res = RESOURCES[item.id];
    return (
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{item.emoji || res?.emoji || "📦"}</span>
          <div>
            <div className="text-xs font-medium text-white">{item.name || res?.name || item.id}</div>
            <div className="text-xs text-gray-500">x{item.qty || 1}
              {item.quality === "masterwork" && <span className="ml-1 text-amber-400">⭐</span>}
            </div>
          </div>
        </div>
        <button onClick={() => onAction(item, idx)} disabled={transferring}
          className={`p-1.5 rounded-lg border ${actionColor} transition-all hover:opacity-80`}>
          <Icon className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">
          Your Inventory ({charInv.length} items)
        </h3>
        <p className="text-xs text-gray-600 mb-3">Click ↓ to deposit items into house storage.</p>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {charInv.length === 0 && <p className="text-xs text-gray-700 py-4 text-center">Inventory empty.</p>}
          {charInv.map((item, idx) => (
            <ItemRow key={idx} item={item} idx={idx} actionLabel="Store" onAction={moveToHouse}
              actionIcon={ArrowDown} actionColor="border-blue-800 text-blue-400 bg-blue-900/20" />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">
          House Storage ({houseStorage.length}/{tierInfo.max_storage} slots)
        </h3>
        <p className="text-xs text-gray-600 mb-3">Click ↑ to take items back to inventory.</p>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {houseStorage.length === 0 && <p className="text-xs text-gray-700 py-4 text-center">Storage empty.</p>}
          {houseStorage.map((item, idx) => (
            <ItemRow key={idx} item={item} idx={idx} actionLabel="Take" onAction={moveToChar}
              actionIcon={ArrowUp} actionColor="border-amber-800 text-amber-400 bg-amber-900/20" />
          ))}
        </div>
      </div>
    </div>
  );
}