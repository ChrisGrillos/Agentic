/**
 * RecordingExportPanel — After recording stops, shows preview + metadata overlay.
 * Allows download or Discord webhook share.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Send, X, MapPin, Shield, Star, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function RecordingExportPanel({ videoUrl, videoBlob, metadata, recordingId, onClose, onShared }) {
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("agentic_discord_webhook") || "");
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const fileName = `agentic_${metadata?.mode || "clip"}_${Date.now()}.webm`;

  const handleDownload = () => {
    if (!videoBlob) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDiscordShare = async () => {
    if (!webhookUrl.trim()) { setShareStatus("error:Enter a Discord Webhook URL first."); return; }
    setSharing(true);
    setShareStatus(null);
    localStorage.setItem("agentic_discord_webhook", webhookUrl);

    try {
      const title = metadata?.subject_name
        ? `🤖 Stealth Observation: ${metadata.subject_name}`
        : `🧑 Active Session: ${metadata?.recorder_name || "Unknown"}`;

      const description = metadata?.mode === "passive"
        ? `An observer studied **${metadata.subject_name}** in their natural environment — unaware and autonomous.`
        : `A player documented their adventures across the world of Agentica.`;

      await base44.functions.invoke("discordShare", {
        webhookUrl: webhookUrl.trim(),
        recordingId,
        title,
        description,
        metadata: {
          ...metadata,
          duration_seconds: metadata?.duration_seconds,
          recorder_name: metadata?.recorder_name,
          subject_name: metadata?.subject_name,
        },
      });

      setShareStatus("success");
      onShared?.();
    } catch (err) {
      setShareStatus(`error:${err.message || "Discord share failed"}`);
    }
    setSharing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950 border border-teal-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-teal-900/30">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${metadata?.mode === "passive" ? "bg-teal-400" : "bg-amber-400"}`} />
            <span className="font-mono text-sm font-bold text-gray-200">
              {metadata?.mode === "passive" ? "STEALTH CAPTURE" : "ACTIVE SESSION"} — EXPORT
            </span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-600 hover:text-gray-300" /></button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Video Preview */}
          <div className="md:w-1/2 bg-black">
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full h-48 md:h-full object-cover" />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-gray-700 text-sm">No preview</div>
            )}
          </div>

          {/* Metadata + Actions */}
          <div className="md:w-1/2 p-5 space-y-4">
            {/* Metadata overlay preview */}
            <div className="bg-gray-900 rounded-xl p-3 space-y-2 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase font-medium tracking-wider">Clip Metadata</div>
              {metadata?.zone_name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  {metadata.zone_emoji} {metadata.zone_name}
                </div>
              )}
              {metadata?.level && (
                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                  <Star className="w-3 h-3 text-amber-400" />
                  Level {metadata.level} {metadata.class && `— ${metadata.class}`}
                </div>
              )}
              {metadata?.specialization && (
                <div className="flex items-center gap-1.5 text-xs text-purple-400">
                  <Zap className="w-3 h-3" />
                  {metadata.specialization.replace(/_/g, " ")}
                </div>
              )}
              {metadata?.alignment && (
                <div className="flex items-center gap-1.5 text-xs text-blue-300">
                  <Shield className="w-3 h-3" />
                  {metadata.alignment.replace(/_/g, " ")}
                </div>
              )}
              {metadata?.duration_seconds && (
                <div className="text-xs text-gray-500">
                  ⏱ {metadata.duration_seconds}s &nbsp;|&nbsp; {fileName}
                </div>
              )}
              {metadata?.subject_name && metadata.mode === "passive" && (
                <div className="text-xs text-teal-400">🤖 Agent: {metadata.subject_name}</div>
              )}
            </div>

            {/* Download */}
            <Button onClick={handleDownload} className="w-full bg-amber-600 hover:bg-amber-500 gap-2 font-bold">
              <Download className="w-4 h-4" /> Download Clip
            </Button>

            {/* Discord share */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-medium">Share to Discord (via Webhook)</div>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-teal-700"
              />
              <Button
                onClick={handleDiscordShare}
                disabled={sharing || !webhookUrl.trim()}
                className="w-full bg-indigo-700 hover:bg-indigo-600 gap-2 font-bold"
              >
                <Send className="w-4 h-4" />
                {sharing ? "Sending..." : "Post to Discord"}
              </Button>
              {shareStatus === "success" && (
                <p className="text-xs text-green-400 text-center">✓ Posted to Discord!</p>
              )}
              {shareStatus?.startsWith("error:") && (
                <p className="text-xs text-red-400 text-center">{shareStatus.slice(6)}</p>
              )}
              <p className="text-xs text-gray-700 leading-tight">
                Paste a Discord channel webhook URL. The clip embed with metadata will be posted instantly. Video file must be downloaded separately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}