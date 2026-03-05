import { getZoneAt, getPOIAt, ZONES, POINTS_OF_INTEREST } from "@/components/shared/worldZones";
import { RESOURCES } from "@/components/shared/craftingData";
import { MapPin, Shield, Package, Sword } from "lucide-react";

const DANGER_LABEL = ["Safe", "Low", "Moderate", "Dangerous", "Very Dangerous", "Deadly", "Extreme", "Legendary"];
const DANGER_COLOR = ["text-green-400", "text-lime-400", "text-yellow-400", "text-orange-400", "text-red-400", "text-red-600", "text-rose-600", "text-purple-400"];

export default function ZoneInfoPanel({ x, y }) {
  const zone = getZoneAt(x, y);
  const poi  = getPOIAt(x, y);

  if (!zone && !poi) {
    return (
      <div className="text-xs text-gray-600 p-2">
        <MapPin className="w-3 h-3 inline mr-1" />Unclaimed frontier ({x}, {y})
      </div>
    );
  }

  const z = zone || ZONES.find(zz => zz.id === poi?.zone);
  const isSafehold = z?.zone_type === "safehold" || z?.danger === 0;

  return (
    <div className={`bg-gray-950/95 border rounded-xl p-3 text-xs space-y-2 shadow-xl
      ${isSafehold ? "border-green-800" : "border-gray-700"}`}>
      {/* Zone type badge */}
      {z && (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit
          ${isSafehold
            ? "bg-green-900/30 border border-green-800 text-green-400"
            : "bg-red-900/20 border border-red-900 text-red-400"}`}>
          {isSafehold ? "🛡️ SAFEHOLD" : "⚔️ FRONTIER"}
        </div>
      )}

      {poi && (
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <span className="text-xl">{poi.emoji}</span>
          <div>
            <div className="font-bold text-white">{poi.name}</div>
            <div className="text-gray-500 capitalize">{poi.type?.replace(/_/g, " ")}</div>
          </div>
        </div>
      )}

      {z && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-base">{z.emoji}</span>
            <span className={`font-bold ${isSafehold ? "text-green-300" : "text-amber-300"}`}>{z.name}</span>
          </div>
          <p className="text-gray-400 leading-relaxed italic">{z.description}</p>

          <div className="flex items-center gap-1">
            {isSafehold ? <Shield className="w-3 h-3 text-green-500" /> : <Sword className="w-3 h-3 text-red-500" />}
            <span className="text-gray-500">Threat:</span>
            <span className={`font-bold ${DANGER_COLOR[z.danger] || "text-gray-400"}`}>
              {DANGER_LABEL[z.danger] || "Unknown"}
            </span>
          </div>

          {z.structures && z.structures.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {z.structures.map(s => (
                <span key={s} className="bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-500 capitalize">
                  {s.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {z.resources && z.resources.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                <Package className="w-3 h-3" /> Resources:
              </div>
              <div className="flex flex-wrap gap-1">
                {z.resources.map(rId => {
                  const r = RESOURCES[rId];
                  return r ? (
                    <span key={rId} className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                      {r.emoji} {r.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}