/**
 * ViewToggle — switches between classic 2D map and 3D scene.
 * Also houses scene presentation settings.
 */
import { useState } from "react";
import { Map, Box, Settings, X, Eye, EyeOff } from "lucide-react";

export default function ViewToggle({ mode, onChange, settings, onSettingsChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
      {/* Mode buttons */}
      <div className="flex bg-gray-900/90 border border-gray-700 rounded-lg overflow-hidden text-xs">
        <button
          onClick={() => onChange("map")}
          className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${
            mode === "map" ? "bg-amber-600 text-black font-bold" : "text-gray-400 hover:text-amber-400"
          }`}
          title="Classic Map View"
        >
          <Map className="w-3 h-3" />
          <span className="hidden sm:inline">Map</span>
        </button>
        <button
          onClick={() => onChange("3d")}
          className={`flex items-center gap-1 px-2 py-1.5 transition-colors border-l border-gray-700 ${
            mode === "3d" ? "bg-amber-600 text-black font-bold" : "text-gray-400 hover:text-amber-400"
          }`}
          title="3D World View"
        >
          <Box className="w-3 h-3" />
          <span className="hidden sm:inline">3D</span>
        </button>
      </div>

      {/* Settings button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="bg-gray-900/90 border border-gray-700 rounded-lg p-1.5 text-gray-500 hover:text-amber-400 transition-colors"
        title="Scene settings"
      >
        {open ? <X className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
      </button>

      {/* Settings panel */}
      {open && (
        <div className="absolute top-8 left-0 bg-gray-900/95 border border-gray-700 rounded-lg p-3 w-52 text-xs shadow-xl">
          <div className="font-bold text-gray-300 mb-2">Scene Settings</div>

          <label className="flex items-center justify-between mb-2 cursor-pointer">
            <span className="text-gray-400 flex items-center gap-1.5"><Eye className="w-3 h-3" />Nameplates</span>
            <input
              type="checkbox"
              checked={settings.showNameplates ?? true}
              onChange={e => onSettingsChange({ ...settings, showNameplates: e.target.checked })}
              className="accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between mb-2 cursor-pointer">
            <span className="text-gray-400 flex items-center gap-1.5"><Eye className="w-3 h-3" />Health Bars</span>
            <input
              type="checkbox"
              checked={settings.showHealthBars ?? true}
              onChange={e => onSettingsChange({ ...settings, showHealthBars: e.target.checked })}
              className="accent-amber-500"
            />
          </label>

          <div className="mb-2">
            <div className="text-gray-400 mb-1">Camera Distance</div>
            <input
              type="range" min="0.6" max="1.6" step="0.1"
              value={settings.cameraDistance ?? 1.0}
              onChange={e => onSettingsChange({ ...settings, cameraDistance: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}