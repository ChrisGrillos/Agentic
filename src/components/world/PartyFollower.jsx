/**
 * PartyFollower — Visual indicator for party/guild members following you.
 *
 * This component:
 * 1. Shows a "following" banner if guild members are near (within 3 tiles)
 * 2. Provides a "Form Party" button to invite nearby guild members
 * 3. Shows who is in your current party with their HP status
 *
 * Movement authority stays in World.jsx — this is only a UI/social layer.
 * "Following" in this context means: guild members within 3 tiles are shown as
 * your party and their health is visible on-screen.
 */

import { useState, useMemo } from "react";
import { Users, Heart, X } from "lucide-react";
import { getRace } from "@/components/shared/raceData";

function dist(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export default function PartyFollower({ myCharacter, allCharacters }) {
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyMembers, setPartyMembers] = useState([]);

  // Find nearby characters (within 5 tiles), same guild preferred
  const nearby = useMemo(() => {
    if (!myCharacter) return [];
    return allCharacters.filter(c =>
      c.id !== myCharacter.id &&
      c.type === "human" &&
      dist(c, myCharacter) <= 5
    ).slice(0, 4);
  }, [myCharacter?.x, myCharacter?.y, allCharacters]);

  // Party = explicitly invited members
  const addToParty = (char) => {
    if (partyMembers.find(m => m.id === char.id)) return;
    setPartyMembers(prev => [...prev, char].slice(0, 4));
  };
  const removeFromParty = (id) => setPartyMembers(prev => prev.filter(m => m.id !== id));

  // Sync party members with latest data
  const liveParty = partyMembers.map(pm => allCharacters.find(c => c.id === pm.id) || pm);

  if (!myCharacter) return null;

  return (
    <div className="absolute bottom-10 right-2 z-20 flex flex-col items-end gap-1.5">
      {/* Party member bars */}
      {liveParty.map(member => {
        const hpPct = Math.min(100, ((member.hp || 100) / (member.max_hp || 100)) * 100);
        const hpColor = hpPct > 60 ? "bg-green-500" : hpPct > 30 ? "bg-yellow-500" : "bg-red-600";
        const race = getRace(member.race || "human");
        const isNear = dist(member, myCharacter) <= 5;
        return (
          <div key={member.id}
            className={`flex items-center gap-2 bg-gray-900/90 border rounded-lg px-2 py-1.5 text-xs min-w-36
              ${isNear ? "border-amber-700/60" : "border-gray-700 opacity-60"}`}>
            <span className="text-base leading-none">{member.avatar_emoji || race.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold truncate leading-tight">{member.name}</div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-0.5">
                <div className={`${hpColor} h-1.5 rounded-full transition-all`} style={{ width: `${hpPct}%` }} />
              </div>
              <div className="text-gray-600 mt-0.5">{member.hp}/{member.max_hp} HP · {isNear ? "Nearby" : "Far"}</div>
            </div>
            <button onClick={() => removeFromParty(member.id)}
              className="text-gray-700 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Party button + nearby invite */}
      <div className="relative">
        <button
          onClick={() => setPartyOpen(v => !v)}
          className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border transition-colors
            ${nearby.length > 0
              ? "bg-amber-900/40 border-amber-700 text-amber-400 hover:bg-amber-900/60"
              : "bg-gray-900/80 border-gray-700 text-gray-500 hover:text-gray-300"}`}
        >
          <Users className="w-3 h-3" />
          {liveParty.length > 0 ? `Party (${liveParty.length})` : nearby.length > 0 ? `${nearby.length} Nearby` : "Party"}
        </button>

        {partyOpen && (
          <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-xl p-3 w-52 shadow-xl">
            <div className="text-xs font-bold text-gray-400 mb-2">Nearby Players</div>
            {nearby.length === 0 && (
              <div className="text-xs text-gray-600 text-center py-2">No players nearby</div>
            )}
            {nearby.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span>{c.avatar_emoji || getRace(c.race || "human").emoji}</span>
                  <div>
                    <div className="text-white text-xs font-semibold">{c.name}</div>
                    <div className="text-gray-600" style={{ fontSize: "10px" }}>Lv.{c.level} {c.base_class || c.class}</div>
                  </div>
                </div>
                {partyMembers.find(m => m.id === c.id) ? (
                  <span className="text-xs text-amber-400">✓ Party</span>
                ) : (
                  <button onClick={() => { addToParty(c); setPartyOpen(false); }}
                    className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded transition-colors">
                    Invite
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}