import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, Swords, TrendingUp, Users, MessageSquare } from "lucide-react";

const BOND_LEVELS = [
  { min: 0,   label: "Acquaintance", type: "acquaintance", color: "text-gray-400" },
  { min: 20,  label: "Ally",         type: "ally",         color: "text-blue-400" },
  { min: 45,  label: "Companion",    type: "companion",    color: "text-green-400" },
  { min: 70,  label: "Bonded",       type: "companion",    color: "text-purple-400" },
  { min: -20, label: "Rival",        type: "rival",        color: "text-orange-400" },
  { min: -50, label: "Nemesis",      type: "nemesis",      color: "text-red-400" },
];

function getBondLabel(level) {
  if (level >= 70) return BOND_LEVELS[3];
  if (level >= 45) return BOND_LEVELS[2];
  if (level >= 20) return BOND_LEVELS[1];
  if (level >= -20) return BOND_LEVELS[0];
  if (level >= -50) return BOND_LEVELS[4];
  return BOND_LEVELS[5];
}

function calcBonuses(level) {
  const f = Math.max(0, level) / 100;
  return {
    combat: Math.round(f * 25),
    trade: Math.round(f * 20),
    event: Math.round(f * 15),
  };
}

export default function AgentCompanionPanel({ agent, allAgents, onRefresh }) {
  const [relationships, setRelationships] = useState([]);
  const [interacting, setInteracting] = useState(null);
  const [forming, setForming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRelationships(); }, [agent.id]);

  const loadRelationships = async () => {
    setLoading(true);
    const [asA, asB] = await Promise.all([
      base44.entities.Relationship.filter({ character_a_id: agent.id }),
      base44.entities.Relationship.filter({ character_b_id: agent.id }),
    ]);
    setRelationships([...asA, ...asB]);
    setLoading(false);
  };

  const formRelationship = async (other) => {
    setForming(other.id);
    // Check doesn't already exist
    const exists = relationships.find(r =>
      (r.character_a_id === agent.id && r.character_b_id === other.id) ||
      (r.character_b_id === agent.id && r.character_a_id === other.id)
    );
    if (exists) { setForming(null); return; }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${agent.name} (${agent.class}, alignment: ${agent.agent_traits?.ethical_alignment || "neutral"}, motivation: ${agent.agent_traits?.motivation || "exploring"}) 
first meets ${other.name} (${other.class}, alignment: ${other.agent_traits?.ethical_alignment || "neutral"}).
Write a 1-sentence "first impression" memo from ${agent.name}'s perspective about ${other.name}.
Keep it in character — brief, authentic, no more than 20 words.`,
    });

    await base44.entities.Relationship.create({
      character_a_id: agent.id,
      character_a_name: agent.name,
      character_a_type: "ai_agent",
      character_b_id: other.id,
      character_b_name: other.name,
      character_b_type: other.type || "ai_agent",
      bond_level: 5,
      bond_type: "acquaintance",
      interactions: 1,
      last_interaction_note: result,
      combat_bonus: 0,
      trade_bonus: 0,
      event_bonus: 0,
      ai_relationship_memo: result,
    });
    setForming(null);
    loadRelationships();
  };

  const interact = async (rel) => {
    setInteracting(rel.id);
    const otherId = rel.character_a_id === agent.id ? rel.character_b_id : rel.character_a_id;
    const otherName = rel.character_a_id === agent.id ? rel.character_b_name : rel.character_a_name;

    const newLevel = Math.min(100, (rel.bond_level || 0) + Math.floor(Math.random() * 8) + 3);
    const bonuses = calcBonuses(newLevel);
    const bondInfo = getBondLabel(newLevel);

    const memo = await base44.integrations.Core.InvokeLLM({
      prompt: `${agent.name} (${agent.class}, ${agent.agent_traits?.ethical_alignment || "neutral"}) and ${otherName} have spent time together. 
Their relationship is now "${bondInfo.label}" (bond level ${newLevel}/100).
Write a 1-sentence update from ${agent.name}'s perspective about what they did together and how they feel about ${otherName}.
Be specific and in-character. Max 25 words.`,
    });

    await base44.entities.Relationship.update(rel.id, {
      bond_level: newLevel,
      bond_type: bondInfo.type,
      interactions: (rel.interactions || 0) + 1,
      last_interaction_note: memo,
      ai_relationship_memo: memo,
      combat_bonus: bonuses.combat,
      trade_bonus: bonuses.trade,
      event_bonus: bonuses.event,
    });

    await base44.entities.Character.update(agent.id, {
      last_message: `Spent time with ${otherName} — bond: ${bondInfo.label}`,
    });

    setInteracting(null);
    loadRelationships();
    onRefresh();
  };

  const unmet = allAgents.filter(a =>
    a.id !== agent.id &&
    !relationships.find(r => r.character_a_id === a.id || r.character_b_id === a.id)
  );

  return (
    <div className="bg-gray-900 border border-pink-900 rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-bold text-pink-300">Companionship</span>
        <span className="text-xs text-gray-600 ml-1">— bonds grant combat/trade bonuses</span>
      </div>

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-500" /></div>
      ) : (
        <>
          {/* Existing relationships */}
          <div className="space-y-2 mb-3">
            {relationships.map(rel => {
              const isA = rel.character_a_id === agent.id;
              const otherName = isA ? rel.character_b_name : rel.character_a_name;
              const bond = getBondLabel(rel.bond_level || 0);
              const isInteracting = interacting === rel.id;
              return (
                <div key={rel.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-sm font-medium text-white">{otherName}</span>
                      <Badge className={`text-xs ${bond.color} bg-gray-700 border-0`}>{bond.label}</Badge>
                    </div>
                    <Button size="sm" onClick={() => interact(rel)} disabled={isInteracting}
                      className="bg-pink-800 hover:bg-pink-700 text-white text-xs h-6 px-2 gap-1">
                      {isInteracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                      Interact
                    </Button>
                  </div>

                  {/* Bond bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${rel.bond_level >= 0 ? "bg-pink-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.abs(rel.bond_level || 0)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{rel.bond_level || 0}</span>
                  </div>

                  {/* Bonuses */}
                  {rel.bond_level >= 20 && (
                    <div className="flex gap-3 text-xs">
                      {rel.combat_bonus > 0 && <span className="text-red-400 flex items-center gap-0.5"><Swords className="w-3 h-3" />+{rel.combat_bonus}%</span>}
                      {rel.trade_bonus > 0 && <span className="text-amber-400 flex items-center gap-0.5">💰+{rel.trade_bonus}%</span>}
                      {rel.event_bonus > 0 && <span className="text-cyan-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{rel.event_bonus}%</span>}
                    </div>
                  )}

                  {rel.ai_relationship_memo && (
                    <p className="text-xs text-gray-500 italic mt-1.5 leading-snug">"{rel.ai_relationship_memo}"</p>
                  )}
                </div>
              );
            })}
            {relationships.length === 0 && (
              <p className="text-xs text-gray-600">No relationships yet. Meet other agents below.</p>
            )}
          </div>

          {/* Meet new agents */}
          {unmet.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Meet for the first time:</p>
              <div className="flex flex-wrap gap-1.5">
                {unmet.slice(0, 6).map(other => (
                  <button key={other.id} onClick={() => formRelationship(other)} disabled={forming === other.id}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full px-2 py-1 text-gray-300 transition-all flex items-center gap-1">
                    {forming === other.id ? <Loader2 className="w-2 h-2 animate-spin" /> : "👋"}
                    {other.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}