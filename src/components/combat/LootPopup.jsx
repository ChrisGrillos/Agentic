const RARITY_STYLES = {
  common:    "border-gray-600 text-gray-300",
  uncommon:  "border-green-600 text-green-300",
  rare:      "border-blue-500 text-blue-300",
  legendary: "border-purple-400 text-purple-300",
};

export default function LootPopup({ loot, onTake, onDismiss }) {
  if (!loot) return null;
  const style = RARITY_STYLES[loot.rarity] || RARITY_STYLES.common;

  return (
    <div className={`mx-3 my-1 border rounded-lg p-3 bg-gray-900 flex items-center gap-3 ${style}`}>
      <span className="text-2xl">{loot.emoji || "📦"}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold capitalize ${style.split(" ")[1]}`}>{loot.rarity} drop!</div>
        <div className="text-sm font-medium text-white truncate">{loot.name}</div>
        {loot.description && <div className="text-xs text-gray-500 truncate">{loot.description}</div>}
      </div>
      <div className="flex gap-1">
        <button onClick={() => onTake(loot)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded">Take</button>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1">Skip</button>
      </div>
    </div>
  );
}