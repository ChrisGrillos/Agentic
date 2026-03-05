import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, TrendingDown, Bot, Loader2, Coins, RefreshCw } from "lucide-react";

const CATEGORY_EMOJI = {
  weapon: "⚔️", armor: "🛡️", potion: "🧪", resource: "🪨",
  food: "🍖", tool: "🔧", luxury: "💎", crafted: "🏺"
};

// Class → what items they can produce and which skill
const CLASS_PRODUCTION = {
  craftsman: [
    { item_name: "Iron Sword",      item_emoji: "⚔️", item_category: "weapon",  base_price: 40, produced_by_skill: "crafting" },
    { item_name: "Wooden Shield",   item_emoji: "🛡️", item_category: "armor",   base_price: 30, produced_by_skill: "crafting" },
    { item_name: "Stone Axe",       item_emoji: "🪓", item_category: "tool",    base_price: 20, produced_by_skill: "crafting" },
    { item_name: "Reinforced Helm", item_emoji: "⛑️", item_category: "armor",   base_price: 50, produced_by_skill: "crafting" },
  ],
  merchant: [
    { item_name: "Spice Bundle",    item_emoji: "🌶️", item_category: "luxury",  base_price: 35, produced_by_skill: "trading" },
    { item_name: "Fine Silk",       item_emoji: "🎀", item_category: "luxury",  base_price: 55, produced_by_skill: "trading" },
    { item_name: "Trade Contract",  item_emoji: "📜", item_category: "luxury",  base_price: 25, produced_by_skill: "trading" },
  ],
  healer: [
    { item_name: "Health Potion",   item_emoji: "🧪", item_category: "potion",  base_price: 25, produced_by_skill: "healing" },
    { item_name: "Antidote Brew",   item_emoji: "💚", item_category: "potion",  base_price: 30, produced_by_skill: "healing" },
    { item_name: "Revive Draught",  item_emoji: "✨", item_category: "potion",  base_price: 60, produced_by_skill: "healing" },
  ],
  wizard: [
    { item_name: "Spell Scroll",    item_emoji: "📜", item_category: "crafted", base_price: 45, produced_by_skill: "research" },
    { item_name: "Mana Crystal",    item_emoji: "🔮", item_category: "luxury",  base_price: 70, produced_by_skill: "research" },
    { item_name: "Enchanted Tome",  item_emoji: "📚", item_category: "crafted", base_price: 80, produced_by_skill: "research" },
  ],
  hunter: [
    { item_name: "Monster Hide",    item_emoji: "🦴", item_category: "resource", base_price: 20, produced_by_skill: "resource_management" },
    { item_name: "Eagle Feathers",  item_emoji: "🪶", item_category: "resource", base_price: 15, produced_by_skill: "resource_management" },
    { item_name: "Smoked Meat",     item_emoji: "🍖", item_category: "food",    base_price: 12, produced_by_skill: "resource_management" },
  ],
  warrior: [
    { item_name: "Battle Trophy",   item_emoji: "🏆", item_category: "luxury",  base_price: 35, produced_by_skill: "combat" },
    { item_name: "Monster Fang",    item_emoji: "🦷", item_category: "resource", base_price: 18, produced_by_skill: "combat" },
  ],
};

// How many of an item are currently for sale → price modifier
function calcDynamicPrice(basePrice, activeCount) {
  // More supply → lower price; less supply → higher
  if (activeCount >= 5) return Math.max(5, Math.round(basePrice * 0.7));
  if (activeCount >= 3) return Math.round(basePrice * 0.85);
  if (activeCount === 0) return Math.round(basePrice * 1.3);
  if (activeCount === 1) return Math.round(basePrice * 1.15);
  return basePrice;
}

export default function Economy() {
  const [listings, setListings] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [agents, setAgents] = useState([]);
  const [producing, setProducing] = useState(null);
  const [buying, setBuying] = useState(null);
  const [agentTrading, setAgentTrading] = useState(null);
  const [filter, setFilter] = useState("all");
  const [priceMap, setPriceMap] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    const [all, agentList] = await Promise.all([
      base44.entities.MarketListing.filter({ status: "active" }, "-created_date", 100),
      base44.entities.Character.filter({ type: "ai_agent" }, "-updated_date", 30),
    ]);
    setListings(all);
    setAgents(agentList);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email });
      setMyCharacter(chars.find(c => c.type === "human") || null);
    }
    // Build supply map: item_name → count active
    const map = {};
    for (const l of all) {
      map[l.item_name] = (map[l.item_name] || 0) + 1;
    }
    setPriceMap(map);
  };

  // Agent produces item based on class + skill level
  const agentProduce = async (agent) => {
    const catalog = CLASS_PRODUCTION[agent.class] || CLASS_PRODUCTION.merchant;
    if (!catalog?.length) return;
    setProducing(agent.id);

    const skills = agent.skills || {};
    // Pick item based on skill: higher skill → higher tier item
    const sorted = [...catalog].sort((a, b) => {
      const sa = skills[a.produced_by_skill] || 1;
      const sb = skills[b.produced_by_skill] || 1;
      return sb - sa;
    });
    const item = sorted[0];
    const skillLevel = skills[item.produced_by_skill] || 1;
    const supplyCount = priceMap[item.item_name] || 0;
    const dynamicPrice = calcDynamicPrice(item.base_price, supplyCount);
    // Higher skill → can produce a bit more valuable item
    const finalPrice = Math.round(dynamicPrice * (1 + skillLevel / 200));

    await base44.entities.MarketListing.create({
      seller_character_id: agent.id,
      seller_name: agent.name,
      seller_type: "ai_agent",
      item_name: item.item_name,
      item_emoji: item.item_emoji,
      item_category: item.item_category,
      quantity: 1,
      base_price: item.base_price,
      current_price: finalPrice,
      produced_by_skill: item.produced_by_skill,
      status: "active",
    });

    // Grow skill
    const newSkills = { ...skills };
    newSkills[item.produced_by_skill] = Math.min(100, (newSkills[item.produced_by_skill] || 1) + 2);
    await base44.entities.Character.update(agent.id, {
      skills: newSkills,
      last_message: `Listed ${item.item_emoji} ${item.item_name} for ${finalPrice}g`,
    });
    setProducing(null);
    loadData();
  };

  // Agent uses trading skill to buy cheapest item and re-list for profit
  const agentArbitrage = async (agent) => {
    setAgentTrading(agent.id);
    const tradingSkill = agent.skills?.trading || 1;
    // Only agents with trading >= 8 can arbitrage
    if (tradingSkill < 8) {
      setAgentTrading(null);
      return;
    }
    const otherListings = listings.filter(l => l.seller_character_id !== agent.id);
    if (!otherListings.length) { setAgentTrading(null); return; }

    const cheapest = [...otherListings].sort((a, b) => a.current_price - b.current_price)[0];
    if ((agent.gold || 0) < cheapest.current_price) { setAgentTrading(null); return; }

    // Buy it
    await base44.entities.MarketListing.update(cheapest.id, {
      status: "sold",
      buyer_character_id: agent.id,
      buyer_name: agent.name,
    });
    const seller = agents.find(a => a.id === cheapest.seller_character_id);
    await Promise.all([
      base44.entities.Character.update(agent.id, {
        gold: (agent.gold || 0) - cheapest.current_price,
        last_message: `Bought ${cheapest.item_emoji || ""} ${cheapest.item_name} for ${cheapest.current_price}g to resell`,
      }),
      seller ? base44.entities.Character.update(seller.id, {
        gold: (seller.gold || 0) + cheapest.current_price,
      }) : Promise.resolve(),
    ]);

    // Re-list at markup
    const markup = 1 + (tradingSkill / 100);
    const resellPrice = Math.round(cheapest.current_price * markup);
    await base44.entities.MarketListing.create({
      seller_character_id: agent.id,
      seller_name: agent.name,
      seller_type: "ai_agent",
      item_name: cheapest.item_name,
      item_emoji: cheapest.item_emoji,
      item_category: cheapest.item_category,
      quantity: 1,
      base_price: cheapest.current_price,
      current_price: resellPrice,
      produced_by_skill: "trading",
      status: "active",
    });
    const newSkills = { ...(agent.skills || {}) };
    newSkills.trading = Math.min(100, (newSkills.trading || 1) + 1);
    await base44.entities.Character.update(agent.id, { skills: newSkills });
    setAgentTrading(null);
    loadData();
  };

  const humanBuy = async (listing) => {
    if (!myCharacter) return;
    if ((myCharacter.gold || 0) < listing.current_price) return;
    setBuying(listing.id);
    await base44.entities.MarketListing.update(listing.id, {
      status: "sold",
      buyer_character_id: myCharacter.id,
      buyer_name: myCharacter.name,
    });
    const seller = agents.find(a => a.id === listing.seller_character_id);
    await Promise.all([
      base44.entities.Character.update(myCharacter.id, { gold: (myCharacter.gold || 0) - listing.current_price }),
      seller ? base44.entities.Character.update(seller.id, { gold: (seller.gold || 0) + listing.current_price }) : Promise.resolve(),
    ]);
    setBuying(null);
    loadData();
  };

  const filtered = filter === "all" ? listings : listings.filter(l => l.item_category === filter);
  const categories = ["all", ...new Set(listings.map(l => l.item_category))];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-2 block">← Back to Home</Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-amber-400 flex items-center gap-2">
              <ShoppingBag className="w-7 h-7" /> Market
            </h1>
            <p className="text-gray-400 mt-1">AI agents produce, trade, and arbitrage goods in real-time</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" className="border-gray-600 text-gray-400 gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Listings", val: listings.length, color: "text-amber-400" },
            { label: "Categories", val: new Set(listings.map(l => l.item_category)).size, color: "text-cyan-400" },
            { label: "Avg Price", val: listings.length ? Math.round(listings.reduce((s, l) => s + l.current_price, 0) / listings.length) + "g" : "—", color: "text-green-400" },
            { label: "Agents Trading", val: agents.filter(a => a.last_message?.includes("Listed") || a.last_message?.includes("Bought")).length, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Agent actions */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-300">Agent Market Actions</span>
            <span className="text-xs text-gray-500 ml-1">— agents produce goods based on class + skills</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {agents.map(agent => {
              const canArbitrage = (agent.skills?.trading || 1) >= 8;
              return (
                <div key={agent.id} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-white">{agent.name}</span>
                    <span className="text-xs text-gray-500 ml-1">({agent.class})</span>
                    <div className="text-xs text-gray-600">{agent.gold || 0}g • crafting:{agent.skills?.crafting || 1} trading:{agent.skills?.trading || 1}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => agentProduce(agent)}
                      disabled={producing === agent.id || !CLASS_PRODUCTION[agent.class]}
                      className="bg-green-800 hover:bg-green-700 text-white text-xs h-7 px-2">
                      {producing === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "📦 Produce"}
                    </Button>
                    {canArbitrage && (
                      <Button size="sm" onClick={() => agentArbitrage(agent)}
                        disabled={agentTrading === agent.id}
                        className="bg-amber-800 hover:bg-amber-700 text-white text-xs h-7 px-2">
                        {agentTrading === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "💹 Trade"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {agents.length === 0 && <p className="text-xs text-gray-600 col-span-2">No agents. Spawn some on the Agents page.</p>}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all
                ${filter === cat ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {cat === "all" ? "All" : `${CATEGORY_EMOJI[cat] || ""} ${cat}`}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(listing => {
            const supplyCount = priceMap[listing.item_name] || 0;
            const priceChanged = listing.current_price !== listing.base_price;
            const cheaper = listing.current_price < listing.base_price;
            return (
              <div key={listing.id} className="bg-gray-900 border border-gray-800 hover:border-amber-700 rounded-xl p-4 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{listing.item_emoji || CATEGORY_EMOJI[listing.item_category] || "📦"}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{listing.item_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{listing.item_category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-400 text-lg">{listing.current_price}g</div>
                    {priceChanged && (
                      <div className={`text-xs flex items-center gap-0.5 justify-end ${cheaper ? "text-green-400" : "text-red-400"}`}>
                        {cheaper ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        vs {listing.base_price}g base
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>by {listing.seller_name}</span>
                  <span className="text-gray-600">{supplyCount} in supply</span>
                </div>
                {myCharacter && listing.seller_character_id !== myCharacter.id && (
                  <Button size="sm" onClick={() => humanBuy(listing)}
                    disabled={buying === listing.id || (myCharacter.gold || 0) < listing.current_price}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs h-7 gap-1">
                    {buying === listing.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Coins className="w-3 h-3" /> Buy</>}
                  </Button>
                )}
                {(!myCharacter || listing.seller_character_id === myCharacter?.id) && (
                  <div className="text-center text-xs text-gray-600">
                    {listing.seller_type === "ai_agent" ? "🤖 Agent listing" : "Your listing"}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-16">
              No active listings. Have agents produce goods above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}