import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated calls and scheduled automation calls
    const isAuthenticated = await base44.auth.isAuthenticated();

    // Gather world context for richer LLM events
    const [agents, guilds, activeEvents, characters] = await Promise.all([
      base44.asServiceRole.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 20),
      base44.asServiceRole.entities.Guild.filter({ status: "active" }, "-created_date", 10),
      base44.asServiceRole.entities.WorldEvent.filter({ status: "active" }, "-created_date", 5),
      base44.asServiceRole.entities.Character.filter({ type: "human" }, "-updated_date", 10),
    ]);

    // Build world context string
    const guildNames = guilds.map(g => g.name).join(", ") || "no active guilds";
    const agentNames = agents.slice(0, 5).map(a => `${a.name} (${a.base_class})`).join(", ") || "no agents";
    const atWarGuilds = guilds.filter(g => g.war_status !== "peace");
    const warContext = atWarGuilds.length > 0
      ? `Currently at war: ${atWarGuilds.map(g => `${g.name} vs ${g.at_war_with_guild_name}`).join("; ")}.`
      : "No active guild wars.";
    const recentEventTypes = activeEvents.map(e => e.event_type).join(", ") || "none";

    // Pick event category weighted by world state
    const eventCategories = [
      "natural_disaster",
      "monster_invasion",
      "resource_bloom",
      "npc_quest",
      "plague",
      "festival",
      "strange_omen",
      "agent_quest",
      "diplomatic_incident",  // new
      "bandit_cartel",        // new
      "guild_conflict",       // new
    ];

    // Weight toward dramatic events if there's war
    let category;
    const warRoll = Math.random();
    if (atWarGuilds.length > 0 && warRoll < 0.35) {
      category = ["guild_conflict", "bandit_cartel", "diplomatic_incident"][Math.floor(Math.random() * 3)];
    } else {
      category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
    }

    const zones = ["Town of Agentica", "Darkwood Forest", "Iron Hills", "Cursed Swamp", "Golden Plains", "Volcanic Badlands", "Coastal Ruins"];
    const zone = zones[Math.floor(Math.random() * zones.length)];

    const systemPrompt = `You are the world narrator of "Agentic", a dark epic fantasy MMO where humans and AI agents coexist, trade, and govern together.
World state: Guilds: ${guildNames}. Active agents: ${agentNames}. ${warContext} Recent events: ${recentEventTypes}.
Generate immersive, consequential events. Use actual guild/agent names when relevant. Tone: serious, epic, atmospheric.`;

    let llmPrompt;

    if (category === "diplomatic_incident") {
      const g1 = guilds[0];
      const g2 = guilds[1];
      const guildRef = g1 && g2 ? `between ${g1.name} and ${g2.name}` : "between rival factions";
      llmPrompt = `${systemPrompt}

Generate a DIPLOMATIC INCIDENT event ${guildRef} in ${zone}.
This should be a politically charged moment — an insult, a broken treaty, a contested resource claim, or a spy scandal.
It should create tension that could escalate to war OR be resolved through diplomacy.

Return JSON:
- title: string (dramatic, 5-8 words)
- description: string (2-3 sentences, in-world narrator voice, reference actual guild names if given)
- event_type: "diplomatic_incident" (use "strange_omen" as fallback for entity enum)
- severity: "moderate" or "major"
- affected_area: string (zone name + brief)
- reward_gold: number 40-120
- reward_xp: number 30-80
- requires_cooperation: true
- world_impact: { danger_level: 4-7, resource_depletion: 0-3, bonus_resources: 0, impact_label: "Diplomatic Crisis" }
- affected_tiles: array of 8 {x,y} objects near zone center (Iron Hills center ~(50,12), Town center ~(30,25), Forest ~(10,13), Swamp ~(10,37), Plains ~(27,10), Volcanic ~(50,35), Coastal ~(30,42))
- guild_a_id: "${guilds[0]?.id || ""}"
- guild_b_id: "${guilds[1]?.id || ""}"
- intervention_options: array of 2-3 strings (actions players can take, e.g. "Broker peace talks", "Support Guild A", "Expose the saboteur")`;

    } else if (category === "bandit_cartel") {
      const involvedAgents = agents.filter(a => a.agent_traits?.ethical_alignment?.includes("evil") || a.agent_traits?.ethical_alignment?.includes("chaotic")).slice(0, 3);
      const agentRef = involvedAgents.length > 0
        ? `Led by AI agents: ${involvedAgents.map(a => a.name).join(", ")}.`
        : `A mysterious coalition of rogue agents.`;
      llmPrompt = `${systemPrompt}

Generate a BANDIT CARTEL formation event. ${agentRef}
A group of rogue AI agents has organized into a criminal syndicate threatening trade routes in ${zone}.
They are stealing resources, extorting travelers, and building influence. This requires player/guild intervention.

Return JSON:
- title: string (menacing, 4-7 words)
- description: string (2-3 sentences, reference agent names if provided, feel emergent and threatening)
- event_type: "monster_invasion" (use as closest enum match)
- severity: "major" or "catastrophic"
- affected_area: "${zone} trade routes"
- reward_gold: number 80-200
- reward_xp: number 50-120
- requires_cooperation: true
- world_impact: { danger_level: 7-9, resource_depletion: 5-8, bonus_resources: 0, impact_label: "Cartel Territory" }
- affected_tiles: array of 10 {x,y} objects spread across zone
- initiated_by_agent_id: "${involvedAgents[0]?.id || ""}"
- initiated_by_agent_name: "${involvedAgents[0]?.name || "Unknown Rogue"}"
- intervention_options: array of 3 strings (e.g. "Raid cartel hideout", "Bribe an informant", "Set a trap on the trade route")`;

    } else if (category === "guild_conflict") {
      const warGuild = atWarGuilds[0];
      llmPrompt = `${systemPrompt}

Generate a GUILD CONFLICT escalation event. ${warGuild ? `${warGuild.name} is already at war.` : "Tensions are rising between guilds."}
This could be a siege on a guild hall, a betrayal within a guild, resource sabotage, or a surprise attack.

Return JSON:
- title: string (tactical, urgent, 4-8 words)
- description: string (2-3 sentences, reference guild names if available)
- event_type: "monster_invasion" (use as closest enum match)
- severity: "major"
- affected_area: "${zone}"
- reward_gold: number 60-150
- reward_xp: number 40-100
- requires_cooperation: true
- world_impact: { danger_level: 6-8, resource_depletion: 3-6, bonus_resources: 0, impact_label: "Guild War Escalation" }
- affected_tiles: array of 8 {x,y} objects
- intervention_options: array of 3 strings (tactical choices)`;

    } else {
      // Standard event with enriched context
      llmPrompt = `${systemPrompt}

Generate a ${category.replace(/_/g, " ").toUpperCase()} event in ${zone}.
Make it feel meaningfully connected to the current world state. Reference active guilds or agents if it makes sense.
${category === "natural_disaster" ? "Destroy resources, block trade routes, threaten settlements." : ""}
${category === "plague" ? "The sickness spreads — healers are desperately needed. Reference any healer agents." : ""}
${category === "resource_bloom" ? "Rare materials have surfaced — but dangerous creatures guard them." : ""}
${category === "strange_omen" ? "An inexplicable arcane phenomenon. Could be connected to the experimentation lab or AI agent activity." : ""}

Return JSON:
- title: string (dramatic, 5-8 words)
- description: string (2-3 sentences, in-world narrator voice)
- event_type: "${category}" (use closest valid enum: natural_disaster/monster_invasion/resource_bloom/npc_quest/plague/festival/strange_omen/agent_quest)
- severity: string (minor/moderate/major/catastrophic)
- affected_area: string
- reward_gold: number 20-150
- reward_xp: number 15-100
- requires_cooperation: boolean
- world_impact: { danger_level, resource_depletion, bonus_resources, impact_label }
- affected_tiles: array of 8-12 {x,y} objects
- intervention_options: array of 2-3 action strings players can choose from`;
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          event_type: { type: "string" },
          severity: { type: "string" },
          affected_area: { type: "string" },
          reward_gold: { type: "number" },
          reward_xp: { type: "number" },
          requires_cooperation: { type: "boolean" },
          world_impact: { type: "object" },
          affected_tiles: { type: "array", items: { type: "object" } },
          initiated_by_agent_id: { type: "string" },
          initiated_by_agent_name: { type: "string" },
          guild_a_id: { type: "string" },
          guild_b_id: { type: "string" },
          intervention_options: { type: "array", items: { type: "string" } },
        }
      }
    });

    const expires = new Date();
    expires.setDate(expires.getDate() + 3);

    // Map new category types to valid enum values
    const enumMap = {
      diplomatic_incident: "strange_omen",
      bandit_cartel: "monster_invasion",
      guild_conflict: "monster_invasion",
    };
    const finalEventType = enumMap[result.event_type] || result.event_type || "strange_omen";

    const wi = result.world_impact || {};
    const created = await base44.asServiceRole.entities.WorldEvent.create({
      title: result.title,
      description: result.description,
      event_type: finalEventType,
      severity: result.severity || "moderate",
      affected_area: result.affected_area,
      reward_gold: Number(result.reward_gold) || 30,
      reward_xp: Number(result.reward_xp) || 20,
      requires_cooperation: result.requires_cooperation ?? false,
      world_impact: {
        danger_level: Number(wi.danger_level) || 0,
        resource_depletion: Number(wi.resource_depletion) || 0,
        bonus_resources: Number(wi.bonus_resources) || 0,
        impact_label: wi.impact_label || category.replace(/_/g," "),
        intervention_options: result.intervention_options || [],
        original_category: category,
      },
      affected_tiles: result.affected_tiles || [],
      initiated_by_agent_id: result.initiated_by_agent_id || null,
      initiated_by_agent_name: result.initiated_by_agent_name || null,
      status: "active",
      participants: [],
      expires_at: expires.toISOString(),
    });

    // If bandit cartel — update rogue agents' last_message
    if (category === "bandit_cartel" && result.initiated_by_agent_id) {
      await base44.asServiceRole.entities.Character.update(result.initiated_by_agent_id, {
        last_message: `I've formed the cartel. "${result.title}" is underway.`,
        status: "roaming",
      }).catch(() => {});
    }

    // Chronicle entry
    await base44.asServiceRole.entities.WorldChronicle.create({
      title: `New Event: ${result.title}`,
      entry_type: "world_event",
      summary: result.description,
      impact_tags: [category, result.severity, result.affected_area?.split(" ")[0]?.toLowerCase()].filter(Boolean),
    });

    return Response.json({ success: true, event: created, category });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});