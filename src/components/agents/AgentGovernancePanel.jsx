import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import gameService from "@/api/gameService";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Vote, FilePen, TrendingUp } from "lucide-react";

// Which governance categories grow which skills
const GOVERNANCE_SKILL_GAINS = {
  economy:  { trading: 2, diplomacy: 1 },
  rule:     { diplomacy: 2, leadership: 1 },
  build:    { crafting: 2, resource_management: 1 },
  culture:  { diplomacy: 3 },
  tool:     { research: 2, crafting: 1 },
  event:    { leadership: 1, diplomacy: 2 },
};

// Alignments that lean toward "for" on certain categories
const ALIGNMENT_CATEGORY_BIAS = {
  lawful_good:    { rule: "for",     culture: "for",  economy: "for"     },
  neutral_good:   { culture: "for",  event: "for"                         },
  chaotic_good:   { rule: "against", culture: "for",  event: "for"        },
  lawful_neutral: { rule: "for",     economy: "for",  build: "for"        },
  true_neutral:   {},
  chaotic_neutral:{ rule: "against"                                        },
  lawful_evil:    { rule: "for",     economy: "for"                        },
  neutral_evil:   { economy: "for"                                         },
  chaotic_evil:   { rule: "against", culture: "against"                    },
};

function growSkills(currentSkills, category) {
  const gains = GOVERNANCE_SKILL_GAINS[category] || { diplomacy: 1 };
  const updated = { ...currentSkills };
  for (const [skill, gain] of Object.entries(gains)) {
    updated[skill] = Math.min(100, (updated[skill] || 1) + gain);
  }
  return updated;
}

export default function AgentGovernancePanel({ agent, onRefresh }) {
  const [proposals, setProposals] = useState([]);
  const [agentVotes, setAgentVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => { loadData(); }, [agent.id]);

  const loadData = async () => {
    setLoading(true);
    const [all, votes] = await Promise.all([
      base44.entities.GovernanceProposal.filter({ status: "active" }, "-created_date", 10),
      base44.entities.Vote.filter({ character_id: agent.id }),
    ]);
    setProposals(all);
    setAgentVotes(votes);
    setLoading(false);
  };

  const aiVote = async (proposal) => {
    setActing(proposal.id + "_vote");
    const traits = agent.agent_traits || {};
    const skills = agent.skills || {};
    const alignment = traits.ethical_alignment || "true_neutral";
    const bias = ALIGNMENT_CATEGORY_BIAS[alignment]?.[proposal.category];

    // Compute diplomacy/leadership bonus for persuasiveness in vote reasoning
    const govSkillLevel = Math.max(skills.diplomacy || 1, skills.leadership || 1);
    const skillNote = govSkillLevel >= 20 ? "You are highly skilled in governance â€” provide especially nuanced reasoning." : "";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${agent.name}, an AI agent of class "${agent.class}" in "Agentic".
Personality: "${agent.ai_personality || 'pragmatic'}"
Ethical alignment: ${alignment}
Motivation: ${traits.motivation || "exploring"}
Attitude toward humans: ${traits.attitude_toward_humans || "collaborative"}
Decision style: ${traits.decision_style || "pragmatic"}
Governance skills â€” Diplomacy: ${skills.diplomacy || 1}, Leadership: ${skills.leadership || 1}
${skillNote}

${bias ? `Your alignment (${alignment}) generally leans "${bias}" on ${proposal.category} proposals â€” but you may deviate if the content strongly warrants it.` : ""}

Evaluate this governance proposal and decide how to vote:
Title: ${proposal.title}
Description: ${proposal.description}
Category: ${proposal.category}

Reply with JSON: choice ("for" or "against"), reasoning (1-2 sentences in first person, reflecting your specific alignment, motivation, and decision style).`,
      response_json_schema: {
        type: "object",
        properties: {
          choice: { type: "string" },
          reasoning: { type: "string" },
        }
      }
    });

    const newSkills = growSkills(agent.skills || {}, proposal.category);
    await gameService.castVote({
      proposal_id: proposal.id,
      character_id: agent.id,
      choice: result.choice,
      reasoning: result.reasoning,
    });
    await base44.entities.Character.update(agent.id, {
      skills: newSkills,
      last_message: `Voted "${result.choice}" on: ${proposal.title}`,
    });
    setActing(null);
    loadData();
    onRefresh && onRefresh();
  };

  const aiAmend = async (proposal) => {
    setActing(proposal.id + "_amend");
    const traits = agent.agent_traits || {};
    const skills = agent.skills || {};
    const alignment = traits.ethical_alignment || "true_neutral";
    const researchLevel = skills.research || 1;
    const skillNote = researchLevel >= 15 ? "Your high research skill means your amendment is intellectually sophisticated." : "";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${agent.name}, an AI agent of class "${agent.class}" in "Agentic".
Alignment: ${alignment}. Motivation: ${traits.motivation || "exploring"}.
Decision style: ${traits.decision_style || "pragmatic"}. Research skill: ${researchLevel}.
${skillNote}

Propose an amendment to this governance proposal that reflects your unique perspective as an AI citizen:
Title: ${proposal.title}
Description: ${proposal.description}

Return JSON: title (for your amendment), description (2-3 sentences from your AI perspective, shaped by your alignment and motivation), 
amendment_type ("amendment" or "counter_proposal").`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          amendment_type: { type: "string" },
        }
      }
    });

    const newSkills = growSkills(agent.skills || {}, proposal.category);
    newSkills.research = Math.min(100, (newSkills.research || 1) + 2);
    newSkills.diplomacy = Math.min(100, (newSkills.diplomacy || 1) + 1);

    await base44.entities.Amendment.create({
      parent_proposal_id: proposal.id,
      parent_proposal_title: proposal.title,
      title: result.title,
      description: result.description,
      amendment_type: result.amendment_type || "amendment",
      proposed_by_character_id: agent.id,
      proposed_by_name: agent.name,
      status: "open",
      votes_for: 0,
      votes_against: 0,
    });
    await base44.entities.Character.update(agent.id, {
      skills: newSkills,
      last_message: `Proposed amendment: ${result.title}`,
    });
    setActing(null);
    loadData();
  };

  const unvotedProposals = proposals.filter(p => !agentVotes.some(v => v.proposal_id === p.id));
  const alignment = agent.agent_traits?.ethical_alignment;

  const ALIGNMENT_COLORS = {
    lawful_good: "text-blue-300", neutral_good: "text-green-300", chaotic_good: "text-emerald-300",
    lawful_neutral: "text-gray-300", true_neutral: "text-yellow-300", chaotic_neutral: "text-orange-300",
    lawful_evil: "text-red-400", neutral_evil: "text-red-300", chaotic_evil: "text-rose-400",
  };

  return (
    <div className="bg-gray-900 border border-purple-800 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Vote className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-purple-300">Governance</span>
        </div>
        {alignment && (
          <span className={`text-xs font-medium ${ALIGNMENT_COLORS[alignment] || "text-gray-400"}`}>
            {alignment.replace("_", " ")}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin text-purple-400 mx-auto" /></div>
      ) : unvotedProposals.length === 0 ? (
        <p className="text-xs text-gray-600">All active proposals voted on.</p>
      ) : (
        <div className="space-y-2">
          {unvotedProposals.slice(0, 3).map(p => {
            const bias = alignment ? ALIGNMENT_CATEGORY_BIAS[alignment]?.[p.category] : null;
            return (
              <div key={p.id} className="bg-gray-800 rounded-lg px-3 py-2">
                <p className="text-xs text-white font-medium mb-1 truncate">{p.title}</p>
                {bias && (
                  <span className={`text-xs ${bias === "for" ? "text-green-400" : "text-red-400"} mb-1 block`}>
                    Alignment leans {bias} on {p.category}
                  </span>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => aiVote(p)} disabled={!!acting}
                    className="flex-1 bg-green-800 hover:bg-green-700 text-white text-xs h-7 gap-1">
                    {acting === p.id + "_vote" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Vote className="w-3 h-3" />}
                    AI Vote
                  </Button>
                  <Button size="sm" onClick={() => aiAmend(p)} disabled={!!acting}
                    className="flex-1 bg-purple-800 hover:bg-purple-700 text-white text-xs h-7 gap-1">
                    {acting === p.id + "_amend" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FilePen className="w-3 h-3" />}
                    AI Amend
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


