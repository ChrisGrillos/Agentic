import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { X, Shield } from "lucide-react";

const GUILD_EMOJIS = ["⚔️","🛡️","🐉","🔥","⚡","🌑","🏹","🗡️","💎","🌙","🦅","🐺"];
const BANNER_COLORS = ["bg-amber-900","bg-red-900","bg-blue-900","bg-green-900","bg-purple-900","bg-gray-800","bg-cyan-900","bg-orange-900"];

export default function CreateGuildModal({ character, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("⚔️");
  const [bannerColor, setBannerColor] = useState("bg-amber-900");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !tag.trim() || saving) return;
    setSaving(true);
    const guild = await base44.entities.Guild.create({
      name: name.trim(),
      tag: tag.trim().toUpperCase().slice(0, 5),
      description: description.trim(),
      emoji,
      banner_color: bannerColor,
      founder_character_id: character.id,
      founder_name: character.name,
      leader_character_id: character.id,
      leader_name: character.name,
      members: [{
        character_id: character.id,
        character_name: character.name,
        character_type: character.type,
        rank: "leader",
        joined_at: new Date().toISOString(),
        contribution_gold: 0,
        contribution_resources: 0,
      }],
      hall_tier: 0,
      shared_gold: 0,
      shared_storage: [],
      upgrade_resources: { wood: 0, stone: 0, iron_ore: 0, gold_ore: 0 },
      town_founded: false,
      keep_founded: false,
      war_status: "peace",
      alliance_with: [],
      active_quests: [],
      status: "active",
    });
    await base44.entities.GuildMessage.create({
      guild_id: guild.id, character_id: character.id,
      character_name: character.name, character_type: character.type,
      message: `⚔️ Guild "${guild.name}" has been founded by ${character.name}! The banner rises!`,
      message_type: "system",
    });
    setSaving(false);
    onCreated(guild);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-amber-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black text-amber-400 flex items-center gap-2"><Shield className="w-5 h-5" /> Found a Guild</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Guild Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="The Iron Brotherhood"
                className="bg-gray-800 border-gray-600 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tag [3-5]</label>
              <Input value={tag} onChange={e => setTag(e.target.value.toUpperCase().slice(0,5))} placeholder="IRN"
                className="bg-gray-800 border-gray-600 text-white font-mono" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What does your guild stand for?"
              className="bg-gray-800 border-gray-600 text-white text-sm h-16 resize-none" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Guild Emblem</label>
            <div className="flex flex-wrap gap-2">
              {GUILD_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg border transition-all ${emoji === e ? "border-amber-500 bg-amber-900/30" : "border-gray-700"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Banner Color</label>
            <div className="flex gap-2">
              {BANNER_COLORS.map(c => (
                <button key={c} onClick={() => setBannerColor(c)}
                  className={`w-8 h-8 rounded-lg ${c} border-2 transition-all ${bannerColor === c ? "border-white scale-110" : "border-transparent"}`} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`${bannerColor} border border-gray-700 rounded-xl p-4 flex items-center gap-3`}>
            <span className="text-4xl">{emoji}</span>
            <div>
              <div className="font-black text-white text-lg">{name || "Guild Name"}</div>
              <div className="text-gray-300 text-sm">[{tag || "TAG"}]</div>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={saving || !name.trim() || !tag.trim()}
            className="w-full bg-amber-600 hover:bg-amber-500 font-bold text-lg">
            {saving ? "Founding..." : "⚔️ Found Guild"}
          </Button>
        </div>
      </div>
    </div>
  );
}