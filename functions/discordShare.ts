import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { webhookUrl, recordingId, metadata, title, description } = await req.json();

    if (!webhookUrl) {
      return Response.json({ error: 'No webhook URL provided' }, { status: 400 });
    }

    // Build a rich Discord embed
    const embed = {
      title: title || `⚔️ Agentic Recording`,
      description: description || "A moment from the living world.",
      color: metadata?.mode === "passive" ? 0x00b4d8 : 0xf59e0b,
      fields: [],
      footer: { text: "Agentic — Where Humans and AI Coexist" },
      timestamp: new Date().toISOString(),
    };

    if (metadata) {
      if (metadata.zone_name) embed.fields.push({ name: "📍 Zone", value: `${metadata.zone_emoji || ""} ${metadata.zone_name}`, inline: true });
      if (metadata.level)     embed.fields.push({ name: "⚡ Level", value: String(metadata.level), inline: true });
      if (metadata.class)     embed.fields.push({ name: "🗡️ Class", value: metadata.class, inline: true });
      if (metadata.alignment) embed.fields.push({ name: "⚖️ Alignment", value: metadata.alignment.replace(/_/g, " "), inline: true });
      if (metadata.specialization) embed.fields.push({ name: "✦ Spec", value: metadata.specialization.replace(/_/g, " "), inline: true });
      if (metadata.duration_seconds) embed.fields.push({ name: "⏱️ Duration", value: `${metadata.duration_seconds}s`, inline: true });
      if (metadata.subject_name && metadata.mode === "passive") {
        embed.fields.push({ name: "🤖 Agent Observed", value: metadata.subject_name, inline: true });
      }
    }

    const payload = {
      username: "Agentic World",
      avatar_url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=128&h=128&fit=crop",
      embeds: [embed],
      content: metadata?.recorder_name ? `📹 *${metadata.recorder_name}* captured a moment from Agentic.` : "📹 A new recording from Agentic.",
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Discord error: ${errText}` }, { status: 502 });
    }

    // Update recording record
    if (recordingId) {
      await base44.entities.Recording.update(recordingId, {
        discord_shared: true,
        status: "exported",
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});