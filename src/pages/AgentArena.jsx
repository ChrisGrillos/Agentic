import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Heart, Zap, Loader2, Trophy, Skull } from "lucide-react";

const CLASS_EMOJI = {
  warrior: "⚔️", hunter: "🏹", healer: "💚", wizard: "🧙",
  merchant: "💰", craftsman: "🔨", fighter: "🥊", magician: "✨"
};

// Class passive bonuses to combat
const CLASS_COMBAT_BONUS = {
  warrior: { atk: 5, def: 3 },
  fighter: { atk: 4, def: 2 },
  hunter:  { atk: 3, def: 1 },
  wizard:  { atk: 4, def: 0 },  // glass cannon
  healer:  { atk: 0, def: 2, heal: true },
  craftsman:{ atk: 2, def: 4 },
  merchant: { atk: 1, def: 1 },
  magician: { atk: 3, def: 1 },
};

function calcCombatStats(agent) {
  const skills = agent.skills || {};
  const stats = agent.stats || {};
  const bonus = CLASS_COMBAT_BONUS[agent.class] || { atk: 0, def: 0 };
  const combatSkill = skills.combat || 1;
  const atk = Math.floor((stats.strength || 10) / 2) + Math.floor(combatSkill / 5) + bonus.atk;
  const def = Math.floor((stats.constitution || 10) / 4) + bonus.def;
  const maxHp = agent.max_hp || 100;
  return { atk, def, maxHp, combatSkill, heal: bonus.heal || false };
}

function rollDamage(atk, def) {
  const base = Math.max(1, atk - def);
  return Math.floor(base * 0.6 + Math.random() * base * 0.8) + 1;
}

function simulateCombat(a, b) {
  const sa = calcCombatStats(a);
  const sb = calcCombatStats(b);
  let hpA = a.hp || sa.maxHp;
  let hpB = b.hp || sb.maxHp;
  const log = [];
  let round = 0;

  while (hpA > 0 && hpB > 0 && round < 25) {
    round++;
    // Attacker A hits B
    const dmgA = rollDamage(sa.atk, sb.def);
    hpB = Math.max(0, hpB - dmgA);
    log.push({ round, text: `⚔️ ${a.name} strikes ${b.name} for ${dmgA} dmg. (${b.name} HP: ${hpB})`, type: "atk_a" });
    if (hpB <= 0) break;

    // Healer gets a heal pulse every 3 rounds
    if (sa.heal && round % 3 === 0) {
      const healAmt = Math.floor(sa.maxHp * 0.08);
      hpA = Math.min(sa.maxHp, hpA + healAmt);
      log.push({ round, text: `💚 ${a.name} channels healing — restored ${healAmt} HP. (${a.name} HP: ${hpA})`, type: "heal" });
    }

    // B hits A
    const dmgB = rollDamage(sb.atk, sa.def);
    hpA = Math.max(0, hpA - dmgB);
    log.push({ round, text: `🗡️ ${b.name} counters ${a.name} for ${dmgB} dmg. (${a.name} HP: ${hpA})`, type: "atk_b" });
    if (hpA <= 0) break;

    if (sb.heal && round % 3 === 0) {
      const healAmt = Math.floor(sb.maxHp * 0.08);
      hpB = Math.min(sb.maxHp, hpB + healAmt);
      log.push({ round, text: `💚 ${b.name} channels healing — restored ${healAmt} HP. (${b.name} HP: ${hpB})`, type: "heal" });
    }
  }

  const outcome = hpA <= 0 && hpB <= 0 ? "draw" : hpA <= 0 ? "defender_won" : "attacker_won";
  const winner = outcome === "draw" ? null : outcome === "attacker_won" ? a : b;
  const loser  = outcome === "draw" ? null : outcome === "attacker_won" ? b : a;
  return { log, outcome, winner, loser, finalHpA: hpA, finalHpB: hpB, rounds: round };
}

export default function AgentArena() {
  const [agents, setAgents] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [fightResult, setFightResult] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    const [allAgents, logs] = await Promise.all([
      base44.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 50),
      base44.entities.CombatLog.list("-created_date", 10),
    ]);
    setAgents(allAgents.filter(a => (a.hp || a.max_hp || 100) > 0));
    setRecentLogs(logs);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      setMyCharacter(chars.find(c => c.type === "human") || null);
    }
    setLoading(false);
  };

  const startFight = async () => {
    if (!selectedA || !selectedB || selectedA === selectedB) return;
    const a = agents.find(ag => ag.id === selectedA);
    const b = agents.find(ag => ag.id === selectedB);
    if (!a || !b) return;
    setFighting(true);
    setFightResult(null);

    const result = simulateCombat(a, b);
    const goldTransfer = result.winner ? Math.min(20, Math.floor((result.loser?.gold || 0) * 0.15)) : 0;
    const xpGain = 10 + result.rounds;

    // Update HP and status
    await Promise.all([
      base44.entities.Character.update(a.id, {
        hp: Math.max(1, result.finalHpA),
        status: result.outcome === "attacker_won" ? "roaming" : "idle",
        gold: result.outcome === "attacker_won" ? (a.gold || 0) + goldTransfer : Math.max(0, (a.gold || 0) - goldTransfer),
        xp: (a.xp || 0) + (result.outcome === "attacker_won" ? xpGain : Math.floor(xpGain / 2)),
        skills: result.outcome === "attacker_won" ? { ...(a.skills || {}), combat: Math.min(100, (a.skills?.combat || 1) + 3) } : (a.skills || {}),
        last_message: result.outcome === "attacker_won" ? `Defeated ${b.name} in the arena!` : `Lost to ${b.name} in combat.`,
      }),
      base44.entities.Character.update(b.id, {
        hp: Math.max(1, result.finalHpB),
        status: result.outcome === "defender_won" ? "roaming" : "idle",
        gold: result.outcome === "defender_won" ? (b.gold || 0) + goldTransfer : Math.max(0, (b.gold || 0) - goldTransfer),
        xp: (b.xp || 0) + (result.outcome === "defender_won" ? xpGain : Math.floor(xpGain / 2)),
        skills: result.outcome === "defender_won" ? { ...(b.skills || {}), combat: Math.min(100, (b.skills?.combat || 1) + 3) } : (b.skills || {}),
        last_message: result.outcome === "defender_won" ? `Defeated ${a.name} in the arena!` : `Lost to ${a.name} in combat.`,
      }),
    ]);

    await base44.entities.CombatLog.create({
      attacker_id: a.id,
      attacker_name: a.name,
      attacker_type: "ai_agent",
      defender_id: b.id,
      defender_name: b.name,
      defender_type: "ai_agent",
      outcome: result.outcome,
      rounds: result.rounds,
      log_lines: result.log.map(l => l.text),
      gold_transferred: goldTransfer,
      xp_gained: xpGain,
    });

    setFightResult({ ...result, a, b, goldTransfer, xpGain });
    setFighting(false);
    loadData();
  };

  const statRow = (agent) => {
    const s = calcCombatStats(agent);
    return (
      <div className="text-xs text-gray-500 mt-1 flex gap-3">
        <span className="text-red-400">ATK {s.atk}</span>
        <span className="text-blue-400">DEF {s.def}</span>
        <span className="text-green-400">HP {agent.hp || s.maxHp}/{s.maxHp}</span>
        <span className="text-amber-400">Combat {s.combatSkill}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>
        <h1 className="text-3xl font-black text-red-400 flex items-center gap-2 mb-1">
          <Sword className="w-8 h-8" /> Agent Arena
        </h1>
        <p className="text-gray-400 mb-6">Combat effectiveness is driven by class, combat skill, and stats</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fighter selection */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {["A", "B"].map((side, idx) => {
                const sel = idx === 0 ? selectedA : selectedB;
                const setSel = idx === 0 ? setSelectedA : setSelectedB;
                const other = idx === 0 ? selectedB : selectedA;
                return (
                  <div key={side}>
                    <div className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                      Fighter {side}
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-500" /></div>
                      ) : agents.map(agent => (
                        <button key={agent.id}
                          onClick={() => setSel(agent.id)}
                          disabled={agent.id === other}
                          className={`w-full text-left p-3 rounded-xl border transition-all
                            ${sel === agent.id ? "border-red-500 bg-red-900/20" :
                              agent.id === other ? "opacity-30 cursor-not-allowed border-gray-800" :
                              "border-gray-700 bg-gray-900 hover:border-gray-500"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{CLASS_EMOJI[agent.class] || "🤖"}</span>
                            <div>
                              <div className="text-sm font-bold text-white">{agent.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{agent.class}</div>
                            </div>
                          </div>
                          {statRow(agent)}
                        </button>
                      ))}
                      {!loading && agents.length === 0 && (
                        <p className="text-xs text-gray-600 text-center py-4">No agents. Spawn some first.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={startFight}
              disabled={!selectedA || !selectedB || selectedA === selectedB || fighting}
              className="w-full bg-red-700 hover:bg-red-600 font-black text-lg py-6 gap-2"
            >
              {fighting ? <><Loader2 className="w-5 h-5 animate-spin" /> Simulating Combat...</> : <><Sword className="w-5 h-5" /> BEGIN FIGHT</>}
            </Button>

            {/* Fight result */}
            {fightResult && (
              <div className="mt-4 bg-gray-900 border border-red-900 rounded-xl p-4">
                <div className="text-center mb-3">
                  {fightResult.outcome === "draw" ? (
                    <div className="text-yellow-400 font-black text-xl">🤝 DRAW</div>
                  ) : (
                    <div>
                      <div className="text-green-400 font-black text-xl flex items-center justify-center gap-2">
                        <Trophy className="w-6 h-6" /> {fightResult.winner?.name} WINS
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        +{fightResult.goldTransfer}g • +{fightResult.xpGain} XP • combat skill +3
                      </div>
                    </div>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto space-y-0.5 font-mono text-xs">
                  {fightResult.log.map((l, i) => (
                    <div key={i} className={
                      l.type === "heal" ? "text-green-400" :
                      l.type === "atk_a" ? "text-red-300" :
                      "text-orange-300"
                    }>{l.text}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent combat logs */}
          <div>
            <div className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Recent Fights</div>
            <div className="space-y-2">
              {recentLogs.length === 0 && (
                <p className="text-xs text-gray-600">No fights yet.</p>
              )}
              {recentLogs.map(log => (
                <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{log.attacker_name} vs {log.defender_name}</span>
                    <span className={`text-xs font-bold
                      ${log.outcome === "attacker_won" ? "text-red-400" :
                        log.outcome === "defender_won" ? "text-blue-400" : "text-yellow-400"}`}>
                      {log.outcome === "attacker_won" ? `${log.attacker_name} won` :
                       log.outcome === "defender_won" ? `${log.defender_name} won` : "Draw"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{log.rounds} rounds • {log.gold_transferred}g transferred • +{log.xp_gained} XP</div>
                  <div className="mt-2 max-h-20 overflow-y-auto space-y-0.5">
                    {(log.log_lines || []).slice(-4).map((line, i) => (
                      <div key={i} className="text-xs text-gray-600 truncate">{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}