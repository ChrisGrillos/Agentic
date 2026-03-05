import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import gameService from "@/api/gameService";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ProposalCard from "@/components/governance/ProposalCard.jsx";
import NewProposalModal from "@/components/governance/NewProposalModal.jsx";
import ChroniclePanel from "@/components/governance/ChroniclePanel.jsx";

const CYCLE_DAYS = 120;
const EPOCH_START = new Date("2026-01-01");

function getCurrentCycle() {
  const now = new Date();
  const daysSinceEpoch = Math.floor((now - EPOCH_START) / (1000 * 60 * 60 * 24));
  return Math.floor(daysSinceEpoch / CYCLE_DAYS) + 1;
}

function getCycleEndDate() {
  const now = new Date();
  const daysSinceEpoch = Math.floor((now - EPOCH_START) / (1000 * 60 * 60 * 24));
  const daysIntoCurrentCycle = daysSinceEpoch % CYCLE_DAYS;
  const daysLeft = CYCLE_DAYS - daysIntoCurrentCycle;
  const end = new Date(now);
  end.setDate(end.getDate() + daysLeft);
  return end;
}

function canVote(character) {
  const errors = [];
  if ((character.level || 1) < 2) errors.push("Your character must be at least level 2 to vote.");
  const ageHours = (Date.now() - new Date(character.created_date).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    const hoursLeft = Math.ceil(24 - ageHours);
    errors.push(`Character must be 24h old. ${hoursLeft}h remaining.`);
  }
  return { eligible: errors.length === 0, errors };
}

export default function Governance() {
  const [proposals, setProposals] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("active");
  const [surgeWarnings, setSurgeWarnings] = useState([]);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      const mine = chars.find(c => c.type === "human") || chars[0];
      setMyCharacter(mine || null);
      if (mine) {
        const votes = await base44.entities.Vote.filter({ character_id: mine.id });
        setMyVotes(votes);
      }
    }
    const all = await base44.entities.GovernanceProposal.list("-created_date", 50);
    setProposals(all);

    const allVotes = await base44.entities.Vote.list("-created_date", 500);
    const warnings = [];
    all.filter(p => p.status === "active").forEach(p => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const recent = allVotes.filter(v => v.proposal_id === p.id && new Date(v.created_date).getTime() > fiveMinAgo);
      if (recent.length >= 20) warnings.push({ proposalId: p.id, title: p.title, count: recent.length });
    });
    setSurgeWarnings(warnings);
  };

  const handleVote = async (proposalId, choice, reasoning = "") => {
    if (!myCharacter) return;

    const { eligible, errors } = canVote(myCharacter);
    if (!eligible) {
      toast({ title: "Not eligible to vote", description: errors.join(" "), variant: "destructive" });
      return;
    }

    try {
      await gameService.castVote({
        proposal_id: proposalId,
        character_id: myCharacter.id,
        choice,
        reasoning,
      });
      await loadData();
    } catch (error) {
      toast({ title: "Vote blocked", description: String(error.message || error), variant: "destructive" });
    }
  };

  const currentCycle = getCurrentCycle();
  const cycleEnd = getCycleEndDate();
  const filtered = proposals.filter(p => filter === "all" ? true : p.status === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">? Back to Home</Link>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-amber-400">?? Governance</h1>
            <p className="text-gray-400 mt-1">Citizens shape civilization — every 120 days</p>
          </div>
          {myCharacter && (
            <Button onClick={() => setShowNew(true)} className="bg-purple-600 hover:bg-purple-700 font-bold">
              + New Proposal
            </Button>
          )}
        </div>

        <div className="bg-gray-900 border border-purple-800 rounded-xl p-4 mb-6 flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Current Cycle</div>
            <div className="text-2xl font-bold text-purple-400">#{currentCycle}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Voting Closes</div>
            <div className="text-2xl font-bold text-amber-400">{cycleEnd.toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Active Proposals</div>
            <div className="text-2xl font-bold text-green-400">{proposals.filter(p => p.status === "active").length}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {["active", "passed", "rejected", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                ${filter === f ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filtered.map(p => (
              <ProposalCard
                key={p.id}
                proposal={p}
                myCharacter={myCharacter}
                hasVoted={myVotes.some(v => v.proposal_id === p.id)}
                myVote={myVotes.find(v => v.proposal_id === p.id)}
                onVote={handleVote}
                surgeWarning={surgeWarnings.find(w => w.proposalId === p.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-500 py-16">No proposals in this category.</div>
            )}
          </div>
          <div className="lg:col-span-1">
            <ChroniclePanel />
          </div>
        </div>
      </div>

      {showNew && myCharacter && (
        <NewProposalModal
          character={myCharacter}
          cycleNumber={currentCycle}
          cycleEnd={cycleEnd}
          onCreated={() => { setShowNew(false); loadData(); }}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

