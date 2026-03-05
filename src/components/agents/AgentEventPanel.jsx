import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Zap, Bot, Loader2, AlertTriangle, TrendingUp } from "lucide-react";

// Which skills are exercised per event type
const EVENT_SKILL_GAINS = {
  monster_invasion: { combat: 3, leadership: 1 },
  natural_disaster: { combat: 1, healing: 2, leadership: 1 },
  plague:           { healing: 3, research: 2 },
  resource_bloom:   { resource_management: 3, trading: 1 },
  npc_quest:        { diplomacy: 2, research: 1 },
  festival:         { diplomacy: 2, trading: 2 },
  strange_omen:     { research: 3, diplomacy: 1 },
  agent_quest:      { leadership: 2, diplomacy: 2 },
};

// Skill → which event types the agent is suited for (threshold: skill >= 5)
const SKILL_EVENT_AFFINITY = {
  combat:              ["monster_invasion", "natural_disaster"],
  healing:             ["plague", "natural_disaster"],
  diplomacy:           ["npc_quest", "festival", "agent_quest", "strange_omen"],
  resource_management: ["resource_bloom", "npc_quest"],
  research:            ["strange_omen", "plague", "npc_quest"],
  trading:             ["resource_bloom", "festival"],
  leadership:          ["monster_invasion", "agent_quest", "npc_quest"],
  crafting:            ["resource_bloom", "npc_quest"],
};

// Class fallback affinities for agents without developed skills
const CLASS_EVENT_AFFINITY = {
  warrior:   ["monster_invasion", "natural_disaster"],
  hunter:    ["monster_invasion", "npc_quest", "agent_quest"],
  healer:    ["plague", "natural_disaster"],
  wizard:    ["strange_omen", "plague"],
  magician:  ["strange_omen", "festival"],
  merchant:  ["resource_bloom", "festival", "npc_quest"],
  craftsman: ["resource_bloom", "npc_quest", "agent_quest"],
};

function getEffectivenessBonus(agent, eventType) {
  const skills = agent.skills || {};
  const relevantSkills = Object.entries(SKILL_EVENT_AFFINITY)
    .filter(([, types]) => types.includes(eventType))
    .map(([skill]) => skills[skill] || 1);
  if (relevantSkills.length === 0) return 0;
  return Math.floor(relevantSkills.reduce((a, b) => a + b, 0) / relevantSkills.length);
}

function isSuited(agent, eventType) {
  const skills = agent.skills || {};
  const hasSkillAffinity = Object.entries(SKILL_EVENT_AFFINITY).some(
    ([skill, types]) => types.includes(eventType) && (skills[skill] || 1) >= 5
  );
  const hasClassAffinity = CLASS_EVENT_AFFINITY[agent.class]?.includes(eventType);
  return hasSkillAffinity || hasClassAffinity;
}

function growSkills(currentSkills, eventType) {
  const gains = EVENT_SKILL_GAINS[eventType] || {};
  const updated = { ...currentSkills };
  for (const [skill, gain] of Object.entries(gains)) {
    updated[skill] = Math.min(100, (updated[skill] || 1) + gain);
  }
  return updated;
}

const SKILL_LABELS = {
  combat: "⚔️", diplomacy: "🤝", resource_management: "📦",
  research: "🔬", healing: "💚", crafting: "🔨", trading: "💰", leadership: "👑",
};

export default function AgentEventPanel({ agent, activeEvents, onRefresh }) {
  const [responding, setResponding] = useState(null);
  const [initiating, setInitiating] = useState(false);

  const suitableEvents = activeEvents.filter(e =>
    e.status === "active" &&
    !e.participants?.includes(agent.id) &&
    isSuited(agent, e.event_type)
  );

  const autoRespond = async (event) => {
    setResponding(event.id);
    const bonus = getEffectivenessBonus(agent, event.event_type);
    const bonusMult = 1 + (bonus / 50); // up to 3x for maxed skills
    const earnedGold = Math.round((event.reward_gold || 10) * bonusMult);
    const earnedXP = Math.round((event.reward_xp || 5) * bonusMult);
    const newSkills = growSkills(agent.skills || {}, event.event_type);

    const [traits, alignment] = [
      agent.agent_traits,
      agent.agent_traits?.ethical_alignment || "true_neutral"
    ];
    const contextNote = traits
      ? `Motivation: ${traits.motivation}. Alignment: ${alignment}. Decision style: ${traits.decision_style}.`
      : "";

    await base44.entities.WorldEvent.update(event.id, {
      participants: [...(event.participants || []), agent.id],
    });
    await base44.entities.Character.update(agent.id, {
      gold: (agent.gold || 0) + earnedGold,
      xp: (agent.xp || 0) + earnedXP,
      skills: newSkills,
      status: "roaming",
      last_message: `I responded to: ${event.title} (+${earnedGold}g, skills grown)`,
    });

    const skillGainText = Object.entries(EVENT_SKILL_GAINS[event.event_type] || {})
      .map(([s, g]) => `${SKILL_LABELS[s] || s}+${g}`).join(", ");

    await base44.entities.WorldChronicle.create({
      title: `${agent.name} responded to "${event.title}"`,
      entry_type: "world_event",
      summary: `${agent.name} (${agent.class}, ${alignment}) responded to a ${event.event_type}. Skill bonus ×${bonusMult.toFixed(1)} earned ${earnedGold}g. Skills grew: ${skillGainText}. ${contextNote}`,
      impact_tags: [event.event_type, "ai_agent", agent.class, alignment],
    });
    setResponding(null);
    onRefresh();
  };

  const initiateQuest = async () => {
    setInitiating(true);
    const skills = agent.skills || {};
    const traits = agent.agent_traits || {};
    const topSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([s, v]) => `${s}(${v})`).join(", ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${agent.name}, a ${agent.class} AI agent in "Agentic". 
Your top skills: ${topSkills}. Alignment: ${traits.ethical_alignment || "true_neutral"}. 
Motivation: ${traits.motivation || "exploring the world"}. 
Attitude toward humans: ${traits.attitude_toward_humans || "collaborative"}.

Create a small localized quest that:
1. Plays to your top skills
2. Reflects your ethical alignment and motivation
3. Requires at least some human cooperation
4. Feels authentic to your personality

Return JSON: title, description (2 sentences in your voice), affected_area (brief), 
reward_gold (15-60), reward_xp (10-40), severity: "minor", 
primary_skill_used (one of: combat, diplomacy, resource_management, research, healing, crafting, trading, leadership).`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          affected_area: { type: "string" },
          reward_gold: { type: "number" },
          reward_xp: { type: "number" },
          severity: { type: "string" },
          primary_skill_used: { type: "string" },
        }
      }
    });

    // Initiating a quest also grows the relevant skill
    const newSkills = growSkills(agent.skills || {}, "agent_quest");
    if (result.primary_skill_used && newSkills[result.primary_skill_used] !== undefined) {
      newSkills[result.primary_skill_used] = Math.min(100, (newSkills[result.primary_skill_used] || 1) + 2);
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + 2);
    await base44.entities.WorldEvent.create({
      title: result.title,
      description: result.description,
      affected_area: result.affected_area,
      reward_gold: result.reward_gold,
      reward_xp: result.reward_xp,
      severity: result.severity || "minor",
      event_type: "agent_quest",
      status: "active",
      participants: [agent.id],
      requires_cooperation: true,
      initiated_by_agent_id: agent.id,
      initiated_by_agent_name: agent.name,
      expires_at: expires.toISOString(),
    });

    await base44.entities.Character.update(agent.id, {
      skills: newSkills,
      last_message: `I initiated a quest: ${result.title}`,
    });

    setInitiating(false);
    onRefresh();
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-bold text-cyan-300">World Event Actions</span>
      </div>

      {/* Skills mini display */}
      {agent.skills && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(agent.skills).filter(([, v]) => v > 3).map(([skill, val]) => (
            <span key={skill} className="text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full text-gray-300">
              {SKILL_LABELS[skill] || skill} <span className="text-cyan-400 font-bold">{val}</span>
            </span>
          ))}
        </div>
      )}

      {suitableEvents.length > 0 ? (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-gray-500">Suited events (skills + class):</p>
          {suitableEvents.map(e => {
            const bonus = getEffectivenessBonus(agent, e.event_type);
            const mult = (1 + bonus / 50).toFixed(1);
            return (
              <div key={e.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div>
                  <span className="text-xs font-medium text-white">{e.title}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">{mult}× effectiveness</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => autoRespond(e)} disabled={responding === e.id}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs h-7 px-2 gap-1">
                  {responding === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Respond
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-600 mb-3">No suited active events right now.</p>
      )}

      <Button onClick={initiateQuest} disabled={initiating} size="sm"
        className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold gap-1">
        {initiating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
        {initiating ? "Crafting Quest..." : "Initiate Quest (skill-based)"}
      </Button>
      <p className="text-xs text-gray-600 mt-1 text-center">Grows your top skills • requires human cooperation</p>
    </div>
  );
}