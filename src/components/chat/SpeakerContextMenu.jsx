/**
 * SpeakerContextMenu — right-click / click popup for social actions on a speaker.
 */
import { X, MessageSquare, UserMinus, VolumeX, UserCheck, Swords } from "lucide-react";

export default function SpeakerContextMenu({ msg, position, onAction, onClose }) {
  if (!msg) return null;

  const actions = [
    { id: "tell",   icon: <MessageSquare className="w-3.5 h-3.5" />, label: `Tell ${msg.speaker_name}` },
    { id: "invite", icon: <UserCheck className="w-3.5 h-3.5" />,     label: "Invite to Party" },
    { id: "mute",   icon: <VolumeX className="w-3.5 h-3.5" />,       label: "Mute" },
    { id: "ignore", icon: <UserMinus className="w-3.5 h-3.5" />,     label: "Ignore" },
    { id: "inspect",icon: <Swords className="w-3.5 h-3.5" />,        label: "Inspect" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 min-w-40"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
          <span className="text-xs font-bold text-gray-200">{msg.speaker_name}</span>
          <button onClick={onClose} className="text-gray-600 hover:text-white ml-2">
            <X className="w-3 h-3" />
          </button>
        </div>
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => { onAction(a.id, msg); onClose(); }}
            className="flex items-center gap-2 w-full text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-1.5 transition-all"
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}