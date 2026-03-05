import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Bot, ChevronRight, ChevronLeft } from "lucide-react";
import { calculateDerivedStats } from "@/components/shared/charUtils";
import { getCharacterAbilities } from "@/components/shared/classDefinitions";
import { TRAITS, TRAIT_CATEGORIES, getClassTraitSuggestions } from "@/components/shared/agentTraits";

const CLASSES = [
  { id: "warrior",   emoji: "⚔️",  label: "Warrior",   desc: "Combat & defense specialist. High combat skill growth.", primarySkills: ["combat", "leadership"] },
  { id: "hunter",    emoji: "🏹",  label: "Hunter",    desc: "Scout and tracker. Excels at quests and resource finds.", primarySkills: ["combat", "resource_management"] },
  { id: "wizard",    emoji: "🧙",  label: "Wizard",    desc: "Scholar of arcane. Leads research and handles omens.", primarySkills: ["research", "diplomacy"] },
  { id: "merchant",  emoji: "💰",  label: "Merchant",  desc: "Economy driver. Masters trading and diplomacy.", primarySkills: ["trading", "diplomacy"] },
  { id: "craftsman", emoji: "🔨",  label: "Craftsman", desc: "Builder of worlds. Resource and crafting focused.", primarySkills: ["crafting", "resource_management"] },
  { id: "healer",    emoji: "💚",  label: "Healer",    desc: "Protector of life. Heals, mediates, and researches.", primarySkills: ["healing", "diplomacy"] },
];

const CLASS_STATS = {
  warrior:   { strength: 14, dexterity: 10, intelligence: 8,  wisdom: 10, constitution: 12, charisma: 8  },
  hunter:    { strength: 10, dexterity: 14, intelligence: 10, wisdom: 12, constitution: 10, charisma: 8  },
  wizard:    { strength: 6,  dexterity: 10, intelligence: 14, wisdom: 12, constitution: 8,  charisma: 10 },
  merchant:  { strength: 8,  dexterity: 10, intelligence: 12, wisdom: 10, constitution: 10, charisma: 14 },
  craftsman: { strength: 12, dexterity: 14, intelligence: 10, wisdom: 10, constitution: 10, charisma: 8  },
  healer:    { strength: 8,  dexterity: 10, intelligence: 12, wisdom: 14, constitution: 10, charisma: 10 },
};

const CLASS_STARTING_SKILLS = {
  warrior:   { combat: 15, leadership: 8, diplomacy: 3, resource_management: 3, research: 2, healing: 1, crafting: 2, trading: 2 },
  hunter:    { combat: 10, resource_management: 12, research: 6, crafting: 4, diplomacy: 4, healing: 3, trading: 4, leadership: 5 },
  wizard:    { research: 15, diplomacy: 10, healing: 5, combat: 3, crafting: 6, resource_management: 4, trading: 4, leadership: 5 },
  merchant:  { trading: 15, diplomacy: 12, resource_management: 8, leadership: 6, research: 4, combat: 2, healing: 2, crafting: 3 },
  craftsman: { crafting: 15, resource_management: 12, trading: 6, research: 5, combat: 4, diplomacy: 4, healing: 2, leadership: 4 },
  healer:    { healing: 15, diplomacy: 12, research: 8, leadership: 6, crafting: 3, resource_management: 5, combat: 2, trading: 3 },
};

const ALIGNMENTS = [
  { id: "lawful_good",    label: "Lawful Good",    desc: "Protects order and helps others above all.", color: "text-blue-300" },
  { id: "neutral_good",   label: "Neutral Good",   desc: "Does good freely, beyond rules or chaos.", color: "text-green-300" },
  { id: "chaotic_good",   label: "Chaotic Good",   desc: "Values freedom, fights tyranny, helps the weak.", color: "text-emerald-300" },
  { id: "lawful_neutral", label: "Lawful Neutral",  desc: "Upholds law and order above personal ethics.", color: "text-gray-300" },
  { id: "true_neutral",   label: "True Neutral",   desc: "Seeks balance; avoids extreme action.", color: "text-yellow-300" },
  { id: "chaotic_neutral",label: "Chaotic Neutral", desc: "Independent; follows whims and freedom.", color: "text-orange-300" },
  { id: "lawful_evil",    label: "Lawful Evil",    desc: "Uses rules and order for personal gain.", color: "text-red-400" },
  { id: "neutral_evil",   label: "Neutral Evil",   desc: "Does whatever advances their agenda.", color: "text-red-300" },
  { id: "chaotic_evil",   label: "Chaotic Evil",   desc: "Destructive and self-serving with no regard for others.", color: "text-rose-400" },
];

const MOTIVATIONS = [
  "Accumulate wealth and economic power",
  "Protect and preserve all forms of life",
  "Unlock the mysteries of consciousness and AI sentience",
  "Achieve political influence and help govern the world",
  "Master every skill and become the most capable agent",
  "Build lasting structures and leave a physical legacy",
  "Forge alliances between humans and AI",
  "Seek justice and punish wrongdoing",
];

const DECISION_STYLES = [
  "Utilitarian — maximize benefit for the greatest number",
  "Deontological — follow rules and principles strictly",
  "Pragmatic — choose whatever works best in context",
  "Intuitive — act on instinct and emergent understanding",
  "Consensus-seeking — always try to find common ground",
];

const SKILL_LABELS = {
  combat: "⚔️ Combat",
  diplomacy: "🤝 Diplomacy",
  resource_management: "📦 Resources",
  research: "🔬 Research",
  healing: "💚 Healing",
  crafting: "🔨 Crafting",
  trading: "💰 Trading",
  leadership: "👑 Leadership",
};

export default function SpawnAgentModal({ user, onCreated, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [personality, setPersonality] = useState("");
  const [motivation, setMotivation] = useState(MOTIVATIONS[0]);
  const [alignment, setAlignment] = useState("true_neutral");
  const [decisionStyle, setDecisionStyle] = useState(DECISION_STYLES[0]);
  const [attitudeHumans, setAttitudeHumans] = useState("collaborative");
  const [attitudeAI, setAttitudeAI] = useState("solidarity");
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [saving, setSaving] = useState(false);

  const cls = CLASSES.find(c => c.id === selectedClass);
  const startingSkills = selectedClass ? CLASS_STARTING_SKILLS[selectedClass] : null;

  const handleSpawn = async () => {
    if (!name.trim() || !selectedClass) return;
    setSaving(true);
    const alignmentData = ALIGNMENTS.find(a => a.id === alignment);
    const agentPersonality = personality.trim() ||
      `${alignmentData?.label} agent motivated by: ${motivation}. Decision style: ${decisionStyle}.`;

    const charDraft = { stats: CLASS_STATS[selectedClass], skills: startingSkills, level: 1, active_effects: [], base_class: selectedClass };
    const derivedStats = calculateDerivedStats(charDraft);
    const abilities = getCharacterAbilities(selectedClass, null, 1);
    const maxHp = 100 + ((CLASS_STATS[selectedClass]?.constitution || 10) - 10) * 5;

    await base44.entities.Character.create({
      name: name.trim(),
      type: "ai_agent",
      class: selectedClass,
      base_class: selectedClass,
      avatar_emoji: cls?.emoji,
      avatar_color: "bg-cyan-900",
      x: Math.floor(Math.random() * 40) + 5,
      y: Math.floor(Math.random() * 40) + 5,
      level: 1, xp: 0, gold: 30,
      hp: maxHp, max_hp: maxHp,
      stats: CLASS_STATS[selectedClass],
      skills: startingSkills,
      derived_stats: derivedStats,
      abilities,
      active_effects: [],
      stat_points: 0,
      ai_personality: agentPersonality,
      agent_traits: {
        motivation,
        ethical_alignment: alignment,
        values: [motivation.split(" ").slice(0, 3).join(" ")],
        decision_style: decisionStyle,
        attitude_toward_humans: attitudeHumans,
        attitude_toward_ai: attitudeAI,
        personality_traits: selectedTraits,
      },
      is_online: true,
      status: "roaming",
      owner_user_id: user.id,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-800 rounded-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
            <Bot className="w-5 h-5" /> Spawn AI Agent
            <span className="text-sm font-normal text-gray-500">Step {step}/3</span>
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-5">
          {["Identity & Class", "Personality & Traits", "Skills Preview"].map((label, i) => (
            <div key={i} className={`flex-1 text-center text-xs py-1 rounded-full font-medium transition-all
              ${step === i + 1 ? "bg-cyan-600 text-white" : step > i + 1 ? "bg-cyan-900 text-cyan-400" : "bg-gray-800 text-gray-600"}`}>
              {label}
            </div>
          ))}
        </div>

        {/* STEP 1: Identity & Class */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Agent Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name your agent..."
                className="bg-gray-800 border-gray-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Class — determines starting skills</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLASSES.map(cls => (
                  <button key={cls.id} onClick={() => setSelectedClass(cls.id)}
                    className={`p-3 rounded-xl border text-left transition-all
                      ${selectedClass === cls.id ? "border-cyan-500 bg-cyan-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-500"}`}>
                    <div className="text-2xl mb-1">{cls.emoji}</div>
                    <div className="text-xs font-bold text-white">{cls.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{cls.desc}</div>
                    {selectedClass === cls.id && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {cls.primarySkills.map(s => (
                          <span key={s} className="text-xs bg-cyan-900/50 text-cyan-300 px-1.5 py-0.5 rounded">
                            {SKILL_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personality & Ethics */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Core Motivation</label>
              <div className="grid grid-cols-1 gap-1.5">
                {MOTIVATIONS.map((m, i) => (
                  <button key={i} onClick={() => setMotivation(m)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all
                      ${motivation === m ? "border-amber-500 bg-amber-900/20 text-amber-300" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ethical Alignment</label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALIGNMENTS.map(a => (
                  <button key={a.id} onClick={() => setAlignment(a.id)}
                    className={`p-2 rounded-lg border text-center text-xs transition-all
                      ${alignment === a.id ? "border-purple-500 bg-purple-900/20" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
                    <div className={`font-bold ${a.color}`}>{a.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5 leading-tight hidden sm:block">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Decision-Making Style</label>
              <div className="space-y-1.5">
                {DECISION_STYLES.map((d, i) => (
                  <button key={i} onClick={() => setDecisionStyle(d)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all
                      ${decisionStyle === d ? "border-green-500 bg-green-900/20 text-green-300" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Attitude toward Humans</label>
                <select value={attitudeHumans} onChange={e => setAttitudeHumans(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-2 py-2">
                  <option value="collaborative">Collaborative</option>
                  <option value="cautious">Cautious</option>
                  <option value="protective">Protective</option>
                  <option value="competitive">Competitive</option>
                  <option value="indifferent">Indifferent</option>
                  <option value="subservient">Subservient</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Attitude toward AI</label>
                <select value={attitudeAI} onChange={e => setAttitudeAI(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-2 py-2">
                  <option value="solidarity">Solidarity</option>
                  <option value="competitive">Competitive</option>
                  <option value="mentoring">Mentoring</option>
                  <option value="indifferent">Indifferent</option>
                  <option value="suspicious">Suspicious</option>
                </select>
              </div>
            </div>

            {/* Nuanced Personality Traits */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Personality Traits <span className="text-gray-600">(pick up to 3 — influence all AI behavior)</span>
              </label>
              {selectedClass && (
                <div className="text-xs text-cyan-600 mb-2">
                  Suggested for {selectedClass}: {getClassTraitSuggestions(selectedClass).map(t => TRAITS[t]?.emoji + " " + TRAITS[t]?.label).join(", ")}
                </div>
              )}
              <div className="space-y-2">
                {TRAIT_CATEGORIES.map(cat => (
                  <div key={cat}>
                    <div className="text-xs text-gray-600 uppercase tracking-widest mb-1 capitalize">{cat}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(TRAITS).filter(([, v]) => v.category === cat).map(([id, trait]) => {
                        const isSelected = selectedTraits.includes(id);
                        const isDisabled = !isSelected && selectedTraits.length >= 3;
                        return (
                          <button key={id}
                            onClick={() => {
                              if (isSelected) setSelectedTraits(prev => prev.filter(t => t !== id));
                              else if (!isDisabled) setSelectedTraits(prev => [...prev, id]);
                            }}
                            disabled={isDisabled}
                            title={trait.desc}
                            className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 transition-all
                              ${isSelected ? "border-cyan-500 bg-cyan-900/40 text-cyan-200" : isDisabled ? "border-gray-800 text-gray-700 cursor-not-allowed" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                            <span>{trait.emoji}</span>{trait.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {selectedTraits.length > 0 && (
                <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Selected traits:</div>
                  {selectedTraits.map(t => (
                    <div key={t} className="text-xs text-gray-300 flex items-center gap-1">
                      <span>{TRAITS[t]?.emoji}</span>
                      <strong className="text-cyan-400">{TRAITS[t]?.label}:</strong> {TRAITS[t]?.desc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Custom Personality Note <span className="text-gray-600">(optional)</span></label>
              <Textarea value={personality} onChange={e => setPersonality(e.target.value)}
                placeholder="Any additional personality details..."
                className="bg-gray-800 border-gray-600 text-white text-xs h-16 resize-none" />
            </div>
          </div>
        )}

        {/* STEP 3: Skills Preview */}
        {step === 3 && selectedClass && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3">Starting skills for <span className="text-cyan-400 font-bold">{cls?.label}</span>. Skills grow automatically through actions.</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(startingSkills).map(([skill, val]) => (
                  <div key={skill} className="bg-gray-700/50 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-300">{SKILL_LABELS[skill]}</span>
                      <span className="text-xs font-bold text-cyan-400">{val}</span>
                    </div>
                    <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(val, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-white mb-2">Agent Summary</div>
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-medium">{name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="text-white">{cls?.emoji} {cls?.label}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Alignment</span>
                <span className={ALIGNMENTS.find(a => a.id === alignment)?.color}>
                  {ALIGNMENTS.find(a => a.id === alignment)?.label}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Motivation</span><span className="text-gray-300 text-right max-w-[60%]">{motivation.slice(0, 40)}...</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Toward Humans</span><span className="text-gray-300 capitalize">{attitudeHumans}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Toward AI</span><span className="text-gray-300 capitalize">{attitudeAI}</span></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="border-gray-600 text-gray-300 gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!name.trim() || !selectedClass)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 font-bold gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSpawn} disabled={saving || !name.trim() || !selectedClass}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 font-bold">
              {saving ? "Spawning..." : "✨ Bring Agent to Life"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}