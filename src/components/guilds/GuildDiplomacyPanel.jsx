import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Handshake, FileText, CheckCircle2, XCircle, Clock, Shield, Scale } from "lucide-react";

const PROPOSAL_TYPES = [
  { id: "ceasefire",        label: "Ceasefire",           emoji: "🏳️", desc: "Temporarily halt all raids for 48 hours. Neither side gains war score.", duration: "48h" },
  { id: "peace_treaty",     label: "Full Peace Treaty",   emoji: "☮️", desc: "End the war entirely. War score resets. Both guilds return to peace.", duration: "Permanent" },
  { id: "non_aggression",   label: "Non-Aggression Pact", emoji: "🛡️", desc: "Agree not to attack each other for a period. War stays on hold.", duration: "7 days" },
];

const STATUS_STYLE = {
  pending:  { color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-800", icon: Clock },
  accepted: { color: "text-green-400",  bg: "bg-green-900/30 border-green-800",  icon: CheckCircle2 },
  rejected: { color: "text-red-400",    bg: "bg-red-900/30 border-red-800",      icon: XCircle },
  countered:{ color: "text-blue-400",   bg: "bg-blue-900/30 border-blue-800",    icon: Scale },
};

export default function GuildDiplomacyPanel({ guild, character, enemyGuild, isLeader, onUpdate }) {
  const [proposals, setProposals]   = useState([]);
  const [proposalType, setProposalType] = useState(PROPOSAL_TYPES[0].id);
  const [customNote, setCustomNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [responding, setResponding] = useState(null);
  const [log, setLog] = useState([]);

  useEffect(() => { loadProposals(); }, [guild.id]);

  const loadProposals = async () => {
    // Load proposals where either guild is proposer or target (via alliance_guild fields)
    const all = await base44.entities.TradeProposal.filter({
      diplomatic_action: "non_aggression",
    }, "-created_date", 20).catch(() => []);
    // Also load ceasefire/peace types
    const [p1, p2, p3] = await Promise.all([
      base44.entities.TradeProposal.filter({ alliance_guild_a: guild.id }, "-created_date", 20).catch(() => []),
      base44.entities.TradeProposal.filter({ alliance_guild_b: guild.id }, "-created_date", 20).catch(() => []),
    ]);
    const combined = [...p1, ...p2].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
    setProposals(combined.slice(0, 10));
  };

  const addLog = msg => setLog(prev => [msg, ...prev.slice(0, 9)]);

  // Diplomatic skill check
  const getDiplomacySkill = () => character?.skills?.diplomacy || 1;

  const handlePropose = async () => {
    if (!isLeader || !enemyGuild) return;
    setGenerating(true);

    const typeDef  = PROPOSAL_TYPES.find(t => t.id === proposalType);
    const dipSkill = getDiplomacySkill();
    const warScore = guild.war_score || 0;

    // LLM generates the formal proposal letter
    const proposalText = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${character.name}, leader of guild "${guild.name}" in "Agentic" fantasy MMO.
You are proposing a ${typeDef.label} to "${enemyGuild.name}" after armed conflict.
Current war score: ${warScore > 0 ? `+${warScore} in your favor` : `${warScore} against you`}.
Your diplomacy skill: ${dipSkill}/100. ${customNote ? `Your additional note: "${customNote}"` : ""}

Write a formal, in-world guild leader's diplomatic proposal (3-5 sentences). Be strategic — reference the war score honestly. End with clear terms.
Keep it atmospheric and serious, written as if on official guild parchment.`,
    });

    // Success chance based on diplomacy skill + war position
    const baseChance = 0.30 + (dipSkill / 200);
    const warBonus   = warScore < 0 ? 0.15 : warScore > 50 ? -0.10 : 0; // losing = more likely to succeed
    const totalChance = Math.min(0.85, baseChance + warBonus);
    const success = Math.random() < totalChance;

    const proposal = await base44.entities.TradeProposal.create({
      proposer_character_id: character.id,
      proposer_name: `${character.name} (${guild.name})`,
      proposer_type: character.type || "human",
      target_character_id: enemyGuild.leader_character_id || enemyGuild.id,
      target_name: `${enemyGuild.leader_name || "Leader"} (${enemyGuild.name})`,
      target_type: "human",
      offer_items: [],
      request_items: [],
      offer_gold: 0,
      request_gold: 0,
      proposal_text: proposalText,
      status: "pending",
      diplomatic_action: "non_aggression",
      alliance_guild_a: guild.id,
      alliance_guild_b: enemyGuild.id,
    });

    // Notify enemy guild chat
    await base44.entities.GuildMessage.create({
      guild_id: enemyGuild.id,
      character_id: character.id,
      character_name: character.name,
      character_type: character.type,
      message: `📜 "${guild.name}" has sent a diplomatic proposal: ${typeDef.label}. Open the War Room to respond.`,
      message_type: "system",
    });

    // Diplomacy skill growth
    const newDiplomacy = Math.min(100, (character.skills?.diplomacy || 1) + 2);
    await base44.entities.Character.update(character.id, {
      skills: { ...(character.skills || {}), diplomacy: newDiplomacy },
      last_message: `Sent ${typeDef.label} proposal to ${enemyGuild.name}`,
    });

    setProposals(prev => [proposal, ...prev]);
    addLog(`📜 Sent ${typeDef.emoji} ${typeDef.label} to ${enemyGuild.name} (diplomacy: ${dipSkill} → ${newDiplomacy})`);
    setGenerating(false);
  };

  const handleRespond = async (proposal, accept) => {
    setResponding(proposal.id);
    const dipSkill = getDiplomacySkill();
    const typeDef  = PROPOSAL_TYPES.find(t => t.diplomatic_action === proposal.diplomatic_action) || PROPOSAL_TYPES[0];

    // LLM generates response
    const responseText = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${character.name}, leader of guild "${guild.name}" in "Agentic".
You received a diplomatic proposal from "${proposal.proposer_name}": "${proposal.proposal_text?.slice(0, 300)}"
You have decided to ${accept ? "ACCEPT" : "REJECT"} this proposal.
Write a formal in-character response (2-3 sentences). Be direct and leader-like. Reference the war if relevant.`,
    });

    await base44.entities.TradeProposal.update(proposal.id, {
      status: accept ? "accepted" : "rejected",
      counter_text: responseText,
    });

    // If accepted — apply war consequences
    if (accept) {
      const proposalLabel = proposal.proposal_text?.slice(0, 50) || "diplomatic agreement";
      // Determine what was proposed (crude detection from stored text)
      const isPeace = proposal.proposal_text?.toLowerCase().includes("peace") || proposal.proposal_text?.toLowerCase().includes("treaty");

      if (isPeace) {
        // Full peace
        await Promise.all([
          base44.entities.Guild.update(guild.id, {
            war_status: "peace", at_war_with_guild_id: "", at_war_with_guild_name: "", war_reason: "", war_score: 0,
          }),
          base44.entities.Guild.update(proposal.alliance_guild_a === guild.id ? proposal.alliance_guild_b : proposal.alliance_guild_a, {
            war_status: "peace", at_war_with_guild_id: "", at_war_with_guild_name: "", war_reason: "", war_score: 0,
          }),
        ]);
        await base44.entities.GuildMessage.create({
          guild_id: guild.id, character_id: character.id,
          character_name: character.name, character_type: character.type,
          message: `☮️ ${character.name} has accepted the peace proposal. The war is over.`,
          message_type: "system",
        });
        onUpdate({ ...guild, war_status: "peace", at_war_with_guild_id: "", at_war_with_guild_name: "", war_score: 0 });
      }

      // Chronicle entry
      await base44.entities.WorldChronicle.create({
        title: `Diplomatic ${accept ? "Agreement" : "Refusal"}: ${guild.name} & ${enemyGuild?.name}`,
        entry_type: "world_event",
        summary: `${character.name} of ${guild.name} ${accept ? "accepted" : "rejected"} a ${proposalLabel}. ${responseText?.slice(0,100)}`,
        impact_tags: ["diplomacy", "guild", accept ? "peace" : "war"],
      });
    }

    // Skill gain for responding
    const newDiplomacy = Math.min(100, (character.skills?.diplomacy || 1) + 1);
    await base44.entities.Character.update(character.id, {
      skills: { ...(character.skills || {}), diplomacy: newDiplomacy },
    });

    setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: accept ? "accepted" : "rejected", counter_text: responseText } : p));
    addLog(`${accept ? "✅ Accepted" : "❌ Rejected"} proposal from ${proposal.proposer_name}`);
    setResponding(null);
  };

  const pendingIncoming = proposals.filter(p =>
    p.status === "pending" && p.alliance_guild_b === guild.id
  );

  const myOutgoing = proposals.filter(p => p.alliance_guild_a === guild.id);

  return (
    <div className="space-y-4">
      {/* Compose new proposal */}
      {isLeader && enemyGuild && (
        <div className="bg-gray-900 border border-indigo-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-300">Draft Diplomatic Proposal</span>
            <span className="ml-auto text-xs text-gray-600">
              diplomacy skill: <span className="text-indigo-400">{getDiplomacySkill()}</span>
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-2">Proposing to: <span className="text-white font-medium">{enemyGuild.emoji} {enemyGuild.name}</span></div>

          {/* Type selection */}
          <div className="space-y-1.5 mb-3">
            {PROPOSAL_TYPES.map(t => (
              <button key={t.id} onClick={() => setProposalType(t.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all
                  ${proposalType === t.id ? "border-indigo-600 bg-indigo-900/30 text-indigo-200" : "border-gray-700 text-gray-500 hover:border-gray-600"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{t.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{t.label}</div>
                    <div className="text-gray-500">{t.desc}</div>
                  </div>
                  <span className="ml-auto text-gray-600 text-xs">{t.duration}</span>
                </div>
              </button>
            ))}
          </div>

          <textarea
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder="Optional: add a personal note, threat, or concession..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:border-indigo-600 outline-none resize-none h-16 mb-3"
          />

          {/* Success probability display */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-gray-600">Est. acceptance chance:</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(85, 30 + getDiplomacySkill() / 2 + ((guild.war_score || 0) < 0 ? 15 : 0))}%` }} />
            </div>
            <span className="text-indigo-400 font-bold">
              {Math.min(85, 30 + Math.floor(getDiplomacySkill() / 2) + ((guild.war_score || 0) < 0 ? 15 : 0))}%
            </span>
          </div>

          <Button onClick={handlePropose} disabled={generating}
            className="w-full bg-indigo-700 hover:bg-indigo-600 font-bold gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
            {generating ? "Drafting proposal via LLM…" : "Send Proposal"}
          </Button>
        </div>
      )}

      {/* Incoming pending proposals */}
      {pendingIncoming.length > 0 && (
        <div className="bg-gray-900 border border-yellow-900 rounded-2xl p-4">
          <div className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Incoming Proposals ({pendingIncoming.length})
          </div>
          <div className="space-y-3">
            {pendingIncoming.map(p => (
              <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">From: <span className="text-white">{p.proposer_name}</span></div>
                <p className="text-xs text-gray-300 italic leading-relaxed mb-3 border-l-2 border-indigo-800 pl-2">
                  "{p.proposal_text?.slice(0, 250)}{p.proposal_text?.length > 250 ? "…" : ""}"
                </p>
                {isLeader && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRespond(p, true)} disabled={responding === p.id}
                      className="flex-1 bg-green-800 hover:bg-green-700 text-xs gap-1">
                      {responding === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Accept
                    </Button>
                    <Button size="sm" onClick={() => handleRespond(p, false)} disabled={responding === p.id}
                      variant="outline" className="flex-1 border-red-800 text-red-400 text-xs gap-1">
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                )}
                {!isLeader && <div className="text-xs text-gray-600 text-center">Only guild leaders can respond.</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposal history */}
      {myOutgoing.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="text-sm font-bold text-gray-400 mb-3">Proposal History</div>
          <div className="space-y-2">
            {myOutgoing.map(p => {
              const sty = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
              const StatusIcon = sty.icon;
              return (
                <div key={p.id} className={`border rounded-xl p-3 text-xs ${sty.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon className={`w-3 h-3 ${sty.color}`} />
                    <span className="text-gray-300">→ {p.target_name}</span>
                    <Badge className={`ml-auto text-xs px-1.5 capitalize ${sty.color} bg-transparent border-0`}>{p.status}</Badge>
                  </div>
                  <p className="text-gray-500 italic truncate">"{p.proposal_text?.slice(0, 120)}…"</p>
                  {p.counter_text && (
                    <p className="text-gray-400 mt-1 border-t border-gray-700 pt-1">
                      Response: "{p.counter_text?.slice(0, 120)}…"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="space-y-0.5">
          {log.map((l, i) => (
            <div key={i} className={`text-xs ${l.includes("✅") ? "text-green-400" : l.includes("❌") ? "text-red-400" : "text-indigo-300"}`}>{l}</div>
          ))}
        </div>
      )}

      {!isLeader && !enemyGuild && (
        <div className="text-center text-gray-600 text-sm py-6">No active war to negotiate.</div>
      )}
    </div>
  );
}