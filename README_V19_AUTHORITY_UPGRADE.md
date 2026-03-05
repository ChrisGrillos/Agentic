# v1.9 Authority Upgrade - Required Base44 Entities

Create these entities in Base44 before publishing:

## SecurityLog
- `timestamp` (datetime)
- `action` (text)
- `actor_user_id` (text)
- `actor_email` (text)
- `actor_role` (text)
- `ip` (text)
- `reason` (text)
- `idempotency_key` (text)
- `proposal_id` (text)
- `character_id` (text)
- `override_action` (text)
- `target_id` (text)
- `result_json` (json)

## CombatSession
- `status` (text)
- `resolution` (text)
- `turn` (text)
- `round` (number)
- `actor_character_id` (text)
- `actor_name` (text)
- `actor_hp` (number)
- `actor_max_hp` (number)
- `actor_energy` (number)
- `monster_id` (text)
- `monster_name` (text)
- `monster_species` (text)
- `monster_hp` (number)
- `monster_max_hp` (number)
- `cooldowns` (json)
- `effects` (json)
- `combat_log` (json)
- `reward` (json)
- `last_intent` (text)
- `last_intent_at` (datetime)
- `nonce` (text)

## MonsterSpawn
- `monster_name` (text)
- `species` (text)
- `level` (number)
- `max_hp` (number)
- `zone_id` (text)
- `x` (number)
- `y` (number)
- `respawn_seconds` (number)
- `active_monster_id` (text)
- `last_spawned_at` (datetime)
- `next_respawn_at` (datetime)

## AgentRoutine
- `agent_id` (text)
- `mode` (text) // `roam`, `job`, etc.
- `meta` (json)

## Character (compat)
- Keep both:
  - `feats` (canonical)
  - `talents` (legacy mirror, remove in next release)

## Governance
- Keep proposal tally fields server-updated only:
  - `votes_for`, `votes_against`, `weighted_for`, `weighted_against`
