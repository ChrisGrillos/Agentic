export type CombatActor = {
  id: string;
  name?: string;
  hp?: number;
  max_hp?: number;
  attack_power?: number;
  defense?: number;
  evasion?: number;
  critical_hit_chance?: number;
};

export type Ability = {
  id?: string;
  name?: string;
  effect_type?: string;
  effect_magnitude?: number;
  energy_cost?: number;
  cooldown_rounds?: number;
};

export function calcAttackDamage(attacker: CombatActor, defender: CombatActor, ability?: Ability) {
  const base = ability?.effect_magnitude || 100;
  const raw = base + (attacker.attack_power || 0) - (defender.defense || 0) * 0.5;
  const critRoll = Math.random() * 100;
  const evadeRoll = Math.random() * 100;
  const evaded = evadeRoll < (defender.evasion || 0);
  if (evaded) {
    return { damage: 0, evaded: true, isCrit: false };
  }
  const isCrit = critRoll < (attacker.critical_hit_chance || 0);
  const damage = Math.max(1, Math.floor(raw * (isCrit ? 1.5 : 1)));
  return { damage, evaded: false, isCrit };
}

export function monsterCombatStats(monster: any): CombatActor {
  const level = Number(monster?.level || 1);
  return {
    id: String(monster?.id || "monster"),
    name: monster?.name || "Monster",
    hp: Number(monster?.hp || 1),
    max_hp: Number(monster?.max_hp || monster?.hp || 1),
    attack_power: level * 8 + 6,
    defense: level * 3,
    evasion: 4 + level,
    critical_hit_chance: 4 + Math.floor(level / 2),
  };
}

export function playerCombatStats(character: any): CombatActor {
  return {
    id: String(character?.id || "player"),
    name: character?.name || "Player",
    hp: Number(character?.hp || 1),
    max_hp: Number(character?.max_hp || 100),
    attack_power: Number(character?.derived_stats?.attack_power || character?.attack_power || 10),
    defense: Number(character?.derived_stats?.defense || character?.defense || 0),
    evasion: Number(character?.derived_stats?.evasion || character?.evasion || 0),
    critical_hit_chance: Number(character?.derived_stats?.critical_hit_chance || character?.critical_hit_chance || 5),
  };
}

export function xpReward(monster: any) {
  return Number(monster?.xp_reward || (Number(monster?.level || 1) * 20));
}

export function goldReward(monster: any) {
  return Number(monster?.gold_reward || (Number(monster?.level || 1) * 8));
}

