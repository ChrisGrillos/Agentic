import { useEffect, useRef, useState } from "react";

// Define 5 distinct zoom levels with unique feels
export const ZOOM_LEVELS = [
  { level: 0, label: "Extreme Close",  distance: 6,  height: 12, angle: 0.45, fov: 50 },
  { level: 1, label: "Close",          distance: 12, height: 18, angle: 0.52, fov: 48 },
  { level: 2, label: "Normal",         distance: 24, height: 28, angle: 0.62, fov: 42 },
  { level: 3, label: "Far",            distance: 42, height: 40, angle: 0.72, fov: 35 },
  { level: 4, label: "Strategic",      distance: 65, height: 55, angle: 0.85, fov: 28 },
];

export function useZoomController() {
  const [zoomLevel, setZoomLevel] = useState(2); // Start at "Normal"
  const targetZoomRef = useRef(2);
  const smoothZoomRef = useRef(2);
  
  // Wheel + touch pinch support
  useEffect(() => {
    let lastTouchDistance = 0;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) return; // Skip browser zoom
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      targetZoomRef.current = Math.max(0, Math.min(4, targetZoomRef.current + delta));
      setZoomLevel(targetZoomRef.current);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const delta = currentDistance - lastTouchDistance;
        if (Math.abs(delta) > 5) {
          const zoomDelta = delta > 0 ? -1 : 1; // Pinch in = zoom out
          targetZoomRef.current = Math.max(0, Math.min(4, targetZoomRef.current + zoomDelta));
          setZoomLevel(targetZoomRef.current);
          lastTouchDistance = currentDistance;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Smooth lerp the zoom value in the animation loop
  const getInterpolatedZoom = () => {
    smoothZoomRef.current += (targetZoomRef.current - smoothZoomRef.current) * 0.12; // Smooth lerp
    return smoothZoomRef.current;
  };

  const getCurrentZoomConfig = () => {
    const smoothLevel = getInterpolatedZoom();
    const lower = Math.floor(smoothLevel);
    const upper = Math.ceil(smoothLevel);
    const t = smoothLevel - lower;

    if (lower === upper) return ZOOM_LEVELS[lower];

    const l = ZOOM_LEVELS[lower];
    const u = ZOOM_LEVELS[upper];

    // Lerp between zoom configs
    return {
      level: smoothLevel,
      distance: l.distance + (u.distance - l.distance) * t,
      height: l.height + (u.height - l.height) * t,
      angle: l.angle + (u.angle - l.angle) * t,
      fov: l.fov + (u.fov - l.fov) * t,
    };
  };

  return {
    zoomLevel,
    setZoomLevel: (level) => {
      targetZoomRef.current = Math.max(0, Math.min(4, level));
      setZoomLevel(targetZoomRef.current);
    },
    getInterpolatedZoom,
    getCurrentZoomConfig,
    ZOOM_LABELS: ZOOM_LEVELS.map((z) => z.label),
  };
}