import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const MSG_TYPE_COLOR = { chat: "", system: "text-amber-400 italic", war_declaration: "text-red-400 font-bold", quest_complete: "text-green-400", member_joined: "text-blue-400 italic", upgrade: "text-purple-400 italic" };

export default function GuildChat({ guild, character }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.entities.GuildMessage.filter({ guild_id: guild.id }, "-created_date", 50)
      .then(msgs => setMessages(msgs.reverse()));

    const unsub = base44.entities.GuildMessage.subscribe(event => {
      if (event.type === "create" && event.data?.guild_id === guild.id) {
        setMessages(prev => [...prev.slice(-49), event.data]);
      }
    });
    return unsub;
  }, [guild.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await base44.entities.GuildMessage.create({
      guild_id: guild.id, character_id: character.id,
      character_name: character.name, character_type: character.type,
      message: input.trim(), message_type: "chat",
    });
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[60vh] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500">
        {guild.emoji} {guild.name} — Guild Chat
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => {
          const isMe = msg.character_id === character.id;
          const typeColor = MSG_TYPE_COLOR[msg.message_type] || "";
          if (msg.message_type !== "chat") {
            return (
              <div key={i} className={`text-xs text-center py-0.5 ${typeColor || "text-gray-500"}`}>
                {msg.message}
              </div>
            );
          }
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isMe ? "bg-amber-800/60 text-white" : "bg-gray-800 text-gray-200"}`}>
                {!isMe && <div className="text-xs text-amber-400 mb-0.5 font-bold">{msg.character_name}</div>}
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-800 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Message your guild..." className="bg-gray-800 border-gray-600 text-white text-sm" />
        <Button onClick={handleSend} disabled={sending || !input.trim()} className="bg-amber-700 hover:bg-amber-600">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}