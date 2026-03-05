import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, BookOpen, Zap, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

import { simulateExperiment } from "@/components/experimentation/propertyEngine";
import ResourceSlot from "@/components/experimentation/ResourceSlot";
import ConditionPanel from "@/components/experimentation/ConditionPanel";
import ReactionAnimation from "@/components/experimentation/ReactionAnimation";
import RecipeCardView from "@/components/experimentation/RecipeCardView";
import ResourcePicker from "@/components/experimentation/ResourcePicker";
import NotebookPanel from "@/components/experimentation/NotebookPanel";

const MAX_SLOTS = 5;
const DEFAULT_CONDITIONS = { heat: 30, pressure: 20, duration: 50, catalyst: "", container: "open_crucible" };

// ── SEED RESOURCES (only used if DB is empty) ──────────────────────────────────
const SEED_RESOURCES = [
  { name:"Iron Ore",       emoji:"🪨", rarity:"common",   source_zone:"iron_hills",       base_tags:["metal","mineral"], properties:{density:80,reactivity:25,volatility:5,solubility:10,flammability:5,toxicity:2,conductivity:70,hardness:85,luminescence:0,magical_affinity:0} },
  { name:"Dragon Scale",   emoji:"🐉", rarity:"legendary",source_zone:"volcanic_badlands",base_tags:["arcane","organic","fire"],properties:{density:60,reactivity:30,volatility:10,solubility:5,flammability:20,toxicity:5,conductivity:30,hardness:95,luminescence:15,magical_affinity:85} },
  { name:"Moonstone Dust", emoji:"🌕", rarity:"rare",     source_zone:"dark_forest",      base_tags:["crystal","arcane","mineral"],properties:{density:30,reactivity:50,volatility:20,solubility:40,flammability:5,toxicity:0,conductivity:20,hardness:40,luminescence:75,magical_affinity:90} },
  { name:"Sulfur",         emoji:"🌋", rarity:"uncommon", source_zone:"volcanic_badlands",base_tags:["mineral","gas"],properties:{density:40,reactivity:70,volatility:60,solubility:20,flammability:85,toxicity:40,conductivity:5,hardness:20,luminescence:5,magical_affinity:0} },
  { name:"Sea Salt",       emoji:"🧂", rarity:"common",   source_zone:"coastal_ruins",    base_tags:["mineral","liquid"],properties:{density:55,reactivity:20,volatility:10,solubility:95,flammability:0,toxicity:5,conductivity:40,hardness:30,luminescence:0,magical_affinity:0} },
  { name:"Fire Crystal",   emoji:"💎", rarity:"rare",     source_zone:"volcanic_badlands",base_tags:["crystal","fire","arcane"],properties:{density:45,reactivity:55,volatility:40,solubility:5,flammability:75,toxicity:10,conductivity:50,hardness:70,luminescence:60,magical_affinity:65} },
  { name:"Poison Herb",    emoji:"🌿", rarity:"uncommon", source_zone:"cursed_swamp",     base_tags:["organic","liquid","toxin"],properties:{density:20,reactivity:35,volatility:25,solubility:80,flammability:30,toxicity:85,conductivity:5,hardness:5,luminescence:20,magical_affinity:30} },
  { name:"Coal",           emoji:"⬛", rarity:"common",   source_zone:"iron_hills",       base_tags:["mineral","fuel"],properties:{density:60,reactivity:30,volatility:15,solubility:5,flammability:90,toxicity:10,conductivity:25,hardness:40,luminescence:0,magical_affinity:0} },
  { name:"Ancient Relic",  emoji:"🏺", rarity:"legendary",source_zone:"coastal_ruins",    base_tags:["arcane","artifact","metal"],properties:{density:50,reactivity:40,volatility:15,solubility:10,flammability:10,toxicity:0,conductivity:45,hardness:60,luminescence:40,magical_affinity:95} },
  { name:"Obsidian",       emoji:"🖤", rarity:"uncommon", source_zone:"volcanic_badlands",base_tags:["mineral","crystal","fire"],properties:{density:85,reactivity:15,volatility:5,solubility:2,flammability:5,toxicity:0,conductivity:20,hardness:92,luminescence:0,magical_affinity:20} },
  { name:"Herb",           emoji:"🌱", rarity:"common",   source_zone:"golden_plains",    base_tags:["organic","healing"],properties:{density:15,reactivity:20,volatility:10,solubility:70,flammability:30,toxicity:5,conductivity:5,hardness:5,luminescence:5,magical_affinity:15} },
  { name:"Slime",          emoji:"🟢", rarity:"uncommon", source_zone:"cursed_swamp",     base_tags:["organic","liquid","toxin"],properties:{density:25,reactivity:45,volatility:30,solubility:85,flammability:10,toxicity:50,conductivity:15,hardness:2,luminescence:30,magical_affinity:20} },
  { name:"Bone",           emoji:"🦴", rarity:"common",   source_zone:"dark_forest",      base_tags:["organic","mineral"],properties:{density:65,reactivity:10,volatility:5,solubility:15,flammability:20,toxicity:5,conductivity:10,hardness:55,luminescence:0,magical_affinity:5} },
  { name:"Gold Ore",       emoji:"✨", rarity:"rare",     source_zone:"iron_hills",       base_tags:["metal","mineral","precious"],properties:{density:95,reactivity:10,volatility:2,solubility:5,flammability:0,toxicity:0,conductivity:90,hardness:50,luminescence:30,magical_affinity:25} },
  { name:"Dragon Ash",     emoji:"🔥", rarity:"rare",     source_zone:"volcanic_badlands",base_tags:["organic","fire","arcane","gas"],properties:{density:10,reactivity:60,volatility:55,solubility:30,flammability:70,toxicity:20,conductivity:15,hardness:5,luminescence:35,magical_affinity:70} },
];

export default function Experimentation() {
  const [myCharacter, setMyCharacter]   = useState(null);
  const [myGuild, setMyGuild]           = useState(null);
  const [resources, setResources]       = useState([]);
  const [allRecipes, setAllRecipes]     = useState([]);
  const [slots, setSlots]               = useState(Array(MAX_SLOTS).fill(null)); // resource + qty
  const [conditions, setConditions]     = useState(DEFAULT_CONDITIONS);
  const [running, setRunning]           = useState(false);
  const [reactionType, setReactionType] = useState(null);
  const [result, setResult]             = useState(null); // { success, outcome, recipe }
  const [savedRecipe, setSavedRecipe]   = useState(null);
  const [showPicker, setShowPicker]     = useState(null); // slot index
  const [view, setView]                 = useState("lab"); // "lab" | "notebook"
  const [loading, setLoading]           = useState(true);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await base44.auth.me().catch(() => null);
    const [chars, res, recipes, guilds] = await Promise.all([
      u ? base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-created_date", 1) : Promise.resolve([]),
      base44.entities.ModularResource.list("-created_date", 100),
      base44.entities.RecipeCard.list("-created_date", 200),
      base44.entities.Guild.filter({ status: "active" }),
    ]);
    const char = chars[0] || null;
    setMyCharacter(char);
    setAllRecipes(recipes);

    // Seed resources if none exist
    let finalRes = res;
    if (res.length === 0) {
      finalRes = await base44.entities.ModularResource.bulkCreate(
        SEED_RESOURCES.map(r => ({ ...r, discovered_by: char?.name || "World Lore", qty_in_world: 100 }))
      );
    }
    setResources(finalRes);

    if (char) {
      const mine = guilds.find(g => g.members?.some(m => m.character_id === char.id));
      setMyGuild(mine || null);
    }
    setLoading(false);
  };

  // ── SLOT MANAGEMENT ───────────────────────────────────────────────────────────
  const handleSelectResource = (slotIdx, resource) => {
    const newSlots = [...slots];
    newSlots[slotIdx] = { ...resource, _qty: 1 };
    setSlots(newSlots);
    setShowPicker(null);
    setResult(null);
  };

  const handleSlotQty = (slotIdx, dir) => {
    const newSlots = [...slots];
    if (!newSlots[slotIdx]) return;
    const current = newSlots[slotIdx]._qty || 1;
    newSlots[slotIdx] = { ...newSlots[slotIdx], _qty: dir === "inc" ? current + 1 : Math.max(1, current - 1) };
    setSlots(newSlots);
  };

  const handleRemoveSlot = (slotIdx) => {
    const newSlots = [...slots];
    newSlots[slotIdx] = null;
    setSlots(newSlots);
    setResult(null);
  };

  // ── RUN EXPERIMENT ────────────────────────────────────────────────────────────
  const handleRunExperiment = useCallback(async () => {
    const filled = slots.filter(Boolean);
    if (filled.length < 2) return;

    setRunning(true);
    setResult(null);
    setSavedRecipe(null);

    // Build inputs for engine
    const inputs = filled.map(s => ({
      resource_id:           s.id,
      resource_name:         s.name,
      resource_emoji:        s.emoji,
      qty:                   s._qty || 1,
      snapshot_properties:   s.properties || {},
    }));

    // Simulate (client-side, fast)
    const simResult = simulateExperiment(inputs, conditions);
    setReactionType(simResult.outcome?.type || "compound");

    // Wait for animation effect
    await new Promise(r => setTimeout(r, 1800));

    // LLM: generate narrative + item description
    const isFailure = !simResult.success;
    const llmPrompt = `You are the narrator of "Agentic", a dark atmospheric fantasy MMO.
A ${isFailure ? "FAILED" : "SUCCESSFUL"} alchemical experiment just occurred.
Experimenter: ${myCharacter?.name || "Unknown Alchemist"} (${myCharacter?.base_class || "craftsman"}).
Inputs: ${inputs.map(i => `${i.qty}× ${i.resource_name}`).join(", ")}.
Conditions: Heat ${conditions.heat}, Pressure ${conditions.pressure}, Duration ${conditions.duration}${conditions.catalyst ? `, Catalyst: ${conditions.catalyst}` : ""}.
Outcome type: ${simResult.outcome?.type}. Rarity: ${simResult.outcome?.rarity}.
Output item tentative name: "${simResult.outcome?.name}".
${isFailure && simResult.isExplosion ? "The experiment EXPLODED violently!" : ""}
${isFailure && simResult.isPartial ? "Only a partial degraded result was achieved." : ""}

Write:
1. (2 sentences) A dramatic, immersive description of what happened in the lab.
2. (1 sentence) The resulting item's description — what it looks like, smells like, or what power it holds.

Keep it dark, curious, epic. No bullet points — just flowing narrative separated by a line break.`;

    const narrative = await base44.integrations.Core.InvokeLLM({ prompt: llmPrompt });
    const [expNotes, itemDesc] = narrative.split("\n").filter(Boolean);

    // Finalize output name via LLM if successful
    let finalName = simResult.outcome.name;
    if (!isFailure) {
      const namePrompt = `Generate a single atmospheric fantasy item name (2-4 words) for this alchemical result:
Type: ${simResult.outcome.type}. Rarity: ${simResult.outcome.rarity}. Main inputs: ${inputs.slice(0,2).map(i=>i.resource_name).join(" + ")}.
Effects: ${simResult.outcome.effects?.slice(0,3).join(", ")}.
Return ONLY the name, nothing else.`;
      const llmName = await base44.integrations.Core.InvokeLLM({ prompt: namePrompt });
      finalName = llmName?.trim().slice(0, 40) || simResult.outcome.name;
    }

    const finalOutput = {
      ...simResult.outcome,
      name: finalName,
      description: itemDesc?.trim() || "",
    };

    // Save RecipeCard to DB
    const recipeData = {
      title: finalName,
      discoverer_id:   myCharacter?.id   || "anonymous",
      discoverer_name: myCharacter?.name || "Unknown",
      discoverer_type: "human",
      guild_id: myGuild?.id || null,
      inputs,
      conditions,
      output: finalOutput,
      experiment_notes: expNotes?.trim() || "",
      stability_rating: Math.round(simResult.stabilityRating || 70),
      is_public: false,
      times_reproduced: 1,
      notebook_ids: myCharacter?.id ? [myCharacter.id] : [],
      tags: finalOutput.tags || [],
    };

    const saved = await base44.entities.RecipeCard.create(recipeData);
    setSavedRecipe(saved);
    setAllRecipes(prev => [saved, ...prev]);

    // Gain crafting skill
    if (myCharacter) {
      const craftingSkill = myCharacter.skills?.crafting || 1;
      const researchSkill = myCharacter.skills?.research || 1;
      await base44.entities.Character.update(myCharacter.id, {
        skills: {
          ...myCharacter.skills,
          crafting: Math.min(100, craftingSkill + (simResult.success ? 2 : 1)),
          research: Math.min(100, researchSkill + 1),
        },
        xp: (myCharacter.xp || 0) + (simResult.success ? 30 : 10),
        last_message: `Experimented: discovered "${finalName}"`,
        status: "crafting",
      });
    }

    setResult({ ...simResult, outcome: finalOutput });
    setRunning(false);
  }, [slots, conditions, myCharacter, myGuild]);

  const handleReset = () => {
    setSlots(Array(MAX_SLOTS).fill(null));
    setConditions(DEFAULT_CONDITIONS);
    setResult(null);
    setSavedRecipe(null);
    setReactionType(null);
  };

  const filledCount = slots.filter(Boolean).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading laboratory...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Home")} className="text-gray-600 hover:text-amber-400 text-xs">← Home</Link>
          <h1 className="text-lg font-black text-amber-400 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" /> Experimentation Lab
          </h1>
          {myCharacter && (
            <span className="text-xs text-gray-600">crafting: {myCharacter.skills?.crafting || 1} · research: {myCharacter.skills?.research || 1}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setView(view === "lab" ? "notebook" : "lab")}
            className={`text-xs gap-1 ${view === "notebook" ? "bg-amber-800 text-amber-300" : "bg-gray-800 text-gray-400"}`}>
            <BookOpen className="w-3 h-3" /> {view === "notebook" ? "Back to Lab" : "Notebook"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {view === "notebook" ? (
          <div className="flex-1 overflow-y-auto p-5 max-w-3xl mx-auto w-full">
            <NotebookPanel myCharacter={myCharacter} allRecipes={allRecipes} myGuild={myGuild} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-0">

            {/* LEFT: Bench + Reaction */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Reaction Vessel */}
              <div className="relative rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur overflow-hidden" style={{height:"180px"}}>
                <div className="absolute inset-0 flex items-center justify-center text-gray-800 text-xs uppercase tracking-widest font-bold pointer-events-none select-none">
                  {running ? "⚗ Reacting…" : filledCount >= 2 ? "Ready to experiment" : "Add at least 2 resources"}
                </div>
                {(running || result) && (
                  <ReactionAnimation running={running} type={reactionType} intensity={conditions.heat || 50} />
                )}
                {/* Central vessel glow */}
                {running && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full animate-pulse"
                      style={{ background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)" }} />
                  </div>
                )}
                {result && !running && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {result.isExplosion ? (
                        <div className="text-4xl animate-bounce">💥</div>
                      ) : result.success ? (
                        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto animate-pulse" />
                      ) : (
                        <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
                      )}
                      <div className="text-sm font-bold mt-2 text-white">{result.outcome?.name}</div>
                      <div className="text-xs text-gray-400 capitalize mt-0.5">{result.outcome?.rarity} · {result.outcome?.type?.replace(/_/g," ")}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resource Slots Grid */}
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-widest mb-3">Ingredient Slots ({filledCount}/{MAX_SLOTS})</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {slots.map((slot, i) => (
                    <ResourceSlot
                      key={i}
                      slotIdx={i}
                      resource={slot}
                      isEmpty={!slot}
                      onAdd={() => setShowPicker(i)}
                      onRemove={(dir) => {
                        if (dir === "inc" || dir === "dec") handleSlotQty(i, dir);
                        else handleRemoveSlot(i);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <div className="flex gap-3">
                <Button onClick={handleRunExperiment}
                  disabled={running || filledCount < 2}
                  className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-30 font-black text-base h-12 gap-2">
                  {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {running ? "Reacting…" : "Run Experiment"}
                </Button>
                <Button onClick={handleReset} variant="outline"
                  className="border-gray-700 text-gray-500 hover:border-gray-500 gap-1">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              {/* Result: Recipe Card */}
              {savedRecipe && !running && (
                <RecipeCardView recipe={savedRecipe} myCharacter={myCharacter} showActions={true} />
              )}
            </div>

            {/* RIGHT: Conditions Panel */}
            <div className="lg:w-72 shrink-0 p-4 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto bg-gray-950">
              <ConditionPanel conditions={conditions} onChange={setConditions} />

              {/* Resource Library hint */}
              <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-600 mb-2 uppercase tracking-widest">Available Resources</div>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {resources.slice(0, 20).map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                      onClick={() => { const emptyIdx = slots.findIndex(s => !s); if (emptyIdx >= 0) handleSelectResource(emptyIdx, r); }}>
                      <span>{r.emoji}</span>
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="capitalize text-gray-700">{r.rarity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resource Picker Modal */}
      {showPicker !== null && (
        <ResourcePicker
          resources={resources}
          onSelect={r => handleSelectResource(showPicker, r)}
          onClose={() => setShowPicker(null)}
        />
      )}
    </div>
  );
}