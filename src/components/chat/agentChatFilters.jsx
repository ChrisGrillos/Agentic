/**
 * Agent-aware chat filtering and summarization.
 */

/**
 * Given a list of messages and a filter mode, return the messages to show.
 * myCharacterId is used to detect "direct replies".
 */
export function applyAgentFilter(messages, filterMode, myCharacterId, myGuildId, myPartyId) {
  switch (filterMode) {
    case "show_all":
      return messages;

    case "humans_only":
      return messages.filter(m =>
        m.speaker_type === "human" ||
        m.speaker_type === "system" ||
        m.channel_type === "system"
      );

    case "humans_direct":
      return messages.filter(m => {
        if (m.speaker_type === "human" || m.speaker_type === "system") return true;
        // Show agent/npc if it directly mentions or replies to the player
        if (m.is_direct_reply_to_player) return true;
        // Show party/guild channel agents
        if (m.party_id && m.party_id === myPartyId) return true;
        if (m.guild_id && m.guild_id === myGuildId) return true;
        return false;
      });

    case "companion_only":
      return messages.filter(m => {
        if (m.speaker_type === "human" || m.speaker_type === "system") return true;
        if (m.is_companion) return true;
        return false;
      });

    case "hide_ambient":
      return messages.filter(m => !m.is_ambient);

    case "summarize":
      return summarizeAgentMessages(messages, myCharacterId);

    case "world_life_off":
      return messages.filter(m =>
        !m.is_ambient &&
        m.speaker_type !== "npc" &&
        (m.speaker_type !== "ai_agent" || m.is_direct_reply_to_player)
      );

    default:
      return messages;
  }
}

/**
 * Collapse runs of agent/ambient messages into summary rows.
 * Returns a new message list where groups of agent/ambient messages
 * may be collapsed into a single summary message with isSummary=true.
 */
export function summarizeAgentMessages(messages, myCharacterId) {
  const result = [];
  let agentRun = [];

  const flushRun = () => {
    if (!agentRun.length) return;
    if (agentRun.length <= 2) {
      result.push(...agentRun);
    } else {
      // Summarize
      const speakers = [...new Set(agentRun.map(m => m.speaker_name))];
      const channels = [...new Set(agentRun.map(m => m.channel_type))];
      // Try to detect a topic from the most common words
      const words = agentRun.flatMap(m => (m.message || "").split(/\s+/).filter(w => w.length > 4));
      const freq = {};
      words.forEach(w => freq[w.toLowerCase()] = (freq[w.toLowerCase()] || 0) + 1);
      const topic = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "various topics";
      const summary = `${speakers.length} agent${speakers.length > 1 ? "s" : ""} discussing ${topic}.`;

      result.push({
        id: `summary_${agentRun[0].id}`,
        isSummary: true,
        summaryCount: agentRun.length,
        summaryMessages: agentRun,
        speaker_name: "Agent Chatter",
        speaker_type: "system",
        channel_type: channels[0] || "agent",
        message: summary,
        timestamp: agentRun[agentRun.length - 1].timestamp,
      });
    }
    agentRun = [];
  };

  for (const msg of messages) {
    const isAgentAmbient =
      (msg.speaker_type === "ai_agent" || msg.speaker_type === "npc") &&
      !msg.is_direct_reply_to_player &&
      msg.is_ambient;

    if (isAgentAmbient) {
      agentRun.push(msg);
    } else {
      flushRun();
      result.push(msg);
    }
  }
  flushRun();
  return result;
}

/**
 * Convert a raw ChatMessage entity (old format) into the enriched message format.
 */
export function enrichMessage(msg) {
  return {
    id:                      msg.id,
    speaker_id:              msg.character_id || msg.speaker_id,
    speaker_name:            msg.character_name || msg.speaker_name || "Unknown",
    speaker_type:            msg.character_type || msg.speaker_type || "human",
    channel_type:            msg.channel || msg.channel_type || "say",
    message:                 msg.message || "",
    timestamp:               msg.created_date || msg.timestamp || new Date().toISOString(),
    zone_id:                 msg.zone_id || null,
    party_id:                msg.party_id || null,
    guild_id:                msg.guild_id || null,
    is_private:              msg.is_private || false,
    is_ambient:              msg.is_ambient || msg.character_type === "npc",
    is_combat:               msg.is_combat || msg.channel === "combat",
    is_trade:                msg.is_trade  || msg.channel === "trade",
    is_direct_reply_to_player: msg.is_direct_reply_to_player || false,
    is_companion:            msg.is_companion || false,
    importance:              msg.importance || "normal",
    tell_target:             msg.tell_target || null,
    custom_channel:          msg.custom_channel || null,
    x:                       msg.x,
    y:                       msg.y,
    // keep raw for reference
    _raw: msg,
  };
}