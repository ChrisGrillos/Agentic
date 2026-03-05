import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BookOpen, Share2, Copy, X, Star } from "lucide-react";

const RARITY_STYLE = {
  common:   { border: "border-gray-600", title: "text-gray-300", bg: "bg-gray-900/90",    glow: "" },
  uncommon: { border: "border-green-700",title: "text-green-300", bg: "bg-green-950/80",   glow: "shadow-green-900/40" },
  rare:     { border: "border-blue-600", title: "text-blue-300",  bg: "bg-blue-950/80",    glow: "shadow-blue-900/40 shadow-lg" },
  legendary:{ border: "border-amber-500",title: "text-amber-300", bg: "bg-amber-950/80",   glow: "shadow-amber-900/40 shadow-xl" },
};

export default function RecipeCardView({ recipe, myCharacter, onClose, showActions = true }) {
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const style = RARITY_STYLE[recipe.output?.rarity] || RARITY_STYLE.common;

  const handleCopyToNotebook = async () => {
    if (!myCharacter) return;
    setCopying(true);
    const current = recipe.notebook_ids || [];
    if (!current.includes(myCharacter.id)) {
      await base44.entities.RecipeCard.update(recipe.id, {
        notebook_ids: [...current, myCharacter.id],
        times_reproduced: (recipe.times_reproduced || 1) + 1,
      });
    }
    setCopying(false);
  };

  const handleShareToChronicle = async () => {
    if (!myCharacter) return;
    setSharing(true);
    await base44.entities.RecipeCard.update(recipe.id, { is_public: true });
    setSharing(false);
  };

  return (
    <div className={`relative rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} p-5 font-mono`}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>

      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">{recipe.output?.emoji || "⚗️"}</div>
        <div className={`text-xl font-black ${style.title}`}>{recipe.output?.name}</div>
        <div className="text-xs text-gray-500 mt-1 capitalize">
          {recipe.output?.rarity} · {recipe.output?.type?.replace(/_/g," ")}
        </div>
        {recipe.output?.rarity === "legendary" && (
          <div className="flex justify-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-700 my-3" />

      {/* Discovery info */}
      <div className="text-xs text-gray-600 mb-3 text-center">
        Discovered by <span className="text-gray-400">{recipe.discoverer_name}</span>
        {recipe.created_date && ` · ${new Date(recipe.created_date).toLocaleDateString()}`}
        {recipe.times_reproduced > 1 && ` · Reproduced ${recipe.times_reproduced}× `}
      </div>

      {/* Inputs */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Ingredients</div>
        <div className="space-y-1">
          {(recipe.inputs || []).map((inp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-base">{inp.resource_emoji}</span>
              <span className="text-gray-300">{inp.resource_name}</span>
              <span className="text-gray-600 ml-auto">×{inp.qty}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Conditions</div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          {recipe.conditions?.heat != null    && <div className="bg-gray-800 rounded px-2 py-1 text-center"><div className="text-red-400">{recipe.conditions.heat}</div><div className="text-gray-600">Heat</div></div>}
          {recipe.conditions?.pressure != null && <div className="bg-gray-800 rounded px-2 py-1 text-center"><div className="text-blue-400">{recipe.conditions.pressure}</div><div className="text-gray-600">Press.</div></div>}
          {recipe.conditions?.duration != null && <div className="bg-gray-800 rounded px-2 py-1 text-center"><div className="text-amber-400">{recipe.conditions.duration}</div><div className="text-gray-600">Time</div></div>}
        </div>
        {recipe.conditions?.catalyst && (
          <div className="text-xs text-purple-400 mt-1">✨ Catalyst: {recipe.conditions.catalyst}</div>
        )}
        {recipe.conditions?.container && (
          <div className="text-xs text-gray-500 mt-0.5">Container: {recipe.conditions.container?.replace(/_/g," ")}</div>
        )}
      </div>

      {/* Effects */}
      {recipe.output?.effects?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Effects</div>
          <div className="flex flex-wrap gap-1">
            {recipe.output.effects.map((e, i) => (
              <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{e.replace(/_/g," ")}</span>
            ))}
          </div>
        </div>
      )}

      {/* Uses */}
      {recipe.output?.uses?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Uses</div>
          <div className="flex flex-wrap gap-1">
            {recipe.output.uses.map((u, i) => (
              <span key={i} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{u.replace(/_/g," ")}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {recipe.experiment_notes && (
        <>
          <div className="border-t border-dashed border-gray-700 my-3" />
          <p className="text-xs text-gray-500 italic leading-relaxed">{recipe.experiment_notes}</p>
        </>
      )}

      {/* Stability */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-600">Stability</span>
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${recipe.stability_rating > 70 ? "bg-green-500" : recipe.stability_rating > 40 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${recipe.stability_rating || 50}%` }} />
        </div>
        <span className="text-xs text-gray-500">{recipe.stability_rating || 50}%</span>
      </div>

      {/* Actions */}
      {showActions && myCharacter && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={handleCopyToNotebook} disabled={copying}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs gap-1">
            <BookOpen className="w-3 h-3" /> {copying ? "Saving…" : "Add to Notebook"}
          </Button>
          {!recipe.is_public && (
            <Button size="sm" onClick={handleShareToChronicle} disabled={sharing}
              className="flex-1 bg-amber-800 hover:bg-amber-700 text-xs gap-1">
              <Share2 className="w-3 h-3" /> {sharing ? "Sharing…" : "Share to Chronicle"}
            </Button>
          )}
          {recipe.is_public && (
            <div className="flex-1 text-center text-xs text-amber-500 flex items-center justify-center gap-1">
              <Share2 className="w-3 h-3" /> In World Chronicle
            </div>
          )}
        </div>
      )}
    </div>
  );
}