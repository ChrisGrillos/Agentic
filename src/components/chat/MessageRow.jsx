/**
 * MessageRow — renders a single chat message or a summary cluster.
 */
import { useState } from "react";
import { CHANNEL_META, SPEAKER_COLORS, SPEAKER_ICONS } from "./chatConstants";
import { ChevronDown, ChevronRight } from "lucide-react";

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function SummaryRow({ msg, showTimestamps }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="my-0.5">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left flex items-center gap-1 text-gray-500 hover:text-gray-400 text-xs px-1 py-0.5 rounded hover:bg-gray-800/40 transition-all"
      >
        {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <span className="italic">{msg.message}</span>
        <span className="ml-auto text-gray-600 text-[10px] shrink-0">×{msg.summaryCount}</span>
        {showTimestamps && <span className="text-[10px] text-gray-700 ml-1">{formatTime(msg.timestamp)}</span>}
      </button>
      {expanded && (
        <div className="pl-4 border-l border-gray-700/40 ml-1 mt-0.5 space-y-0.5">
          {msg.summaryMessages.map(m => (
            <MessageRow key={m.id} msg={m} showTimestamps={showTimestamps} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessageRow({ msg, showTimestamps, onClickSpeaker, myCharacterId, highlighted }) {
  if (msg.isSummary) return <SummaryRow msg={msg} showTimestamps={showTimestamps} />;

  const chMeta    = CHANNEL_META[msg.channel_type] || CHANNEL_META.say;
  const spColor   = SPEAKER_COLORS[msg.speaker_type] || "text-gray-300";
  const spIcon    = SPEAKER_ICONS[msg.speaker_type] || "💬";
  const isTell    = msg.channel_type === "tell";
  const isSystem  = msg.speaker_type === "system" || msg.channel_type === "system";
  const isMention = !isSystem && myCharacterId && msg.message?.toLowerCase().includes(myCharacterId.toLowerCase());
  const isMe      = msg.speaker_id === myCharacterId;

  const rowBg = isMention
    ? "bg-yellow-900/20 border-l-2 border-yellow-500/60 pl-1"
    : highlighted ? "bg-gray-800/30" : "";

  if (isSystem) {
    return (
      <div className={`flex items-start gap-1 text-xs py-0.5 ${rowBg}`}>
        {showTimestamps && <span className="text-gray-700 shrink-0 text-[10px] mt-0.5">{formatTime(msg.timestamp)}</span>}
        <span className="text-gray-500 italic">{msg.message}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-1 text-xs py-0.5 group ${rowBg}`}>
      {showTimestamps && (
        <span className="text-gray-700 shrink-0 text-[10px] mt-0.5">{formatTime(msg.timestamp)}</span>
      )}
      <span className="shrink-0 mt-0.5">{spIcon}</span>
      <div className="flex-1 min-w-0 leading-relaxed">
        {isTell ? (
          <>
            <span className={`font-bold ${spColor}`}>{isMe ? `→ ${msg.tell_target}` : msg.speaker_name}</span>
            <span className="text-pink-300/70 ml-1 text-[10px]">[tells you]</span>
            <span className="text-gray-200 ml-1 break-words">{msg.message}</span>
          </>
        ) : (
          <>
            <button
              onClick={() => onClickSpeaker?.(msg)}
              className={`font-bold hover:underline cursor-pointer ${spColor}`}
            >
              {msg.speaker_name}
            </button>
            <span className={`ml-1 text-[10px] opacity-60 ${chMeta.color}`}>[{chMeta.label}]</span>
            <span className={`ml-1 break-words ${isMention ? "text-yellow-200 font-semibold" : "text-gray-300"}`}>
              {msg.message}
            </span>
          </>
        )}
      </div>
    </div>
  );
}