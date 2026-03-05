import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EQUIPMENT_SLOTS = [
  { key: "head",      label: "Head",    emoji: "🪖" },
  { key: "chest",     label: "Chest",   emoji: "🛡️" },
  { key: "weapon",    label: "Weapon",  emoji: "⚔️" },
  { key: "shield",    label: "Shield",  emoji: "🛡" },
  { key: "boots",     label: "Boots",   emoji: "👢" },
  { key: "accessory", label: "Acc",     emoji: "💍" },
];

const RARITY_BORDER = {
  common:    "border-gray-600",
  uncommon:  "border-green-600",
  rare:      "border-blue-600",
  legendary: "border-purple-500 animate-pulse",
};

const RARITY_COLOR = {
  common:    "text-gray-400",
  uncommon:  "text-green-400",
  rare:      "text-blue-400",
  legendary: "text-purple-400",
};

function slotLabel(slot) {
  return EQUIPMENT_SLOTS.find(s => s.key === slot)?.label || slot;
}

function inferSlot(item) {
  const n = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();
  if (cat === "weapon" || n.includes("sword") || n.includes("bow") || n.includes("staff") || n.includes("axe") || n.includes("dagger")) return "weapon";
  if (n.includes("helm") || n.includes("hat") || n.includes("hood") || n.includes("head")) return "head";
  if (n.includes("chest") || n.includes("robe") || n.includes("armor") || n.includes("tunic") || cat === "armor") return "chest";
  if (n.includes("shield") || n.includes("buckler")) return "shield";
  if (n.includes("boot") || n.includes("shoe") || n.includes("greave")) return "boots";
  if (n.includes("ring") || n.includes("amulet") || n.includes("pendant") || n.includes("necklace")) return "accessory";
  return null;
}

export default function InventoryPanel({ open, onClose, character, onUpdate }) {
  const [selected, setSelected] = useState(null);

  const inventory  = character?.inventory  || [];
  const equipment  = character?.equipment  || {};

  const save = async (newInv, newEquip, extraUpdates = {}) => {
    const updates = { inventory: newInv, equipment: newEquip, ...extraUpdates };
    await base44.entities.Character.update(character.id, updates);
    onUpdate({ ...character, ...updates });
  };

  const equipItem = async (item) => {
    const slot = inferSlot(item);
    if (!slot) return;

    const newEquip = { ...equipment };
    const newInv   = inventory.filter(i => i.id !== item.id || (i.qty > 1 && (i.qty = i.qty - 1) >= 0));

    // Unequip existing item in slot back to inventory
    if (newEquip[slot]) {
      const prev = newEquip[slot];
      const existIdx = newInv.findIndex(i => i.id === prev.id);
      if (existIdx >= 0) newInv[existIdx] = { ...newInv[existIdx], qty: (newInv[existIdx].qty || 1) + 1 };
      else newInv.push({ ...prev, qty: 1 });
    }

    newEquip[slot] = { ...item, qty: 1 };
    // Remove from inventory (qty-1 or fully)
    const idx = inventory.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      const copy = [...inventory];
      if ((copy[idx].qty || 1) > 1) {
        copy[idx] = { ...copy[idx], qty: copy[idx].qty - 1 };
        await save(copy, newEquip);
      } else {
        const withoutItem = copy.filter((_, i) => i !== idx);
        await save(withoutItem, newEquip);
      }
    }
    setSelected(null);
  };

  const unequipItem = async (slotKey) => {
    const item = equipment[slotKey];
    if (!item) return;
    const newEquip = { ...equipment, [slotKey]: null };
    const idx = inventory.findIndex(i => i.id === item.id);
    let newInv;
    if (idx >= 0) newInv = inventory.map((it, i) => i === idx ? { ...it, qty: (it.qty || 1) + 1 } : it);
    else newInv = [...inventory, { ...item, qty: 1 }];
    await save(newInv, newEquip);
  };

  const useConsumable = async (item) => {
    const heals = item.heals || item.heal || 0;
    const newHP  = Math.min(character.max_hp || 100, (character.hp || 100) + heals);
    const idx    = inventory.findIndex(i => i.id === item.id);
    if (idx < 0) return;
    let newInv;
    if ((inventory[idx].qty || 1) > 1) newInv = inventory.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it);
    else newInv = inventory.filter((_, i) => i !== idx);
    await save(newInv, equipment, { hp: newHP });
    setSelected(null);
  };

  const dropItem = async (item) => {
    // Note: drop confirmation could be a toast instead of window.confirm
    // For now, silently drop the item
    const idx = inventory.findIndex(i => i.id === item.id);
    if (idx < 0) return;
    let newInv;
    if ((inventory[idx].qty || 1) > 1) newInv = inventory.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it);
    else newInv = inventory.filter((_, i) => i !== idx);
    await save(newInv, equipment);
    setSelected(null);
  };

  const isConsumable = (item) => item.category === "consumable" || !!item.heals || !!item.heal;
  const isEquippable  = (item) => !!inferSlot(item);

  return (
    <>
      <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
        <SheetContent side="right" className="bg-gray-950 border-gray-800 text-white w-full sm:w-[420px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-amber-400 text-xl">🎒 Inventory</SheetTitle>
          </SheetHeader>

          {/* Equipment slots */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Equipped</p>
            <div className="grid grid-cols-6 gap-2">
              {EQUIPMENT_SLOTS.map(slot => {
                const item = equipment[slot.key];
                return (
                  <button key={slot.key}
                    onClick={() => item && unequipItem(slot.key)}
                    title={item ? `${item.name} (click to unequip)` : slot.label}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-xl transition-all
                      ${item ? "bg-gray-800 border-amber-700 hover:border-red-500" : "bg-gray-900 border-gray-700 opacity-50"}`}>
                    {item ? (item.emoji || "❓") : <span className="text-gray-700 text-sm">{slot.emoji}</span>}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-6 gap-2 mt-0.5">
              {EQUIPMENT_SLOTS.map(s => (
                <div key={s.key} className="text-center text-gray-600" style={{ fontSize: "9px" }}>{s.label}</div>
              ))}
            </div>
          </div>

          {/* Inventory grid */}
          <div className="mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bag ({inventory.length} items)</p>
            {inventory.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">Your bag is empty. Fight monsters to get loot!</p>
            )}
            <div className="grid grid-cols-6 gap-1.5">
              {inventory.map((item, idx) => (
                <button key={`${item.id}-${idx}`}
                  onClick={() => setSelected(item)}
                  className={`aspect-square relative flex items-center justify-center rounded-lg border-2 bg-gray-900 text-xl hover:bg-gray-800 transition-all
                    ${RARITY_BORDER[item.rarity] || "border-gray-700"}`}>
                  <span>{item.emoji || "📦"}</span>
                  {(item.qty || 1) > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 bg-gray-950 text-gray-300 rounded text-xs leading-none px-0.5" style={{ fontSize: "9px" }}>
                      {item.qty}
                    </span>
                  )}
                </button>
              ))}
              {/* empty cells */}
              {Array.from({ length: Math.max(0, 18 - inventory.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-lg bg-gray-900 border border-gray-800 opacity-40" />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-4xl">{selected.emoji || "📦"}</span>
                <div>
                  <div className="text-white font-bold">{selected.name}</div>
                  {selected.rarity && (
                    <div className={`text-xs font-bold capitalize ${RARITY_COLOR[selected.rarity] || "text-gray-400"}`}>
                      {selected.rarity}
                    </div>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className={`border-2 rounded-lg p-3 mb-2 ${RARITY_BORDER[selected.rarity] || "border-gray-700"}`}>
              {selected.description && (
                <p className="text-sm text-gray-400 mb-2 italic">{selected.description}</p>
              )}
              {selected.stats && Object.keys(selected.stats).length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Bonuses</p>
                  {Object.entries(selected.stats).map(([stat, val]) => (
                    <div key={stat} className="flex justify-between text-xs">
                      <span className="text-gray-400 capitalize">{stat.replace(/_/g, " ")}</span>
                      <span className="text-green-400 font-bold">+{val}</span>
                    </div>
                  ))}
                </div>
              )}
              {(selected.heals || selected.heal) && (
                <p className="text-sm text-green-400">Restores +{selected.heals || selected.heal} HP</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {isConsumable(selected) && (
                <Button size="sm" onClick={() => useConsumable(selected)} className="bg-green-700 hover:bg-green-600">
                  Use
                </Button>
              )}
              {isEquippable(selected) && (
                <Button size="sm" onClick={() => equipItem(selected)} className="bg-blue-700 hover:bg-blue-600">
                  Equip → {slotLabel(inferSlot(selected))}
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/30" onClick={() => { dropItem(selected); setSelected(null); }}>
                 Drop
               </Button>
              <Button size="sm" variant="ghost" className="text-gray-500 ml-auto" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}