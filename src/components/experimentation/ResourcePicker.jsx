import { useState } from "react";
import { Search, X } from "lucide-react";

const RARITY_DOT = { common:"bg-gray-400", uncommon:"bg-green-400", rare:"bg-blue-400", legendary:"bg-amber-400" };

export default function ResourcePicker({ resources, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = resources.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.base_tags || []).some(t => t.includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="text-sm font-bold text-gray-300">Select Resource</div>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              autoFocus
              type="text"
              placeholder="Search resources or tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:border-amber-600 outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 && (
            <div className="text-center text-gray-600 text-xs py-8">
              No resources found. Gather some first!
            </div>
          )}
          {filtered.map(r => (
            <button key={r.id} onClick={() => onSelect(r)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-all group">
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-200 font-medium">{r.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[r.rarity] || "bg-gray-500"}`} />
                  <span className="text-xs text-gray-600 capitalize">{r.rarity}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(r.base_tags || []).map(t => (
                    <span key={t} className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              {/* Quick property glance */}
              <div className="text-xs text-gray-600 text-right shrink-0 hidden group-hover:block">
                {r.properties?.reactivity > 50 && <div className="text-red-400">⚠ High reactivity</div>}
                {r.properties?.magical_affinity > 50 && <div className="text-purple-400">✨ Arcane</div>}
                {r.properties?.flammability > 70 && <div className="text-orange-400">🔥 Flammable</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}