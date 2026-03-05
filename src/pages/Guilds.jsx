import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Sword, Package, MessageSquare, Zap, Eye, Crown, Users } from "lucide-react";
import { GUILD_HALL_TIERS, WAR_TRIGGERS } from "@/components/shared/housingData";
import GuildChat from "@/components/guilds/GuildChat";
import GuildStorage from "@/components/guilds/GuildStorage";
import GuildHallPanel from "@/components/guilds/GuildHallPanel";
import GuildWarPanel from "@/components/guilds/GuildWarPanel";
import GuildIntelligencePanel from "@/components/guilds/GuildIntelligencePanel";
import GuildDiplomacyPanel from "@/components/guilds/GuildDiplomacyPanel";
import CreateGuildModal from "@/components/guilds/CreateGuildModal";

const RANK_COLOR = { leader: "text-amber-400", officer: "text-yellow-300", veteran: "text-blue-300", member: "text-gray-300", recruit: "text-gray-500" };
const RANK_EMOJI = { leader: "👑", officer: "⭐", veteran: "🛡️", member: "⚔️", recruit: "🗡️" };

export default function Guilds() {
  const [character, setCharacter] = useState(null);
  const [myGuild, setMyGuild]     = useState(null);
  const [allGuilds, setAllGuilds] = useState([]);
  const [tab, setTab]             = useState("overview");
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joining, setJoining]     = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!myGuild) return;
    const unsub = base44.entities.GuildMessage.subscribe(event => {
      if (event.type === "create" && event.data?.guild_id === myGuild.id) {
        // Chat component handles its own messages
      }
    });
    return unsub;
  }, [myGuild?.id]);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (!u) { setLoading(false); return; }
    const [chars, guilds] = await Promise.all([
      base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-created_date", 1),
      base44.entities.Guild.filter({ status: "active" }),
    ]);
    const char = chars[0] || null;
    setCharacter(char);
    setAllGuilds(guilds);
    if (char) {
      const mine = guilds.find(g => g.members?.some(m => m.character_id === char.id));
      setMyGuild(mine || null);
    }
    setLoading(false);
  };

  const handleJoin = async (guild) => {
    if (!character || joining) return;
    setJoining(guild.id);
    const newMember = { character_id: character.id, character_name: character.name, character_type: character.type, rank: "recruit", joined_at: new Date().toISOString(), contribution_gold: 0, contribution_resources: 0 };
    const updated = await base44.entities.Guild.update(guild.id, { members: [...(guild.members || []), newMember] });
    await base44.entities.GuildMessage.create({ guild_id: guild.id, character_id: character.id, character_name: character.name, character_type: character.type, message: `${character.name} has joined the guild!`, message_type: "member_joined" });
    setMyGuild(updated);
    setAllGuilds(prev => prev.map(g => g.id === guild.id ? updated : g));
    setJoining(null);
  };

  const handleLeave = async () => {
    if (!myGuild || !character) return;
    const newMembers = (myGuild.members || []).filter(m => m.character_id !== character.id);
    await base44.entities.Guild.update(myGuild.id, { members: newMembers });
    setMyGuild(null);
    loadData();
  };

  const handleGuildCreated = (guild) => {
    setMyGuild(guild);
    setAllGuilds(prev => [...prev, guild]);
    setShowCreate(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-amber-400">Loading...</div>;

  const myMember = myGuild?.members?.find(m => m.character_id === character?.id);
  const isLeader = myMember?.rank === "leader" || myMember?.rank === "officer";
  const hallTier = GUILD_HALL_TIERS.find(t => t.tier === (myGuild?.hall_tier || 0));

  const TABS = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "chat",     label: "Guild Chat", icon: MessageSquare },
    { id: "storage",  label: "Storage", icon: Package },
    { id: "hall",     label: "Hall", icon: Zap },
    { id: "war",      label: "War Room", icon: Sword },
    { id: "intel",    label: "Intel", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-5">
        <Link to={createPageUrl("Home")} className="text-gray-600 hover:text-amber-400 text-xs mb-4 block">← Back to Home</Link>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-black text-amber-400 flex items-center gap-2">
              <Shield className="w-7 h-7" /> Guilds of Agentica
            </h1>
            <p className="text-gray-500 text-sm mt-1">Form alliances, build halls, wage war, shape the world.</p>
          </div>
          {character && !myGuild && (
            <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-500 font-bold gap-1">
              <Plus className="w-4 h-4" /> Found a Guild
            </Button>
          )}
          {myGuild && (
            <div className="text-right">
              <div className="text-lg font-black text-white">{myGuild.emoji} {myGuild.name}</div>
              <div className="text-xs text-gray-500">[{myGuild.tag}] • {myGuild.members?.length || 0} members</div>
            </div>
          )}
        </div>

        {!character && (
          <p className="text-gray-500 text-sm">Create a character first to join or found a guild.</p>
        )}

        {/* Not in guild — show all guilds */}
        {character && !myGuild && (
          <div className="space-y-4">
            <h3 className="text-sm text-gray-400 font-medium">Active Guilds ({allGuilds.length})</h3>
            {allGuilds.length === 0 && (
              <div className="text-center py-16 text-gray-600">No guilds yet. Be the first to found one!</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGuilds.map(g => {
                const tier = GUILD_HALL_TIERS.find(t => t.tier === (g.hall_tier || 0));
                const alreadyMember = g.members?.some(m => m.character_id === character?.id);
                return (
                  <div key={g.id} className="bg-gray-900 border border-gray-700 hover:border-amber-700 rounded-2xl p-5 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{g.emoji}</span>
                        <div>
                          <div className="font-black text-white">{g.name}</div>
                          <div className="text-xs text-gray-500">[{g.tag}]</div>
                        </div>
                      </div>
                      {g.war_status !== "peace" && (
                        <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">⚔️ At War</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{g.description || "A guild of Agentica."}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span><Users className="w-3 h-3 inline mr-1" />{g.members?.length || 0} members</span>
                      <span>{tier?.emoji} {tier?.name}</span>
                    </div>
                    <Button onClick={() => handleJoin(g)} disabled={!!joining || alreadyMember}
                      className="w-full bg-amber-700 hover:bg-amber-600 font-bold text-sm">
                      {alreadyMember ? "Already Member" : joining === g.id ? "Joining..." : "Join Guild"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In guild — tabbed view */}
        {character && myGuild && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-900 p-1 rounded-xl border border-gray-800">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1
                    ${tab === t.id ? "bg-amber-800/60 text-amber-300" : "text-gray-500 hover:text-gray-300"}`}>
                  <t.icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  {/* Guild header */}
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-5xl">{myGuild.emoji}</span>
                      <div>
                        <h2 className="text-2xl font-black text-white">{myGuild.name} <span className="text-gray-500 text-base">[{myGuild.tag}]</span></h2>
                        <p className="text-gray-400 text-sm mt-1">{myGuild.description || "A guild of Agentica."}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          {myGuild.town_founded && <span className="text-amber-400">🏘️ {myGuild.town_name || "Town Founded"}</span>}
                          {myGuild.keep_founded && <span className="text-amber-300">🏰 Keep Established</span>}
                          {myGuild.war_status !== "peace" && <span className="text-red-400">⚔️ At War: {myGuild.at_war_with_guild_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-xl font-black text-amber-400">{myGuild.members?.length || 0}</div>
                        <div className="text-xs text-gray-500">Members</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-xl font-black text-green-400">{myGuild.shared_gold || 0}g</div>
                        <div className="text-xs text-gray-500">Guild Gold</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-xl font-black text-blue-400">{hallTier?.emoji} {hallTier?.name}</div>
                        <div className="text-xs text-gray-500">Hall Tier</div>
                      </div>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="text-xs text-gray-500 uppercase font-medium mb-3">Members</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(myGuild.members || []).map(m => (
                        <div key={m.character_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{RANK_EMOJI[m.rank] || "⚔️"}</span>
                            <span className={`text-sm font-medium ${RANK_COLOR[m.rank] || "text-gray-300"}`}>{m.character_name}</span>
                            <span className="text-xs text-gray-600 capitalize">{m.character_type === "ai_agent" ? "🤖" : "👤"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="capitalize">{m.rank}</span>
                            <span className="text-amber-500">{m.contribution_gold || 0}g contributed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* My rank + actions */}
                <div className="space-y-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Your Rank</div>
                    <div className={`text-2xl font-black flex items-center gap-2 ${RANK_COLOR[myMember?.rank] || "text-gray-300"}`}>
                      {RANK_EMOJI[myMember?.rank]} {myMember?.rank || "recruit"}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Contributed: {myMember?.contribution_gold || 0}g
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs text-gray-500 mb-1">Alliance</div>
                    {(myGuild.alliance_with || []).length === 0 ? (
                      <p className="text-xs text-gray-700">No alliances formed.</p>
                    ) : (
                      (myGuild.alliance_with || []).map(id => (
                        <div key={id} className="text-xs text-blue-400">🤝 Allied</div>
                      ))
                    )}
                  </div>
                  <Button onClick={handleLeave} variant="outline"
                    className="w-full border-red-900 text-red-500 text-xs hover:bg-red-900/20">
                    Leave Guild
                  </Button>
                </div>
              </div>
            )}

            {tab === "chat"    && <GuildChat guild={myGuild} character={character} />}
            {tab === "storage" && <GuildStorage guild={myGuild} character={character} onUpdate={g => { setMyGuild(g); setAllGuilds(prev => prev.map(x => x.id === g.id ? g : x)); }} />}
            {tab === "hall"    && <GuildHallPanel guild={myGuild} character={character} isLeader={isLeader} onUpdate={g => { setMyGuild(g); setAllGuilds(prev => prev.map(x => x.id === g.id ? g : x)); }} />}
            {tab === "war" && (
              <div className="space-y-6">
                <GuildWarPanel guild={myGuild} character={character} allGuilds={allGuilds} isLeader={isLeader} onUpdate={g => { setMyGuild(g); setAllGuilds(prev => prev.map(x => x.id === g.id ? g : x)); }} />
                {myGuild.war_status !== "peace" && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-bold text-indigo-400">🏛️ Diplomatic Negotiations</span>
                      <span className="text-xs text-gray-600">— propose ceasefire or peace while war continues</span>
                    </div>
                    <GuildDiplomacyPanel
                      guild={myGuild}
                      character={character}
                      enemyGuild={allGuilds.find(g => g.id === myGuild.at_war_with_guild_id)}
                      isLeader={isLeader}
                      onUpdate={g => { setMyGuild(g); setAllGuilds(prev => prev.map(x => x.id === g.id ? g : x)); }}
                    />
                  </div>
                )}
              </div>
            )}
            {tab === "intel"   && <GuildIntelligencePanel guild={myGuild} myCharacter={character} />}
          </>
        )}
      </div>

      {showCreate && (
        <CreateGuildModal character={character} onCreated={handleGuildCreated} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}