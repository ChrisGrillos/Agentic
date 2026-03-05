import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CharacterCard from "@/components/characters/CharacterCard.jsx";
import CreateCharacterModalV2 from "@/components/characters/CreateCharacterModalV2.jsx";

export default function Characters() {
  const [myCharacters, setMyCharacters] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const all = await base44.entities.Character.list("-updated_date", 100);
    setAllCharacters(all);
    if (u) {
      const mine = all.filter(c => c.created_by === u.email && c.type === "human");
      setMyCharacters(mine);
    }
    setLoading(false);
  };

  const handleCreated = () => {
    setShowCreate(false);
    loadData();
  };

  const handleSelectCharacter = async (charId) => {
    if (user) {
      await base44.auth.updateMe({ active_character_id: charId }).catch(() => {});
    }
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to={createPageUrl("Home")} className="text-gray-500 hover:text-amber-400 text-sm mb-3 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-black text-amber-400 mb-2">My Characters</h1>
          <p className="text-gray-400">Manage your character roster. You can have up to 6 characters.</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading characters...</div>
        ) : (
          <div>
            {/* My characters section */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-amber-400 mb-4">Your Characters ({myCharacters.length}/6)</h2>
              {myCharacters.length === 0 ? (
                <p className="text-gray-500">You don't have any characters yet. Create one below!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myCharacters.map(c => (
                    <div
                      key={c.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-amber-500 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-3xl">{c.avatar_emoji || "🧑"}</div>
                        <span className="text-xs px-2 py-1 bg-amber-900/50 text-amber-400 rounded border border-amber-800">Active</span>
                      </div>
                      <div className="font-bold text-white text-lg mb-1">{c.name}</div>
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <div>{c.race || "human"} · {c.base_class || "—"}</div>
                        <div>Level {c.level || 1} · {c.xp || 0} XP</div>
                        {c.hp && (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">HP</div>
                            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div className="bg-green-500 h-2" style={{ width: `${Math.min(100, ((c.hp || 0) / (c.max_hp || 100)) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl("World")} className="flex-1">
                          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-500 h-8 text-xs">
                            Play
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 h-8 text-xs"
                          onClick={() => handleSelectCharacter(c.id)}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create character button */}
            {myCharacters.length < 6 && (
              <div className="mb-10 flex justify-center">
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3"
                >
                  + Create New Character
                </Button>
              </div>
            )}

            {/* All citizens section */}
            <div className="border-t border-gray-800 pt-10">
              <h2 className="text-xl font-bold text-gray-400 mb-4">All Citizens</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allCharacters.map(c => (
                  <CharacterCard key={c.id} character={c} isMe={user && c.created_by === user.email} />
                ))}
                {allCharacters.length === 0 && (
                  <div className="col-span-3 text-center text-gray-500 py-10">No citizens yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCreate && (
          <CreateCharacterModalV2 user={user} onCreated={handleCreated} onClose={() => setShowCreate(false)} />
        )}
      </div>
    </div>
  );
}