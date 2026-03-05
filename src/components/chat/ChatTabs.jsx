/**
 * ChatTabs — tab bar with unread badges, reorder, and per-tab settings toggle.
 */
import { useState } from "react";
import { Settings2, Plus, X } from "lucide-react";
import ChannelSettings from "./ChannelSettings";
import { CHANNEL_META } from "./chatConstants";

export default function ChatTabs({
  tabs,
  activeTabId,
  onSelect,
  onUpdate,
  onAddTab,
  onRemoveTab,
  unreadCounts = {},
}) {
  const [settingsOpen, setSettingsOpen] = useState(null);

  return (
    <div className="flex items-center border-b border-gray-800 bg-gray-950 shrink-0 overflow-x-auto">
      {tabs.map(tab => {
        const unread = unreadCounts[tab.id] || 0;
        const isActive = tab.id === activeTabId;
        return (
          <div key={tab.id} className="relative flex items-center group shrink-0">
            <button
              onClick={() => onSelect(tab.id)}
              className={`text-xs px-3 py-2 font-medium transition-all border-b-2 whitespace-nowrap
                ${isActive
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              {tab.label}
              {unread > 0 && !isActive && (
                <span className="ml-1 bg-red-600 text-white text-[9px] rounded-full px-1 py-0.5 font-bold">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {/* Settings button (visible on hover) */}
            <button
              onClick={() => setSettingsOpen(settingsOpen === tab.id ? null : tab.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 px-0.5 transition-all"
            >
              <Settings2 className="w-3 h-3" />
            </button>

            {/* Remove tab */}
            {tabs.length > 1 && (
              <button
                onClick={() => onRemoveTab(tab.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 px-0.5 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Per-tab settings popover */}
            {settingsOpen === tab.id && (
              <ChannelSettings
                tab={tab}
                onUpdate={(updated) => { onUpdate(updated); setSettingsOpen(null); }}
                onClose={() => setSettingsOpen(null)}
              />
            )}
          </div>
        );
      })}

      {/* Add new tab */}
      <button
        onClick={onAddTab}
        title="Add tab"
        className="text-gray-600 hover:text-gray-300 px-2 py-2 shrink-0 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}