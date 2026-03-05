import { useState } from "react";
import { BookOpen, Globe, Library, Filter } from "lucide-react";
import RecipeCardView from "./RecipeCardView";

const TABS = [
  { id: "mine",    label: "My Notebook", icon: BookOpen, color: "text-amber-400" },
  { id: "guild",   label: "Guild Library", icon: Library, color: "text-blue-400" },
  { id: "world",   label: "World Chronicle", icon: Globe, color: "text-purple-400" },
];

const RARITY_ORDER = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
const TYPE_EMOJIS  = { explosion:"💥", arcane_substance:"✨", crystal:"💎", alloy:"⚙️", elixir:"🧪", gas:"💨", residue:"🫙", compound:"⚗️" };

export default function NotebookPanel({ myCharacter, allRecipes, myGuild }) {
  const [tab, setTab]             = useState("mine");
  const [selected, setSelected]   = useState(null);
  const [filterType, setFilterType] = useState("all");

  const myRecipes    = allRecipes.filter(r => r.discoverer_id === myCharacter?.id || (r.notebook_ids || []).includes(myCharacter?.id));
  const guildRecipes = allRecipes.filter(r => myGuild && r.guild_id === myGuild.id);
  const worldRecipes = allRecipes.filter(r => r.is_public);

  const tabRecipes = { mine: myRecipes, guild: guildRecipes, world: worldRecipes }[tab] || [];

  const types = ["all", ...new Set(tabRecipes.map(r => r.output?.type).filter(Boolean))];
  const displayed = (filterType === "all" ? tabRecipes : tabRecipes.filter(r => r.output?.type === filterType))
    .sort((a, b) => (RARITY_ORDER[a.output?.rarity] ?? 3) - (RARITY_ORDER[b.output?.rarity] ?? 3));

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-xl border border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1
              ${tab === t.id ? "bg-gray-800 " + t.color : "text-gray-600 hover:text-gray-400"}`}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      {types.length > 1 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {types.map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-all flex items-center gap-1
                ${filterType === type ? "border-amber-600 bg-amber-900/30 text-amber-300" : "border-gray-700 text-gray-600 hover:border-gray-500"}`}>
              {type !== "all" && <span>{TYPE_EMOJIS[type] || "⚗️"}</span>}
              {type === "all" ? "All" : type.replace(/_/g," ")}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="flex-1 overflow-y-auto">
          <RecipeCardView recipe={selected} myCharacter={myCharacter} onClose={() => setSelected(null)} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {displayed.length === 0 && (
            <div className="text-center text-gray-600 text-sm py-12">
              {tab === "mine" && "No recipes yet. Run your first experiment!"}
              {tab === "guild" && "Your guild hasn't discovered any recipes."}
              {tab === "world" && "No public recipes in the World Chronicle yet."}
            </div>
          )}
          {displayed.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3 transition-all flex items-center gap-3">
              <span className="text-2xl">{r.output?.emoji || "⚗️"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-200 truncate">{r.output?.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="capitalize">{r.output?.rarity}</span>
                  <span>·</span>
                  <span>by {r.discoverer_name}</span>
                  {r.is_public && <span className="text-purple-400">🌐</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-600">{r.inputs?.length || 0} ingredients</div>
                <div className={`text-xs ${r.stability_rating > 70 ? "text-green-500" : r.stability_rating > 40 ? "text-yellow-500" : "text-red-500"}`}>
                  {r.stability_rating || 50}% stable
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}