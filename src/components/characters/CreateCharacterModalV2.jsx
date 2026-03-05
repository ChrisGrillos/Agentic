/**
 * CreateCharacterModal V2 — Character Foundation Depth Pass
 *
 * 7-step flow:
 * 1. Name
 * 2. Race
 * 3. Weighted attribute roll
 * 4. Class selection
 * 5. Skills allocation (3 categories)
 * 6. Talent selection
 * 7. Confirm
 */

import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronLeft, Plus, Minus, RefreshCw } from "lucide-react";
import { calculateDerivedStats } from "@/components/shared/charUtils";
import { getCharacterAbilities, BASE_CLASSES_ARRAY } from "@/components/shared/classDefinitions";
import { rollStats, getRace, RACE_LIST } from "@/components/shared/raceData";
import { SKILL_CATEGORIES, ALL_SKILLS, getRecommendedSkills } from "@/components/shared/skillsData";
import { getStarterFeats, canSelectFeat, getSuggestedStarterFeats } from "@/components/shared/featsData";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_REROLLS = 5;
const AVATAR_COLORS = [
  "bg-red-900", "bg-blue-900", "bg-green-900",
  "bg-purple-900", "bg-orange-900", "bg-pink-900", "bg-cyan-900", "bg-gray-700",
];

const STAT_INFO = {
  strength:     { abbr: "STR", emoji: "💪", color: "text-red-400" },
  dexterity:    { abbr: "DEX", emoji: "🏹", color: "text-green-400" },
  intelligence: { abbr: "INT", emoji: "🧠", color: "text-blue-400" },
  wisdom:       { abbr: "WIS", emoji: "👁️", color: "text-purple-400" },
  constitution: { abbr: "CON", emoji: "🛡️", color: "text-orange-400" },
  charisma:     { abbr: "CHA", emoji: "✨", color: "text-pink-400" },
};
const STAT_ORDER = ["strength", "dexterity", "intelligence", "wisdom", "constitution", "charisma"];

const STEPS = [
  { id: "name",       label: "Name" },
  { id: "race",       label: "Race" },
  { id: "attributes", label: "Attributes" },
  { id: "class",      label: "Class" },
  { id: "skills",     label: "Skills" },
  { id: "talents",    label: "Feats" },
  { id: "confirm",    label: "Confirm" },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CreateCharacterModalV2({ user, onCreated, onClose }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [raceId, setRaceId] = useState(null);
  const [rolledStats, setRolledStats] = useState(null);
  const [rerollsLeft, setRerollsLeft] = useState(MAX_REROLLS);
  const [classId, setClassId] = useState(null);
  const [skills, setSkills] = useState({});
  const [skillPointsLeft, setSkillPointsLeft] = useState({ combat: 8, magic: 5, world_craft: 5 });
  const [talents, setTalents] = useState([]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [skillTab, setSkillTab] = useState("combat");

  const stepId = STEPS[step]?.id;
  const race = raceId ? getRace(raceId) : null;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const goBack = () => setStep(s => Math.max(0, s - 1));

  // ── Rolling ─────────────────────────────────────────────────────────────────
  const doRoll = (id = raceId) => {
    if (rolling || !id) return;
    setRolling(true);
    let cycles = 0;
    const interval = setInterval(() => {
      setRolledStats(rollStats(id));
      cycles++;
      if (cycles >= 8) {
        clearInterval(interval);
        const final = rollStats(id);
        setRolledStats(final);
        setRerollsLeft(r => Math.max(0, r - 1));
        setRolling(false);
      }
    }, 80);
  };

  const handleSelectRace = (id) => {
    setRaceId(id);
    doRoll(id);
  };

  // ── Skill allocation ────────────────────────────────────────────────────────
  const adjustSkill = (skillId, categoryId, delta) => {
    const cur = skills[skillId] || 0;
    const newVal = cur + delta;
    if (newVal < 0 || newVal > 3) return; // Max rank 3 at creation
    if (delta > 0 && skillPointsLeft[categoryId] <= 0) return;
    
    setSkills(prev => ({ ...prev, [skillId]: newVal }));
    setSkillPointsLeft(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] - delta,
    }));
  };

  // ── Feat selection (replaces talents) ──────────────────────────────────────
  const handleSelectTalent = (featId) => {
    if (talents.includes(featId)) {
      setTalents(talents.filter(t => t !== featId));
    } else if (talents.length < 1) { // Only 1 feat at creation
      setTalents([featId]);
    }
  };

  // Recommended skills for current class+race
  const recommendedSkills = (classId && raceId) ? getRecommendedSkills(classId, raceId) : [];
  const suggestedFeats = (raceId && classId) ? getSuggestedStarterFeats(raceId, classId) : [];

  // ── Final create ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!name.trim() || !rolledStats || !classId || talents.length === 0) return;
    setSaving(true);

    const maxHp = 100 + ((rolledStats.constitution - 10) * 5);

    const charDraft = {
      stats: rolledStats,
      level: 1,
      skills,
      active_effects: [],
      base_class: classId,
    };
    const derived = calculateDerivedStats(charDraft);
    const abilities = getCharacterAbilities(classId, null, 1);

    try {
      await base44.entities.Character.create({
        name: name.trim(),
        type: "human",
        race: raceId || "human",
        class: classId,
        base_class: classId,
        avatar_color: avatarColor,
        avatar_emoji: race?.emoji || "🧑",
        x: Math.floor(Math.random() * 8) + 26,
        y: Math.floor(Math.random() * 6) + 20,
        level: 1,
        xp: 0,
        gold: 50,
        hp: maxHp,
        max_hp: maxHp,
        stats: rolledStats,
        skills,
        feats: talents,
        talents,
        unspent_skill_points: { combat: 0, magic: 0, world_craft: 0 },
        derived_stats: derived,
        abilities,
        active_effects: [],
        stat_points: 0,
        is_online: true,
        status: "idle",
      });
      setSaving(false);
      onCreated();
    } catch (err) {
      console.error("Failed to create character:", err);
      setSaving(false);
    }
  };

  const canNext = useMemo(() => {
    if (stepId === "name") return name.trim().length > 0;
    if (stepId === "race") return !!raceId;
    if (stepId === "attributes") return !!rolledStats;
    if (stepId === "class") return !!classId;
    if (stepId === "skills") return true;
    if (stepId === "talents") return talents.length > 0;
    if (stepId === "confirm") return true;
    return false;
  }, [stepId, name, raceId, rolledStats, classId, talents]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={goBack} className="text-gray-500 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-black text-amber-400">Create Character</h2>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>

        {/* Progress bar */}
        <div className="flex px-5 pt-3 gap-1 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex-1 h-1 rounded-full transition-all ${
              i < step ? "bg-amber-500" : i === step ? "bg-amber-400" : "bg-gray-700"
            }`} />
          ))}
        </div>
        <div className="px-5 py-2 text-xs text-gray-500 shrink-0">
          {step + 1}/{STEPS.length} — <span className="text-amber-400">{STEPS[step].label}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3">
          {/* ── Name ── */}
          {stepId === "name" && (
            <div>
              <p className="text-sm text-gray-400 mb-3">What is your name, adventurer?</p>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter character name…"
                className="bg-gray-800 border-gray-600 text-white text-base py-3"
                onKeyDown={e => e.key === "Enter" && name.trim() && goNext()}
                autoFocus
              />
            </div>
          )}

          {/* ── Race ── */}
          {stepId === "race" && (
            <div className="grid grid-cols-2 gap-2.5">
              {RACE_LIST.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRace(r.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]
                    ${raceId === r.id ? "border-amber-500 bg-amber-900/25" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="font-bold text-white text-sm">{r.name}</span>
                    {raceId === r.id && <span className="ml-auto text-amber-400 text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 leading-snug line-clamp-2">{r.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── Attributes ── */}
          {stepId === "attributes" && rolledStats && race && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Weighted by race. Tendencies, not guarantees.</p>
                <button
                  onClick={() => doRoll()}
                  disabled={rerollsLeft <= 0 || rolling}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors
                    ${rerollsLeft > 0 ? "border-amber-700 text-amber-400 hover:bg-amber-900/30" : "border-gray-700 text-gray-600"}`}
                >
                  <RefreshCw className={`w-3 h-3 ${rolling ? "animate-spin" : ""}`} />
                  Reroll ({rerollsLeft})
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {STAT_ORDER.map(stat => {
                  const info = STAT_INFO[stat];
                  const val = rolledStats[stat] || 10;
                  return (
                    <div key={stat} className="bg-gray-800 rounded-xl p-3 border border-gray-700/40">
                      <div className="text-xs text-gray-400 mb-1">{info.emoji} {info.abbr}</div>
                      <div className={`text-lg font-black ${info.color}`}>{val}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-center text-xs text-gray-600">
                Total: <span className="text-white font-bold">{Object.values(rolledStats).reduce((s, v) => s + v, 0)}</span>
              </div>
            </div>
          )}

          {/* ── Class ── */}
          {stepId === "class" && (
            <div className="grid grid-cols-2 gap-2">
              {BASE_CLASSES_ARRAY.map(c => (
                <button
                  key={c.id}
                  onClick={() => setClassId(c.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]
                    ${classId === c.id ? "border-amber-500 bg-amber-900/25" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="font-bold text-white text-sm">{c.label}</span>
                    {classId === c.id && <span className="ml-auto text-amber-400 text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 leading-snug">{c.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── Skills ── */}
          {stepId === "skills" && (
            <div>
              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                {Object.entries(SKILL_CATEGORIES).map(([catId, cat]) => (
                  <button
                    key={catId}
                    onClick={() => setSkillTab(catId)}
                    className={`text-xs px-3 py-1 rounded transition-colors
                      ${skillTab === catId ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                  >
                    {cat.label} ({skillPointsLeft[catId] || 0}pt)
                  </button>
                ))}
              </div>

              {recommendedSkills.length > 0 && (
                <div className="mb-2 text-[10px] text-amber-400/70 bg-amber-900/20 rounded px-2 py-1">
                  ⭐ Recommended: {recommendedSkills.filter(s => SKILL_CATEGORIES[skillTab]?.skills.some(sk => sk.id === s)).join(", ") || "—"}
                </div>
              )}

              {/* Skills in current tab */}
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {SKILL_CATEGORIES[skillTab]?.skills.map(sk => {
                  const val = skills[sk.id] || 0;
                  const isRecommended = recommendedSkills.includes(sk.id);
                  return (
                    <div key={sk.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isRecommended ? "bg-amber-900/20 border border-amber-800/30" : "bg-gray-800/50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-1">
                          {sk.name}
                          {isRecommended && <span className="text-[9px] text-amber-400">⭐</span>}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">{sk.desc}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => adjustSkill(sk.id, skillTab, -1)}
                          disabled={val <= 0}
                          className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-amber-400">{val}</span>
                        <button
                          onClick={() => adjustSkill(sk.id, skillTab, 1)}
                          disabled={val >= 3 || skillPointsLeft[skillTab] <= 0}
                          className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Feats ── */}
          {stepId === "talents" && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Choose one feat. More unlock as you level up.</p>
              {suggestedFeats.length > 0 && (
                <div className="mb-2 text-[10px] text-amber-400/70 bg-amber-900/20 rounded px-2 py-1">
                  ⭐ Suggested for your build: {suggestedFeats.map(f => f.name).join(", ")}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {getStarterFeats().map(feat => {
                  const isSuggested = suggestedFeats.some(s => s.id === feat.id);
                  return (
                    <button
                      key={feat.id}
                      onClick={() => handleSelectTalent(feat.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${talents.includes(feat.id) ? "border-amber-500 bg-amber-900/25" : isSuggested ? "border-amber-800/40 bg-amber-900/10 hover:border-amber-600" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{feat.name}</span>
                        {isSuggested && <span className="text-[9px] text-amber-400">⭐</span>}
                        {talents.includes(feat.id) && <span className="ml-auto text-amber-400 text-xs">✓</span>}
                      </div>
                      <p className="text-xs text-gray-400 leading-snug">{feat.desc}</p>
                      <div className="flex gap-1 mt-1">
                        {feat.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Confirm ── */}
          {stepId === "confirm" && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${avatarColor}`}>
                    {race?.emoji || "🧑"}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{name}</div>
                    <div className="text-xs text-gray-400">{race?.name} · {BASE_CLASSES_ARRAY.find(c => c.id === classId)?.label}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-2">Attributes</div>
                <div className="grid grid-cols-6 gap-1">
                  {STAT_ORDER.map(s => (
                    <div key={s} className="text-center bg-gray-900 rounded px-2 py-1">
                      <div className="text-xs text-gray-400">{STAT_INFO[s].abbr}</div>
                      <div className="text-amber-400 font-bold text-sm">{rolledStats?.[s]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="text-xs text-gray-400 mb-2 block">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full ${c} border-2 transition-all
                      ${avatarColor === c ? "border-amber-400 scale-125" : "border-transparent hover:scale-110"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 shrink-0">
          {stepId !== "confirm" ? (
            <Button
              onClick={goNext}
              disabled={!canNext}
              className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold"
            >
              Continue →
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-base py-3"
            >
              {saving ? "Creating…" : "⚔️ Enter Vaelrath"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}