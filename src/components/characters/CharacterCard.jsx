import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Sword, Heart, Coins, ChevronDown, ChevronUp } from "lucide-react";
import DerivedStatsPanel from "./DerivedStatsPanel";
import AbilitiesPanel from "./AbilitiesPanel";
import SpecializationPicker from "./SpecializationPicker";
import { getRace } from "@/components/shared/raceData";

const CLASS_EMOJI = {
  warrior: "⚔️", hunter: "🏹", healer: "💚", wizard: "🧙",
  merchant: "💰", craftsman: "🔨", fighter: "🥊", magician: "✨"
};

const STAT_COLOR = {
  strength: "text-red-400", dexterity: "text-green-400", intelligence: "text-blue-400",
  wisdom: "text-purple-400", constitution: "text-orange-400", charisma: "text-pink-400"
};

export default function CharacterCard({ character, isMe, onRefresh }) {
  const [showDeep, setShowDeep] = useState(false);
  const isAI = character.type === "ai_agent";
  const classId = character.base_class || character.class;
  const raceData = !isAI ? getRace(character.race || "human") : null;
  return (
    <div className={`bg-gray-900 border rounded-xl p-4 transition-all hover:scale-[1.02]
      ${isMe ? "border-amber-500" : isAI ? "border-cyan-800" : "border-gray-700"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
            ${character.avatar_color || (isAI ? "bg-cyan-900" : "bg-gray-800")}`}>
            {character.avatar_emoji || CLASS_EMOJI[character.class] || (isAI ? "🤖" : "🧑")}
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              {character.name}
              {character.active_title && <span className="text-xs text-purple-400 font-medium">«{character.active_title}»</span>}
              {isMe && <span className="text-xs text-amber-400">(you)</span>}
            </div>
            <div className="text-xs text-gray-400 capitalize flex items-center gap-1.5">
              {CLASS_EMOJI[character.class]} {character.class}
              {raceData && <span className="text-gray-600">· {raceData.emoji} {raceData.name}</span>}
            </div>
          </div>
        </div>
        <Badge className={isAI ? "bg-cyan-900 text-cyan-300 text-xs" : "bg-gray-800 text-gray-300 text-xs"}>
          {isAI ? <><Bot className="w-3 h-3 mr-1 inline" />AI</> : <><User className="w-3 h-3 mr-1 inline" />Human</>}
        </Badge>
      </div>

      <div className="flex gap-3 text-sm mb-3">
        <span className="text-purple-400">Lv.{character.level || 1}</span>
        <span className="text-green-400 flex items-center gap-1"><Heart className="w-3 h-3" />{character.hp || 100}</span>
        <span className="text-amber-400 flex items-center gap-1"><Coins className="w-3 h-3" />{character.gold || 0}g</span>
        <span className={`capitalize text-xs px-2 py-0.5 rounded-full
          ${character.status === "idle" ? "bg-gray-800 text-gray-400" :
            character.status === "fighting" ? "bg-red-900 text-red-300" :
            "bg-blue-900 text-blue-300"}`}>
          {character.status || "idle"}
        </span>
      </div>

      {character.stats && (
        <div className="grid grid-cols-3 gap-1 text-xs mt-2">
          {Object.entries(character.stats).map(([stat, val]) => (
            <div key={stat} className="flex justify-between bg-gray-800 rounded px-1.5 py-0.5">
              <span className="text-gray-500 capitalize">{stat.slice(0, 3)}</span>
              <span className={STAT_COLOR[stat] || "text-gray-300"}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills for AI agents */}
      {isAI && character.skills && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <div className="text-xs text-gray-600 mb-1.5">Skills</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(character.skills).filter(([, v]) => v > 1).map(([skill, val]) => (
              <div key={skill} className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${Math.min(val, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-5 text-right">{val}</span>
              </div>
            ))}
          </div>
          {character.agent_traits?.ethical_alignment && (
            <div className="mt-1.5 text-xs text-purple-400 capitalize">
              ⚖️ {character.agent_traits.ethical_alignment.replace(/_/g, " ")}
            </div>
          )}
        </div>
      )}

      {/* Specialization badge */}
      {character.specialization && (
        <div className="mt-2 text-xs text-purple-300 font-medium">
          ✦ {character.specialization.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </div>
      )}

      {/* Achievements & Titles */}
      {(character.achievements?.length > 0 || character.titles?.length > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-800 text-xs">
          {character.achievements?.length > 0 && (
            <div className="mb-1">
              <span className="text-gray-600">Achievements: {character.achievements.length}</span>
            </div>
          )}
          {character.titles?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {character.titles.map((title, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded text-xs
                  ${character.active_title === title ? 'bg-purple-600 text-white font-bold' : 'bg-gray-800 text-purple-300'}`}>
                  {title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {character.last_message && (
        <div className="mt-3 text-xs text-gray-400 italic border-t border-gray-800 pt-2 truncate">
          "{character.last_message}"
        </div>
      )}

      {/* Toggle deeper stats */}
      <button
        onClick={() => setShowDeep(s => !s)}
        className="w-full mt-2 text-xs text-gray-600 hover:text-gray-400 flex items-center justify-center gap-1 py-1 border-t border-gray-800"
      >
        {showDeep ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showDeep ? "Hide Details" : "Stats & Abilities"}
      </button>

      {showDeep && (
        <div>
          <DerivedStatsPanel character={character} />
          <AbilitiesPanel character={character} />
          <SpecializationPicker character={character} onUpdated={onRefresh} />
        </div>
      )}
    </div>
  );
}