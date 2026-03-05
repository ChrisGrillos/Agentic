import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Coins, Star } from "lucide-react";
import NewJobModal from "@/components/jobs/NewJobModal.jsx";

const JOB_ICONS = {
  farming: "🌾", mining: "⛏️", crafting: "🔨", guarding: "🛡️",
  hunting: "🏹", gathering: "🧺", delivery: "📦"
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("open");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      setMyCharacter(chars.find(c => c.type === "human") || chars[0] || null);
    }
    const all = await base44.entities.JobPosting.list("-created_date", 50);
    setJobs(all);
  };

  const handleAccept = async (job) => {
    if (!myCharacter || job.posted_by_character_id === myCharacter.id) return;
    await base44.entities.JobPosting.update(job.id, {
      status: "in_progress",
      assigned_to_character_id: myCharacter.id,
      assigned_to_name: myCharacter.name
    });
    loadData();
  };

  const handleComplete = async (job) => {
    if (!myCharacter || job.assigned_to_character_id !== myCharacter.id) return;
    await Promise.all([
      base44.entities.JobPosting.update(job.id, { status: "completed" }),
      base44.entities.Character.update(myCharacter.id, {
        gold: (myCharacter.gold || 0) + job.reward_gold,
        xp: (myCharacter.xp || 0) + (job.reward_xp || 10)
      })
    ]);
    loadData();
  };

  const filtered = jobs.filter(j => filter === "all" ? true : j.status === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-amber-400">💼 Job Board</h1>
            <p className="text-gray-400 mt-1">Hire AI agents or take work yourself</p>
          </div>
          {myCharacter && (
            <Button onClick={() => setShowNew(true)} className="bg-yellow-600 hover:bg-yellow-700 font-bold">
              + Post Job
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {["open", "in_progress", "completed", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                ${filter === f ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex gap-3 items-start">
                <span className="text-3xl">{JOB_ICONS[job.job_type] || "📋"}</span>
                <div>
                  <h3 className="font-bold text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{job.description}</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="text-gray-500">By: <span className="text-gray-300">{job.posted_by_name}</span></span>
                    {job.assigned_to_name && (
                      <span className="text-gray-500">Assigned: <span className="text-cyan-400">{job.assigned_to_name}</span></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-2 items-center">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {job.reward_gold}g
                  </span>
                  {job.reward_xp > 0 && (
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Star className="w-4 h-4" /> {job.reward_xp}xp
                    </span>
                  )}
                </div>
                <Badge className={
                  job.status === "open" ? "bg-green-900 text-green-300" :
                  job.status === "in_progress" ? "bg-blue-900 text-blue-300" :
                  "bg-gray-800 text-gray-400"
                }>
                  {job.status.replace("_", " ")}
                </Badge>
                {myCharacter && job.status === "open" && job.posted_by_character_id !== myCharacter.id && (
                  <Button size="sm" onClick={() => handleAccept(job)} className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs">
                    Accept
                  </Button>
                )}
                {myCharacter && job.status === "in_progress" && job.assigned_to_character_id === myCharacter.id && (
                  <Button size="sm" onClick={() => handleComplete(job)} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs">
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-16">No jobs in this category.</div>
          )}
        </div>
      </div>

      {showNew && myCharacter && (
        <NewJobModal character={myCharacter} onCreated={() => { setShowNew(false); loadData(); }} onClose={() => setShowNew(false)} />
      )}
    </div>
  );
}