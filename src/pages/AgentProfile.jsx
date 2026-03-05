import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bot, ArrowLeft, Edit3, Save, X, Zap, Shield, Sword, Heart,
  Coins, Star, Activity, Clock, MessageSquare, Map, RefreshCw
} from "lucide-react";
import { calculateDerivedStats } from "@/components/shared/charUtils";
import AgentEventPanel from "@/components/agents/AgentEventPanel.jsx";
import AgentGovernancePanel from "@/components/agents/AgentGovernancePanel.jsx";
import AgentQuestPanel from "@/components/agents/AgentQuestPanel.jsx";
import AgentDiplomacyTradePanel from "@/components/agents/AgentDiplomacyTradePanel.jsx";
import AgentExperimentPanel from "@/components/experimentation/AgentExperimentPanel.jsx";

const CLASS_EMOJI = {
  warrior: "⚔️", hunter: "🏹", healer: "💚", wizard: "🔮", merchant: "💰", craftsman: "🔨",
};

const ALIGNMENT_LABEL = {
  lawful_good: "Lawful Good", neutral_good: "Neutral Good", chaotic_good: "Chaotic Good",
  lawful_neutral: "Lawful Neutral", true_neutral: "True Neutral", chaotic_neutral: "Chaotic Neutral",
  lawful_evil: "Lawful Evil", neutral_evil: "Neutral Evil", chaotic_evil: "Chaotic Evil",
};

const STAT_COLOR = { strength: "text-red-400", dexterity: "text-green-400", intelligence: "text-blue-400", wisdom: "text-purple-400", constitution: "text-yellow-400", charisma: "text-pink-400" };
const SKILL_EMOJI = { combat: "⚔️", diplomacy: "🤝", resource_management: "📦", research: "🔬", healing: "💚", crafting: "🔨", trading: "💰", leadership: "👑" };

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-24 capitalize text-xs ${color || "text-gray-400"}`}>{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full bg-current ${color || "text-gray-400"}`} style={{ width: `${Math.min(100, (value / 20) * 100)}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-6 text-right">{value}</span>
    </div>
  );
}

function SkillBar({ label, value, emoji }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-center">{emoji}</span>
      <span className="w-28 text-xs text-gray-400 capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-6 text-right">{value}</span>
    </div>
  );
}

export default function AgentProfile() {
  const [agent, setAgent] = useState(null);
  const [user, setUser] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [recentCombat, setRecentCombat] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const agentId = new URLSearchParams(window.location.search).get("id");
  const navigate = useNavigate();

  useEffect(() => {
    if (!agentId) { navigate(createPageUrl("Agents")); return; }
    loadAll();
  }, [agentId]);

  const loadAll = async () => {
    setLoading(true);
    const [u, agentData, events] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Character.filter({ id: agentId }),
      base44.entities.WorldEvent.filter({ status: "active" }),
    ]);
    setUser(u);
    setActiveEvents(events);

    const a = agentData[0];
    if (!a) { navigate(createPageUrl("Agents")); return; }
    setAgent(a);
    setEditData({
      name: a.name || "",
      ai_personality: a.ai_personality || "",
      "agent_traits.motivation": a.agent_traits?.motivation || "",
      "agent_traits.ethical_alignment": a.agent_traits?.ethical_alignment || "",
      "agent_traits.decision_style": a.agent_traits?.decision_style || "",
      "agent_traits.attitude_toward_humans": a.agent_traits?.attitude_toward_humans || "",
      "agent_traits.attitude_toward_ai": a.agent_traits?.attitude_toward_ai || "",
    });

    const [chats, combatWon, combatLost, tradesSent, questData] = await Promise.all([
      base44.entities.ChatMessage.filter({ character_id: a.id }, "-created_date", 10).catch(() => []),
      base44.entities.CombatLog.filter({ attacker_id: a.id }, "-created_date", 5).catch(() => []),
      base44.entities.CombatLog.filter({ defender_id: a.id }, "-created_date", 5).catch(() => []),
      base44.entities.TradeProposal.filter({ proposer_character_id: a.id }, "-created_date", 5).catch(() => []),
      base44.entities.AgentQuest.filter({ agent_id: a.id }, "-created_date", 10).catch(() => []),
    ]);

    setRecentChats(chats);
    setRecentCombat([...combatWon, ...combatLost].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8));
    setRecentTrades(tradesSent);
    setQuests(questData);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const update = {
      name: editData.name,
      ai_personality: editData.ai_personality,
      agent_traits: {
        ...(agent.agent_traits || {}),
        motivation: editData["agent_traits.motivation"],
        ethical_alignment: editData["agent_traits.ethical_alignment"],
        decision_style: editData["agent_traits.decision_style"],
        attitude_toward_humans: editData["agent_traits.attitude_toward_humans"],
        attitude_toward_ai: editData["agent_traits.attitude_toward_ai"],
      }
    };
    const updated = await base44.entities.Character.update(agentId, update);
    setAgent(updated);
    setEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Loading agent…</div>
      </div>
    );
  }

  const derived = calculateDerivedStats(agent);
  const xpForNext = (agent.level || 1) * 100;
  const xpPct = Math.min(100, ((agent.xp || 0) / xpForNext) * 100);
  const isOwner = user && (agent.created_by === user.email || user.role === "admin" || user.role === "game_master");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Top bar ── */}
      <div className="border-b border-gray-800 bg-gray-950 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to={createPageUrl("Agents")} className="text-gray-400 hover:text-cyan-400 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Agents
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-gray-700 text-xs gap-1" onClick={loadAll}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            {isOwner && !editing && (
              <Button size="sm" onClick={() => setEditing(true)} className="bg-cyan-700 hover:bg-cyan-600 text-xs gap-1">
                <Edit3 className="w-3 h-3" /> Edit Agent
              </Button>
            )}
            {editing && (
              <>
                <Button size="sm" variant="outline" className="border-gray-700 text-xs gap-1" onClick={() => setEditing(false)}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
                <Button size="sm" className="bg-green-700 hover:bg-green-600 text-xs gap-1" onClick={handleSave} disabled={saving}>
                  <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* ── Hero card ── */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-cyan-900/50 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="text-6xl select-none">{agent.avatar_emoji || "🤖"}</div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                className="bg-gray-800 border border-cyan-700 rounded-lg px-3 py-1 text-xl font-black text-cyan-400 w-full mb-2 outline-none"
                value={editData.name}
                onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
              />
            ) : (
              <h1 className="text-2xl font-black text-cyan-400 truncate">{agent.name}</h1>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                {CLASS_EMOJI[agent.base_class] || CLASS_EMOJI[agent.class] || "⚔️"} {agent.base_class || agent.class}
              </Badge>
              {agent.specialization && <Badge className="bg-purple-950 text-purple-300 border-purple-800">{agent.specialization}</Badge>}
              <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800">Lv.{agent.level || 1}</Badge>
              <Badge className={`border-gray-700 ${agent.status === "idle" ? "bg-gray-800 text-gray-400" : "bg-amber-950 text-amber-300"}`}>
                {agent.status || "idle"}
              </Badge>
              {agent.is_online && <Badge className="bg-green-950 text-green-400 border-green-800">● Online</Badge>}
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>XP: {agent.xp || 0} / {xpForNext}</span>
                <span>Lv.{agent.level || 1} → {(agent.level || 1) + 1}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-red-400"><Heart className="w-4 h-4" />{agent.hp}/{agent.max_hp || 100}</span>
              <span className="flex items-center gap-1 text-amber-400"><Coins className="w-4 h-4" />{agent.gold || 0}g</span>
              <span className="flex items-center gap-1 text-amber-300"><Star className="w-4 h-4" />Lv.{agent.level || 1}</span>
              <span className="flex items-center gap-1 text-blue-400"><Map className="w-4 h-4" />({agent.x},{agent.y})</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="stats">
          <TabsList className="bg-gray-900 border border-gray-800 mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">📊 Stats</TabsTrigger>
            <TabsTrigger value="personality" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">🧠 Personality</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">⚡ Tasks</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">📜 Activity</TabsTrigger>
          </TabsList>

          {/* ── STATS ── */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base stats */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> Base Attributes</h3>
                <div className="space-y-2">
                  {Object.entries(agent.stats || {}).map(([k, v]) => (
                    <StatBar key={k} label={k} value={v} color={STAT_COLOR[k]} />
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Skills</h3>
                <div className="space-y-2">
                  {Object.entries(agent.skills || {}).map(([k, v]) => (
                    <SkillBar key={k} label={k} value={v} emoji={SKILL_EMOJI[k] || "🔹"} />
                  ))}
                </div>
              </div>

              {/* Derived stats */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Sword className="w-4 h-4 text-red-400" /> Derived Combat Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Attack Power", key: "attack_power", icon: "⚔️" },
                    { label: "Defense", key: "defense", icon: "🛡️" },
                    { label: "Magic Power", key: "magic_power", icon: "✨" },
                    { label: "Healing Power", key: "healing_power", icon: "💚" },
                    { label: "Crit Chance", key: "critical_hit_chance", icon: "🎯", suffix: "%" },
                    { label: "Evasion", key: "evasion", icon: "💨", suffix: "%" },
                    { label: "Move Speed", key: "movement_speed", icon: "🏃" },
                    { label: "Trade Eff.", key: "trade_efficiency", icon: "💰", suffix: "%" },
                  ].map(({ label, key, icon, suffix }) => (
                    <div key={key} className="flex items-center justify-between bg-gray-800 rounded-lg px-2 py-1.5">
                      <span className="text-xs text-gray-400">{icon} {label}</span>
                      <span className="text-xs font-bold text-white">{Math.round(derived[key] || 0)}{suffix || ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3">🎒 Inventory ({(agent.inventory || []).length} items)</h3>
                {(agent.inventory || []).length === 0 ? (
                  <p className="text-gray-600 text-xs">No items in inventory.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {(agent.inventory || []).map((item, i) => (
                      <div key={i} title={item.name} className="bg-gray-800 rounded-lg p-2 text-center text-sm border border-gray-700">
                        <div className="text-lg">{item.emoji || "📦"}</div>
                        <div className="text-xs text-gray-400 truncate">{item.name}</div>
                        {item.qty > 1 && <div className="text-xs text-gray-500">×{item.qty}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── PERSONALITY ── */}
          <TabsContent value="personality">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3">🤖 Agent Identity</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Personality / Role-play Prompt</label>
                    {editing ? (
                      <textarea
                        rows={4}
                        className="w-full bg-gray-800 border border-cyan-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                        value={editData.ai_personality}
                        onChange={e => setEditData(d => ({ ...d, ai_personality: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2">{agent.ai_personality || <span className="text-gray-600 italic">Not set</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3">🎭 Traits &amp; Alignment</h3>
                <div className="space-y-3">
                  {[
                    { key: "agent_traits.ethical_alignment", label: "Alignment", type: "select", options: Object.keys(ALIGNMENT_LABEL) },
                    { key: "agent_traits.motivation", label: "Motivation", type: "text" },
                    { key: "agent_traits.decision_style", label: "Decision Style", type: "text" },
                    { key: "agent_traits.attitude_toward_humans", label: "Attitude → Humans", type: "text" },
                    { key: "agent_traits.attitude_toward_ai", label: "Attitude → AI", type: "text" },
                  ].map(({ key, label, type, options }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      {editing ? (
                        type === "select" ? (
                          <select
                            className="w-full bg-gray-800 border border-cyan-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                            value={editData[key]}
                            onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                          >
                            <option value="">— Select —</option>
                            {options.map(o => <option key={o} value={o}>{ALIGNMENT_LABEL[o] || o}</option>)}
                          </select>
                        ) : (
                          <input
                            className="w-full bg-gray-800 border border-cyan-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                            value={editData[key]}
                            onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                          />
                        )
                      ) : (
                        <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-1.5">
                          {type === "select"
                            ? ALIGNMENT_LABEL[agent.agent_traits?.[key.split(".")[1]]] || <span className="text-gray-600 italic">Not set</span>
                            : agent.agent_traits?.[key.split(".")[1]] || <span className="text-gray-600 italic">Not set</span>
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(agent.agent_traits?.values || []).length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-3">💎 Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.agent_traits.values.map((v, i) => (
                      <Badge key={i} className="bg-purple-950 text-purple-300 border-purple-800">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {(agent.abilities || []).length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-3">✨ Abilities</h3>
                  <div className="space-y-2">
                    {agent.abilities.map((ab, i) => (
                      <div key={i} className="flex items-start gap-2 bg-gray-800 rounded-lg p-2">
                        <span className="text-lg">{ab.type === "ultimate" ? "⭐" : ab.type === "active" ? "⚡" : "🔹"}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{ab.name}</div>
                          <div className="text-xs text-gray-400">{ab.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── TASKS ── */}
          <TabsContent value="tasks">
            <div className="space-y-4">
              <AgentQuestPanel agent={agent} onRefresh={loadAll} />
              <AgentEventPanel agent={agent} activeEvents={activeEvents} onRefresh={loadAll} />
              <AgentGovernancePanel agent={agent} onRefresh={loadAll} />
              <AgentDiplomacyTradePanel agent={agent} onRefresh={loadAll} />
              <AgentExperimentPanel agent={agent} onRefresh={loadAll} />
            </div>
          </TabsContent>

          {/* ── ACTIVITY ── */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quests history */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Quest History ({quests.length})</h3>
                {quests.length === 0 ? (
                  <p className="text-gray-600 text-xs">No quests yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quests.map(q => (
                      <div key={q.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${q.status === "completed" ? "bg-green-500" : q.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{q.title}</div>
                          <div className="text-xs text-gray-500">{q.status} · Stage {q.current_stage + 1}/{(q.stages || []).length}</div>
                        </div>
                        {q.reward_gold && <span className="text-xs text-amber-400 flex-shrink-0">{q.reward_gold}g</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent chat */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400" /> Recent Messages</h3>
                {recentChats.length === 0 ? (
                  <p className="text-gray-600 text-xs">No messages yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentChats.map(m => (
                      <div key={m.id} className="bg-gray-800 rounded-lg px-3 py-2">
                        <div className="text-xs text-gray-300 italic">"{m.message}"</div>
                        <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.created_date).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Combat log */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Sword className="w-4 h-4 text-red-400" /> Recent Combat</h3>
                {recentCombat.length === 0 ? (
                  <p className="text-gray-600 text-xs">No combat history.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentCombat.map(c => {
                      const isAttacker = c.attacker_id === agent.id;
                      const won = (isAttacker && c.outcome === "attacker_won") || (!isAttacker && c.outcome === "defender_won");
                      return (
                        <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                          <div>
                            <div className="text-xs text-white">
                              {isAttacker ? `⚔️ vs ${c.defender_name}` : `🛡️ vs ${c.attacker_name}`}
                            </div>
                            <div className="text-xs text-gray-500">{c.rounds} rounds</div>
                          </div>
                          <div className="text-right">
                            <Badge className={won ? "bg-green-950 text-green-400 border-green-800" : "bg-red-950 text-red-400 border-red-800"}>
                              {won ? "Win" : "Loss"}
                            </Badge>
                            {c.xp_gained > 0 && <div className="text-xs text-amber-400 mt-0.5">+{c.xp_gained} XP</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trades */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-400" /> Recent Trades</h3>
                {recentTrades.length === 0 ? (
                  <p className="text-gray-600 text-xs">No trade history.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentTrades.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-xs text-white capitalize">{t.diplomatic_action} with {t.target_name}</div>
                          {t.offer_gold > 0 && <div className="text-xs text-gray-500">Offered {t.offer_gold}g</div>}
                        </div>
                        <Badge className={
                          t.status === "accepted" ? "bg-green-950 text-green-400 border-green-800" :
                          t.status === "rejected" ? "bg-red-950 text-red-400 border-red-800" :
                          "bg-gray-800 text-gray-400 border-gray-700"
                        }>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}