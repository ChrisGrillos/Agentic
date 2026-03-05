import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map, Sword, ShoppingBag, MessageSquare, ChevronRight, Star } from "lucide-react";

const STAGE_ICONS = {
  exploration: <Map className="w-3 h-3" />,
  combat:      <Sword className="w-3 h-3" />,
  trading:     <ShoppingBag className="w-3 h-3" />,
  diplomacy:   <MessageSquare className="w-3 h-3" />,
};

const STAGE_COLORS = {
  exploration: "text-green-400 border-green-800",
  combat:      "text-red-400 border-red-800",
  trading:     "text-amber-400 border-amber-800",
  diplomacy:   "text-purple-400 border-purple-800",
};

function calcStageSuccess(agent, stage) {
  const skill = (agent.skills || {})[stage.required_skill] || 1;
  const threshold = stage.skill_threshold || 5;
  // Base 50% + skill advantage
  const chance = Math.min(0.95, 0.45 + (skill / threshold) * 0.35);
  return { chance, skill, threshold };
}

export default function AgentQuestPanel({ agent, onRefresh }) {
  const [quests, setQuests] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [advancing, setAdvancing] = useState(null);
  const [expandedQuest, setExpandedQuest] = useState(null);

  useEffect(() => { loadQuests(); }, [agent.id]);

  const loadQuests = async () => {
    const q = await base44.entities.AgentQuest.filter({ agent_id: agent.id, status: "active" }, "-created_date", 5);
    setQuests(q);
  };

  const generateQuest = async () => {
    setGenerating(true);
    const skills = agent.skills || {};
    const traits = agent.agent_traits || {};
    const topSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, v]) => `${s}(${v})`).join(", ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${agent.name}, a ${agent.class} in "Agentic" MMO. 
Alignment: ${traits.ethical_alignment || "true_neutral"}. Motivation: ${traits.motivation || "exploring the world"}.
Top skills: ${topSkills}.

Design a multi-stage quest with EXACTLY 3-4 stages mixing: exploration, combat, trading, diplomacy.
Each stage should logically flow from the last. Make it personal to ${agent.name}'s personality and skills.

Return JSON with:
- title: quest name
- description: 2-sentence flavor text in first person
- reward_gold: number 40-120
- reward_xp: number 30-80
- reward_skills: object mapping 1-2 skill names to numbers 3-6 (the skills that grow most)
- stages: array of objects each with:
  - stage_number: 1-indexed
  - title: short stage name
  - description: 1 sentence describing the challenge
  - type: one of "exploration" | "combat" | "trading" | "diplomacy"
  - required_skill: one of combat|diplomacy|resource_management|research|healing|crafting|trading|leadership
  - skill_threshold: number 3-15 (how much skill is needed to easily pass)`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          reward_gold: { type: "number" },
          reward_xp: { type: "number" },
          reward_skills: { type: "object" },
          stages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stage_number: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string" },
                required_skill: { type: "string" },
                skill_threshold: { type: "number" }
              }
            }
          }
        }
      }
    });

    const stages = (result.stages || []).map(s => ({ ...s, status: "pending" }));
    if (stages.length > 0) stages[0].status = "active";

    await base44.entities.AgentQuest.create({
      agent_id: agent.id,
      agent_name: agent.name,
      title: result.title,
      description: result.description,
      stages,
      current_stage: 0,
      status: "active",
      reward_gold: result.reward_gold || 60,
      reward_xp: result.reward_xp || 40,
      reward_skills: result.reward_skills || {},
      companion_ids: [],
      log: [`Quest begun: ${result.title}`],
    });

    await base44.entities.Character.update(agent.id, {
      last_message: `Started multi-stage quest: ${result.title}`,
    });

    setGenerating(false);
    loadQuests();
    onRefresh();
  };

  const advanceStage = async (quest) => {
    setAdvancing(quest.id);
    const stages = [...(quest.stages || [])];
    const idx = quest.current_stage || 0;
    const stage = stages[idx];
    if (!stage) { setAdvancing(null); return; }

    const { chance, skill } = calcStageSuccess(agent, stage);
    const success = Math.random() < chance;
    const outcomeText = success
      ? `✅ Success! ${agent.name} used ${stage.required_skill}(${skill}) to overcome: ${stage.title}`
      : `❌ Partial fail — ${agent.name} struggled at ${stage.title} (${stage.required_skill} too low)`;

    stages[idx] = { ...stage, status: success ? "completed" : "failed", outcome_text: outcomeText };

    const nextIdx = idx + 1;
    let questStatus = "active";
    let newLog = [...(quest.log || []), outcomeText];

    if (nextIdx < stages.length) {
      stages[nextIdx] = { ...stages[nextIdx], status: "active" };
    } else {
      questStatus = "completed";
      newLog.push(`🏆 Quest complete: ${quest.title}`);
    }

    // Skill growth per stage attempt
    const skillGain = success ? 3 : 1;
    const newSkills = { ...(agent.skills || {}) };
    if (stage.required_skill) {
      newSkills[stage.required_skill] = Math.min(100, (newSkills[stage.required_skill] || 1) + skillGain);
    }

    let goldGain = 0, xpGain = 0;
    if (questStatus === "completed") {
      goldGain = quest.reward_gold || 60;
      xpGain = quest.reward_xp || 40;
      // Apply reward_skills
      for (const [sk, amt] of Object.entries(quest.reward_skills || {})) {
        newSkills[sk] = Math.min(100, (newSkills[sk] || 1) + amt);
      }
      newLog.push(`+${goldGain}g +${xpGain}xp earned!`);
    }

    await Promise.all([
      base44.entities.AgentQuest.update(quest.id, {
        stages,
        current_stage: nextIdx,
        status: questStatus,
        log: newLog,
      }),
      base44.entities.Character.update(agent.id, {
        skills: newSkills,
        gold: (agent.gold || 0) + goldGain,
        xp: (agent.xp || 0) + xpGain,
        last_message: questStatus === "completed" ? `Completed quest: ${quest.title}!` : `Quest stage: ${stage.title} — ${success ? "success" : "partial fail"}`,
      }),
    ]);

    setAdvancing(null);
    loadQuests();
    onRefresh();
  };

  const activeQuests = quests.filter(q => q.status === "active");

  return (
    <div className="bg-gray-900 border border-purple-900 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-purple-300">Multi-Stage Quests</span>
        </div>
        <Button size="sm" onClick={generateQuest} disabled={generating || activeQuests.length >= 2}
          className="bg-purple-700 hover:bg-purple-600 text-white text-xs h-7 px-2 gap-1">
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
          {generating ? "Generating..." : "New Quest"}
        </Button>
      </div>

      {activeQuests.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-3">No active quests. Generate one!</p>
      )}

      <div className="space-y-3">
        {activeQuests.map(quest => {
          const currentStage = (quest.stages || [])[quest.current_stage || 0];
          const isExpanded = expandedQuest === quest.id;
          const progress = (quest.stages || []).filter(s => s.status === "completed").length;
          const total = (quest.stages || []).length;

          return (
            <div key={quest.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <button className="w-full text-left" onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{quest.title}</span>
                  <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${(progress / Math.max(total, 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{progress}/{total}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400 italic">{quest.description}</p>
                  
                  {/* Stages */}
                  <div className="space-y-1.5">
                    {(quest.stages || []).map((stage, i) => {
                      const colors = STAGE_COLORS[stage.type] || "text-gray-400 border-gray-700";
                      return (
                        <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-900 ${colors}`}>
                          <span className="shrink-0">{STAGE_ICONS[stage.type] || <Map className="w-3 h-3" />}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{stage.title}</div>
                            <div className="text-xs text-gray-500 truncate">{stage.description}</div>
                            {stage.outcome_text && (
                              <div className={`text-xs mt-0.5 ${stage.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                                {stage.outcome_text}
                              </div>
                            )}
                          </div>
                          <Badge className={`text-xs shrink-0 ${
                            stage.status === "completed" ? "bg-green-900 text-green-300" :
                            stage.status === "active" ? "bg-purple-900 text-purple-300" :
                            stage.status === "failed" ? "bg-red-900 text-red-300" :
                            "bg-gray-800 text-gray-500"}`}>
                            {stage.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {currentStage && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">
                        Current: <span className="text-white">{currentStage.title}</span>
                        {" — "}needs <span className="text-cyan-400">{currentStage.required_skill}</span>
                        <span className="text-gray-600"> (yours: {(agent.skills || {})[currentStage.required_skill] || 1}/{currentStage.skill_threshold})</span>
                      </div>
                      <Button size="sm" onClick={() => advanceStage(quest)} disabled={advancing === quest.id}
                        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs h-7 gap-1">
                        {advancing === quest.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                        Attempt Stage
                      </Button>
                    </div>
                  )}

                  {/* Log */}
                  {quest.log?.length > 0 && (
                    <div className="mt-2 max-h-20 overflow-y-auto space-y-0.5">
                      {quest.log.slice(-5).map((line, i) => (
                        <div key={i} className={`text-xs ${line.startsWith("✅") ? "text-green-400" : line.startsWith("❌") ? "text-red-400" : line.startsWith("🏆") ? "text-amber-400" : "text-gray-500"}`}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}