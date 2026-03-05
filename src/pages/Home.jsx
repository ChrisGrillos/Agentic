import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Sword, Bot, Users, Vote, Briefcase, Map, Zap, Hammer, Video, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [user, setUser] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      const chars = await base44.entities.Character.filter({ created_by: u.email, type: "human" }, "-updated_date", 10);
      setCharacters(chars);
    }
    setLoading(false);
  };

  const handleSelectCharacter = async (charId) => {
    if (user) {
      await base44.auth.updateMe({ active_character_id: charId }).catch(() => {});
      // Redirect to World
      window.location.href = createPageUrl("World");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            ⚔️ Agentic
          </h1>
          <p className="text-gray-400">A world of Humans and AI, at war, at peace, building together.</p>
        </div>
        <Button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 text-lg"
        >
          Enter the World
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black mb-3 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
          ⚔️ Agentic
        </h1>
        <p className="text-gray-500 text-base max-w-lg mx-auto italic">
          The old order shattered. Safeholds hold the light. Frontiers are contested and lawless.
        </p>
        <p className="text-gray-600 text-sm mt-2">Welcome, {user.full_name}</p>
      </div>

      <div className="w-full max-w-4xl">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading your characters...</div>
        ) : characters.length === 0 ? (
          <div className="text-center space-y-4">
            <p className="text-gray-400 mb-6">You don't have a character yet. Begin your journey.</p>
            <Link to={createPageUrl("Characters")}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 text-lg">
                ⚔️ Create Your Character
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-amber-400 mb-1">CONTINUE YOUR ADVENTURE</h2>
              <p className="text-xs text-gray-500 mb-4">Select a character to enter the world</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCharacter(c.id)}
                    className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:border-amber-500 rounded-xl p-4 text-left transition-all hover:shadow-lg hover:shadow-amber-500/20 hover:scale-102 cursor-pointer group"
                  >
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{c.avatar_emoji || "🧑"}</div>
                    <div className="font-bold text-white text-lg">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.race || "human"} · {c.base_class || "—"}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Level {c.level || 1}</div>
                    {c.hp && (
                      <div className="mt-3 bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700/50">
                        <div className="bg-green-500 h-2 transition-all" style={{ width: `${Math.min(100, ((c.hp || 0) / (c.max_hp || 100)) * 100)}%` }} />
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-1">Click to continue</div>
                  </button>
                ))}

                {characters.length < 6 && (
                  <Link to={createPageUrl("Characters")} className="contents">
                    <button className="bg-gray-900/30 border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-102 cursor-pointer group">
                      <div className="text-4xl mb-2 group-hover:scale-125 transition-transform">+</div>
                      <div className="font-bold text-gray-400 text-sm">New Character</div>
                      <div className="text-xs text-gray-600 mt-2">{6 - characters.length} slot{6 - characters.length !== 1 ? 's' : ''} available</div>
                    </button>
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <p className="text-xs text-gray-600 mb-3 text-center">Other options:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link to={createPageUrl("Characters")}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                    👥 Roster
                  </Button>
                </Link>
                <Link to={createPageUrl("Agents")}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                    🤖 Agents
                  </Button>
                </Link>
                <Link to={createPageUrl("Guilds")}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                    🏰 Guilds
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }