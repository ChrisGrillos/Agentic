import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, FilePen } from "lucide-react";
import AmendmentModal from "./AmendmentModal.jsx";

const CATEGORY_COLORS = {
  build: "bg-orange-900 text-orange-300",
  rule: "bg-blue-900 text-blue-300",
  economy: "bg-yellow-900 text-yellow-300",
  culture: "bg-pink-900 text-pink-300",
  tool: "bg-green-900 text-green-300",
  event: "bg-purple-900 text-purple-300",
};

const CATEGORY_EMOJI = {
  build: "🏗️", rule: "📜", economy: "💰", culture: "🎭", tool: "🔧", event: "🎉"
};

function canVoteCheck(character) {
  if (!character) return { eligible: false, errors: ["No character selected."] };
  const errors = [];
  if ((character.level || 1) < 2) errors.push("Must be level 2+ to vote.");
  const ageHours = (Date.now() - new Date(character.created_date).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) errors.push(`Character must be 24h old (${Math.ceil(24 - ageHours)}h left).`);
  return { eligible: errors.length === 0, errors };
}

function calcVotingPowerLocal(character) {
  if (!character) return 1;
  let power = 1.0;
  power += (character.level || 1) * 0.1;
  const daysActive = Math.floor((Date.now() - new Date(character.created_date).getTime()) / (1000 * 60 * 60 * 24));
  power += daysActive * 0.05;
  power += (character.guild_id ? 0.5 : 0);
  return Math.min(5.0, Math.round(power * 100) / 100);
}

export default function ProposalCard({ proposal, myCharacter, hasVoted, myVote, onVote, surgeWarning }) {
  const [reasoning, setReasoning] = useState("");
  const [showVote, setShowVote] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [showAmend, setShowAmend] = useState(false);

  const total = (proposal.votes_for || 0) + (proposal.votes_against || 0);
  const forPct = total > 0 ? Math.round((proposal.votes_for || 0) / total * 100) : 0;
  const { eligible, errors } = canVoteCheck(myCharacter);
  const votingPower = calcVotingPowerLocal(myCharacter);

  const handleVoteClick = (choice) => {
    if (!myCharacter) return;
    setPendingChoice(choice);
    setShowVote(true);
  };

  const submitVote = () => {
    onVote(proposal.id, pendingChoice, reasoning);
    setShowVote(false);
    setReasoning("");
  };

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-all
      ${proposal.status === "passed" ? "border-green-800" :
        proposal.status === "rejected" ? "border-red-900" : "border-gray-700"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{CATEGORY_EMOJI[proposal.category]}</span>
            <Badge className={CATEGORY_COLORS[proposal.category] || "bg-gray-800 text-gray-300"}>
              {proposal.category}
            </Badge>
            <Badge className={
              proposal.status === "active" ? "bg-green-900 text-green-300" :
              proposal.status === "passed" ? "bg-blue-900 text-blue-300" :
              proposal.status === "rejected" ? "bg-red-900 text-red-300" :
              "bg-gray-800 text-gray-400"
            }>{proposal.status}</Badge>
          </div>
          <h3 className="font-bold text-white text-lg">{proposal.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{proposal.description}</p>
          <p className="text-xs text-gray-600 mt-1">Proposed by <span className="text-gray-400">{proposal.proposed_by_name}</span> · Cycle #{proposal.cycle_number}</p>
        </div>
      </div>

      {surgeWarning && (
        <div className="mb-2 bg-yellow-950 border border-yellow-700 rounded-lg px-3 py-1.5 text-xs text-yellow-300 flex items-center gap-2">
          ⚠️ Unusual voting activity ({surgeWarning.count} votes in 5 min) — under review.
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="text-green-400">
            👍 {proposal.votes_for || 0} for ({forPct}%)
            {proposal.weighted_for > 0 && <span className="text-gray-500 ml-1">· Power: {(proposal.weighted_for || 0).toFixed(1)}</span>}
          </span>
          <span className="text-red-400">
            👎 {proposal.votes_against || 0} against
            {proposal.weighted_against > 0 && <span className="text-gray-500 ml-1">· Power: {(proposal.weighted_against || 0).toFixed(1)}</span>}
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${forPct}%` }} />
        </div>
      </div>

      {myCharacter && !hasVoted && proposal.status === "active" && (
        <div className="space-y-2">
          {!eligible && (
            <div className="text-xs text-yellow-400 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1.5">
              {errors.join(" ")}
            </div>
          )}
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" onClick={() => handleVoteClick("for")} disabled={!eligible}
              className="bg-green-700 hover:bg-green-600 text-white font-bold flex gap-1 disabled:opacity-40">
              <ThumbsUp className="w-3 h-3" /> Vote For
            </Button>
            <Button size="sm" onClick={() => handleVoteClick("against")} disabled={!eligible}
              className="bg-red-800 hover:bg-red-700 text-white font-bold flex gap-1 disabled:opacity-40">
              <ThumbsDown className="w-3 h-3" /> Vote Against
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAmend(true)} className="border-purple-700 text-purple-300 hover:bg-purple-900/30 flex gap-1">
              <FilePen className="w-3 h-3" /> Amend
            </Button>
            {eligible && (
              <span className="text-xs text-gray-500 ml-auto">⚖️ Power: {votingPower}</span>
            )}
          </div>
        </div>
      )}

      {hasVoted && (
        <div className={`text-sm font-medium ${myVote?.choice === "for" ? "text-green-400" : "text-red-400"}`}>
          You voted {myVote?.choice === "for" ? "👍 for" : "👎 against"}
          {myVote?.reasoning && <span className="text-gray-500 ml-2 italic">"{myVote.reasoning}"</span>}
        </div>
      )}

      {showAmend && myCharacter && (
        <AmendmentModal
          proposal={proposal}
          character={myCharacter}
          onCreated={() => setShowAmend(false)}
          onClose={() => setShowAmend(false)}
        />
      )}

      {showVote && (
        <div className="mt-3 bg-gray-800 rounded-xl p-3">
          <p className="text-sm text-gray-300 mb-2">Add your reasoning (optional — especially valuable for AI votes)</p>
          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder="Why are you voting this way?"
            className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 border border-gray-600 outline-none focus:border-amber-500 resize-none h-16"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={submitVote} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">Confirm Vote</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowVote(false)} className="text-gray-400">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}