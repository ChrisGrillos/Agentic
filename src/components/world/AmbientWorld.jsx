/**
 * AmbientWorld — Day/night cycle, weather, ambient animals.
 * Drives THREE.js scene environment (lighting, fog, sky color) and
 * spawns procedural ambient entities (birds, rabbits, etc.) that
 * do NOT interact with gameplay — purely cosmetic.
 *
 * Props:
 *   scene     THREE.Scene ref (the scene object, not a ref)
 *   sunLight  THREE.DirectionalLight ref to drive sun position
 *   ambientLight THREE.AmbientLight ref
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── TIME CONFIG ──────────────────────────────────────────────────────────────
// 1 real minute = 1 full in-game day (tweak for feel)
const REAL_MS_PER_DAY = 4 * 60 * 1000; // 4 real minutes = 1 game day

const TIME_OF_DAY_CONFIG = [
  // [hourStart, hourEnd, skyHex, ambientHex, ambientIntensity, fogDensity, sunIntensity, label]
  [0,   5,  0x020812, 0x1a1a3e, 0.15, 0.035, 0.0,  "Night"],
  [5,   7,  0x0d1a3a, 0x3d3060, 0.25, 0.028, 0.3,  "Dawn"],
  [7,   9,  0x1a3060, 0xffb347, 0.55, 0.020, 0.8,  "Sunrise"],
  [9,   17, 0x0a1628, 0xffeedd, 0.55, 0.016, 1.2,  "Day"],
  [17,  19, 0x1a1530, 0xff7b3a, 0.45, 0.022, 0.7,  "Sunset"],
  [19,  21, 0x0d0f2a, 0x4040a0, 0.25, 0.030, 0.15, "Dusk"],
  [21,  24, 0x020812, 0x1a1a3e, 0.15, 0.035, 0.0,  "Night"],
];

const WEATHER_TYPES = [
  { id: "clear",   label: "Clear",   fogMult: 1.0, ambientMult: 1.0, skyDarken: 0   },
  { id: "haze",    label: "Haze",    fogMult: 1.8, ambientMult: 0.8, skyDarken: 0.1 },
  { id: "overcast",label: "Overcast",fogMult: 2.5, ambientMult: 0.6, skyDarken: 0.2 },
  { id: "rain",    label: "Rain",    fogMult: 3.0, ambientMult: 0.4, skyDarken: 0.3 },
];

// ─── AMBIENT ANIMALS ──────────────────────────────────────────────────────────

function createBird(scene) {
  const group = new THREE.Group();
  // Two wing triangles
  const wingGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0,0,0,  -0.4, 0.2, 0,  -0.1, 0.05, 0,
    0,0,0,   0.4, 0.2, 0,   0.1, 0.05, 0,
  ]);
  wingGeo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  group.add(wings);

  // Random start position high in the sky
  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * 20;
  group.position.set(
    Math.cos(angle) * radius,
    8 + Math.random() * 6,
    Math.sin(angle) * radius
  );
  group.userData = {
    type: "bird",
    angle,
    radius,
    speed: 0.008 + Math.random() * 0.006,
    bobPhase: Math.random() * Math.PI * 2,
    wingPhase: Math.random() * Math.PI * 2,
  };
  scene.add(group);
  return group;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAmbientWorld(sceneRef, sunLightRef, ambientLightRef, fogRef) {
  const [timeLabel, setTimeLabel] = useState("Day");
  const [weatherLabel, setWeatherLabel] = useState("Clear");
  const [gameHour, setGameHour] = useState(10);

  const birdsRef = useRef([]);
  const weatherRef = useRef(WEATHER_TYPES[0]);
  const weatherTimerRef = useRef(0);
  const gameTimeRef = useRef(10 * (REAL_MS_PER_DAY / 24)); // start at 10am
  const rafRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef?.current;
    if (!scene) return;

    // Spawn ambient birds
    for (let i = 0; i < 6; i++) birdsRef.current.push(createBird(scene));

    let last = performance.now();

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const delta = now - last;
      last = now;

      // Advance game time
      gameTimeRef.current = (gameTimeRef.current + delta) % REAL_MS_PER_DAY;
      const hour = (gameTimeRef.current / REAL_MS_PER_DAY) * 24;
      setGameHour(Math.floor(hour));

      // Find time config
      const tod = TIME_OF_DAY_CONFIG.find(c => hour >= c[0] && hour < c[1]) || TIME_OF_DAY_CONFIG[3];
      setTimeLabel(tod[7]);

      // Random weather change every ~2 mins
      weatherTimerRef.current += delta;
      if (weatherTimerRef.current > 120000) {
        weatherTimerRef.current = 0;
        const newWeather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
        weatherRef.current = newWeather;
        setWeatherLabel(newWeather.label);
      }

      const weather = weatherRef.current;

      // Apply scene lighting
      if (scene.background && scene.background.isColor) {
        const skyColor = new THREE.Color(tod[2]);
        skyColor.lerp(new THREE.Color(0x111827), weather.skyDarken);
        scene.background.lerp(skyColor, 0.02);
      }

      if (ambientLightRef?.current) {
        const ac = new THREE.Color(tod[3]);
        ambientLightRef.current.color.lerp(ac, 0.03);
        ambientLightRef.current.intensity += (tod[4] * weather.ambientMult - ambientLightRef.current.intensity) * 0.03;
      }

      if (sunLightRef?.current) {
        // Sun arc — rises in east, sets in west
        const sunAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
        sunLightRef.current.position.set(
          Math.cos(sunAngle) * 40,
          Math.abs(Math.sin(sunAngle)) * 50 + 5,
          -20
        );
        sunLightRef.current.intensity += (tod[6] - sunLightRef.current.intensity) * 0.03;
      }

      if (fogRef?.current) {
        const baseDensity = tod[5];
        fogRef.current.density += (baseDensity * weather.fogMult - fogRef.current.density) * 0.02;
      }

      // Animate birds
      birdsRef.current.forEach(bird => {
        const d = bird.userData;
        d.angle += d.speed;
        d.wingPhase += 0.08;
        bird.position.x = Math.cos(d.angle) * d.radius;
        bird.position.z = Math.sin(d.angle) * d.radius;
        bird.position.y = 8 + Math.sin(d.bobPhase + now * 0.001) * 0.3;
        bird.rotation.y = -d.angle + Math.PI / 2;

        // Wing flap
        const wings = bird.children[0];
        if (wings) wings.scale.y = 1 + Math.abs(Math.sin(d.wingPhase)) * 0.5;

        // Hide birds at night
        bird.visible = hour > 5 && hour < 21;
      });
    };

    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      birdsRef.current.forEach(b => scene.remove(b));
      birdsRef.current = [];
    };
  }, []);

  return { gameHour, timeLabel, weatherLabel };
}

// ─── HUD WIDGET ───────────────────────────────────────────────────────────────

export function AmbientHUDWidget({ gameHour, timeLabel, weatherLabel }) {
  const WEATHER_ICONS = { Clear: "☀️", Haze: "🌫️", Overcast: "☁️", Rain: "🌧️" };
  const TIME_ICONS = { Night: "🌙", Dawn: "🌄", Sunrise: "🌅", Day: "☀️", Sunset: "🌇", Dusk: "🌆" };

  const pad = n => String(n).padStart(2, "0");
  const displayHour = `${pad(gameHour)}:00`;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded-lg border border-gray-800 pointer-events-none select-none">
      <span>{TIME_ICONS[timeLabel] || "🌤️"} {displayHour}</span>
      <span className="text-gray-700">·</span>
      <span>{WEATHER_ICONS[weatherLabel] || "🌤️"} {weatherLabel}</span>
    </div>
  );
}