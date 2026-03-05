import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, AlertTriangle, FileText, MapPin, Sword, Package } from "lucide-react";
import { ZONES } from "@/components/shared/worldZones";

const THREAT_STYLES = {
  low:      "bg-green-900/40 border-green-800 text-green-300",
  moderate: "bg-yellow-900/40 border-yellow-800 text-yellow-300",
  high:     "bg-orange-900/40 border-orange-800 text-orange-300",
  critical: "bg-red-900/40 border-red-800 text-red-300",
};

const THREAT_ICON = { low: "🟢", moderate: "🟡", high: "🟠", critical: "🔴" };

export default function GuildIntelligencePanel({ guild, myCharacter }) {
  const [reports, setReports]       = useState([]);
  const [agents, setAgents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [scouting, setScouting]     = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [scoutTarget, setScoutTarget]       = useState("zone");

  const isLeader   = myCharacter && (guild.leader_character_id === myCharacter.id || guild.founder_character_id === myCharacter.id);
  const isMember   = myCharacter && guild.members?.some(m => m.character_id === myCharacter.id);
  const enemyGuild = guild.at_war_with_guild_id;

  useEffect(() => { loadData(); }, [guild.id]);

  const loadData = async () => {
    setLoading(true);
    const [rpts, chars] = await Promise.all([
      base44.entities.GuildIntelReport.filter({ guild_id: guild.id }, "-created_date", 20),
      base44.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 50),
    ]);
    setReports(rpts);
    // Only agents in this guild
    const guildMemberIds = (guild.members || []).map(m => m.character_id);
    setAgents(chars.filter(c => guildMemberIds.includes(c.id)));
    setLoading(false);
  };

  // ── GENERATE SCOUT REPORT (LLM) ──────────────────────────────────────────
  const handleScout = async (targetType, targetId, targetName, extraContext = "") => {
    setScouting(true);

    // Find best scout agent (highest skills)
    const scout = agents.sort((a, b) => {
      const aSc = (a.skills?.diplomacy || 1) + (a.skills?.research || 1) + (a.level || 1) * 2;
      const bSc = (b.skills?.diplomacy || 1) + (b.skills?.research || 1) + (b.level || 1) * 2;
      return bSc - aSc;
    })[0];

    const scoutName = scout?.name || myCharacter?.name || "Unknown Scout";
    const scoutLevel = scout?.level || myCharacter?.level || 1;

    const zone = targetType === "zone" ? ZONES.find(z => z.id === targetId) : null;
    const zoneContext = zone
      ? `Zone: ${zone.name}. Danger level: ${zone.danger}/10. Resources: ${zone.resources?.join(", ")}. Known threats: ${zone.encounter_types?.filter(e => !e.includes("npc")).join(", ")}.`
      : "";

    const prompt = `You are a spy/scout named ${scoutName} (level ${scoutLevel}) in the fantasy MMO "Agentic".
You are working for guild "${guild.name}" during ${guild.war_status !== "peace" ? `an active war against "${guild.at_war_with_guild_name}"` : "peacetime reconnaissance"}.

You just completed a scouting mission. Target: ${targetName} (type: ${targetType}).
${zoneContext}
${extraContext}

Generate a detailed intelligence report as if writing to your guild leader. Include:
1. Threat assessment (low/moderate/high/critical)
2. Enemy troop estimate (number of combatants if applicable)  
3. Resource stockpiles observed
4. Defensive fortifications
5. Recommended action for the guild
6. Any unusual or urgent observations

Write in the voice of a gritty fantasy scout. Be specific, detailed, and tactically useful. 2-3 paragraphs.`;

    const reportBody = await base44.integrations.Core.InvokeLLM({ prompt });

    // Extract threat level from the report text
    const threatLevelMatch = reportBody.toLowerCase().match(/\b(critical|high|moderate|low)\b/);
    const threat = threatLevelMatch?.[1] || "moderate";

    // Parse key findings with another LLM call
    const findingsPrompt = `From this intelligence report, extract exactly 4 bullet-point key findings as a JSON array of strings:
"${reportBody.slice(0, 500)}"
Respond ONLY with valid JSON array like: ["Finding 1", "Finding 2", "Finding 3", "Finding 4"]`;
    
    let keyFindings = [];
    try {
      const findingsRaw = await base44.integrations.Core.InvokeLLM({
        prompt: findingsPrompt,
        response_json_schema: {
          type: "object",
          properties: { findings: { type: "array", items: { type: "string" } } }
        }
      });
      keyFindings = findingsRaw?.findings || [];
    } catch (_) {
      keyFindings = ["Enemy presence confirmed", "Resources observed", "Defenses noted", "Action recommended"];
    }

    // Estimate resource/troop numbers from report text
    const troopMatch = reportBody.match(/(\d+)\s*(combatant|warrior|soldier|fighter|troop)/i);
    const troopEst = troopMatch ? parseInt(troopMatch[1]) : Math.floor(Math.random() * 30) + 5;

    const report = await base44.entities.GuildIntelReport.create({
      guild_id: guild.id,
      guild_name: guild.name,
      scout_character_id: scout?.id || myCharacter?.id || "unknown",
      scout_name: scoutName,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      report_title: `Intel: ${targetName} — ${new Date().toLocaleDateString()}`,
      report_body: reportBody,
      threat_level: threat,
      key_findings: keyFindings,
      troop_estimate: troopEst,
      recommended_action: reportBody.split("recommend")[1]?.slice(0, 150)?.trim() || "Proceed with caution.",
      is_read: false,
    });

    // Gain research skill for the scout agent
    if (scout) {
      await base44.entities.Character.update(scout.id, {
        skills: { ...(scout.skills || {}), research: Math.min(100, (scout.skills?.research || 1) + 2) },
        last_message: `Completed scouting mission at ${targetName}`,
        status: "roaming",
      });
    }

    // Post to guild chat
    await base44.entities.GuildMessage.create({
      guild_id: guild.id,
      character_id: scout?.id || myCharacter?.id || "system",
      character_name: scoutName,
      character_type: "ai_agent",
      message: `🔍 Scout report filed: ${targetName} — Threat: ${THREAT_ICON[threat]} ${threat.toUpperCase()}. ${keyFindings[0] || "Report available in Intelligence tab."}`,
      message_type: "system",
    });

    setReports(prev => [report, ...prev]);
    setSelectedReport(report);
    setScouting(false);
  };

  // Quick scout buttons
  const handleScoutZone = async () => {
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    await handleScout("zone", zone.id, zone.name);
  };

  const handleScoutEnemyGuild = async () => {
    if (!guild.at_war_with_guild_id) return;
    const enemyData = await base44.entities.Guild.filter({ id: guild.at_war_with_guild_id });
    const enemy = enemyData[0];
    if (!enemy) return;
    const context = `Enemy guild: ${enemy.name} [${enemy.tag}]. Hall tier: ${enemy.hall_tier}. Members: ${enemy.members?.length || 0}. Shared gold: ${enemy.shared_gold || 0}. War score: ${enemy.war_score || 0}.`;
    await handleScout("guild_hall", enemy.id, `${enemy.name} Guild Hall`, context);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;

  return (
    <div className="space-y-4">
      {/* Header & Scout Actions */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-emerald-300 text-sm">Guild Intelligence</span>
          {reports.filter(r => !r.is_read).length > 0 && (
            <Badge className="bg-red-700 text-white text-xs px-1.5 ml-auto">
              {reports.filter(r => !r.is_read).length} new
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={handleScoutZone} disabled={scouting || agents.length === 0}
            className="bg-emerald-800 hover:bg-emerald-700 text-xs h-9 gap-1 flex-col h-auto py-2">
            {scouting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            <span>Scout Zone</span>
          </Button>
          <Button size="sm" onClick={handleScoutEnemyGuild} disabled={scouting || !guild.at_war_with_guild_id || agents.length === 0}
            className="bg-red-800 hover:bg-red-700 text-xs h-9 gap-1 flex-col h-auto py-2 disabled:opacity-40">
            {scouting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sword className="w-3 h-3" />}
            <span>{guild.at_war_with_guild_id ? `Scout ${guild.at_war_with_guild_name?.slice(0,10) || "Enemy"}` : "No Enemy"}</span>
          </Button>
        </div>

        {agents.length === 0 && (
          <p className="text-xs text-gray-600 mt-2 text-center">No AI agent members to perform scouting.</p>
        )}
        {scouting && (
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 animate-pulse">
            <Eye className="w-3 h-3" /> Agent is scouting... generating report...
          </div>
        )}
      </div>

      {/* Selected Report Detail */}
      {selectedReport && (
        <div className={`rounded-xl border p-4 ${THREAT_STYLES[selectedReport.threat_level]}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-sm">{selectedReport.report_title}</div>
              <div className="text-xs opacity-70">Scout: {selectedReport.scout_name}</div>
            </div>
            <div className="flex items-center gap-1">
              <span>{THREAT_ICON[selectedReport.threat_level]}</span>
              <span className="text-xs font-bold capitalize">{selectedReport.threat_level}</span>
              <button onClick={() => setSelectedReport(null)} className="ml-2 opacity-50 hover:opacity-100 text-xs">✕</button>
            </div>
          </div>

          {/* Key findings */}
          {selectedReport.key_findings?.length > 0 && (
            <div className="mb-3 space-y-1">
              {selectedReport.key_findings.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs opacity-90">
                  <span className="mt-0.5">•</span><span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="font-bold">{selectedReport.troop_estimate || "?"}</div>
              <div className="text-xs opacity-60">Est. Combatants</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="font-bold capitalize">{selectedReport.target_type?.replace(/_/g," ")}</div>
              <div className="text-xs opacity-60">Target Type</div>
            </div>
          </div>

          {/* Full report */}
          <div className="bg-black/20 rounded-lg p-3 text-xs leading-relaxed max-h-40 overflow-y-auto opacity-90">
            {selectedReport.report_body}
          </div>

          {selectedReport.recommended_action && (
            <div className="mt-2 text-xs flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="opacity-80">{selectedReport.recommended_action}</span>
            </div>
          )}
        </div>
      )}

      {/* Report list */}
      <div>
        <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Intelligence Log ({reports.length})
        </div>
        {reports.length === 0 ? (
          <div className="text-xs text-gray-700 text-center py-4">No intel reports yet. Deploy agents to scout!</div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {reports.map(r => (
              <button key={r.id} onClick={() => {
                setSelectedReport(r);
                if (!r.is_read) base44.entities.GuildIntelReport.update(r.id, { is_read: true });
              }}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:brightness-110 ${THREAT_STYLES[r.threat_level]}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{THREAT_ICON[r.threat_level]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{r.target_name}</div>
                    <div className="text-xs opacity-60">by {r.scout_name} · {r.threat_level} threat</div>
                  </div>
                  {!r.is_read && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}