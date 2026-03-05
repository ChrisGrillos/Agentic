import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const JOB_TYPES = [
  { id: "farming", emoji: "🌾", label: "Farming" },
  { id: "mining", emoji: "⛏️", label: "Mining" },
  { id: "crafting", emoji: "🔨", label: "Crafting" },
  { id: "guarding", emoji: "🛡️", label: "Guarding" },
  { id: "hunting", emoji: "🏹", label: "Hunting" },
  { id: "gathering", emoji: "🧺", label: "Gathering" },
  { id: "delivery", emoji: "📦", label: "Delivery" },
];

export default function NewJobModal({ character, onCreated, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState(null);
  const [gold, setGold] = useState(10);
  const [xp, setXp] = useState(5);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !jobType) return;
    setSaving(true);
    await base44.entities.JobPosting.create({
      title: title.trim(),
      description: description.trim(),
      posted_by_character_id: character.id,
      posted_by_name: character.name,
      job_type: jobType,
      reward_gold: Number(gold),
      reward_xp: Number(xp),
      status: "open"
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black text-yellow-400">💼 Post a Job</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Job Type</label>
          <div className="grid grid-cols-4 gap-2">
            {JOB_TYPES.map(jt => (
              <button key={jt.id} onClick={() => setJobType(jt.id)}
                className={`p-2 rounded-lg border text-center transition-all
                  ${jobType === jt.id ? "border-yellow-500 bg-yellow-900/20" : "border-gray-700 bg-gray-800 hover:border-gray-500"}`}>
                <div className="text-xl">{jt.emoji}</div>
                <div className="text-xs text-gray-300">{jt.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-400 mb-1 block">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Job title..."
            className="bg-gray-800 border-gray-600 text-white" />
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-400 mb-1 block">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be done?"
            className="bg-gray-800 border-gray-600 text-white" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Gold Reward</label>
            <Input type="number" min="1" value={gold} onChange={e => setGold(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">XP Reward</label>
            <Input type="number" min="0" value={xp} onChange={e => setXp(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white" />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!title.trim() || !jobType || saving}
          className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold">
          {saving ? "Posting..." : "Post Job"}
        </Button>
      </div>
    </div>
  );
}