/**
 * Central constants for the MMO chat system.
 */

export const CHANNEL_META = {
  say:     { label: "Say",     color: "text-green-300",  bg: "bg-green-900/20",  prefix: "/say",    short: "S"  },
  local:   { label: "Local",   color: "text-green-400",  bg: "bg-green-900/20",  prefix: "/local",  short: "L"  },
  party:   { label: "Party",   color: "text-blue-400",   bg: "bg-blue-900/20",   prefix: "/p",      short: "P"  },
  raid:    { label: "Raid",    color: "text-orange-400", bg: "bg-orange-900/20", prefix: "/raid",   short: "R"  },
  guild:   { label: "Guild",   color: "text-yellow-400", bg: "bg-yellow-900/20", prefix: "/g",      short: "G"  },
  officer: { label: "Officer", color: "text-yellow-500", bg: "bg-yellow-900/30", prefix: "/o",      short: "O"  },
  tell:    { label: "Tell",    color: "text-pink-400",   bg: "bg-pink-900/20",   prefix: "/tell",   short: "T"  },
  system:  { label: "System",  color: "text-gray-400",   bg: "bg-gray-900/20",   prefix: null,      short: "SY" },
  combat:  { label: "Combat",  color: "text-red-400",    bg: "bg-red-900/20",    prefix: "/combat", short: "C"  },
  loot:    { label: "Loot",    color: "text-amber-400",  bg: "bg-amber-900/20",  prefix: "/loot",   short: "LT" },
  trade:   { label: "Trade",   color: "text-orange-300", bg: "bg-orange-900/20", prefix: "/trade",  short: "TR" },
  help:    { label: "Help",    color: "text-cyan-300",   bg: "bg-cyan-900/20",   prefix: "/help",   short: "H"  },
  global:  { label: "World",   color: "text-yellow-300", bg: "bg-yellow-900/20", prefix: "/world",  short: "W"  },
  agent:   { label: "Agents",  color: "text-cyan-400",   bg: "bg-cyan-900/20",   prefix: "/agent",  short: "AG" },
  ambient: { label: "Ambient", color: "text-gray-500",   bg: "bg-gray-900/10",   prefix: null,      short: "AM" },
  custom:  { label: "Custom",  color: "text-purple-400", bg: "bg-purple-900/20", prefix: null,      short: "CH" },
};

// Default tab definitions
export const DEFAULT_TABS = [
  {
    id: "main",
    label: "Main",
    channels: ["say", "local", "party", "guild", "tell", "system", "global"],
    defaultChannel: "say",
    agentFilter: "humans_direct",
  },
  {
    id: "world",
    label: "World",
    channels: ["global", "trade", "help", "say", "local"],
    defaultChannel: "global",
    agentFilter: "show_all",
  },
  {
    id: "combat",
    label: "Combat",
    channels: ["combat", "loot", "say"],
    defaultChannel: "say",
    agentFilter: "show_all",
  },
  {
    id: "social",
    label: "Social",
    channels: ["say", "party", "guild", "officer", "tell", "raid"],
    defaultChannel: "say",
    agentFilter: "humans_only",
  },
  {
    id: "agents",
    label: "Agents",
    channels: ["agent", "ambient", "global", "combat"],
    defaultChannel: "agent",
    agentFilter: "show_all",
  },
  {
    id: "quiet",
    label: "Quiet",
    channels: ["tell", "guild", "party", "system"],
    defaultChannel: "say",
    agentFilter: "humans_only",
  },
];

// Agent filtering modes
export const AGENT_FILTER_MODES = {
  show_all:        { label: "Show All",              icon: "📡" },
  humans_direct:   { label: "Humans + Direct",       icon: "👥" },
  humans_only:     { label: "Humans Only",           icon: "🧑" },
  companion_only:  { label: "Companion Only",        icon: "🤝" },
  summarize:       { label: "Summarize Agents",      icon: "📋" },
  hide_ambient:    { label: "Hide Ambient",          icon: "🔇" },
  world_life_off:  { label: "World Life Off",        icon: "🌑" },
};

export const SPEAKER_COLORS = {
  human:  "text-amber-400",
  ai_agent: "text-cyan-400",
  npc:    "text-green-300",
  system: "text-gray-400",
};

export const SPEAKER_ICONS = {
  human:    "🧑",
  ai_agent: "🤖",
  npc:      "🗣",
  system:   "⚙",
};