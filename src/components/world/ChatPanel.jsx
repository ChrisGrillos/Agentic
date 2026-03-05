import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const CHANNEL_COLORS = {
  global: "text-yellow-400",
  local: "text-green-400",
  party: "text-blue-400",
  trade: "text-orange-400",
};

export default function ChatPanel({ messages, onSend, myCharacter }) {
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState("global");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim(), channel);
    setInput("");
  };

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
      <div className="p-2 border-b border-gray-800">
        <div className="flex gap-1">
          {["global", "local", "trade"].map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`px-2 py-0.5 rounded text-xs font-medium capitalize transition-all
                ${channel === ch ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}>
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className="flex gap-1 items-start">
            <span className="shrink-0">
              {msg.character_type === "ai_agent" ? "🤖" : "🧑"}
            </span>
            <div>
              <span className={`font-bold ${msg.character_type === "ai_agent" ? "text-cyan-400" : "text-amber-400"}`}>
                {msg.character_name}
              </span>
              <span className={`ml-1 text-xs ${CHANNEL_COLORS[msg.channel] || "text-gray-500"}`}>[{msg.channel}]</span>
              <span className="text-gray-300 ml-1">{msg.message}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {myCharacter && (
        <div className="p-2 border-t border-gray-800 flex gap-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Say something..."
            className="flex-1 bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700 outline-none focus:border-amber-500"
          />
          <button onClick={send} className="bg-amber-500 hover:bg-amber-600 rounded p-1.5">
            <Send className="w-3 h-3 text-black" />
          </button>
        </div>
      )}
    </div>
  );
}