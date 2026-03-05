/**
 * ChannelSettings — per-tab filter and agent-mode panel (shown in a popover).
 */
import { useState } from "react";
import { X, Settings2 } from "lucide-react";
import { AGENT_FILTER_MODES, CHANNEL_META } from "./chatConstants";

const ALL_CHANNELS = Object.keys(CHANNEL_META);

export default function ChannelSettings({ tab, onUpdate, onClose }) {
  const [channels, setChannels] = useState([...tab.channels]);
  const [agentFilter, setAgentFilter] = useState(tab.agentFilter || "show_all");
  const [defaultChannel, setDefaultChannel] = useState(tab.defaultChannel || "say");

  const toggleChannel = (ch) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const save = () => {
    onUpdate({ ...tab, channels, agentFilter, defaultChannel });
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-200">
          <Settings2 className="w-4 h-4" />
          {tab.label} Settings
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Agent filter */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 block">Agent Filter</label>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(AGENT_FILTER_MODES).map(([id, { label, icon }]) => (
            <button
              key={id}
              onClick={() => setAgentFilter(id)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all
                ${agentFilter === id
                  ? "border-amber-500 bg-amber-900/30 text-amber-300"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"}`}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Default input channel */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 block">Default Channel</label>
        <select
          value={defaultChannel}
          onChange={e => setDefaultChannel(e.target.value)}
          className="w-full bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700 outline-none"
        >
          {ALL_CHANNELS.map(ch => (
            <option key={ch} value={ch}>{CHANNEL_META[ch]?.label || ch}</option>
          ))}
        </select>
      </div>

      {/* Visible channels */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 block">Visible Channels</label>
        <div className="flex flex-wrap gap-1">
          {ALL_CHANNELS.map(ch => {
            const meta = CHANNEL_META[ch];
            const on = channels.includes(ch);
            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-all
                  ${on ? `${meta.color} border-current/50 bg-current/10` : "border-gray-700 text-gray-600"}`}
              >
                {meta.short}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={save}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-1.5 rounded transition-all"
      >
        Save
      </button>
    </div>
  );
}