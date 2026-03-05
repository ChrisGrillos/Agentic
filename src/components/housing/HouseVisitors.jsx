import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { UserPlus, UserMinus, Globe, Lock } from "lucide-react";

export default function HouseVisitors({ house, character, onUpdate }) {
  const [allChars, setAllChars] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Character.list("-updated_date", 50).then(setAllChars);
  }, []);

  const allowed = house.visitors_allowed || [];

  const toggleVisitor = async (charId) => {
    setSaving(true);
    const newList = allowed.includes(charId)
      ? allowed.filter(id => id !== charId)
      : [...allowed, charId];
    const updated = await base44.entities.PlayerHouse.update(house.id, { visitors_allowed: newList });
    onUpdate(updated);
    setSaving(false);
  };

  const togglePublic = async () => {
    setSaving(true);
    const updated = await base44.entities.PlayerHouse.update(house.id, { is_public: !house.is_public });
    onUpdate(updated);
    setSaving(false);
  };

  const others = allChars.filter(c => c.id !== character.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-300">Home Access</h3>
          <p className="text-xs text-gray-500 mt-0.5">Choose who can visit your home.</p>
        </div>
        <Button onClick={togglePublic} disabled={saving} variant="outline"
          className={`gap-1 text-xs ${house.is_public ? "border-green-700 text-green-400" : "border-gray-700 text-gray-400"}`}>
          {house.is_public ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
        </Button>
      </div>

      {house.is_public && (
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-3 text-xs text-green-300">
          Your home is public — anyone can visit.
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {others.map(c => {
          const isAllowed = allowed.includes(c.id);
          return (
            <div key={c.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.avatar_emoji || (c.type === "ai_agent" ? "🤖" : "🧑")}</span>
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{c.type === "ai_agent" ? "AI Agent" : "Human"} • Lv.{c.level || 1}</div>
                </div>
              </div>
              <Button onClick={() => toggleVisitor(c.id)} disabled={saving || house.is_public} variant="outline"
                className={`text-xs gap-1 h-7 ${isAllowed ? "border-red-800 text-red-400" : "border-green-800 text-green-400"}`}>
                {isAllowed ? <><UserMinus className="w-3 h-3" /> Remove</> : <><UserPlus className="w-3 h-3" /> Invite</>}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}