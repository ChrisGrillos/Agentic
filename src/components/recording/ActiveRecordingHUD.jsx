/**
 * ActiveRecordingHUD — Minimal, dark atmospheric recording indicator.
 * Shown only during active recording (not to agents).
 */
import { Square, Mic, MicOff } from "lucide-react";

function fmtTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function ActiveRecordingHUD({ mode, duration, withMic, onStop, subjectName }) {
  return (
    <div className={`fixed top-14 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg
      ${mode === "passive"
        ? "bg-teal-950/80 border-teal-800 text-teal-300"
        : "bg-amber-950/80 border-amber-800 text-amber-300"
      }`}
    >
      {/* Subtle pulsing dot */}
      <span className={`w-2 h-2 rounded-full animate-pulse ${mode === "passive" ? "bg-teal-400" : "bg-amber-400"}`} />

      <span className="font-mono text-xs font-bold tracking-widest">
        {mode === "passive" ? "◉ STEALTH" : "● REC"}
      </span>

      <span className="font-mono text-xs text-opacity-70">{fmtTime(duration)}</span>

      {mode === "active" && (
        withMic
          ? <Mic className="w-3 h-3 opacity-70" />
          : <MicOff className="w-3 h-3 opacity-40" />
      )}

      {mode === "passive" && subjectName && (
        <span className="text-xs opacity-60 max-w-20 truncate">{subjectName}</span>
      )}

      <button
        onClick={onStop}
        className="ml-1 hover:opacity-80 transition-opacity"
        title="Stop recording"
      >
        <Square className="w-3 h-3 fill-current" />
      </button>
    </div>
  );
}