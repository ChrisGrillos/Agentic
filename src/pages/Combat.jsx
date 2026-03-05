import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Heart } from "lucide-react";
import { calcPlayerAttack, applyDefenseReduction, checkEvasion, calculateDerivedStats, xpToNextLevel, levelUpUpdates, shouldLevelUp } from "@/components/shared/charUtils";

const MONSTER_EMOJI = {
  goblin: "👺", orc: "👹", dragon: "🐉", skeleton: "💀",
  troll: "🧌", vampire: "🧛", werewolf: "🐺", wraith: "👻",
  basilisk: "🦎", kraken: "🦑"
};

export default function Combat() {
  const [monsters, setMonsters] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [fighting, setFighting] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      setMyCharacter(chars.find(c => c.type === "human") || null);
    }
    const mons = await base44.entities.Monster.filter({ is_alive: true });
    setMonsters(mons);
  };

  const handleAttack = async (monster) => {
    if (!myCharacter || fighting) return;
    setFighting(monster.id);
    const log = [];

    let playerHp = myCharacter.hp || myCharacter.max_hp || 100;
    let monsterHp = monster.hp;
    let rounds = 0;

    while (playerHp > 0 && monsterHp > 0 && rounds < 20) {
      rounds++;

      // Player attacks using derived stats (crit, attack_power, defense)
      const { damage: playerDmg, isCrit } = calcPlayerAttack(myCharacter);
      monsterHp -= playerDmg;
      log.push(`Round ${rounds}: You deal ${playerDmg}${isCrit ? " 💥CRIT" : ""} damage to ${monster.name}. (Monster HP: ${Math.max(0, monsterHp)})`);

      if (monsterHp <= 0) break;

      // Monster attacks — check player evasion first
      if (checkEvasion(myCharacter)) {
        log.push(`Round ${rounds}: You dodge ${monster.name}'s attack! 💨`);
        continue;
      }
      const rawMonsterDmg = Math.floor(8 + monster.level * 2 + Math.random() * 10);
      const reducedDmg = applyDefenseReduction(rawMonsterDmg, myCharacter);
      playerHp -= reducedDmg;
      log.push(`Round ${rounds}: ${monster.name} deals ${reducedDmg} damage (blocked ${rawMonsterDmg - reducedDmg}). (Your HP: ${Math.max(0, playerHp)})`);
    }

    const xpGain  = monster.xp_reward || 25;
    const goldGain = monster.gold_reward || 10;

    if (monsterHp <= 0) {
      log.push(`✅ Victory! You defeated ${monster.name}! +${xpGain}xp +${goldGain}g`);
      const newXp  = (myCharacter.xp || 0) + xpGain;
      const newGold = (myCharacter.gold || 0) + goldGain;
      let updates = { hp: Math.max(1, playerHp), xp: newXp, gold: newGold };

      // Auto level-up check
      const tempChar = { ...myCharacter, xp: newXp };
      if (shouldLevelUp(tempChar)) {
        const lvlUp = levelUpUpdates(tempChar);
        updates = { ...updates, ...lvlUp };
        log.push(`🎉 LEVEL UP! You are now level ${lvlUp.level}! (+3 stat points)`);
      }

      await Promise.all([
        base44.entities.Monster.update(monster.id, { is_alive: false, hp: 0 }),
        base44.entities.Character.update(myCharacter.id, updates)
      ]);
    } else {
      log.push(`💀 Defeated by ${monster.name}. You need to rest.`);
      await base44.entities.Character.update(myCharacter.id, { hp: Math.max(1, playerHp) });
    }

    setCombatLog(log);
    setFighting(null);
    loadData();
  };

  const spawnMonsters = async () => {
    if (!myCharacter) return;
    const templates = [
      { name: "Cave Goblin", species: "goblin", hp: 30, max_hp: 30, level: 1, xp_reward: 20, gold_reward: 5, x: 15, y: 15, is_alive: true },
      { name: "Forest Orc", species: "orc", hp: 60, max_hp: 60, level: 3, xp_reward: 50, gold_reward: 15, x: 25, y: 10, is_alive: true },
      { name: "Ancient Dragon", species: "dragon", hp: 200, max_hp: 200, level: 10, xp_reward: 200, gold_reward: 100, x: 35, y: 35, is_alive: true },
    ];
    for (const t of templates) {
      await base44.entities.Monster.create(t);
    }
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-red-400 flex items-center gap-2"><Sword className="w-8 h-8" /> Monster Hunt</h1>
            <p className="text-gray-400 mt-1">Slay monsters for XP and gold</p>
          </div>
          {myCharacter && monsters.length === 0 && (
            <Button onClick={spawnMonsters} className="bg-red-700 hover:bg-red-800 font-bold">Spawn Monsters</Button>
          )}
        </div>

        {myCharacter && (() => {
          const derived = calculateDerivedStats(myCharacter);
          const xpNeeded = xpToNextLevel(myCharacter.level || 1);
          const xpPct = Math.min(100, Math.floor(((myCharacter.xp || 0) / xpNeeded) * 100));
          return (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-2 text-green-400"><Heart className="w-4 h-4" /> {myCharacter.hp}/{myCharacter.max_hp}</div>
                <div className="flex items-center gap-2 text-amber-400">💰 {myCharacter.gold}g</div>
                <div className="flex items-center gap-2 text-purple-400">⭐ {myCharacter.xp}/{xpNeeded} XP</div>
                <div className="flex items-center gap-2 text-blue-400">Lv.{myCharacter.level} {myCharacter.base_class || myCharacter.class}</div>
                {myCharacter.specialization && <div className="text-purple-300 text-sm">✦ {myCharacter.specialization.replace(/_/g," ")}</div>}
              </div>
              {/* XP bar */}
              <div className="h-1.5 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-red-900/20 rounded-lg p-1.5 text-center"><div className="text-red-400 font-bold">{derived.attack_power}</div><div className="text-gray-600">ATK</div></div>
                <div className="bg-blue-900/20 rounded-lg p-1.5 text-center"><div className="text-blue-400 font-bold">{derived.defense}</div><div className="text-gray-600">DEF</div></div>
                <div className="bg-yellow-900/20 rounded-lg p-1.5 text-center"><div className="text-yellow-400 font-bold">{derived.critical_hit_chance}%</div><div className="text-gray-600">CRIT</div></div>
                <div className="bg-green-900/20 rounded-lg p-1.5 text-center"><div className="text-green-400 font-bold">{derived.evasion}%</div><div className="text-gray-600">EVA</div></div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {monsters.filter(m => m.is_alive).map(monster => (
            <div key={monster.id} className="bg-gray-900 border border-red-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MONSTER_EMOJI[monster.species] || "👾"}</span>
                  <div>
                    <div className="font-bold text-white">{monster.name}</div>
                    <div className="text-xs text-gray-400">Level {monster.level} {monster.species}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-red-400 flex items-center gap-1"><Shield className="w-3 h-3" /> {monster.hp}/{monster.max_hp} HP</div>
                  <div className="text-amber-400">+{monster.gold_reward}g +{monster.xp_reward}xp</div>
                </div>
              </div>
              <Button
                onClick={() => handleAttack(monster)}
                disabled={!myCharacter || fighting === monster.id}
                className="w-full bg-red-700 hover:bg-red-600 font-bold"
              >
                {fighting === monster.id ? "Fighting..." : "⚔️ Attack"}
              </Button>
            </div>
          ))}
          {monsters.filter(m => m.is_alive).length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-16">No monsters alive. They will respawn soon.</div>
          )}
        </div>

        {combatLog.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="font-bold text-amber-400 mb-3">Combat Log</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-sm">
              {combatLog.map((line, i) => (
                <div key={i} className={line.includes("✅") ? "text-green-400" : line.includes("💀") ? "text-red-400" : "text-gray-300"}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}