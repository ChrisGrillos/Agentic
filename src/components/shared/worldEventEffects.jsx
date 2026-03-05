export function getTileEffects(activeEvents = [], x, y) {
  let dangerLevel = 0;
  let healPerMove = 0;
  let resourceBonus = 0;
  let lawEffect = null;

  for (const event of activeEvents || []) {
    const tiles = Array.isArray(event.affected_tiles) ? event.affected_tiles : [];
    const hit = tiles.some((t) => Number(t?.x) === Number(x) && Number(t?.y) === Number(y));
    if (!hit) continue;

    const impact = event.world_impact || {};
    dangerLevel += Number(impact.danger_level || 0);
    resourceBonus += Number(impact.bonus_resources || 0);

    if (event.event_type === "festival" || /healing/i.test(String(impact.impact_label || ""))) {
      healPerMove += 2;
    }

    if (impact.law_effect) {
      lawEffect = impact.law_effect;
    } else if (/law|edict|governance/i.test(String(impact.impact_label || ""))) {
      lawEffect = "active";
    }
  }

  return {
    dangerLevel,
    resourceBonus,
    healPerMove,
    lawEffect,
    energyPenalty: dangerLevel >= 7 ? 4 : dangerLevel >= 4 ? 2 : 0,
  };
}
