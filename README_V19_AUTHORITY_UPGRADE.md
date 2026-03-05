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

## CombatSession (directional combat additions)
- `next_monster_swing_side` (text)
- `next_monster_windup_at` (datetime)
- `guard_state` (text)
- `guard_vector` (json)
- `guard_at` (datetime)
- `last_mouse_vector` (json)
- `last_guard_vector` (json)
- `did_player_attack` (boolean)

## Guild (siege contract additions)
- `siege_prime_start_utc` (number)
- `siege_prime_duration_hours` (number)
- `siege_status` (text)
- `siege_declared_at` (datetime)
- `siege_starts_at` (datetime)
- `siege_reason` (text)
- `city_components` (json)
- `storage_risk` (text)
- `tax_efficiency_penalty` (number)

## Character (agent cognition additions)
- `social_memory` (json)
- `goal_stack` (json)
- `risk_profile` (json)
- `alignment_profile` (json)
- `last_reflection_at` (datetime)

## AgentRoutine (expanded contract)
- `routine_state` (json)
- `goal_stack` (json)
- `social_memory` (json)
- `last_reflection` (datetime)

## CreatorClipMarker (creator pipeline)
- `marker_type` (text)
- `title` (text)
- `summary` (text)
- `context` (json)
- `created_by` (text)
- `created_at` (datetime)

## New Functions Added
- `siegeAction` - prime-time windows, siege declarations, siege raid damage, rebuild, resolution.
- `creatorEventHook` - creates creator clip markers and optional Discord world webhook posts.

## Combat Intent Payload Contract
Client should send to `combatAction`:
- `intent`: `swing_left|swing_right|guard_left|guard_right|feint|ability_cast|attack|retreat`
- `mouse_vector`: `{x:number,y:number}` normalized direction from cursor
- `guard_vector`: `{x:number,y:number}` normalized guard plane
- `timestamp`: unix ms from client
