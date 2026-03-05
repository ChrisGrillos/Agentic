/**
 * ChatInput — single input bar for the active tab.
 * Handles slash-command parsing and channel shortcuts.
 */
import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { CHANNEL_META } from "./chatConstants";
import { parseInput } from "./chatCommands";

const CHANNEL_CYCLE = ["say", "party", "guild", "global", "trade", "tell"];

export default function ChatInput({ defaultChannel = "say", onSend, onCommand, disabled }) {
  const [input, setInput] = useState("");
  const [activeChannel, setActiveChannel] = useState(defaultChannel);
  const inputRef = useRef(null);

  const chMeta = CHANNEL_META[activeChannel] || CHANNEL_META.say;

  const handleSend = () => {
    const raw = input.trim();
    if (!raw) return;

    const parsed = parseInput(raw);

    if (parsed.command) {
      // Slash command — let parent handle it
      onCommand?.(parsed);
      setInput("");
      return;
    }

    const channel = parsed.channel || activeChannel;
    onSend?.(parsed.text || raw, channel);
    setInput("");
  };

  const cycleChannel = () => {
    const idx = CHANNEL_CYCLE.indexOf(activeChannel);
    setActiveChannel(CHANNEL_CYCLE[(idx + 1) % CHANNEL_CYCLE.length]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSend(); }
    if (e.key === "Tab")   { e.preventDefault(); cycleChannel(); }
  };

  // Show channel suggestion while typing /
  const suggestion = input.startsWith("/") ? input.split(" ")[0] : null;

  return (
    <div className="flex items-center gap-1.5 p-2 border-t border-gray-800 bg-gray-950">
      {/* Channel badge — click to cycle */}
      <button
        onClick={cycleChannel}
        title="Tab to cycle channel"
        className={`shrink-0 text-[10px] font-bold px-1.5 py-1 rounded border ${chMeta.color} border-current/40 hover:brightness-125 transition-all select-none`}
      >
        {CHANNEL_META[activeChannel]?.short || "S"}
      </button>

      <div className="relative flex-1">
        {suggestion && (
          <div className="absolute -top-7 left-0 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-300 pointer-events-none">
            {suggestion}
          </div>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={`${chMeta.label} · Tab=cycle, /cmd`}
          className="w-full bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700 outline-none focus:border-amber-500/60 disabled:opacity-40"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="shrink-0 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded p-1.5 transition-all"
      >
        <Send className="w-3 h-3 text-black" />
      </button>
    </div>
  );
}