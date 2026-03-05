import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { RESOURCES } from "@/components/shared/craftingData";
import { ArrowDown, ArrowUp, Coins } from "lucide-react";

export default function GuildStorage({ guild, character, onUpdate }) {
  const [transferring, setTransferring] = useState(false);
  const [donateAmount, setDonateAmount] = useState(10);

  const charInv = character.inventory || [];
  const guildStorage = guild.shared_storage || [];

  const depositItem = async (item, idx) => {
    if (transferring) return;
    setTransferring(true);
    const newInv = charInv.filter((_, i) => i !== idx);
    const existingIdx = guildStorage.findIndex(s => s.id === item.id);
    const newStorage = existingIdx >= 0 && item.category === "consumable"
      ? guildStorage.map((s, i) => i === existingIdx ? { ...s, qty: (s.qty || 1) + (item.qty || 1) } : s)
      : [...guildStorage, item];
    const updated = await base44.entities.Guild.update(guild.id, { shared_storage: newStorage });
    await base44.entities.Character.update(character.id, { inventory: newInv });
    onUpdate({ ...guild, ...updated, shared_storage: newStorage });
    setTransferring(false);
  };

  const withdrawItem = async (item, idx) => {
    if (transferring) return;
    setTransferring(true);
    const newStorage = guildStorage.filter((_, i) => i !== idx);
    const existingIdx = charInv.findIndex(c => c.id === item.id);
    const newInv = existingIdx >= 0 && item.category === "consumable"
      ? charInv.map((c, i) => i === existingIdx ? { ...c, qty: (c.qty || 1) + (item.qty || 1) } : c)
      : [...charInv, item];
    const updated = await base44.entities.Guild.update(guild.id, { shared_storage: newStorage });
    await base44.entities.Character.update(character.id, { inventory: newInv });
    onUpdate({ ...guild, ...updated, shared_storage: newStorage });
    setTransferring(false);
  };

  const donateGold = async () => {
    if (transferring || (character.gold || 0) < donateAmount) return;
    setTransferring(true);
    const updated = await base44.entities.Guild.update(guild.id, { shared_gold: (guild.shared_gold || 0) + donateAmount });
    await base44.entities.Character.update(character.id, { gold: (character.gold || 0) - donateAmount });
    // Update member contribution
    const members = (guild.members || []).map(m =>
      m.character_id === character.id ? { ...m, contribution_gold: (m.contribution_gold || 0) + donateAmount } : m
    );
    await base44.entities.Guild.update(guild.id, { members });
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: `${character.name} donated ${donateAmount}g to the guild treasury!`, message_type: "system" });
    onUpdate({ ...guild, ...updated, shared_gold: (guild.shared_gold || 0) + donateAmount, members });
    setTransferring(false);
  };

  const ItemRow = ({ item, idx, onAction, Icon, color }) => {
    const res = RESOURCES[item.id];
    return (
      <div className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{item.emoji || res?.emoji || "📦"}</span>
          <div>
            <div className="text-xs font-medium text-white">{item.name || res?.name || item.id}</div>
            <div className="text-xs text-gray-500">x{item.qty || 1}</div>
          </div>
        </div>
        <button onClick={() => onAction(item, idx)} disabled={transferring}
          className={`p-1.5 rounded-lg border ${color} transition-all`}>
          <Icon className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Gold treasury */}
      <div className="bg-gray-900 border border-amber-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-amber-400" />
          <div>
            <div className="font-black text-amber-400 text-xl">{guild.shared_gold || 0}g</div>
            <div className="text-xs text-gray-500">Guild Treasury</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min="1" max={character.gold || 0} value={donateAmount}
            onChange={e => setDonateAmount(Number(e.target.value))}
            className="w-16 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white text-center" />
          <Button onClick={donateGold} disabled={transferring || (character.gold || 0) < donateAmount}
            className="bg-amber-700 hover:bg-amber-600 text-xs font-bold">Donate Gold</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">Your Inventory</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {charInv.length === 0 && <p className="text-xs text-gray-700 py-4 text-center">Empty.</p>}
            {charInv.map((item, idx) => (
              <ItemRow key={idx} item={item} idx={idx} onAction={depositItem} Icon={ArrowDown} color="border-blue-800 text-blue-400 bg-blue-900/20" />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">Guild Storage ({guildStorage.length} items)</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {guildStorage.length === 0 && <p className="text-xs text-gray-700 py-4 text-center">Empty.</p>}
            {guildStorage.map((item, idx) => (
              <ItemRow key={idx} item={item} idx={idx} onAction={withdrawItem} Icon={ArrowUp} color="border-amber-800 text-amber-400 bg-amber-900/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}