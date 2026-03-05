import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, BookOpen } from "lucide-react";
import { simulateExperiment, agentExperimentScore, CONDITION_PRESETS } from "./propertyEngine";
import RecipeCardView from "./RecipeCardView";

export default function AgentExperimentPanel({ agent, onRefresh }) {
  const [running, setRunning]   = useState(false);
  const [lastRecipe, setLastRecipe] = useState(null);
  const [log, setLog]           = useState([]);

  const addLog = msg => setLog(prev => [msg, ...prev.slice(0, 9)]);

  const handleAutoExperiment = async () => {
    setRunning(true);

    // Fetch resources
    const allRes = await base44.entities.ModularResource.list("-created_date", 100);
    if (allRes.length < 2) { addLog("❌ Not enough resources in the world."); setRunning(false); return; }

    // Agent picks 2-3 resources by affinity
    const motivation = (agent.agent_traits?.motivation || "").toLowerCase();
    const alignment  = agent.agent_traits?.ethical_alignment || "true_neutral";

    // Personality-driven resource preference
    let preferred = [...allRes].sort(() => Math.random() - 0.5);
    if (motivation.includes("power") || motivation.includes("war"))     preferred.sort((a,b) => (b.properties?.reactivity||0)-(a.properties?.reactivity||0));
    else if (motivation.includes("heal") || alignment.includes("good")) preferred.sort((a,b) => (b.properties?.solubility||0)-(a.properties?.solubility||0));
    else if (motivation.includes("magic") || agent.base_class === "wizard") preferred.sort((a,b) => (b.properties?.magical_affinity||0)-(a.properties?.magical_affinity||0));
    else if (agent.base_class === "craftsman")                           preferred.sort((a,b) => (b.properties?.hardness||0)-(a.properties?.hardness||0));

    const picked = preferred.slice(0, 2 + Math.floor(Math.random() * 2));
    const inputs = picked.map(r => ({
      resource_id: r.id, resource_name: r.name, resource_emoji: r.emoji,
      qty: 1 + Math.floor(Math.random() * 2),
      snapshot_properties: r.properties || {},
    }));

    // Pick condition preset by class/motivation
    let preset = CONDITION_PRESETS[Math.floor(Math.random() * CONDITION_PRESETS.length)];
    if (agent.base_class === "wizard" || motivation.includes("magic")) preset = CONDITION_PRESETS[3]; // Arcane Bath
    if (agent.base_class === "craftsman" || motivation.includes("forge")) preset = CONDITION_PRESETS[2]; // High Forge
    if (alignment.includes("chaotic")) preset = CONDITION_PRESETS[5]; // Rapid Boil (risky)

    const conditions = { heat: preset.heat, pressure: preset.pressure, duration: preset.duration, catalyst: preset.catalyst, container: "open_crucible" };
    const simResult  = simulateExperiment(inputs, conditions);

    // LLM narrative
    const narrative = await base44.integrations.Core.InvokeLLM({
      prompt: `${agent.name} is a ${agent.base_class} AI agent in "Agentic" with motivation "${agent.agent_traits?.motivation || "curiosity"}".
They just ran an experiment combining: ${inputs.map(i=>`${i.qty}× ${i.resource_name}`).join(", ")} using preset "${preset.name}".
The result was ${simResult.success ? "a success" : "a failure"}: "${simResult.outcome?.name}" (${simResult.outcome?.type}, ${simResult.outcome?.rarity}).
Write 1-2 sentences in-character — what the agent observed and felt. Keep it atmospheric and brief.`
    });

    const finalOutput = { ...simResult.outcome, description: narrative?.trim() || "" };

    const saved = await base44.entities.RecipeCard.create({
      title: simResult.outcome?.name,
      discoverer_id: agent.id,
      discoverer_name: agent.name,
      discoverer_type: "ai_agent",
      inputs, conditions,
      output: finalOutput,
      experiment_notes: narrative?.trim() || "",
      stability_rating: Math.round(simResult.stabilityRating || 60),
      is_public: false,
      times_reproduced: 1,
      notebook_ids: [agent.id],
      tags: finalOutput.tags || [],
    });

    // Gain skill
    const craftSkill  = agent.skills?.crafting  || 1;
    const resSkill    = agent.skills?.research   || 1;
    await base44.entities.Character.update(agent.id, {
      skills: { ...(agent.skills||{}), crafting: Math.min(100, craftSkill + (simResult.success?2:1)), research: Math.min(100, resSkill + 1) },
      xp:    (agent.xp||0) + (simResult.success?25:8),
      last_message: `Discovered: ${simResult.outcome?.name} via experimentation`,
      status: "crafting",
    });

    setLastRecipe(saved);
    addLog(`${simResult.success?"✅":"⚠️"} ${agent.name} discovered "${simResult.outcome?.name}" (${simResult.outcome?.rarity})`);
    setRunning(false);
    onRefresh();
  };

  return (
    <div className="bg-gray-900 border border-orange-900 rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-bold text-orange-300">Autonomous Experimentation</span>
        <div className="ml-auto text-xs text-gray-600">
          craft: <span className="text-orange-400">{agent.skills?.crafting||1}</span>
          {" · "}research: <span className="text-amber-400">{agent.skills?.research||1}</span>
        </div>
      </div>

      <Button size="sm" onClick={handleAutoExperiment} disabled={running}
        className="w-full bg-orange-800 hover:bg-orange-700 text-xs h-8 gap-1 mb-3">
        {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
        {running ? "Experimenting…" : "Auto-Experiment (by personality)"}
      </Button>

      {lastRecipe && (
        <div className="mb-2">
          <RecipeCardView recipe={lastRecipe} myCharacter={null} showActions={false} />
        </div>
      )}

      {log.length > 0 && (
        <div className="space-y-0.5 max-h-20 overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className={`text-xs ${l.startsWith("✅") ? "text-green-400" : l.startsWith("❌") ? "text-red-400" : "text-amber-300"}`}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}