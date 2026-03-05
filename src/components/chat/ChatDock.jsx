/**
 * ChatDock — main docked chat shell.
 * Multi-tab, agent-filter-aware, slash-command enabled.
 * Replaces the old ChatPanel.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ChatTabs from "./ChatTabs";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import SpeakerContextMenu from "./SpeakerContextMenu";
import { enrichMessage } from "./agentChatFilters";
import { DEFAULT_TABS, CHANNEL_META } from "./chatConstants";
import { executeCommand } from "./chatCommands";
import { base44 } from "@/api/base44Client";
import { Minimize2, Maximize2, MessageSquare } from "lucide-react";

const PREFS_KEY = "aetheria_chat_prefs";

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

export default function ChatDock({ messages: rawMessages = [], onSend, myCharacter }) {
  const prefs = useMemo(() => loadPrefs(), []);

  const [tabs, setTabs] = useState(() => prefs.tabs || DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState(prefs.activeTabId || "main");
  const [unread, setUnread] = useState({});
  const [showTimestamps, setShowTimestamps] = useState(prefs.showTimestamps ?? false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(prefs.muted || []);
  const [ignored, setIgnored] = useState(prefs.ignored || []);
  const [contextMenu, setContextMenu] = useState(null); // { msg, position }
  const [systemMessages, setSystemMessages] = useState([]);
  const [customChannels, setCustomChannels] = useState(prefs.customChannels || {});
  const [joinedChannels, setJoinedChannels] = useState(prefs.joinedChannels || []);

  const prevLengthRef = useRef(rawMessages.length);

  // Enrich raw messages
  const messages = useMemo(() => rawMessages.map(enrichMessage), [rawMessages]);

  // Persist prefs on change
  useEffect(() => {
    savePrefs({ tabs, activeTabId, showTimestamps, muted, ignored, customChannels, joinedChannels });
  }, [tabs, activeTabId, showTimestamps, muted, ignored, customChannels, joinedChannels]);

  // Track unread counts for inactive tabs
  useEffect(() => {
    const newMsgs = messages.slice(prevLengthRef.current);
    if (!newMsgs.length) { prevLengthRef.current = messages.length; return; }
    prevLengthRef.current = messages.length;

    setUnread(prev => {
      const next = { ...prev };
      for (const tab of tabs) {
        if (tab.id === activeTabId) continue;
        const relevant = newMsgs.filter(m =>
          tab.channels.includes(m.channel_type) || tab.channels.includes("all")
        );
        if (relevant.length) next[tab.id] = (next[tab.id] || 0) + relevant.length;
      }
      return next;
    });
  }, [messages, tabs, activeTabId]);

  // Clear unread on tab switch
  const handleSelectTab = (id) => {
    setActiveTabId(id);
    setUnread(prev => ({ ...prev, [id]: 0 }));
  };

  const allMessages = useMemo(() => [
    ...messages,
    ...systemMessages,
  ], [messages, systemMessages]);

  const addSystemMsg = useCallback((text) => {
    setSystemMessages(prev => [...prev, {
      id: `sys_${Date.now()}`,
      speaker_type: "system",
      channel_type: "system",
      speaker_name: "System",
      message: text,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const handleSend = useCallback((text, channel) => {
    onSend?.(text, channel);
  }, [onSend]);

  const cmdState = useMemo(() => ({
    myName: myCharacter?.name || "",
    customChannels,
    joinedChannels,
    muted,
    ignored,
  }), [myCharacter, customChannels, joinedChannels, muted, ignored]);

  const handleCommand = useCallback((parsed) => {
    const result = executeCommand(parsed, cmdState, (updater) => {
      const next = updater(cmdState);
      if (next.customChannels !== undefined) setCustomChannels(next.customChannels);
      if (next.joinedChannels !== undefined) setJoinedChannels(next.joinedChannels);
      if (next.muted       !== undefined)   setMuted(next.muted);
      if (next.ignored     !== undefined)   setIgnored(next.ignored);
    });
    if (result?.reply) addSystemMsg(result.reply);
    if (result?.channel && result?.text) handleSend(result.text, result.channel);
  }, [cmdState, addSystemMsg, handleSend]);

  const handleSpeakerAction = useCallback((actionId, msg) => {
    switch (actionId) {
      case "tell":
        // Pre-fill /tell target in input by injecting a tell system message
        addSystemMsg(`Type your message to ${msg.speaker_name}. Use /tell ${msg.speaker_name} <msg>`);
        break;
      case "mute":
        setMuted(prev => [...new Set([...prev, msg.speaker_name])]);
        addSystemMsg(`Muted ${msg.speaker_name}.`);
        break;
      case "ignore":
        setIgnored(prev => [...new Set([...prev, msg.speaker_name])]);
        addSystemMsg(`Ignoring ${msg.speaker_name}.`);
        break;
      case "invite":
        addSystemMsg(`Party invite sent to ${msg.speaker_name}.`);
        break;
      case "inspect":
        addSystemMsg(`Inspecting ${msg.speaker_name}...`);
        break;
    }
  }, [addSystemMsg]);

  const handleClickSpeaker = useCallback((msg, event) => {
    const rect = event?.target?.getBoundingClientRect?.();
    const x = rect ? rect.right + 4 : 100;
    const y = rect ? rect.top : 100;
    setContextMenu({ msg, position: { x, y } });
  }, []);

  const addTab = () => {
    const id = `custom_${Date.now()}`;
    const newTab = {
      id,
      label: `Tab ${tabs.length + 1}`,
      channels: ["say", "local", "global"],
      defaultChannel: "say",
      agentFilter: "show_all",
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  };

  const removeTab = (id) => {
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) setActiveTabId(tabs[0]?.id || "main");
  };

  const updateTab = (updated) => {
    setTabs(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div
      className={`flex flex-col bg-gray-950/95 border-l border-gray-800 shrink-0 transition-all duration-200
        ${minimized ? "w-10" : "w-80"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800 shrink-0">
        {!minimized && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-gray-400">Chat</span>
            <button
              onClick={() => setShowTimestamps(v => !v)}
              title="Toggle timestamps"
              className={`text-[9px] px-1 py-0.5 rounded border ml-1 transition-all
                ${showTimestamps ? "border-amber-500/50 text-amber-400" : "border-gray-700 text-gray-600"}`}
            >
              TS
            </button>
          </div>
        )}
        <button
          onClick={() => setMinimized(v => !v)}
          className="text-gray-600 hover:text-gray-300 ml-auto p-0.5"
        >
          {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <ChatTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={handleSelectTab}
            onUpdate={updateTab}
            onAddTab={addTab}
            onRemoveTab={removeTab}
            unreadCounts={unread}
          />

          {/* Message window */}
          {activeTab && (
            <ChatWindow
              messages={allMessages}
              tab={activeTab}
              myCharacter={myCharacter}
              showTimestamps={showTimestamps}
              onClickSpeaker={(msg) => handleClickSpeaker(msg)}
              muted={muted}
              ignored={ignored}
            />
          )}

          {/* Input */}
          <ChatInput
            defaultChannel={activeTab?.defaultChannel || "say"}
            onSend={handleSend}
            onCommand={handleCommand}
            disabled={!myCharacter}
          />
        </>
      )}

      {/* Context menu */}
      {contextMenu && (
        <SpeakerContextMenu
          msg={contextMenu.msg}
          position={contextMenu.position}
          onAction={handleSpeakerAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}