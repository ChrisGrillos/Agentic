import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const TYPES = [
  { id: "amendment", label: "📝 Amendment", desc: "Modify or clarify the original" },
  { id: "counter_proposal", label: "⚔️ Counter-Proposal", desc: "Propose an alternative approach" },
  { id: "extension", label: "⏳ Extension", desc: "Expand the scope of the original" },
];

export default function AmendmentModal({ proposal, character, onCreated, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("amendment");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    await base44.entities.Amendment.create({
      parent_proposal_id: proposal.id,
      parent_proposal_title: proposal.title,
      title,
      description,
      amendment_type: type,
      proposed_by_character_id: character.id,
      proposed_by_name: character.name,
      status: "open",
      votes_for: 0,
      votes_against: 0,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-700 rounded-2xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-300">Submit Amendment</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4 border-b border-gray-800 pb-3">
          Re: <span className="text-amber-400">{proposal.title}</span>
        </p>

        <div className="flex gap-2 mb-4">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`flex-1 text-xs px-2 py-2 rounded-lg border transition-all text-center
                ${type === t.id ? "border-purple-500 bg-purple-900/40 text-purple-200" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              <div>{t.label}</div>
              <div className="text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        <input
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-purple-500"
          placeholder="Title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-28 resize-none focus:outline-none focus:border-purple-500"
          placeholder="Describe your amendment or counter-proposal..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || saving}
            className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold"
          >
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}