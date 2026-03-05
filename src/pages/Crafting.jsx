import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Hammer, Package, FlaskConical, Sword, Shield, Wrench, ChevronDown, ChevronUp, Home, Users } from "lucide-react";
import { ALL_RECIPES, CRAFTING_STATIONS, RESOURCES, canCraft, craftItem, getRecipesByStation } from "@/components/shared/craftingData";
import { POINTS_OF_INTEREST } from "@/components/shared/worldZones";

const CATEGORY_ICONS = {
  weapon:     { icon: Sword,        color: "text-red-400",    label: "Weapons" },
  armor:      { icon: Shield,       color: "text-blue-400",   label: "Armor" },
  consumable: { icon: FlaskConical, color: "text-green-400",  label: "Consumables" },
  tool:       { icon: Wrench,       color: "text-orange-400", label: "Tools" },
  furniture:  { icon: Home,         color: "text-amber-400",  label: "Furniture" },
  guild_item: { icon: Users,        color: "text-purple-400", label: "Guild Items" },
};

const RARITY_COLORS = {
  common:    "text-gray-300",
  uncommon:  "text-green-400",
  rare:      "text-blue-400",
  legendary: "text-amber-400",
};

export default function Crafting() {
  const [character, setCharacter]   = useState(null);
  const [selectedStation, setSelectedStation] = useState("hand");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredRecipe, setHoveredRecipe] = useState(null);
  const [crafting, setCrafting] = useState(false);
  const [craftLog, setCraftLog] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacter();
  }, []);

  const loadCharacter = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (!u) { setLoading(false); return; }
    const chars = await base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-created_date", 1);
    if (chars.length > 0) setCharacter(chars[0]);
    setLoading(false);
  };

  const craftingSkill = character?.skills?.crafting || 1;
  const inventory     = character?.inventory || [];
  const specId        = character?.specialization;

  const stationRecipes = getRecipesByStation(selectedStation).filter(r =>
    selectedCategory === "all" || r.category === selectedCategory
  );

  // Check if character is near this station's POI (simplified: always allow in this page)
  const nearStation = (stationId) => true; // Full travel integration would check character pos vs POI

  const handleCraft = async (recipe) => {
    if (!character || crafting) return;
    const check = canCraft(recipe, inventory, craftingSkill);
    if (!check.can) { setCraftLog(prev => [`❌ Cannot craft: ${check.reason}`, ...prev.slice(0,9)]); return; }

    setCrafting(true);
    const hasBonus = specId === recipe.specialization_bonus;
    const newInventory = craftItem(recipe, inventory, hasBonus, craftingSkill);
    const newSkill = Math.min(100, craftingSkill + Math.floor(recipe.skill_required * 0.1) + 1);
    const skillUpdates = { crafting: newSkill };

    await base44.entities.Character.update(character.id, {
      inventory: newInventory,
      skills: { ...(character.skills || {}), ...skillUpdates },
      xp: (character.xp || 0) + recipe.xp_reward,
    });

    const qualityLabel = hasBonus ? "Masterwork ⭐" : craftingSkill >= recipe.skill_required * 3 ? "Fine ✨" : "Normal";
    const qualityStr = ` (${qualityLabel})`;
    setCraftLog(prev => [
      `✅ Crafted: ${recipe.emoji} ${recipe.name}${qualityStr} (+${recipe.xp_reward} XP)`,
      ...prev.slice(0, 9)
    ]);
    setCharacter(prev => ({
      ...prev,
      inventory: newInventory,
      skills: { ...prev.skills, crafting: newSkill },
      xp: (prev.xp || 0) + recipe.xp_reward,
    }));
    setCrafting(false);
  };

  const getIngredientStatus = (recipe) => {
    return recipe.ingredients.map(ing => {
      const inInv = inventory.find(i => i.id === ing.id);
      const have = inInv?.qty || 0;
      return { ...ing, have, ok: have >= ing.qty };
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-black text-orange-400 flex items-center gap-2">
              <Hammer className="w-8 h-8" /> Crafting Workshop
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {character ? (
                <>
                  {character.name} — Crafting Skill: <span className="text-orange-400 font-bold">{craftingSkill}</span>
                  {specId && <span className="ml-2 text-purple-400">✦ {specId.replace(/_/g," ")}</span>}
                </>
              ) : "No character found. Create one first!"}
            </p>
          </div>
          {character && (
            <Button
              onClick={() => setShowInventory(s => !s)}
              variant="outline"
              className="border-gray-600 text-gray-300 gap-1"
            >
              <Package className="w-4 h-4" />
              Inventory ({inventory.length})
              {showInventory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>

        {/* Inventory Panel */}
        {showInventory && character && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-5">
            <h3 className="text-sm font-bold text-gray-300 mb-3">Inventory & Resources</h3>
            {inventory.length === 0 ? (
              <p className="text-gray-600 text-sm">Empty. Gather resources by exploring zones on the World map!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {inventory.map((item, i) => {
                  const res = RESOURCES[item.id];
                  return (
                    <div key={i} className="bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-lg">{item.emoji || res?.emoji || "📦"}</span>
                      <div>
                        <div className="text-xs font-medium text-white">{item.name || res?.name || item.id}</div>
                        <div className="text-xs text-gray-500">
                          x{item.qty || 1}
                          {item.quality === "masterwork" && <span className="ml-1 text-amber-400">⭐</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Station Selector */}
          <div className="lg:col-span-1">
            <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">Crafting Station</h3>
            <div className="space-y-2">
              {Object.values(CRAFTING_STATIONS).map(station => {
                const pois = POINTS_OF_INTEREST.filter(p => p.station === station.id);
                return (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStation(station.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedStation === station.id
                        ? "border-orange-500 bg-orange-900/20"
                        : "border-gray-700 bg-gray-900 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{station.emoji}</span>
                      <span className="font-bold text-sm text-white">{station.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-tight">{station.desc}</p>
                    {pois.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {pois.map(p => (
                          <span key={p.id} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                            📍 {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category filter */}
            <h3 className="text-xs text-gray-500 uppercase font-medium mt-4 mb-2">Category</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  selectedCategory === "all" ? "border-gray-500 bg-gray-700 text-white" : "border-gray-800 text-gray-500 hover:border-gray-600"
                }`}
              >
                All Recipes
              </button>
              {Object.entries(CATEGORY_ICONS).map(([cat, { icon: Icon, color, label }]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                    selectedCategory === cat ? "border-gray-500 bg-gray-700 text-white" : "border-gray-800 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${color}`} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe List */}
          <div className="lg:col-span-2">
            <h3 className="text-xs text-gray-500 uppercase font-medium mb-2">
              Recipes — {CRAFTING_STATIONS[selectedStation]?.name}
            </h3>
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {stationRecipes.length === 0 && (
                <div className="text-gray-600 text-sm py-10 text-center">No recipes for this station/category.</div>
              )}
              {stationRecipes.map(recipe => {
                const check = canCraft(recipe, inventory, craftingSkill);
                const ings  = getIngredientStatus(recipe);
                const isSelected = hoveredRecipe?.id === recipe.id;

                return (
                  <button
                    key={recipe.id}
                    onClick={() => setHoveredRecipe(isSelected ? null : recipe)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-orange-600 bg-orange-900/20"
                        : check.can
                        ? "border-gray-700 bg-gray-900 hover:border-gray-500"
                        : "border-gray-800 bg-gray-900/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{recipe.emoji}</span>
                        <div>
                          <span className="font-bold text-sm text-white">{recipe.name}</span>
                          <span className={`ml-2 text-xs ${RARITY_COLORS[recipe.result.rarity] || "text-gray-500"}`}>
                            {recipe.result.rarity}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Skill {recipe.skill_required}</span>
                        {recipe.specialization_bonus && (
                          <span className="text-purple-400 text-xs">✦ {recipe.specialization_bonus}</span>
                        )}
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ings.map((ing, i) => {
                        const res = RESOURCES[ing.id];
                        return (
                          <span
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              ing.ok ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {res?.emoji || "📦"} {ing.qty}x {res?.name || ing.id.replace(/_/g," ")}
                            {!ing.ok && <span className="ml-1 text-gray-600">({ing.have})</span>}
                          </span>
                        );
                      })}
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between">
                        <p className="text-xs text-gray-400">{recipe.description}</p>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleCraft(recipe); }}
                          disabled={!check.can || !character || crafting}
                          className="ml-3 bg-orange-600 hover:bg-orange-500 text-xs px-3 py-1 h-auto font-bold"
                        >
                          {crafting ? "..." : "Craft!"}
                        </Button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipe Detail + Craft Log */}
          <div className="lg:col-span-1 space-y-4">
            {hoveredRecipe && (
              <div className="bg-gray-900 border border-orange-800 rounded-xl p-4">
                <div className="text-2xl mb-1">{hoveredRecipe.emoji}</div>
                <div className="font-black text-white text-lg">{hoveredRecipe.name}</div>
                <div className={`text-xs mb-2 capitalize ${RARITY_COLORS[hoveredRecipe.result.rarity]}`}>
                  {hoveredRecipe.result.rarity}
                </div>
                <p className="text-xs text-gray-400 mb-3">{hoveredRecipe.description}</p>

                <div className="text-xs text-gray-500 mb-1 font-medium">Stats:</div>
                <div className="space-y-1 mb-3">
                  {Object.entries(hoveredRecipe.result).filter(([k]) => !["durability","rarity","debuff","buff","hp_restore","removes_debuff","resource_bonus","enchant_bonus"].includes(k)).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{k.replace(/_/g," ")}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                  {hoveredRecipe.result.hp_restore && <div className="flex justify-between text-xs"><span className="text-gray-500">HP Restore</span><span className="text-green-400">+{hoveredRecipe.result.hp_restore}</span></div>}
                  {hoveredRecipe.result.durability && <div className="flex justify-between text-xs"><span className="text-gray-500">Durability</span><span className="text-white">{hoveredRecipe.result.durability}</span></div>}
                </div>

                <div className="text-xs text-gray-500 mb-1">Rewards:</div>
                <div className="text-xs text-purple-400">+{hoveredRecipe.xp_reward} XP on craft</div>
                {hoveredRecipe.specialization_bonus && (
                  <div className="text-xs text-amber-400 mt-1">⭐ {hoveredRecipe.specialization_bonus} spec = masterwork quality</div>
                )}

                <Button
                  onClick={() => handleCraft(hoveredRecipe)}
                  disabled={!canCraft(hoveredRecipe, inventory, craftingSkill).can || !character || crafting}
                  className="w-full mt-3 bg-orange-600 hover:bg-orange-500 font-bold"
                >
                  {crafting ? "Crafting..." : "Craft Now"}
                </Button>
              </div>
            )}

            {/* Craft log */}
            {craftLog.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-2">Craft Log</div>
                <div className="space-y-1">
                  {craftLog.map((l, i) => (
                    <div key={i} className={`text-xs ${l.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{l}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Gathering hint */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <div className="font-medium text-gray-500">How to gather resources:</div>
              <p>Explore zones on the <Link to={createPageUrl("World")} className="text-amber-400 hover:underline">World Map</Link>. Each zone drops different resources when you encounter NPCs or events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}