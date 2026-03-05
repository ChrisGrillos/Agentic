import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Gift, Scroll } from "lucide-react";

const NPC_DATA = {
  merchant: {
    emoji: "🏪",
    name: "Traveling Merchant",
    dialogue: "Greetings, adventurer! I have fine wares and supplies for sale.",
    actions: ["trade", "talk"],
  },
  quest_giver: {
    emoji: "❓",
    name: "Town Elder",
    dialogue: "We have need of your services. Will you help us?",
    actions: ["quest", "talk"],
  },
  trader: {
    emoji: "💰",
    name: "Free Spears Trader",
    dialogue: "Looking to buy or sell? I deal in fair exchanges.",
    actions: ["trade", "talk"],
  },
  herbalist: {
    emoji: "🌿",
    name: "Forest Herbalist",
    dialogue: "The herbs here are potent. Learn their secrets?",
    actions: ["talk"],
  },
  miner: {
    emoji: "⛏️",
    name: "Iron Oath Miner",
    dialogue: "Fine ore runs deep in these mountains. Care to delve?",
    actions: ["talk"],
  },
  farmer: {
    emoji: "🌾",
    name: "Ashfield Farmer",
    dialogue: "Harvest time is here. Would you lend a hand?",
    actions: ["talk"],
  },
  hunter: {
    emoji: "🏹",
    name: "Vaultkeeper Scout",
    dialogue: "The relics of old are scattered. Help me find them?",
    actions: ["talk"],
  },
  witch: {
    emoji: "🪄",
    name: "Fen Witch",
    dialogue: "The spirits whisper secrets... would you hear them?",
    actions: ["talk"],
  },
  spirit: {
    emoji: "🔥",
    name: "Cinder Spirit",
    dialogue: "The flames speak. Listen, if you dare...",
    actions: ["talk"],
  },
};

const NPC_REWARDS = {
  merchant: { gold: [5, 25] },
  quest_giver: { xp: 80 },
  trader: { gold: [5, 30] },
  herbalist: { resource: "herb" },
  miner: { resource: "iron_ore" },
  farmer: { resource: "wheat" },
  hunter: { xp: 50 },
  witch: { xp: 100 },
  spirit: { xp: 120 },
};

export default function NPCPanel({ npcType, zoneName, character, onClose, onInteract }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!character) return null;

  const npcInfo = NPC_DATA[npcType] || NPC_DATA.merchant;
  const rewards = NPC_REWARDS[npcType] || {};

  const handleInteract = async (action) => {
    try {
      setLoading(true);
      const updates = {};

      // Apply rewards
      if (rewards.xp) {
        updates.xp = (character.xp || 0) + rewards.xp;
      }
      if (rewards.gold) {
        const [min, max] = rewards.gold;
        updates.gold = (character.gold || 0) + Math.floor(Math.random() * (max - min) + min);
      }
      if (rewards.resource) {
        const inv = [...(character.inventory || [])];
        const idx = inv.findIndex(i => i.id === rewards.resource);
        if (idx >= 0) {
          inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 0) + 1 };
        } else {
          inv.push({ id: rewards.resource, name: rewards.resource, qty: 1 });
        }
        updates.inventory = inv;
      }

      // Save updates
      if (Object.keys(updates).length > 0) {
        await base44.entities.Character.update(character.id, updates);
      }

      setResult({
        action,
        message: `${npcInfo.name} says: "Thank you for your time!"`,
        rewards: updates,
      });

      // Call callback if provided
      if (onInteract) onInteract(updates);

      // Auto-close after 2 seconds
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error("[NPCPanel] Interaction error:", error);
      setResult({ action, message: "Something went wrong..." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="bg-gray-900/95 border-l border-amber-800 text-white w-full sm:w-80 overflow-y-auto backdrop-blur-sm"
      >
        <SheetHeader className="text-left mb-3">
           <SheetTitle className="flex items-center gap-2 text-lg text-amber-400">
            <span className="text-3xl">{npcInfo.emoji}</span>
            <div>
              <div className="text-white">{npcInfo.name}</div>
              <div className="text-xs text-gray-500">{zoneName}</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Dialogue */}
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-xs mb-2">
              <p className="text-gray-300 italic">"{npcInfo.dialogue}"</p>
            </div>

            {/* Rewards preview */}
            {Object.keys(rewards).length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-[11px] space-y-0.5 mb-2">
                <p className="text-gray-500 uppercase tracking-wider font-bold text-xs">Rewards:</p>
                {rewards.xp && <p className="text-purple-400">✦ +{rewards.xp} XP</p>}
                {rewards.gold && (
                  <p className="text-amber-400">💰 +{rewards.gold[0]}-{rewards.gold[1]} gold</p>
                )}
                {rewards.resource && (
                  <p className="text-green-400">📦 {rewards.resource}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-1.5 flex-wrap text-sm">
              {npcInfo.actions?.includes("trade") && (
                <Button
                  size="sm"
                  onClick={() => handleInteract("trade")}
                  disabled={loading}
                  className="bg-blue-700 hover:bg-blue-600 gap-1 h-8 text-xs"
                >
                  <Gift className="w-3 h-3" /> Trade
                </Button>
              )}
              {npcInfo.actions?.includes("quest") && (
                <Button
                  size="sm"
                  onClick={() => handleInteract("quest")}
                  disabled={loading}
                  className="bg-green-700 hover:bg-green-600 gap-1 h-8 text-xs"
                >
                  <Scroll className="w-3 h-3" /> Quest
                </Button>
              )}
              {npcInfo.actions?.includes("talk") && (
                <Button
                  size="sm"
                  onClick={() => handleInteract("talk")}
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-600 gap-1 h-8 text-xs"
                >
                  <MessageCircle className="w-3 h-3" /> Talk
                </Button>
              )}
              <Button
                size="sm"
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300 ml-auto h-8 text-xs gap-1"
              >
                <X className="w-3 h-3" /> Leave
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-3xl">💬</div>
            <p className="text-gray-300 text-xs">{result.message}</p>
            {result.rewards?.xp && (
              <p className="text-purple-400 text-xs">+{result.rewards.xp} XP</p>
            )}
            {result.rewards?.gold && (
              <p className="text-amber-400 text-xs">+{result.rewards.gold} gold</p>
            )}
            {result.rewards?.inventory && (
              <p className="text-green-400 text-xs">📦 Item received</p>
            )}
            <p className="text-[10px] text-gray-500 mt-2">Closing...</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}