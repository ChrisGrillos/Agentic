import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Flower2, Scroll, Skull, PartyPopper, Eye, Loader2, Swords } from "lucide-react";

const TYPE_CONFIG = {
  natural_disaster: { icon: "🌊", color: "border-blue-700 bg-blue-900/20", label: "Natural Disaster", iconC: Zap },
  monster_invasion: { icon: "👹", color: "border-red-700 bg-red-900/20", label: "Monster Invasion", iconC: Skull },
  resource_bloom: { icon: "🌿", color: "border-green-700 bg-green-900/20", label: "Resource Bloom", iconC: Flower2 },
  npc_quest: { icon: "📜", color: "border-amber-700 bg-amber-900/20", label: "NPC Quest", iconC: Scroll },
  plague: { icon: "☣️", color: "border-yellow-700 bg-yellow-900/20", label: "Plague", iconC: Skull },
  festival: { icon: "🎉", color: "border-pink-700 bg-pink-900/20", label: "Festival", iconC: PartyPopper },
  strange_omen: { icon: "🔮", color: "border-purple-700 bg-purple-900/20", label: "Strange Omen / Diplomatic", iconC: Eye },
  agent_quest: { icon: "🤖", color: "border-cyan-700 bg-cyan-900/20", label: "Agent Quest", iconC: Eye },
};

const SEVERITY_COLOR = {
  minor: "text-green-400",
  moderate: "text-yellow-400",
  major: "text-orange-400",
  catastrophic: "text-red-400",
};

const STATUS_BADGE = {
  incoming: "bg-yellow-900 text-yellow-300",
  active: "bg-red-900 text-red-300",
  resolved: "bg-gray-800 text-gray-400",
};

export default function WorldEvents() {
  const [events, setEvents] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("active");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      setMyCharacter(chars.find(c => c.type === "human") || chars[0] || null);
    }
    const all = await base44.entities.WorldEvent.list("-created_date", 30);
    setEvents(all);
    setLoading(false);
  };

  const generateEvent = async () => {
    setGenerating(true);
    // Use the rich context-aware backend function
    await base44.functions.invoke("generateWorldEvent", {});
    loadData();
    setGenerating(false);
  };

  const respond = async (event) => {
    if (!myCharacter) return;
    if (event.participants?.includes(myCharacter.id)) return;
    const newParticipants = [...(event.participants || []), myCharacter.id];
    await base44.entities.WorldEvent.update(event.id, { participants: newParticipants });
    await base44.entities.Character.update(myCharacter.id, {
      gold: (myCharacter.gold || 0) + event.reward_gold,
      xp: (myCharacter.xp || 0) + event.reward_xp,
    });
    // Auto-resolve if enough participants and generate NPC quest follow-up
    if (newParticipants.length >= 2 && event.status === "active") {
      const outcome = await base44.integrations.Core.InvokeLLM({
        prompt: `The world event "${event.title}" in the MMO Agentic has been responded to by ${newParticipants.length} citizens. Generate a brief outcome (1-2 sentences, in-world dramatic tone) and optionally spawn a follow-up NPC quest.
Return JSON: outcome (string), spawn_quest (boolean), quest_title (string or null), quest_description (string or null).`,
        response_json_schema: {
          type: "object",
          properties: {
            outcome: { type: "string" },
            spawn_quest: { type: "boolean" },
            quest_title: { type: "string" },
            quest_description: { type: "string" },
          }
        }
      });
      await base44.entities.WorldEvent.update(event.id, { status: "resolved", outcome: outcome.outcome });
      if (outcome.spawn_quest && outcome.quest_title) {
        const expires = new Date(); expires.setDate(expires.getDate() + 3);
        await base44.entities.WorldEvent.create({
          title: outcome.quest_title,
          description: outcome.quest_description,
          event_type: "npc_quest",
          severity: "minor",
          status: "active",
          triggered_by_proposal_id: event.id,
          affected_area: event.affected_area,
          affected_tiles: event.affected_tiles,
          reward_gold: Math.round((event.reward_gold || 20) * 0.6),
          reward_xp: Math.round((event.reward_xp || 15) * 0.6),
          participants: [],
          requires_cooperation: false,
          expires_at: expires.toISOString(),
        });
      }
      await base44.entities.WorldChronicle.create({
        title: `Event Resolved: ${event.title}`,
        entry_type: "world_event",
        summary: outcome.outcome,
        impact_tags: [event.event_type, "resolved"],
      });
    }
    loadData();
  };

  const filtered = events.filter(e => filter === "all" ? true : e.status === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-cyan-400">⚡ World Events</h1>
            <p className="text-gray-400 mt-1">Dynamic events that shake Agentic — respond before time runs out</p>
          </div>
          <Button
            onClick={generateEvent}
            disabled={generating}
            className="bg-cyan-600 hover:bg-cyan-700 font-bold gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {generating ? "Generating..." : "Trigger Event"}
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {["active", "incoming", "resolved", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                ${filter === f ? "bg-cyan-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p>The world is calm… for now.</p>
            {myCharacter?.role !== undefined || true ? (
              <p className="mt-2 text-sm">Click "Trigger Event" to summon a world event via AI.</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(event => {
              const cfg = TYPE_CONFIG[event.event_type] || { icon: "❓", color: "border-gray-700", label: event.event_type };
              const alreadyJoined = event.participants?.includes(myCharacter?.id);
              return (
                <div key={event.id} className={`border rounded-xl p-5 ${cfg.color}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cfg.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-gray-400">{cfg.label}</span>
                          <span className="text-gray-600">·</span>
                          <span className={SEVERITY_COLOR[event.severity]}>{event.severity?.toUpperCase()}</span>
                          {event.requires_cooperation && (
                            <span className="bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">🤝 Coop Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[event.status]}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{event.description}</p>

                  {event.affected_area && (
                    <p className="text-xs text-gray-500 mb-3">📍 {event.affected_area}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <span className="text-amber-400">+{event.reward_gold}g</span>
                      <span className="text-purple-400">+{event.reward_xp} XP</span>
                      <span className="text-gray-500">{event.participants?.length || 0} responded</span>
                    </div>
                    {myCharacter && event.status === "active" && (
                      <Button
                        onClick={() => respond(event)}
                        disabled={alreadyJoined}
                        size="sm"
                        className={alreadyJoined
                          ? "bg-gray-700 text-gray-400 cursor-default"
                          : "bg-cyan-600 hover:bg-cyan-700 font-bold"
                        }
                      >
                        {alreadyJoined ? "✓ Responded" : "Respond"}
                      </Button>
                    )}
                  </div>

                  {event.world_impact?.impact_label && event.status === "active" && (
                    <div className="mt-2 flex gap-3 text-xs">
                      {event.world_impact.danger_level > 0 && (
                        <span className="text-red-400">⚠️ Danger +{event.world_impact.danger_level}</span>
                      )}
                      {event.world_impact.resource_depletion > 0 && (
                        <span className="text-orange-400">📉 Resources -{event.world_impact.resource_depletion}</span>
                      )}
                      {event.world_impact.bonus_resources > 0 && (
                        <span className="text-green-400">📈 Resources +{event.world_impact.bonus_resources}</span>
                      )}
                      <span className="text-gray-500">{event.world_impact.impact_label}</span>
                    </div>
                  )}
                  {event.initiated_by_agent_name && (
                    <div className="mt-2 text-xs text-cyan-400">🤖 Initiated by agent: {event.initiated_by_agent_name}</div>
                  )}

                  {/* Intervention Options */}
                  {event.world_impact?.intervention_options?.length > 0 && event.status === "active" && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Intervention Options</div>
                      <div className="flex flex-wrap gap-2">
                        {event.world_impact.intervention_options.map((opt, i) => (
                          <span key={i} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded-lg">
                            {["⚔️","🤝","🔍"][i % 3]} {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.world_impact?.original_category && event.world_impact.original_category !== event.event_type && (
                    <div className="mt-2 text-xs text-purple-400">
                      {event.world_impact.original_category === "diplomatic_incident" && "🏛️ Diplomatic Incident"}
                      {event.world_impact.original_category === "bandit_cartel" && "🗡️ Bandit Cartel"}
                      {event.world_impact.original_category === "guild_conflict" && "⚔️ Guild Conflict"}
                    </div>
                  )}

                  {event.outcome && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 italic">
                      Outcome: {event.outcome}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}