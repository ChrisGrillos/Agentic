import { useState } from "react";
import gameService from "@/api/gameService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const CATEGORIES = [
  { id: "build", emoji: "???", label: "Build", desc: "Propose a new building or structure in the world" },
  { id: "rule", emoji: "??", label: "Rule", desc: "Propose a new law or social contract" },
  { id: "economy", emoji: "??", label: "Economy", desc: "Propose changes to trade, jobs, or currency" },
  { id: "culture", emoji: "??", label: "Culture", desc: "Propose festivals, traditions, or shared values" },
  { id: "tool", emoji: "??", label: "Tool", desc: "Propose a new craftable item or technology" },
  { id: "event", emoji: "??", label: "Event", desc: "Propose a world event or tournament" },
];

export default function NewProposalModal({ character, cycleNumber, cycleEnd, onCreated, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) return;
    setSaving(true);
    try {
      await gameService.createProposal({
        title: title.trim(),
        description: description.trim(),
        category,
        cycle_number: cycleNumber,
        voting_ends_at: cycleEnd.toISOString(),
        proposed_by_character_id: character.id,
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black text-purple-400">?? New Proposal</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <div className="text-xs text-gray-500 mb-4 bg-gray-800 rounded-lg p-3">
          Proposals shape civilization — buildings, laws, tools — but cannot alter the fundamental terrain or physics of the world.
          Voting closes on <span className="text-amber-400">{cycleEnd.toLocaleDateString()}</span> (Cycle #{cycleNumber}).
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`p-2 rounded-lg border text-left transition-all
                  ${category === cat.id ? "border-purple-500 bg-purple-900/20" : "border-gray-700 bg-gray-800 hover:border-gray-500"}`}>
                <span className="text-lg">{cat.emoji}</span>
                <span className="font-bold text-white text-sm ml-2">{cat.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short, clear title..."
            className="bg-gray-800 border-gray-600 text-white" />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe your proposal in detail. Why is it needed? What will it change?"
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 outline-none focus:border-purple-500 resize-none h-24 text-sm" />
        </div>

        <Button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || !category || saving}
          className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
          {saving ? "Submitting..." : "Submit Proposal"}
        </Button>
      </div>
    </div>
  );
}

