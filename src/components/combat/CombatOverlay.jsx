import { useEffect, useMemo, useState } from "react";
import { X, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import gameService from "@/api/gameService";
import { getCharacterAbilities } from "@/components/shared/classDefinitions";

export default function CombatOverlay({ character, monster, onClose, onVictory, onDefeat }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const abilities = useMemo(() => {
    const list = getCharacterAbilities(character.base_class || character.class, character.specialization, character.level || 1) || [];
    const actives = list.filter(a => a.type !== "passive");
    return actives.length ? actives : [{ id: "basic_attack", name: "Basic Attack", effect_type: "damage", energy_cost: 0 }];
  }, [character]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await gameService.combatAction({
          action: "start",
          character_id: character.id,
          monster_id: monster.id,
        });
        if (!mounted) return;
        setSession(res.session);
        setStatus(res.phase || "active");
      } catch (e) {
        if (!mounted) return;
        setError(String(e.message || e));
        setStatus("error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [character.id, monster.id]);

  const performIntent = async (intent, abilityId) => {
    if (!session || busy || status !== "active") return;
    setBusy(true);
    setError("");
    try {
      const res = await gameService.combatAction({
        action: intent === "retreat" ? "retreat" : "intent",
        intent,
        session_id: session.id,
        ability_id: abilityId,
      });
      const nextSession = res.session || session;
      setSession(nextSession);
      const resolved = res.status;
      if (resolved === "victory") {
        setStatus("victory");
        onVictory && onVictory({
          hp: nextSession.actor_hp,
          energy: nextSession.actor_energy,
          xp: (character.xp || 0) + (res.reward?.xp || 0),
          gold: (character.gold || 0) + (res.reward?.gold || 0),
        }, null);
      } else if (resolved === "defeat") {
        setStatus("defeat");
        onDefeat && onDefeat();
      } else if (resolved === "retreated") {
        onClose && onClose();
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const combatLog = session?.combat_log || [];
  const playerHp = session?.actor_hp ?? character.hp ?? 1;
  const playerMaxHp = session?.actor_max_hp ?? character.max_hp ?? 100;
  const monsterHp = session?.monster_hp ?? monster.hp ?? 1;
  const monsterMaxHp = session?.monster_max_hp ?? monster.max_hp ?? monster.hp ?? 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gray-950 border border-red-900 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="font-black text-red-400 flex items-center gap-2"><Swords className="w-5 h-5" /> Combat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">{character.name}</div>
            <div className="h-3 rounded bg-gray-800 overflow-hidden mb-2">
              <div className="h-3 bg-green-500" style={{ width: `${Math.max(0, Math.min(100, (playerHp / Math.max(1, playerMaxHp)) * 100))}%` }} />
            </div>
            <div className="text-xs text-gray-500">HP {playerHp} / {playerMaxHp}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">{monster.name}</div>
            <div className="h-3 rounded bg-gray-800 overflow-hidden mb-2">
              <div className="h-3 bg-red-500" style={{ width: `${Math.max(0, Math.min(100, (monsterHp / Math.max(1, monsterMaxHp)) * 100))}%` }} />
            </div>
            <div className="text-xs text-gray-500">HP {monsterHp} / {monsterMaxHp}</div>
          </div>
        </div>

        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {abilities.slice(0, 6).map((ab) => (
            <Button key={ab.id || ab.name} size="sm" disabled={busy || status !== "active"} className="bg-red-800 hover:bg-red-700"
              onClick={() => performIntent("ability", ab.id)}>
              {ab.name}
            </Button>
          ))}
          <Button size="sm" variant="outline" disabled={busy || status !== "active"} onClick={() => performIntent("attack", "basic_attack")}>Attack</Button>
          <Button size="sm" variant="outline" disabled={busy || status !== "active"} onClick={() => performIntent("retreat")}>Retreat</Button>
        </div>

        <div className="mx-4 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-3 max-h-56 overflow-y-auto text-xs text-gray-300 space-y-1">
          {status === "starting" && <div>Starting combat session…</div>}
          {status === "victory" && <div className="text-green-400 font-bold">Victory!</div>}
          {status === "defeat" && <div className="text-red-400 font-bold">Defeated.</div>}
          {error && <div className="text-red-400">{error}</div>}
          {combatLog.map((line, idx) => <div key={idx}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}

