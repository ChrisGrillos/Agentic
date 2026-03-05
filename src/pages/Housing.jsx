import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Home, Plus, Package, Hammer, Users, Star, ArrowUpCircle } from "lucide-react";
import { FURNITURE, HOUSE_TIERS, TIER_ORDER, PET_SPECIES } from "@/components/shared/housingData";
import { ZONES } from "@/components/shared/worldZones";
import HouseFurnitureEditor from "@/components/housing/HouseFurnitureEditor";
import HouseStorage from "@/components/housing/HouseStorage";
import HousePets from "@/components/housing/HousePets";
import HouseVisitors from "@/components/housing/HouseVisitors";

const TABS = [
  { id: "overview", label: "Home",     icon: Home },
  { id: "furnish",  label: "Furnish",  icon: Hammer },
  { id: "storage",  label: "Storage",  icon: Package },
  { id: "pets",     label: "Pets",     icon: "🐾" },
  { id: "visitors", label: "Visitors", icon: Users },
];

export default function Housing() {
  const [character, setCharacter] = useState(null);
  const [house, setHouse]         = useState(null);
  const [pets, setPets]           = useState([]);
  const [tab, setTab]             = useState("overview");
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (!u) { setLoading(false); return; }
    const [chars, houses, myPets] = await Promise.all([
      base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-created_date", 1),
      base44.entities.PlayerHouse.filter({ owner_character_id: { $exists: true } }),
      base44.entities.Pet.filter({ owner_character_id: { $exists: true } }),
    ]);
    const char = chars[0] || null;
    setCharacter(char);
    if (char) {
      const myHouse = houses.find(h => h.owner_character_id === char.id);
      setHouse(myHouse || null);
      setPets(myPets.filter(p => p.owner_character_id === char.id));
    }
    setLoading(false);
  };

  const handleCreateHouse = async () => {
    if (!character || creating) return;
    setCreating(true);
    const zone = ZONES.find(z => z.id === "town_center") || ZONES[0];
    const newHouse = await base44.entities.PlayerHouse.create({
      owner_character_id: character.id,
      owner_name: character.name,
      name: `${character.name}'s Hut`,
      tier: "hut",
      x: zone.x + 2 + Math.floor(Math.random() * 5),
      y: zone.y + 5 + Math.floor(Math.random() * 5),
      zone: "town_center",
      furniture: [],
      storage: [],
      visitors_allowed: [],
      is_public: false,
      pets: [],
      crafting_stations: [],
    });
    await base44.entities.Character.update(character.id, {
      gold: Math.max(0, (character.gold || 0) - 100),
    });
    setCharacter(prev => ({ ...prev, gold: Math.max(0, (prev.gold || 0) - 100) }));
    setHouse(newHouse);
    setCreating(false);
  };

  const handleUpgrade = async () => {
    if (!house || upgrading) return;
    const currentIdx = TIER_ORDER.indexOf(house.tier);
    const nextTier = TIER_ORDER[currentIdx + 1];
    if (!nextTier) return;
    const cost = HOUSE_TIERS[nextTier].cost;
    if ((character.gold || 0) < cost) { alert(`Need ${cost} gold to upgrade!`); return; }
    setUpgrading(true);
    const updated = await base44.entities.PlayerHouse.update(house.id, { tier: nextTier, name: house.name.replace(/Hut|Cottage|House|Manor/g, HOUSE_TIERS[nextTier].name) });
    await base44.entities.Character.update(character.id, { gold: (character.gold || 0) - cost });
    setCharacter(prev => ({ ...prev, gold: prev.gold - cost }));
    setHouse(updated);
    setUpgrading(false);
  };

  const refreshHouse = async () => {
    if (!house) return;
    const updated = await base44.entities.PlayerHouse.filter({ owner_character_id: character.id });
    if (updated.length > 0) setHouse(updated[0]);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400">Loading...</div>
  );

  const tierInfo = house ? HOUSE_TIERS[house.tier] : null;
  const nextTierKey = house ? TIER_ORDER[TIER_ORDER.indexOf(house.tier) + 1] : null;
  const nextTierInfo = nextTierKey ? HOUSE_TIERS[nextTierKey] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto p-5">
        <Link to={createPageUrl("Home")} className="text-gray-600 hover:text-amber-400 text-xs mb-4 block">← Back to Home</Link>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-black text-amber-400 flex items-center gap-2">
              {house ? `${tierInfo?.emoji} ${house.name}` : "🏠 Player Housing"}
            </h1>
            {character && (
              <p className="text-gray-500 text-sm mt-1">
                {character.name} — {character.gold || 0}g
                {house && <span className="ml-2 text-amber-600">{tierInfo?.name} • {tierInfo?.slots} furniture slots</span>}
              </p>
            )}
          </div>
          {house && nextTierInfo && (
            <Button onClick={handleUpgrade} disabled={upgrading || (character?.gold || 0) < nextTierInfo.cost}
              className="bg-amber-700 hover:bg-amber-600 gap-1 text-sm font-bold">
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade to {nextTierInfo.name} ({nextTierInfo.cost}g)
            </Button>
          )}
        </div>

        {!character && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            No character found. <Link to={createPageUrl("Characters")} className="text-amber-400">Create one first.</Link>
          </div>
        )}

        {character && !house && (
          <div className="bg-gray-900 border border-amber-900 rounded-2xl p-10 text-center">
            <div className="text-6xl mb-4">🛖</div>
            <h2 className="text-xl font-bold text-white mb-2">You have no home</h2>
            <p className="text-gray-500 text-sm mb-6">Purchase a humble hut in the Town of Agentica for 100 gold. Store items, place furniture, keep pets.</p>
            <Button onClick={handleCreateHouse} disabled={creating || (character.gold || 0) < 100}
              className="bg-amber-600 hover:bg-amber-500 font-bold text-lg px-8 py-3">
              {creating ? "Building..." : "Buy Hut — 100g"}
            </Button>
            {(character.gold || 0) < 100 && (
              <p className="text-red-400 text-xs mt-2">Need {100 - (character.gold || 0)} more gold.</p>
            )}
          </div>
        )}

        {character && house && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-900 p-1 rounded-xl border border-gray-800">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1
                    ${tab === t.id ? "bg-amber-800/60 text-amber-300" : "text-gray-500 hover:text-gray-300"}`}>
                  {typeof t.icon === "string" ? t.icon : <t.icon className="w-3 h-3" />}
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl">{tierInfo?.emoji}</span>
                    <div>
                      <h2 className="text-xl font-black text-white">{house.name}</h2>
                      <p className="text-gray-500 text-sm">{tierInfo?.name} • Zone: {house.zone?.replace(/_/g," ")}</p>
                      <p className="text-xs text-gray-600">Coordinates: ({house.x}, {house.y})</p>
                    </div>
                  </div>
                  {house.description && <p className="text-gray-400 text-sm mb-3 italic">"{house.description}"</p>}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-black text-amber-400">{(house.furniture || []).length}/{tierInfo?.slots}</div>
                      <div className="text-xs text-gray-500">Furniture</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-black text-blue-400">{(house.storage || []).length}/{tierInfo?.max_storage}</div>
                      <div className="text-xs text-gray-500">Items Stored</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-black text-green-400">{pets.length}</div>
                      <div className="text-xs text-gray-500">Pets</div>
                    </div>
                  </div>
                  {/* Placed crafting stations */}
                  {(house.crafting_stations || []).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Crafting Stations in Home:</p>
                      <div className="flex flex-wrap gap-2">
                        {house.crafting_stations.map(s => (
                          <span key={s} className="bg-orange-900/30 border border-orange-800 text-orange-300 text-xs px-2 py-1 rounded-lg">
                            ⚒️ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-3">Furniture Bonuses Active:</p>
                    {(house.furniture || []).filter(f => f.bonus).map((f, i) => (
                      <div key={i} className="text-xs text-green-400 flex items-center gap-1 mb-1">
                        <span>{f.emoji}</span> {f.bonus}
                      </div>
                    ))}
                    {!(house.furniture || []).some(f => f.bonus) && (
                      <p className="text-xs text-gray-700">Place furniture to get bonuses.</p>
                    )}
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Your Pets:</p>
                    {pets.length === 0 ? (
                      <p className="text-xs text-gray-700">No pets yet. Tame them in the wild!</p>
                    ) : pets.map(p => (
                      <div key={p.id} className="flex items-center gap-2 mb-1.5">
                        <span>{p.emoji}</span>
                        <span className="text-xs text-white">{p.name}</span>
                        <span className="text-xs text-gray-500">Lv.{p.level}</span>
                        <span className={`text-xs ml-auto ${p.mood === "happy" ? "text-green-400" : p.mood === "hungry" ? "text-orange-400" : "text-gray-500"}`}>
                          {p.mood}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "furnish" && (
              <HouseFurnitureEditor house={house} character={character} onUpdate={(updated) => { setHouse(updated); }} />
            )}
            {tab === "storage" && (
              <HouseStorage house={house} character={character} onUpdate={(updated) => { setHouse(updated); setCharacter(prev => ({ ...prev, inventory: updated._charInventory || prev.inventory })); }} />
            )}
            {tab === "pets" && (
              <HousePets house={house} character={character} pets={pets} onUpdate={(newPets) => setPets(newPets)} onRefreshHouse={refreshHouse} />
            )}
            {tab === "visitors" && (
              <HouseVisitors house={house} character={character} onUpdate={(updated) => setHouse(updated)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}