import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Video, Eye, EyeOff, Clock, Download, Trash2, ChevronDown, ChevronUp, Mic, MicOff } from "lucide-react";
import useScreenRecorder from "@/components/recording/useScreenRecorder";
import useAgentRecorder from "@/components/recording/useAgentRecorder";
import ActiveRecordingHUD from "@/components/recording/ActiveRecordingHUD";
import RecordingExportPanel from "@/components/recording/RecordingExportPanel";
import { getZoneAt } from "@/components/shared/worldZones";

function fmtDuration(s) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function Recording() {
  const [user, setUser] = useState(null);
  const [myChar, setMyChar] = useState(null);
  const [aiAgents, setAiAgents] = useState([]);
  const [pastRecordings, setPastRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withMic, setWithMic] = useState(false);
  const [exportTarget, setExportTarget] = useState(null); // { videoUrl, videoBlob, metadata, recordingId }
  const [activeRecMode, setActiveRecMode] = useState(null); // "active" | "passive"
  const [passiveAgent, setPassiveAgent] = useState(null);
  const [showAgents, setShowAgents] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const screen = useScreenRecorder();
  const agent  = useAgentRecorder();

  const isRecording = screen.recording || agent.recording;

  useEffect(() => { loadData(); }, []);

  // When active recording finishes → save meta + show export
  useEffect(() => {
    if (!screen.recording && screen.videoBlob && activeRecMode === "active" && myChar) {
      handleRecordingStopped("active", myChar, null, screen.videoBlob, screen.videoUrl, screen.duration);
    }
  }, [screen.recording, screen.videoBlob]);

  // When agent recording finishes → save meta + show export
  useEffect(() => {
    if (!agent.recording && agent.videoBlob && activeRecMode === "passive" && passiveAgent) {
      handleRecordingStopped("passive", myChar, passiveAgent, agent.videoBlob, agent.videoUrl, agent.duration);
    }
  }, [agent.recording, agent.videoBlob]);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      const [chars, recs] = await Promise.all([
        base44.entities.Character.list("-updated_date", 100),
        base44.entities.Recording.filter({ recorder_character_id: { $exists: true } }, "-created_date", 20).catch(() => []),
      ]);
      const mine = chars.find(c => c.created_by === u.email && c.type === "human");
      setMyChar(mine || null);
      setAiAgents(chars.filter(c => c.type === "ai_agent"));
      // Only show this user's recordings
      if (mine) setPastRecordings(recs.filter(r => r.recorder_character_id === mine.id));
    }
    setLoading(false);
  };

  const handleRecordingStopped = async (mode, recorder, subject, blob, url, duration) => {
    setSavingMeta(true);
    const zone = recorder ? getZoneAt(recorder.x || 20, recorder.y || 20) : null;
    const subj = subject || {};
    const metadata = {
      x: recorder?.x, y: recorder?.y,
      level: mode === "passive" ? subj.level : recorder?.level,
      class: mode === "passive" ? subj.base_class || subj.class : recorder?.base_class || recorder?.class,
      specialization: mode === "passive" ? subj.specialization : recorder?.specialization,
      alignment: mode === "passive"
        ? subj.agent_traits?.ethical_alignment
        : recorder?.agent_traits?.ethical_alignment,
    };

    const title = mode === "passive"
      ? `Stealth: ${subj.name}`
      : `Active: ${recorder?.name}`;

    const rec = await base44.entities.Recording.create({
      title,
      mode,
      recorder_character_id: recorder?.id || "",
      recorder_name: recorder?.name || "",
      subject_character_id: subj.id || "",
      subject_name: subj.name || "",
      status: "stopped",
      duration_seconds: duration,
      zone_name: zone?.name || "",
      zone_emoji: zone?.emoji || "",
      metadata,
      file_name: `agentic_${mode}_${Date.now()}.webm`,
    }).catch(() => null);

    setExportTarget({
      videoUrl: url,
      videoBlob: blob,
      recordingId: rec?.id || null,
      metadata: {
        ...metadata,
        mode,
        zone_name: zone?.name || "",
        zone_emoji: zone?.emoji || "",
        recorder_name: recorder?.name,
        subject_name: subj.name,
        duration_seconds: duration,
      },
    });
    setActiveRecMode(null);
    setSavingMeta(false);
    setPastRecordings(prev => rec ? [rec, ...prev] : prev);
  };

  const startActiveRecording = async () => {
    if (isRecording) return;
    setActiveRecMode("active");
    screen.reset();
    await screen.startRecording({ withMic });
  };

  const startPassiveRecording = async (agentChar) => {
    if (isRecording) return;
    setPassiveAgent(agentChar);
    setActiveRecMode("passive");
    agent.reset();
    await agent.startRecording(agentChar);
    setShowAgents(false);
  };

  const stopCurrent = () => {
    if (screen.recording) screen.stopRecording();
    if (agent.recording) agent.stopRecording();
  };

  const handleDeleteRec = async (recId) => {
    await base44.entities.Recording.delete(recId);
    setPastRecordings(prev => prev.filter(r => r.id !== recId));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-teal-400 font-mono">
      Initializing Capture Module...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Recording HUD overlay */}
      {isRecording && (
        <ActiveRecordingHUD
          mode={activeRecMode}
          duration={screen.recording ? screen.duration : agent.duration}
          withMic={withMic}
          subjectName={passiveAgent?.name}
          onStop={stopCurrent}
        />
      )}

      {/* Export panel */}
      {exportTarget && (
        <RecordingExportPanel
          {...exportTarget}
          onClose={() => setExportTarget(null)}
          onShared={() => setPastRecordings(prev =>
            prev.map(r => r.id === exportTarget.recordingId ? { ...r, discord_shared: true, status: "exported" } : r)
          )}
        />
      )}

      <div className="max-w-5xl mx-auto p-5">
        <Link to={createPageUrl("Home")} className="text-gray-600 hover:text-amber-400 text-xs mb-4 block">← Back to Agentica</Link>

        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-3xl font-black text-teal-400 flex items-center gap-2">
              <Video className="w-7 h-7" /> Capture Chronicle
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Document your adventures. Observe agents. Share to Discord.
            </p>
          </div>
          {savingMeta && <span className="text-xs text-gray-600 animate-pulse mt-1">Saving metadata...</span>}
        </div>

        {!user && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            <p className="mb-3">Sign in to use the Capture Chronicle.</p>
            <Button onClick={() => base44.auth.redirectToLogin(createPageUrl("Recording"))}
              className="bg-teal-700 hover:bg-teal-600">Enter the World</Button>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Active Recording ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* ACTIVE MODE */}
              <div className={`bg-gray-900 border rounded-2xl p-5 transition-all
                ${screen.recording ? "border-amber-700 shadow-lg shadow-amber-900/20" : "border-gray-800"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${screen.recording ? "bg-amber-400 animate-pulse" : "bg-gray-600"}`} />
                  <span className="font-bold text-amber-300 text-sm uppercase tracking-wide">Active Session Recording</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Record your own screen as you explore the world. Browser screen-share — your perspective, your story.
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setWithMic(m => !m)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all
                      ${withMic ? "border-amber-700 bg-amber-900/30 text-amber-300" : "border-gray-700 text-gray-500"}`}
                  >
                    {withMic ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    {withMic ? "Mic On" : "Mic Off"}
                  </button>
                  {myChar && (
                    <span className="text-xs text-gray-600">
                      Recording as: <span className="text-amber-400">{myChar.name}</span>
                    </span>
                  )}
                </div>

                {screen.error && (
                  <p className="text-xs text-red-400 mb-3 bg-red-900/20 border border-red-900 px-3 py-2 rounded-lg">{screen.error}</p>
                )}

                <div className="flex gap-2">
                  {!screen.recording ? (
                    <Button
                      onClick={startActiveRecording}
                      disabled={isRecording || !myChar}
                      className="bg-amber-700 hover:bg-amber-600 font-bold gap-2"
                    >
                      <Video className="w-4 h-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button onClick={screen.stopRecording} className="bg-red-800 hover:bg-red-700 font-bold gap-2">
                      ■ Stop — {screen.duration}s
                    </Button>
                  )}
                </div>
              </div>

              {/* PASSIVE (STEALTH) MODE */}
              <div className={`bg-gray-900 border rounded-2xl p-5 transition-all
                ${agent.recording ? "border-teal-700 shadow-lg shadow-teal-900/20" : "border-gray-800"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${agent.recording ? "bg-teal-400 animate-pulse" : "bg-gray-600"}`} />
                  <span className="font-bold text-teal-300 text-sm uppercase tracking-wide">Stealth Agent Observation</span>
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full ml-auto">Passive • Agent Unaware</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Observe any AI agent's world — rendered live from database state. The agent has no knowledge of being recorded.
                  Their autonomy remains intact.
                </p>

                {agent.error && (
                  <p className="text-xs text-red-400 mb-3 bg-red-900/20 border border-red-900 px-3 py-2 rounded-lg">{agent.error}</p>
                )}

                {!agent.recording ? (
                  <div>
                    <Button
                      onClick={() => setShowAgents(s => !s)}
                      disabled={isRecording}
                      variant="outline"
                      className="border-teal-900 text-teal-400 hover:bg-teal-900/20 gap-2 mb-3"
                    >
                      <EyeOff className="w-4 h-4" />
                      Select Agent to Observe
                      {showAgents ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>

                    {showAgents && (
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                        {aiAgents.length === 0 && (
                          <p className="text-xs text-gray-600 col-span-2">No AI agents found. Visit the Agents page to spawn one.</p>
                        )}
                        {aiAgents.map(ag => (
                          <button
                            key={ag.id}
                            onClick={() => startPassiveRecording(ag)}
                            className="text-left bg-gray-800 hover:bg-teal-900/20 border border-gray-700 hover:border-teal-800 rounded-xl p-3 transition-all"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{ag.avatar_emoji || "🤖"}</span>
                              <div>
                                <div className="text-xs font-bold text-teal-300">{ag.name}</div>
                                <div className="text-xs text-gray-500 capitalize">Lv.{ag.level || 1} {ag.base_class || ag.class}</div>
                              </div>
                            </div>
                            <div className={`text-xs capitalize inline-block px-1.5 py-0.5 rounded text-xs
                              ${ag.status === "fighting" ? "bg-red-900/40 text-red-400" :
                                ag.status === "roaming" ? "bg-blue-900/40 text-blue-400" :
                                "bg-gray-700 text-gray-500"}`}>
                              {ag.status || "idle"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button onClick={agent.stopRecording} className="bg-red-800 hover:bg-red-700 font-bold gap-2">
                      ■ Stop — {agent.duration}s
                    </Button>
                    <span className="text-xs text-teal-400">
                      👁 Observing <span className="font-bold">{passiveAgent?.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Past Recordings ── */}
            <div>
              <h3 className="text-xs uppercase text-gray-600 font-medium tracking-wider mb-3">
                <Clock className="w-3 h-3 inline mr-1" /> Session History
              </h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {pastRecordings.length === 0 && (
                  <p className="text-xs text-gray-700 py-6 text-center">No sessions recorded yet.</p>
                )}
                {pastRecordings.map(rec => (
                  <div key={rec.id} className={`bg-gray-900 border rounded-xl p-3 group
                    ${rec.mode === "passive" ? "border-gray-800 hover:border-teal-900" : "border-gray-800 hover:border-amber-900"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${rec.mode === "passive" ? "bg-teal-500" : "bg-amber-500"}`} />
                        <span className="text-xs font-bold text-gray-300 truncate max-w-32">{rec.title}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRec(rec.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-gray-700 hover:text-red-400" />
                      </button>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {rec.zone_name && (
                        <div className="text-xs text-gray-600">{rec.zone_emoji} {rec.zone_name}</div>
                      )}
                      <div className="text-xs text-gray-700">
                        {fmtDuration(rec.duration_seconds)}
                        {rec.discord_shared && <span className="ml-2 text-indigo-500">✓ Discord</span>}
                      </div>
                      <div className={`text-xs capitalize ${
                        rec.status === "exported" ? "text-green-600" :
                        rec.status === "stopped" ? "text-gray-600" : "text-amber-600"
                      }`}>
                        {rec.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}