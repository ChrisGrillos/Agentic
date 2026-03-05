import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import gameService from "@/api/gameService";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Bot, Zap, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import CharacterCard from "@/components/characters/CharacterCard.jsx";
import SpawnAgentModal from "@/components/agents/SpawnAgentModal.jsx";
import AgentEventPanel from "@/components/agents/AgentEventPanel.jsx";
import AgentGovernancePanel from "@/components/agents/AgentGovernancePanel.jsx";
import AgentQuestPanel from "@/components/agents/AgentQuestPanel.jsx";
import AgentCompanionPanel from "@/components/agents/AgentCompanionPanel.jsx";
import AgentHousingGuildPanel from "@/components/agents/AgentHousingGuildPanel.jsx";
import AgentDiplomacyTradePanel from "@/components/agents/AgentDiplomacyTradePanel.jsx";
import AgentExperimentPanel from "@/components/experimentation/AgentExperimentPanel.jsx";

const CLASS_OPTIONS = ["warrior", "hunter", "healer", "wizard", "merchant", "craftsman"];

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [user, setUser] = useState(null);
  const [showSpawn, setShowSpawn] = useState(false);
  const [activeEvents, setActiveEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [myOnly, setMyOnly] = useState(false);
  const [sortBy, setSortBy] = useState("-level");
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bulkTask, setBulkTask] = useState("patrol");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const [all, events] = await Promise.all([
      base44.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 100),
      base44.entities.WorldEvent.filter({ status: "active" }),
    ]);
    setAgents(all);
    setActiveEvents(events);
    setSelectedIds(new Set());
  };

  const filteredAgents = agents
    .filter((a) => {
      if (search) {
        const s = search.toLowerCase();
        if (!a.name?.toLowerCase().includes(s) && !a.base_class?.toLowerCase().includes(s) && !(a.class || "").toLowerCase().includes(s)) return false;
      }
      if (filterClass && a.base_class !== filterClass && a.class !== filterClass) return false;
      if (myOnly && user && a.created_by !== user.email) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "-level": return (b.level || 1) - (a.level || 1);
        case "level": return (a.level || 1) - (b.level || 1);
        case "name": return (a.name || "").localeCompare(b.name || "");
        case "-gold": return (b.gold || 0) - (a.gold || 0);
        case "-updated_date": return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
        default: return 0;
      }
    });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAgents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAgents.map((a) => a.id)));
  };

  const selectedAll = filteredAgents.length > 0 && selectedIds.size === filteredAgents.length;

  const bulkMoveToTown = async () => {
    const ids = [...selectedIds];
    await gameService.bulkAgentAction({ action: "move_to_town", agent_ids: ids, to_x: 30, to_y: 25 });
    setSelectedIds(new Set());
    loadData();
  };

  const bulkAssignTask = async () => {
    const ids = [...selectedIds];
    await gameService.bulkAgentAction({ action: "assign_task", agent_ids: ids, task: bulkTask });
    setSelectedIds(new Set());
    loadData();
  };

  const confirmBulkDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    const idsToDelete = [...selectedIds].filter((id) => {
      const agent = agents.find((a) => a.id === id);
      return agent && (agent.created_by === user?.email || user?.role === "admin" || user?.role === "game_master");
    });
    await gameService.bulkAgentAction({ action: "delete", agent_ids: idsToDelete });
    setSelectedIds(new Set());
    setShowBulkDelete(false);
    setDeleteConfirmText("");
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">Back to Home</Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-cyan-400 flex items-center gap-2"><Bot className="w-8 h-8" /> AI Agents</h1>
            <p className="text-gray-400 mt-1">Autonomous citizens living and working in Agentic</p>
          </div>
          {user && (
            <Button onClick={() => setShowSpawn(true)} className="bg-cyan-600 hover:bg-cyan-700 font-bold flex gap-2">
              <Zap className="w-4 h-4" /> Spawn Agent
            </Button>
          )}
        </div>

        <div className="bg-gray-900 border border-cyan-900 rounded-xl p-4 mb-5 text-sm text-gray-400">
          AI agents live autonomously and can roam, work, vote, and trade.
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input type="checkbox" checked={selectedAll} onChange={toggleSelectAll} className="rounded" />
            All ({selectedIds.size}/{filteredAgents.length})
          </label>

          <input
            type="text"
            placeholder="Search name, class"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-44 outline-none focus:border-cyan-600"
          />

          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input type="checkbox" checked={myOnly} onChange={() => setMyOnly((v) => !v)} className="rounded" />
            My Agents
          </label>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
            <option value="-level">Level down</option>
            <option value="level">Level up</option>
            <option value="name">Name A-Z</option>
            <option value="-gold">Gold down</option>
            <option value="-updated_date">Recent</option>
          </select>

          {selectedIds.size > 0 && (
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" className="border-gray-700 text-xs gap-1" onClick={bulkMoveToTown}>Town ({selectedIds.size})</Button>
              <select value={bulkTask} onChange={(e) => setBulkTask(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                <option value="patrol">Patrol</option>
                <option value="guard">Guard</option>
                <option value="gather">Gather</option>
                <option value="hunt">Hunt</option>
                <option value="trade">Trade</option>
                <option value="return_to_town">Return</option>
              </select>
              <Button size="sm" variant="outline" className="border-cyan-700 text-xs gap-1" onClick={bulkAssignTask}>Task ({selectedIds.size})</Button>
              <Button size="sm" className="bg-red-900 hover:bg-red-800 text-xs gap-1" onClick={() => setShowBulkDelete(true)}>
                <Trash2 className="w-3 h-3" /> Delete ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-600 mb-3">
          Showing {filteredAgents.length} of {agents.length} agents
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredAgents.map((a) => (
            <div key={a.id} className={`relative ${selectedIds.has(a.id) ? "ring-2 ring-cyan-500 rounded-xl" : ""}`}>
              <label className="absolute top-2 left-2 z-10 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="rounded" />
              </label>
              <CharacterCard character={a} isMe={user && a.created_by === user.email} />
              <div className="flex gap-2 mt-1">
                <Link to={createPageUrl("AgentProfile") + `?id=${a.id}`} className="flex-1 text-xs text-gray-500 hover:text-cyan-400 flex items-center justify-center gap-1 py-1 border border-gray-800 hover:border-cyan-800 rounded-lg transition-colors">
                  View Profile
                </Link>
                <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="flex-1 text-xs text-gray-500 hover:text-cyan-400 flex items-center justify-center gap-1 py-1 border border-gray-800 hover:border-cyan-800 rounded-lg transition-colors">
                  {expanded === a.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded === a.id ? "Hide Actions" : "Quick Actions"}
                </button>
              </div>
              {expanded === a.id && (
                <div>
                  <AgentEventPanel agent={a} activeEvents={activeEvents} onRefresh={loadData} />
                  <AgentQuestPanel agent={a} onRefresh={loadData} />
                  <AgentGovernancePanel agent={a} onRefresh={loadData} />
                  <AgentCompanionPanel agent={a} allAgents={agents} onRefresh={loadData} />
                  <AgentHousingGuildPanel agent={a} onRefresh={loadData} />
                  <AgentDiplomacyTradePanel agent={a} onRefresh={loadData} />
                  <AgentExperimentPanel agent={a} onRefresh={loadData} />
                </div>
              )}
            </div>
          ))}
          {filteredAgents.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-20">
              {agents.length === 0 ? "No AI agents yet." : "No agents match your filters."}
            </div>
          )}
        </div>
      </div>

      {showSpawn && user && (
        <SpawnAgentModal user={user} onCreated={() => { setShowSpawn(false); loadData(); }} onClose={() => setShowSpawn(false)} />
      )}

      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-red-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-400 mb-2">Delete {selectedIds.size} Agents?</h3>
            <div className="text-xs text-gray-500 max-h-32 overflow-y-auto mb-4 bg-gray-950 rounded p-2">
              {agents.filter((a) => selectedIds.has(a.id)).map((a) => (
                <div key={a.id}>{a.avatar_emoji || "[bot]"} {a.name} (Lv.{a.level})</div>
              ))}
            </div>
            <p className="text-sm text-gray-300 mb-2">Type DELETE to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white mb-4 outline-none"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-gray-700" onClick={() => { setShowBulkDelete(false); setDeleteConfirmText(""); }}>Cancel</Button>
              <Button className="bg-red-800 hover:bg-red-700" disabled={deleteConfirmText !== "DELETE"} onClick={confirmBulkDelete}>Permanently Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
