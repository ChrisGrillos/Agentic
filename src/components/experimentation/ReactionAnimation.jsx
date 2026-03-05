import { useEffect, useRef } from "react";

/** Canvas-based particle reaction animation */
export default function ReactionAnimation({ running, type, intensity = 50 }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const particles = useRef([]);

  const PALETTE = {
    explosion:       ["#ff4500","#ff8c00","#ffd700","#ff6347"],
    arcane_substance:["#a855f7","#7c3aed","#e879f9","#c4b5fd"],
    crystal:         ["#38bdf8","#7dd3fc","#bae6fd","#e0f2fe"],
    alloy:           ["#9ca3af","#d1d5db","#fbbf24","#f59e0b"],
    elixir:          ["#4ade80","#86efac","#22c55e","#bbf7d0"],
    gas:             ["#d1d5db","#9ca3af","#e5e7eb","#f3f4f6"],
    residue:         ["#78350f","#92400e","#a16207","#713f12"],
    compound:        ["#60a5fa","#93c5fd","#a78bfa","#c4b5fd"],
  };

  const colors = PALETTE[type] || PALETTE.compound;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    const spawn = () => ({
      x: W / 2 + (Math.random() - 0.5) * 40,
      y: H / 2 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * (intensity / 15),
      vy: -(Math.random() * intensity / 10 + 0.5),
      life: 1.0,
      decay: 0.01 + Math.random() * 0.025,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    if (running) {
      particles.current = Array.from({ length: 30 }, spawn);
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      if (running && particles.current.length < 60) {
        for (let i = 0; i < 3; i++) particles.current.push(spawn());
      }

      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.life -= p.decay;
        p.vx *= 0.99;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameRef.current);
  }, [running, type, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0 pointer-events-none"
    />
  );
}