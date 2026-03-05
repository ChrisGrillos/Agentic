import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ACHIEVEMENTS, TITLES, getAchievementProgress } from '@/components/shared/achievementData';

export default function AchievementsPanel({ character }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const unlocked = character.achievements || [];
  const progress = getAchievementProgress(character);
  const titles = character.titles || [];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Achievements</h3>
          <div className="text-sm text-gray-400">{progress.unlocked}/{progress.total}</div>
        </div>
        <div className="w-full bg-gray-800 rounded h-2">
          <div
            className="bg-yellow-500 h-2 rounded transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(ACHIEVEMENTS).map(([id, achievement]) => {
          const isUnlocked = unlocked.includes(id);
          return (
            <button
              key={id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`p-3 rounded-lg border text-center transition-all ${
                isUnlocked
                  ? 'bg-yellow-900 border-yellow-700 hover:border-yellow-600'
                  : 'bg-gray-900 border-gray-700 opacity-40'
              }`}
            >
              <div className="text-2xl mb-1">{achievement.emoji}</div>
              <div className="text-xs font-semibold line-clamp-2">{achievement.name}</div>
            </button>
          );
        })}
      </div>

      {titles.length > 0 && (
        <div className="bg-purple-900 p-3 rounded-lg border border-purple-700">
          <h4 className="font-semibold text-sm mb-2">Titles Earned</h4>
          <div className="flex flex-wrap gap-2">
            {titles.map((titleName) => (
              <div key={titleName} className="bg-purple-800 px-2 py-1 rounded text-xs">
                {titleName}
              </div>
            ))}
          </div>
          {character.active_title && (
            <div className="text-xs text-purple-300 mt-2">
              Active Title: <span className="font-semibold">{character.active_title}</span>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="text-2xl mr-2">{selectedAchievement?.emoji}</span>
              {selectedAchievement?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">{selectedAchievement?.description}</p>
            {selectedAchievement?.title_unlocked && (
              <div className="bg-purple-900 p-2 rounded text-sm">
                <div className="font-semibold text-purple-300">Unlocks Title:</div>
                <div className="text-purple-200">{selectedAchievement.title_unlocked}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}