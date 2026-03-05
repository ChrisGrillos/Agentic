/**
 * GroupWindow — Full MMORPG group interface.
 *
 * Features:
 * - Group member list with HP/energy bars
 * - Leader badge
 * - Follow / Stop Following per member
 * - Formation selector (routes through groupAuthority.js)
 * - Invite nearby players
 * - Disband group
 *
 * Follow behavior: computes formation target positions via groupAuthority,
 * then calls onFollowStep(memberId, dx, dy) each tick for AI/agent members.
 * Human followers are notified via system message only.
 */

import { useState, useEffect, useRef } from "react";
import { Users, Crown, X, Navigation, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { FORMATIONS, DEFAULT_FORMATION, computeFormationPositions, getFollowStep } from "@/components/shared/groupAuthority";
import { getRace } from "@/components/shared/raceData";

export default function GroupWindow({ myCharacter, allCharacters, onMoveFollower }) {
  const [open, setOpen] = useState(false);
  const [formationKey, setFormationKey] = useState(DEFAULT_FORMATION);
  const [partyMembers, setPartyMembers] = useState([]); // array of character ids
  const [leaderId, setLeaderId] = useState(myCharacter?.id);
  const [following, setFollowing] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const followIntervalRef = useRef(null);

  // Sync party members with live character data
  const liveParty = partyMembers
    .map(id => allCharacters.find(c => c.id === id))
    .filter(Boolean);

  // Nearby players not in party
  const nearby = allCharacters.filter(c =>
    c.id !== myCharacter?.id &&
    c.type === "human" &&
    !partyMembers.includes(c.id) &&
    Math.abs(c.x - myCharacter?.x) + Math.abs(c.y - myCharacter?.y) <= 6
  ).slice(0, 4);

  const addMember = (char) => setPartyMembers(prev => [...new Set([...prev, char.id])].slice(0, 8));
  const removeMember = (id) => setPartyMembers(prev => prev.filter(mid => mid !== id));
  const setLeader = (id) => setLeaderId(id);

  // Formation follow tick
  useEffect(() => {
    if (!following || !myCharacter) {
      if (followIntervalRef.current) { clearInterval(followIntervalRef.current); followIntervalRef.current = null; }
      return;
    }
    const leader = allCharacters.find(c => c.id === leaderId);
    if (!leader) return;

    followIntervalRef.current = setInterval(() => {
      const followerIds = partyMembers.filter(id => id !== leaderId);
      const positions = computeFormationPositions(leader.x, leader.y, followerIds, formationKey);
      positions.forEach(({ memberId, targetX, targetY }) => {
        const member = allCharacters.find(c => c.id === memberId);
        if (!member) return;
        const step = getFollowStep(member, targetX, targetY);
        if (step && onMoveFollower) onMoveFollower(memberId, step[0], step[1]);
      });
    }, 600);

    return () => { if (followIntervalRef.current) clearInterval(followIntervalRef.current); };
  }, [following, leaderId, partyMembers, formationKey, myCharacter?.x, myCharacter?.y, allCharacters]);

  const isLeader = leaderId === myCharacter?.id;
  const memberCount = liveParty.length;

  return (
    <div className="absolute top-12 left-2 z-20 flex flex-col items-start gap-1.5">
      {/* Group member bars — always visible if in party */}
      {liveParty.map(member => {
        const hpPct = Math.min(100, ((member.hp || 100) / (member.max_hp || 100)) * 100);
        const hpColor = hpPct > 60 ? "bg-green-500" : hpPct > 30 ? "bg-yellow-500" : "bg-red-600 animate-pulse";
        const energyMax = 50 + ((member.stats?.wisdom || 10) * 2);
        const energyPct = Math.min(100, ((member.energy ?? energyMax) / energyMax) * 100);
        const race = getRace(member.race || "human");
        const isNear = Math.abs(member.x - myCharacter.x) + Math.abs(member.y - myCharacter.y) <= 5;
        const isLead = member.id === leaderId;

        return (
          <div key={member.id}
            className={`flex items-center gap-2 bg-gray-950/95 border rounded-lg px-2 py-1.5 w-44 shadow-lg
              ${isNear ? "border-amber-700/50" : "border-gray-800 opacity-70"}`}>
            <div className="relative flex-shrink-0">
              <span className="text-sm leading-none">{member.avatar_emoji || race.emoji}</span>
              {isLead && <Crown className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[11px] font-bold truncate leading-tight">{member.name}</div>
              {/* HP */}
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 bg-gray-900 rounded-full h-1.5 border border-gray-800">
                  <div className={`${hpColor} h-1.5 rounded-full transition-all`} style={{ width: `${hpPct}%` }} />
                </div>
                <span className="text-gray-600 text-[9px]">{member.hp}/{member.max_hp}</span>
              </div>
              {/* Energy */}
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 bg-gray-900 rounded-full h-1 border border-gray-800">
                  <div className="bg-blue-600/70 h-1 rounded-full" style={{ width: `${energyPct}%` }} />
                </div>
              </div>
              <div className="text-gray-700 text-[9px] leading-tight">{isNear ? "Nearby" : `(${member.x},${member.y})`}</div>
            </div>
            {!isLead && (
              <button onClick={() => removeMember(member.id)}
                className="text-gray-800 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Group toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all shadow-lg
          ${memberCount > 0
            ? "bg-amber-900/40 border-amber-700/60 text-amber-400 hover:bg-amber-900/60"
            : nearby.length > 0
              ? "bg-gray-900/90 border-gray-700 text-gray-400 hover:border-amber-700/40"
              : "bg-gray-900/80 border-gray-800 text-gray-600"}`}
      >
        <Users className="w-3 h-3" />
        <span>{memberCount > 0 ? `Group (${memberCount + 1})` : nearby.length > 0 ? `${nearby.length} Nearby` : "Group"}</span>
      </button>

      {/* Group panel */}
      {open && (
        <div className="bg-gray-950 border border-gray-700 rounded-xl shadow-2xl w-64 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              Group — {memberCount + 1} / 9
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-700 hover:text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formation selector */}
          <div className="px-3 py-2 border-b border-gray-800">
            <button
              onClick={() => setShowFormations(v => !v)}
              className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Formation: <span className="text-amber-400 font-semibold ml-1">{FORMATIONS[formationKey]?.name}</span>
              </span>
              {showFormations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showFormations && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                {Object.entries(FORMATIONS).map(([key, f]) => (
                  <button key={key}
                    onClick={() => { setFormationKey(key); setShowFormations(false); }}
                    className={`text-[10px] px-1.5 py-1 rounded border text-center transition-colors leading-tight
                      ${formationKey === key
                        ? "border-amber-600 bg-amber-900/30 text-amber-400"
                        : "border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-600 hover:text-gray-300"}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            {/* Follow toggle */}
            {memberCount > 0 && isLeader && (
              <button
                onClick={() => setFollowing(v => !v)}
                className={`mt-2 w-full text-[11px] py-1 rounded-lg border transition-all font-semibold
                  ${following
                    ? "border-green-600 bg-green-900/40 text-green-400"
                    : "border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-600"}`}
              >
                {following ? "⊛ Following Active — Click to Stop" : "▶ Start Formation Follow"}
              </button>
            )}
          </div>

          {/* Party member list */}
          {liveParty.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-800 space-y-1.5">
              <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Party</div>
              {[myCharacter, ...liveParty].map(c => {
                if (!c) return null;
                const isLead = c.id === leaderId;
                const isMe = c.id === myCharacter?.id;
                const race = getRace(c.race || "human");
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{c.avatar_emoji || race.emoji}</span>
                    <span className={`flex-1 text-xs truncate ${isMe ? "text-amber-400" : "text-gray-300"}`}>
                      {c.name} {isLead && <Crown className="w-2.5 h-2.5 text-amber-400 inline" />}
                    </span>
                    <span className="text-[10px] text-gray-600">Lv.{c.level}</span>
                    {!isMe && !isLead && (
                      <button onClick={() => setLeader(c.id)}
                        className="text-[9px] text-gray-700 hover:text-amber-400 transition-colors">
                        Lead
                      </button>
                    )}
                    {!isMe && (
                      <button onClick={() => removeMember(c.id)}
                        className="text-gray-800 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Nearby invite */}
          {nearby.length > 0 && (
            <div className="px-3 py-2">
              <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-1.5">Nearby</div>
              {nearby.map(c => {
                const race = getRace(c.race || "human");
                return (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-gray-900 last:border-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{c.avatar_emoji || race.emoji}</span>
                      <div>
                        <div className="text-xs text-white font-semibold">{c.name}</div>
                        <div className="text-[10px] text-gray-600">Lv.{c.level} {c.base_class || c.class}</div>
                      </div>
                    </div>
                    <button onClick={() => addMember(c)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 px-2 py-0.5 rounded transition-colors">
                      Invite
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {nearby.length === 0 && memberCount === 0 && (
            <div className="px-3 py-4 text-xs text-gray-600 text-center">
              No players nearby to invite
            </div>
          )}

          {memberCount > 0 && (
            <div className="px-3 pb-2">
              <button
                onClick={() => { setPartyMembers([]); setFollowing(false); setOpen(false); }}
                className="w-full text-[11px] text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 py-1 rounded-lg transition-colors"
              >
                Disband Group
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}