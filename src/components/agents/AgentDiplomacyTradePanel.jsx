import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Handshake, ShoppingBag, Scale, Shield } from "lucide-react";
import { traitTargetScore, pickActionByTraits, getDialogueTone, traitSuccessModifier, getTraitEvolutionFromAction } from "@/components/shared/agentTraits";

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTradeContext(agent, targetChar) {
  const inv = (agent.inventory || []).filter(i => (i.qty || 0) > 1);
  const targetInv = (targetChar.inventory || []).filter(i => (i.qty || 0) > 1);
  return {
    agentOffer: inv.slice(0, 3),
    agentWants: targetInv.slice(0, 3),
  };
}

function pickDiplomaticAction(agent, targetChar) {
  const traits    = agent.agent_traits?.personality_traits || [];
  const alignment = agent.agent_traits?.ethical_alignment || "true_neutral";
  // Trait-driven action takes priority
  return pickActionByTraits(traits, alignment, targetChar);
}

const ACTION_CONFIG = {
  trade:           { label: "Negotiate Trade", emoji: "🤝", color: "bg-amber-700 hover:bg-amber-600" },
  alliance:        { label: "Propose Alliance", emoji: "🛡️", color: "bg-blue-700 hover:bg-blue-600" },
  non_aggression:  { label: "Peace Pact",       emoji: "☮️", color: "bg-green-700 hover:bg-green-600" },
  resolve_dispute: { label: "Resolve Dispute",  emoji: "⚖️", color: "bg-purple-700 hover:bg-purple-600" },
  tribute:         { label: "Demand Tribute",   emoji: "💰", color: "bg-red-700 hover:bg-red-600" },
};

const THREAT_BADGE = {
  low: "bg-green-900/40 text-green-300 border-green-800",
  moderate: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  high: "bg-orange-900/40 text-orange-300 border-orange-800",
  critical: "bg-red-900/40 text-red-300 border-red-800",
};

export default function AgentDiplomacyTradePanel({ agent, onRefresh }) {
  const [characters, setCharacters] = useState([]);
  const [proposals, setProposals]   = useState([]);
  const [log, setLog]               = useState([]);
  const [busy, setBusy]             = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [dialogue, setDialogue]     = useState(null); // latest LLM dialogue to display

  useEffect(() => { loadData(); }, [agent.id]);

  const loadData = async () => {
    const [chars, props] = await Promise.all([
      base44.entities.Character.list("-updated_date", 30),
      base44.entities.TradeProposal.filter({ proposer_character_id: agent.id }),
    ]);
    setCharacters(chars.filter(c => c.id !== agent.id));
    setProposals(props);
  };

  const addLog = (msg) => setLog(prev => [msg, ...prev.slice(0, 19)]);

  // ── PICK best target character ────────────────────────────────────────────
  const pickTarget = () => {
    if (characters.length === 0) return null;
    const traits = agent.agent_traits?.personality_traits || [];
    const scored = characters.map(c => {
      let score = (c.inventory?.length || 0) * 3;
      const dx = Math.abs((c.x || 0) - (agent.x || 0));
      const dy = Math.abs((c.y || 0) - (agent.y || 0));
      score -= (dx + dy) * 0.5;
      if (c.type === "ai_agent") score += 5;
      // Apply trait-based target preference
      score += traitTargetScore(traits, c);
      return { char: c, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0]?.char || null;
  };

  // ── INITIATE CONVERSATION / TRADE ─────────────────────────────────────────
  const handleInitiateInteraction = async () => {
    const target = pickTarget();
    if (!target) { addLog("❌ No suitable characters found nearby."); return; }

    setBusy(true); setActiveAction("talk");
    const action = pickDiplomaticAction(agent, target);
    const { agentOffer, agentWants } = buildTradeContext(agent, target);
    const actionCfg = ACTION_CONFIG[action];

    const offerDesc = agentOffer.length > 0
      ? agentOffer.map(i => `${i.qty}x ${i.name || i.id}`).join(", ")
      : "some future consideration";
    const wantDesc = agentWants.length > 0
      ? agentWants.map(i => `${i.qty}x ${i.name || i.id}`).join(", ")
      : "information or goodwill";

    const traits = agent.agent_traits?.personality_traits || [];
    const tone   = getDialogueTone(traits);
    const prompt = `You are ${agent.name}, a ${agent.base_class} AI character in "Agentic" fantasy MMO.
Personality: ${agent.agent_traits?.motivation || "seeking adventure"}. Alignment: ${agent.agent_traits?.ethical_alignment || "neutral"}.
Personality traits: ${traits.join(", ") || "none defined"}. Dialogue tone: ${tone}.
You are initiating a "${action}" interaction with ${target.name} (Lv.${target.level} ${target.base_class || target.class}).

${action === "trade" ? `You are offering: ${offerDesc}. You want: ${wantDesc}.` : ""}
${action === "alliance" ? `You want to form a strategic alliance for mutual benefit.` : ""}
${action === "non_aggression" ? `You want to establish a peace pact and avoid conflict.` : ""}
${action === "resolve_dispute" ? `You want to settle a recent disagreement diplomatically.` : ""}
${action === "tribute" ? `You are demanding a tribute due to your superior strength.` : ""}

Write an in-character opening dialogue (2-4 sentences). Be persuasive and let your personality traits shine through clearly. End with a clear proposal.`;

    const dialogueText = await base44.integrations.Core.InvokeLLM({ prompt });

    // Determine outcome probabilistically (skill + trait based)
    const diplomacySkill = agent.skills?.diplomacy || 1;
    const tradingSkill   = agent.skills?.trading    || 1;
    const relevantSkill  = action === "trade" ? tradingSkill : diplomacySkill;
    const traitMod       = traitSuccessModifier(traits, action);
    const successChance  = Math.min(0.9, 0.4 + (relevantSkill / 200) + traitMod);
    const success        = Math.random() < successChance;

    // Trait evolution — may gain/lose traits through actions
    const { gained: gainedTraits, removed: removedTraits } = getTraitEvolutionFromAction(action, success, traits);
    const updatedTraits = [...traits.filter(t => !removedTraits.includes(t)), ...gainedTraits];

    // Skill gain
    const skillKey = action === "trade" ? "trading" : "diplomacy";
    const skillGain = success ? 2 : 1;
    const newSkills = { ...(agent.skills || {}), [skillKey]: Math.min(100, (agent.skills?.[skillKey] || 1) + skillGain) };

    // Build proposal record
    const proposal = await base44.entities.TradeProposal.create({
      proposer_character_id: agent.id,
      proposer_name: agent.name,
      proposer_type: "ai_agent",
      target_character_id: target.id,
      target_name: target.name,
      target_type: target.type || "human",
      offer_items: agentOffer,
      request_items: agentWants,
      offer_gold: 0,
      request_gold: 0,
      proposal_text: dialogueText,
      status: success ? "accepted" : "rejected",
      diplomatic_action: action,
    });

    // If accepted trade: swap items
    let goldDelta = 0;
    if (success && action === "trade" && agentWants.length > 0) {
      const newInv = [...(agent.inventory || [])];
      agentWants.forEach(wanted => {
        const existing = newInv.find(i => i.id === wanted.id);
        if (existing) existing.qty = (existing.qty || 0) + Math.max(1, wanted.qty - 1);
        else newInv.push({ ...wanted, qty: 1 });
      });
      agentOffer.forEach(offered => {
        const idx = newInv.findIndex(i => i.id === offered.id);
        if (idx >= 0) { newInv[idx].qty -= 1; if (newInv[idx].qty <= 0) newInv.splice(idx, 1); }
      });
      await base44.entities.Character.update(agent.id, { inventory: newInv, skills: newSkills,
        agent_traits: { ...(agent.agent_traits || {}), personality_traits: updatedTraits },
        last_message: `Trade accepted with ${target.name}: got ${agentWants.map(i=>i.name||i.id).join(", ")}` });
    } else {
      await base44.entities.Character.update(agent.id, { skills: newSkills,
        agent_traits: { ...(agent.agent_traits || {}), personality_traits: updatedTraits },
        last_message: `${actionCfg.emoji} ${action} with ${target.name}: ${success ? "accepted" : "rejected"}` });
    }
    const traitMsg = gainedTraits.length > 0 ? ` | Gained trait: ${gainedTraits.join(",")}` : removedTraits.length > 0 ? ` | Lost trait: ${removedTraits.join(",")}` : "";

    setDialogue({ action, actionCfg, target, text: dialogueText, success });
    setProposals(prev => [proposal, ...prev.slice(0, 9)]);
    addLog(`${actionCfg.emoji} [${action}] → ${target.name}: ${success ? "✅ Accepted" : "❌ Rejected"} | ${skillKey} +${skillGain}${traitMsg}`);
    setBusy(false); setActiveAction(null);
    onRefresh();
  };

  // ── RESPOND TO INCOMING PROPOSALS ────────────────────────────────────────
  const handleRespondToIncoming = async () => {
    const incoming = await base44.entities.TradeProposal.filter({ target_character_id: agent.id, status: "pending" });
    if (incoming.length === 0) { addLog("📭 No pending proposals to respond to."); return; }
    setBusy(true); setActiveAction("respond");

    const proposal = incoming[0];
    const diplomacySkill = agent.skills?.diplomacy || 1;
    const relevantSkill = proposal.diplomatic_action === "trade" ? (agent.skills?.trading || 1) : diplomacySkill;
    const personality = agent.agent_traits?.ethical_alignment || "true_neutral";
    const successChance = 0.45 + (relevantSkill / 200);
    const accept = Math.random() < successChance;

    const responsePrompt = `You are ${agent.name}, a ${agent.base_class} AI in "Agentic" MMO.
Alignment: ${personality}. Motivation: ${agent.agent_traits?.motivation || "adventure"}.
${proposal.proposer_name} has proposed: "${proposal.proposal_text?.slice(0, 200)}..."
This is a "${proposal.diplomatic_action}" proposal. You decide to ${accept ? "ACCEPT" : "POLITELY DECLINE"}.
Write your in-character response (1-3 sentences). Be personality-consistent.`;

    const responseText = await base44.integrations.Core.InvokeLLM({ prompt: responsePrompt });
    await base44.entities.TradeProposal.update(proposal.id, {
      status: accept ? "accepted" : "rejected",
      counter_text: responseText,
    });

    const skillKey = proposal.diplomatic_action === "trade" ? "trading" : "diplomacy";
    const newSkills = { ...(agent.skills || {}), [skillKey]: Math.min(100, (agent.skills?.[skillKey] || 1) + 1) };
    await base44.entities.Character.update(agent.id, { skills: newSkills,
      last_message: `Responded to ${proposal.proposer_name}'s ${proposal.diplomatic_action}: ${accept ? "Accepted" : "Declined"}` });

    setDialogue({ action: proposal.diplomatic_action, actionCfg: ACTION_CONFIG[proposal.diplomatic_action], target: { name: proposal.proposer_name }, text: responseText, success: accept });
    addLog(`📨 Responded to ${proposal.proposer_name}'s ${proposal.diplomatic_action}: ${accept ? "✅ Accepted" : "❌ Declined"}`);
    setBusy(false); setActiveAction(null);
    onRefresh();
  };

  return (
    <div className="bg-gray-900 border border-indigo-900 rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-indigo-300">Diplomacy & Trade</span>
        <div className="ml-auto text-xs text-gray-600">
          diplomacy: <span className="text-indigo-400">{agent.skills?.diplomacy || 1}</span>
          {" · "}trading: <span className="text-amber-400">{agent.skills?.trading || 1}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button size="sm" onClick={handleInitiateInteraction} disabled={busy}
          className="bg-indigo-700 hover:bg-indigo-600 text-xs h-8 gap-1">
          {activeAction === "talk" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Handshake className="w-3 h-3" />}
          Initiate Interaction
        </Button>
        <Button size="sm" onClick={handleRespondToIncoming} disabled={busy}
          className="bg-purple-700 hover:bg-purple-600 text-xs h-8 gap-1">
          {activeAction === "respond" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scale className="w-3 h-3" />}
          Respond to Proposals
        </Button>
      </div>

      {/* Live dialogue display */}
      {dialogue && (
        <div className={`mb-3 rounded-lg border p-3 text-xs ${dialogue.success ? "border-green-800 bg-green-900/20" : "border-red-800 bg-red-900/20"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span>{dialogue.actionCfg?.emoji}</span>
            <span className="font-bold text-white capitalize">{dialogue.action?.replace(/_/g, " ")} with {dialogue.target?.name}</span>
            <Badge className={`ml-auto text-xs px-1.5 ${dialogue.success ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}`}>
              {dialogue.success ? "✅ Accepted" : "❌ Rejected"}
            </Badge>
          </div>
          <p className="text-gray-300 italic leading-relaxed">"{dialogue.text?.slice(0, 200)}{dialogue.text?.length > 200 ? "..." : ""}"</p>
        </div>
      )}

      {/* Recent proposals */}
      {proposals.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Recent Proposals:</div>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {proposals.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg px-2 py-1">
                <span>{ACTION_CONFIG[p.diplomatic_action]?.emoji || "🤝"}</span>
                <span className="text-gray-400">→ {p.target_name}</span>
                <span className="capitalize text-gray-600 text-xs">{p.diplomatic_action?.replace(/_/g," ")}</span>
                <Badge className={`ml-auto text-xs px-1 ${p.status === "accepted" ? "bg-green-900 text-green-300" : p.status === "rejected" ? "bg-red-900 text-red-300" : "bg-gray-700 text-gray-400"}`}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="pt-2 border-t border-gray-800 space-y-0.5 max-h-24 overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className={`text-xs leading-relaxed ${l.includes("✅") ? "text-green-400" : l.includes("❌") ? "text-red-400" : "text-gray-500"}`}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}