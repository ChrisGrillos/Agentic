import { useEffect, useState } from "react";

const COLORS = {
  damage:  "text-red-400",
  crit:    "text-orange-300 font-black text-lg",
  heal:    "text-green-400",
  buff:    "text-blue-400",
  debuff:  "text-purple-400",
  dodge:   "text-gray-400 italic",
};

export default function DamageNumber({ value, type, x, y }) {
  const [visible, setVisible] = useState(true);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setOffsetY(frame * -1.8);
      if (frame > 30) { setVisible(false); clearInterval(interval); }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`absolute pointer-events-none select-none font-bold text-sm ${COLORS[type] || "text-white"} transition-opacity`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translateY(${offsetY}px)`,
        opacity: Math.max(0, 1 - Math.abs(offsetY) / 55),
        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
      }}
    >
      {value}
    </div>
  );
}