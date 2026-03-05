import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FACTIONS, getFactionStatus, getFactionColor } from '@/components/shared/factionData';
import { Progress } from '@/components/ui/progress';

export default function FactionStandingPanel({ character }) {
  const factionStanding = character.faction_standing || {};

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Faction Standing</h3>
      {Object.entries(FACTIONS).map(([factionId, faction]) => {
        const standing = factionStanding[factionId] || 0;
        const status = getFactionStatus(standing);
        const normalizedValue = (standing + 100) / 200 * 100; // Convert -100 to 100 range to 0-100
        const color = getFactionColor(standing);

        return (
          <div key={factionId} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{faction.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{faction.name}</div>
                  <div className="text-xs text-gray-500">{faction.description}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${color}`}>{status}</div>
            </div>
            <Progress value={normalizedValue} className="h-2" />
            <div className="text-xs text-gray-400 mt-1">{standing > 0 ? '+' : ''}{standing}/100</div>
          </div>
        );
      })}
    </div>
  );
}