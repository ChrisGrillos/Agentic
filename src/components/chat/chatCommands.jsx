/**
 * Slash-command parser and executor for the MMO chat system.
 */

/**
 * Parse a raw input string.
 * Returns { channel, text, command, args } or null if plain text.
 */
export function parseInput(raw) {
  const s = raw.trim();
  if (!s.startsWith("/")) return { channel: null, text: s, command: null, args: [] };

  const [cmd, ...rest] = s.slice(1).split(/\s+/);
  const lower = cmd.toLowerCase();
  const text  = rest.join(" ");

  // Channel shorthands
  const channelMap = {
    say: "say", s: "say",
    local: "local", l: "local",
    p: "party", party: "party",
    r: "raid",  raid: "raid",
    g: "guild", guild: "guild",
    o: "officer", officer: "officer",
    tell: "tell", w: "tell", whisper: "tell",
    trade: "trade", t: "trade",
    help: "help", h: "help",
    world: "global", global: "global",
    combat: "combat",
    agent: "agent",
    shout: "global",
  };

  if (channelMap[lower]) return { channel: channelMap[lower], text, command: null, args: [] };

  // Social / channel management commands
  const commands = ["createchannel", "join", "leave", "channellist", "whochannel", "invitechannel",
    "mute", "unmute", "ignore", "unignore", "invite", "kick", "who", "emote", "me", "afk",
    "dnd", "report", "clear"];

  if (commands.includes(lower)) return { channel: null, text, command: lower, args: rest };

  return { channel: null, text: s, command: "unknown", args: [] };
}

/**
 * Execute a slash command.
 * Returns { reply, channelAction } where reply is feedback text and channelAction describes channel state changes.
 */
export function executeCommand(parsed, state, setState) {
  const { command, args } = parsed;

  switch (command) {
    case "createchannel": {
      const name = args[0]?.toLowerCase();
      const pw   = args[1] || null;
      if (!name) return { reply: "Usage: /createchannel <name> [password]" };
      if (state.customChannels[name]) return { reply: `Channel '${name}' already exists.` };
      setState(prev => ({
        ...prev,
        customChannels: { ...prev.customChannels, [name]: { name, password: pw, members: [state.myName] } },
        joinedChannels: [...prev.joinedChannels, name],
      }));
      return { reply: `Created and joined channel: ${name}` };
    }

    case "join": {
      const name = args[0]?.toLowerCase();
      const pw   = args[1] || null;
      if (!name) return { reply: "Usage: /join <name> [password]" };
      const ch = state.customChannels[name];
      if (ch && ch.password && ch.password !== pw) return { reply: "Incorrect password." };
      setState(prev => ({
        ...prev,
        joinedChannels: prev.joinedChannels.includes(name)
          ? prev.joinedChannels
          : [...prev.joinedChannels, name],
      }));
      return { reply: `Joined channel: ${name}` };
    }

    case "leave": {
      const name = args[0]?.toLowerCase();
      if (!name) return { reply: "Usage: /leave <name>" };
      setState(prev => ({
        ...prev,
        joinedChannels: prev.joinedChannels.filter(c => c !== name),
      }));
      return { reply: `Left channel: ${name}` };
    }

    case "channellist": {
      const all = Object.keys(state.customChannels);
      return { reply: all.length ? `Custom channels: ${all.join(", ")}` : "No custom channels." };
    }

    case "whochannel": {
      const name = args[0]?.toLowerCase();
      const ch   = state.customChannels[name];
      if (!ch) return { reply: `Channel '${name}' not found.` };
      return { reply: `Members of ${name}: ${ch.members.join(", ")}` };
    }

    case "invitechannel": {
      const name   = args[0]?.toLowerCase();
      const player = args[1];
      if (!name || !player) return { reply: "Usage: /invitechannel <channel> <player>" };
      setState(prev => {
        const ch = prev.customChannels[name];
        if (!ch) return prev;
        if (ch.members.includes(player)) return prev;
        return {
          ...prev,
          customChannels: {
            ...prev.customChannels,
            [name]: { ...ch, members: [...ch.members, player] },
          },
        };
      });
      return { reply: `Invited ${player} to ${name}.` };
    }

    case "mute": {
      const target = args[0];
      if (!target) return { reply: "Usage: /mute <name>" };
      setState(prev => ({ ...prev, muted: [...new Set([...prev.muted, target])] }));
      return { reply: `Muted: ${target}` };
    }

    case "unmute": {
      const target = args[0];
      setState(prev => ({ ...prev, muted: prev.muted.filter(m => m !== target) }));
      return { reply: `Unmuted: ${target}` };
    }

    case "ignore": {
      const target = args[0];
      if (!target) return { reply: "Usage: /ignore <name>" };
      setState(prev => ({ ...prev, ignored: [...new Set([...prev.ignored, target])] }));
      return { reply: `Ignoring: ${target}` };
    }

    case "unignore": {
      const target = args[0];
      setState(prev => ({ ...prev, ignored: prev.ignored.filter(i => i !== target) }));
      return { reply: `No longer ignoring: ${target}` };
    }

    case "me": {
      return { channel: "say", emote: true, text: args.join(" ") };
    }

    case "clear":
      return { clearLocal: true, reply: "Chat cleared." };

    case "afk":
      return { reply: "[Away from keyboard]" };

    case "dnd":
      return { reply: "[Do not disturb mode toggled]" };

    case "who":
      return { reply: "Type /who in the chat — results will appear here." };

    case "unknown":
    default:
      return { reply: `Unknown command. Type /help for a list.` };
  }
}