/**
 * NPCDialogue — Agent-driven NPC dialogue trees.
 *
 * When a player enters a POI with an NPC type, this modal is opened.
 * It uses InvokeLLM to generate contextual dialogue lines from the NPC's personality
 * and presents a small dialogue tree with player response choices.
 *
 * The NPC's "personality" is derived from: poi type, zone, character class, and world context.
 * No external agent entity is required — uses the Core InvokeLLM integration.
 */

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, MessageCircle } from "lucide-react";

const NPC_PERSONAS = {
  merchant:    { name: "Traveling Merchant",  emoji: "🛒", personality: "shrewd, friendly, knows market prices and rumors" },
  quest_giver: { name: "Villager",            emoji: "👨‍🌾", personality: "worried, desperate, has a local problem needing solving" },
  herbalist:   { name: "Forest Herbalist",    emoji: "🌿", personality: "wise, mysterious, speaks in nature metaphors" },
  miner:       { name: "Seasoned Miner",      emoji: "⛏️", personality: "gruff, honest, knows the hills and their dangers" },
  trader:      { name: "Wandering Trader",    emoji: "🎒", personality: "cheerful, gossipy, has news from distant lands" },
  farmer:      { name: "Local Farmer",        emoji: "🌾", personality: "simple, hardworking, worried about the harvest" },
  hunter:      { name: "Treasure Hunter",     emoji: "🗺️", personality: "boastful, adventurous, hints at hidden riches" },
  witch:       { name: "The Old Witch",       emoji: "🔮", personality: "cryptic, ancient, speaks in riddles and prophecy" },
  spirit:      { name: "Fire Spirit",         emoji: "🔥", personality: "elemental, alien, curious about mortals" },
};

const QUICK_RESPONSES = [
  ["Tell me about this area.", "What can you trade?", "I must be on my way."],
  ["What dangers lurk nearby?", "Any quests for me?", "I'll remember that."],
  ["What do you know of the guilds?", "How are things in the world?", "Farewell."],
];

export default function NPCDialogue({ npcType, zoneName, character, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputting, setInputting] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const npc = NPC_PERSONAS[npcType] || { name: "Stranger", emoji: "🧑", personality: "quiet and observant" };

  useEffect(() => {
    startDialogue();
  }, []);

  const startDialogue = async () => {
    setLoading(true);
    const greeting = await generateNPCLine(
      `You are ${npc.name}, a ${npc.personality} NPC in the fantasy world of Aetheria.
       You're in ${zoneName}. You've just met ${character.name}, a level ${character.level || 1} ${character.base_class || character.class}.
       Give a short opening greeting (2-3 sentences max). Stay in character. Be evocative but brief.`,
      []
    );
    setMessages([{ role: "npc", text: greeting }]);
    setLoading(false);
  };

  const generateNPCLine = async (prompt, history) => {
    const historyText = history.map(m => `${m.role === "player" ? "Player" : npc.name}: ${m.text}`).join("\n");
    const fullPrompt = history.length
      ? `${prompt}\n\nConversation so far:\n${historyText}\n\nRespond as ${npc.name} in 1-3 sentences:`
      : prompt;

    const result = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
    return typeof result === "string" ? result : result?.text || "...";
  };

  const playerSay = async (line) => {
    if (loading) return;
    const newMessages = [...messages, { role: "player", text: line }];
    setMessages(newMessages);
    setLoading(true);

    const response = await generateNPCLine(
      `You are ${npc.name}, a ${npc.personality} NPC in ${zoneName} in the fantasy world of Aetheria.
       Keep your response brief (1-3 sentences), in character, and contextually appropriate.`,
      newMessages
    );

    setMessages(prev => [...prev, { role: "npc", text: response }]);
    setLoading(false);
    setInputting(false);
    setCustomInput("");
  };

  const round = Math.min(2, Math.floor(messages.filter(m => m.role === "player").length));
  const quickReplies = QUICK_RESPONSES[round] || QUICK_RESPONSES[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-3">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{npc.emoji}</span>
            <div>
              <div className="font-bold text-white text-sm">{npc.name}</div>
              <div className="text-xs text-gray-500">{zoneName}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue log */}
        <div className="px-4 py-3 space-y-2.5 max-h-56 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "player" ? "flex-row-reverse" : ""}`}>
              <span className="text-sm shrink-0 mt-0.5">{m.role === "npc" ? npc.emoji : (character.avatar_emoji || "🧑")}</span>
              <div className={`text-xs rounded-xl px-3 py-2 max-w-[80%] leading-relaxed ${
                m.role === "npc"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-amber-900/40 text-amber-200 text-right"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">{npc.emoji}</span>
              <div className="bg-gray-800 rounded-xl px-3 py-2 text-gray-500 text-xs animate-pulse">...</div>
            </div>
          )}
        </div>

        {/* Player options */}
        <div className="px-4 pb-4 space-y-2 border-t border-gray-800 pt-3">
          {!inputting ? (
            <>
              <div className="grid grid-cols-1 gap-1.5">
                {quickReplies.map((r, i) => (
                  <button key={i} onClick={() => playerSay(r)} disabled={loading}
                    className="text-left text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3 text-gray-600 shrink-0" />
                    {r}
                  </button>
                ))}
              </div>
              <button onClick={() => setInputting(true)} disabled={loading}
                className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
                Type something custom…
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && customInput.trim()) playerSay(customInput.trim()); if (e.key === "Escape") setInputting(false); }}
                placeholder="What do you say?"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-600"
              />
              <button onClick={() => customInput.trim() && playerSay(customInput.trim())} disabled={!customInput.trim() || loading}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold rounded-lg disabled:opacity-40 transition-colors">
                Say
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}