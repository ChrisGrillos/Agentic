import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import gameService from "@/api/gameService";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Bot, Zap, Users, AlertTriangle, RefreshCw, Trash2, Ban, CheckCircle, SkipForward, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ label, value, color = "text-white", icon: Icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function ThreatBadge({ level }) {
  const cfg = {
    low:      { cls: "bg-green-900 text-green-300 border-green-700",  label: "LOW"      },
    moderate: { cls: "bg-yellow-900 text-yellow-300 border-yellow-700", label: "MODERATE" },
    high:     { cls: "bg-red-900 text-red-300 border-red-700",        label: "HIGH"     },
    critical: { cls: "bg-purple-900 text-purple-300 border-purple-700", label: "CRITICAL" },
  }[level] || { cls: "bg-gray-800 text-gray-400 border-gray-700", label: level?.toUpperCase() };
  return <span className={`text-xs px-2 py-0.5 rounded border font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

// â”€â”€ anomaly detection (client-side heuristics) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function detectAnomalies({ proposals, votes, agents }) {
  const alerts = [];

  // Too many votes from the same character in a short window
  const voteCounts = {};
  votes.forEach(v => { voteCounts[v.character_id] = (voteCounts[v.character_id] || 0) + 1; });
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > 5) alerts.push({ id: `vote-spam-${id}`, level: "high", msg: `Character ${id.slice(-6)} cast ${count} votes â€” possible vote farming.` });
  });

  // Agent swarm: many agents with the same owner
  const ownerCounts = {};
  agents.forEach(a => { if (a.owner_user_id) ownerCounts[a.owner_user_id] = (ownerCounts[a.owner_user_id] || 0) + 1; });
  Object.entries(ownerCounts).forEach(([uid, count]) => {
    if (count > 10) alerts.push({ id: `agent-swarm-${uid}`, level: "critical", msg: `User ${uid.slice(-6)} owns ${count} AI agents â€” possible bot swarm.` });
    else if (count > 5) alerts.push({ id: `agent-many-${uid}`, level: "moderate", msg: `User ${uid.slice(-6)} owns ${count} AI agents â€” monitor closely.` });
  });

  // Proposal spam: many proposals from same character
  const propCounts = {};
  proposals.forEach(p => { propCounts[p.proposed_by_character_id] = (propCounts[p.proposed_by_character_id] || 0) + 1; });
  Object.entries(propCounts).forEach(([id, count]) => {
    if (count > 5) alerts.push({ id: `prop-spam-${id}`, level: "moderate", msg: `Character ${id.slice(-6)} submitted ${count} proposals â€” possible spam.` });
  });

  return alerts;
}

// â”€â”€ main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function GMDashboard() {
  const [user, setUser]           = useState(null);
  const [authorized, setAuthorized] = useState(null); // null=loading
  const [agents, setAgents]       = useState([]);
  const [characters, setCharacters] = useState([]);
  const [events, setEvents]       = useState([]);
  const [proposals, setProposals] = useState([]);
  const [votes, setVotes]         = useState([]);
  const [guilds, setGuilds]       = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLog, setActionLog] = useState([]);
  const [apiTestBusy, setApiTestBusy] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (!u || (u.role !== "admin" && u.role !== "game_master")) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [agentList, charList, eventList, proposalList, voteList, guildList] = await Promise.all([
      base44.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 100),
      base44.entities.Character.filter({ type: "human" }, "-updated_date", 100),
      base44.entities.WorldEvent.list("-created_date", 50),
      base44.entities.GovernanceProposal.list("-created_date", 100),
      base44.entities.Vote.list("-created_date", 200),
      base44.entities.Guild.filter({ status: "active" }, "-updated_date", 100),
    ]);
    setAgents(agentList);
    setCharacters(charList);
    setEvents(eventList);
    setProposals(proposalList);
    setVotes(voteList);
    setGuilds(guildList);
    setAlerts(detectAnomalies({ proposals: proposalList, votes: voteList, agents: agentList }));
  };

  const log = (msg) => setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);

  // â”€â”€ GM override actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const forceResolveEvent = async (event) => {
    await gameService.gmOverride({ action: "resolve_event", target_id: event.id, reason: "GM dashboard manual resolve" });
    log(`Resolved event: "${event.title}"`);
    loadData();
  };

  const forceRejectProposal = async (proposal) => {
    await gameService.gmOverride({ action: "reject_proposal", target_id: proposal.id, reason: "GM dashboard reject" });
    log(`Rejected proposal: "${proposal.title}"`);
    loadData();
  };

  const forcePassProposal = async (proposal) => {
    await gameService.gmOverride({ action: "pass_proposal", target_id: proposal.id, reason: "GM dashboard pass" });
    log(`Force-passed proposal: "${proposal.title}"`);
    loadData();
  };

  const deleteAgent = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"?`)) return;
    await gameService.gmOverride({ action: "delete_agent", target_id: agent.id, reason: "GM dashboard delete" });
    log(`Deleted agent: "${agent.name}"`);
    loadData();
  };

  const resetAgentToTown = async (agent) => {
    await gameService.gmOverride({ action: "reset_agent_to_town", target_id: agent.id, reason: "GM dashboard reset" });
    log(`Teleported agent "${agent.name}" to town`);
    loadData();
  };

  const clearAllVotesForProposal = async (proposal) => {
    if (!window.confirm(`Clear ALL votes for "${proposal.title}"? This cannot be undone.`)) return;
    await gameService.gmOverride({ action: "clear_proposal_votes", target_id: proposal.id, reason: "GM dashboard clear votes" });
    log(`Cleared votes from "${proposal.title}"`);
    loadData();
  };

  const runSiegeStub = async () => {
    setApiTestBusy(true);
    try {
      if ((guilds || []).length < 2) {
        throw new Error("Need at least 2 active guilds for siege flow test");
      }

      const attacker = guilds.find(g => g.war_status === "peace") || guilds[0];
      const target = guilds.find(g => g.id !== attacker.id);
      if (!target) throw new Error("No target guild available");

      if (attacker.war_status === "peace") {
        const declareRes = await gameService.siegeAction({
          action_type: "declare",
          guild_id: attacker.id,
          target_guild_id: target.id,
          reason: "GM dashboard smoke test declare",
        });
        log(`siegeAction declare OK: ${declareRes?.result?.status || "war"}`);
      } else {
        log(`siegeAction declare skipped: ${attacker.name} already in ${attacker.war_status}`);
      }

      const startRes = await gameService.siegeAction({
        action_type: "start_phase",
        guild_id: attacker.id,
        reason: "GM dashboard smoke test start phase",
      });
      log(`siegeAction start_phase OK: ${startRes?.result?.status || "siege"}`);

      const dmgRes = await gameService.siegeAction({
        action_type: "damage_objective",
        guild_id: attacker.id,
        objective_id: "gate",
        amount: 20,
        reason: "GM dashboard smoke test objective damage",
      });
      log(`siegeAction damage_objective OK: score ${dmgRes?.result?.war_score ?? "n/a"}`);
      await loadData();
    } catch (error) {
      log(`siegeAction FAILED: ${String(error?.message || error)}`);
    } finally {
      setApiTestBusy(false);
    }
  };

  const runCreatorHookStub = async () => {
    setApiTestBusy(true);
    try {
      const res = await gameService.creatorEventHook({
        event_type: "gm_dashboard_test",
        entity_id: activeEvents[0]?.id || "gm-dashboard",
        timestamp: new Date().toISOString(),
        metadata: {
          source: "gm_dashboard",
          category: "smoke_test",
        },
      });
      log(`creatorEventHook OK: marker ${res?.result?.marker_id || "n/a"} (${res?.result?.implemented ? "implemented" : "stub"})`);
    } catch (error) {
      log(`creatorEventHook FAILED: ${String(error?.message || error)}`);
    } finally {
      setApiTestBusy(false);
    }
  };

  // â”€â”€ guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-400 text-lg animate-pulse flex gap-2"><Shield className="w-6 h-6" /> Loading GM Dashboardâ€¦</div>
    </div>
  );

  if (!authorized) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <Shield className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-black text-red-400">Access Denied</h1>
      <p className="text-gray-400">This area requires the <span className="text-amber-400 font-bold">game_master</span> or <span className="text-amber-400 font-bold">admin</span> role.</p>
      <Link to={createPageUrl("Home")}><Button variant="outline" className="border-gray-700">â† Return Home</Button></Link>
    </div>
  );

  const activeEvents    = events.filter(e => e.status === "active");
  const incomingEvents  = events.filter(e => e.status === "incoming");
  const activeProposals = proposals.filter(p => p.status === "active");
  const onlineAgents    = agents.filter(a => a.is_online);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-1 block">â† Back to Home</Link>
            <h1 className="text-3xl font-black text-amber-400 flex items-center gap-3">
              <Shield className="w-8 h-8" /> Game Master Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {user?.full_name} Â· Role: <span className="text-amber-300 font-bold">{user?.role}</span></p>
          </div>
          <Button onClick={loadData} variant="outline" className="border-gray-700 gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* â”€â”€ security alerts â”€â”€ */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Security Alerts ({alerts.length})
            </h2>
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-gray-900 border border-red-900 rounded-lg px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-gray-200 flex-1">{a.msg}</span>
                <ThreatBadge level={a.level} />
              </div>
            ))}
          </div>
        )}
        {alerts.length === 0 && (
          <div className="mb-6 flex items-center gap-2 bg-green-950 border border-green-800 rounded-lg px-4 py-2.5 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" /> No security anomalies detected.
          </div>
        )}

        {/* â”€â”€ stats overview â”€â”€ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="AI Agents" value={agents.length} color="text-cyan-400" icon={Bot} />
          <StatCard label="Online Agents" value={onlineAgents.length} color="text-green-400" icon={Bot} />
          <StatCard label="Human Players" value={characters.length} color="text-blue-400" icon={Users} />
          <StatCard label="Active Events" value={activeEvents.length} color="text-yellow-400" icon={Zap} />
          <StatCard label="Active Proposals" value={activeProposals.length} color="text-purple-400" icon={Globe} />
          <StatCard label="Total Votes" value={votes.length} color="text-amber-400" icon={CheckCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* â”€â”€ left col: world events + proposals â”€â”€ */}
          <div className="lg:col-span-2 space-y-6">

            {/* World Events Override */}
            <section>
              <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> World Events Override
              </h2>
              <div className="space-y-2">
                {[...activeEvents, ...incomingEvents].slice(0, 10).map(e => (
                  <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{e.title}</div>
                      <div className="text-xs text-gray-500">{e.event_type} Â· <span className={e.status === "active" ? "text-yellow-400" : "text-blue-400"}>{e.status}</span></div>
                    </div>
                    <Button size="sm" variant="outline" className="border-gray-700 text-xs gap-1" onClick={() => forceResolveEvent(e)}>
                      <SkipForward className="w-3 h-3" /> Resolve
                    </Button>
                  </div>
                ))}
                {activeEvents.length + incomingEvents.length === 0 && <p className="text-gray-600 text-sm">No active events.</p>}
              </div>
            </section>

            {/* Governance Override */}
            <section>
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Governance Override
              </h2>
              <div className="space-y-2">
                {activeProposals.slice(0, 10).map(p => (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{p.title}</div>
                      <div className="text-xs text-gray-500">
                        by {p.proposed_by_name} Â· ðŸ‘ {p.votes_for || 0} Â· ðŸ‘Ž {p.votes_against || 0}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" className="bg-green-800 hover:bg-green-700 text-xs h-7 px-2" onClick={() => forcePassProposal(p)}>
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button size="sm" className="bg-red-900 hover:bg-red-800 text-xs h-7 px-2" onClick={() => forceRejectProposal(p)}>
                        <Ban className="w-3 h-3" />
                      </Button>
                      <Button size="sm" className="bg-gray-700 hover:bg-gray-600 text-xs h-7 px-2" title="Clear votes" onClick={() => clearAllVotesForProposal(p)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {activeProposals.length === 0 && <p className="text-gray-600 text-sm">No active proposals.</p>}
              </div>
            </section>

            {/* Agent Management */}
            <section>
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Agent Management (top 20 by activity)
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {agents.slice(0, 20).map(a => (
                  <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-3">
                    <span className="text-lg">{a.avatar_emoji || "ðŸ¤–"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.base_class} Â· Lv{a.level} Â· {a.status}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs h-7 px-2" title="Teleport to town" onClick={() => resetAgentToTown(a)}>
                        ðŸ˜ï¸
                      </Button>
                      <Button size="sm" className="bg-red-900 hover:bg-red-800 text-xs h-7 px-2" onClick={() => deleteAgent(a)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* â”€â”€ right col: action log + player activity â”€â”€ */}
          <div className="space-y-6">

            {/* Recent Player Activity */}
            <section>
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Player Activity
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {characters.slice(0, 15).map(c => (
                  <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-base">{c.avatar_emoji || "ðŸ‘¤"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="text-xs text-gray-500">Lv{c.level} {c.base_class} Â· {c.status}</div>
                    </div>
                    {c.is_online && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Online" />}
                  </div>
                ))}
                {characters.length === 0 && <p className="text-gray-600 text-sm">No human players yet.</p>}
              </div>
            </section>

            {/* GM Action Log */}
            <section>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> GM Action Log
              </h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 max-h-72 overflow-y-auto space-y-1">
                {actionLog.length === 0 && <p className="text-gray-600 text-xs">No actions taken this session.</p>}
                {actionLog.map((entry, i) => (
                  <div key={i} className="text-xs text-gray-400 font-mono border-b border-gray-800 pb-1">{entry}</div>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Agents", page: "Agents" },
                  { label: "Governance", page: "Governance" },
                  { label: "World Events", page: "WorldEvents" },
                  { label: "World Map", page: "WorldMapView" },
                  { label: "Economy", page: "Economy" },
                  { label: "Arena", page: "AgentArena" },
                ].map(({ label, page }) => (
                  <Link key={page} to={createPageUrl(page)}>
                    <Button variant="outline" size="sm" className="w-full border-gray-700 text-xs">{label}</Button>
                  </Link>
                ))}
              </div>
            </section>

            {/* API Smoke Tests */}
            <section>
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">Authority API Smoke Tests</h2>
              <div className="space-y-2">
                <Button
                  onClick={runSiegeStub}
                  disabled={apiTestBusy}
                  variant="outline"
                  className="w-full border-gray-700 text-xs justify-start gap-2"
                >
                  <Swords className="w-4 h-4" />
                  Test siegeAction flow
                </Button>
                <Button
                  onClick={runCreatorHookStub}
                  disabled={apiTestBusy}
                  variant="outline"
                  className="w-full border-gray-700 text-xs justify-start gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Test creatorEventHook stub
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}




