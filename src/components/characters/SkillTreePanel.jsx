import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getSkillTree, canUnlockSkill, unlockSkillUpdates } from '@/components/shared/skillTreeData';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Lock } from 'lucide-react';

export default function SkillTreePanel({ character, onUpdateCharacter }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const tree = getSkillTree(character.base_class);

  const handleUnlockSkill = async () => {
    const updates = unlockSkillUpdates(character, selectedNode.id);
    if (!updates) return;

    await base44.entities.Character.update(character.id, updates);
    onUpdateCharacter({ ...character, ...updates });
    setSelectedNode(null);
  };

  const unlockedIds = character.skill_tree_unlocked || [];
  const canUnlock = selectedNode && canUnlockSkill(character, selectedNode.id);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <h3 className="font-semibold text-lg">{tree.name}</h3>
        <p className="text-sm text-gray-400">{tree.description}</p>
        <div className="text-sm">
          Stat Points: <span className="font-bold text-yellow-500">{character.stat_points || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(tree.roots || []).map((node) => {
          const isUnlocked = unlockedIds.includes(node.id);
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-3 rounded-lg border transition-all text-left ${
                isUnlocked
                  ? 'bg-green-900 border-green-700'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{node.icon}</div>
              <div className="font-semibold text-sm">{node.name}</div>
              <div className="text-xs text-gray-400">Cost: {node.cost}</div>
            </button>
          );
        })}
      </div>

      {(tree.nodes || []).length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Advanced Skills</h4>
          <div className="grid grid-cols-2 gap-3">
            {tree.nodes.map((node) => {
              const isUnlocked = unlockedIds.includes(node.id);
              const parentsUnlocked = (node.parents || []).some(p => unlockedIds.includes(p));
              const canUnlockThis = canUnlockSkill(character, node.id);

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  disabled={!parentsUnlocked && !isUnlocked}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    isUnlocked
                      ? 'bg-blue-900 border-blue-700'
                      : parentsUnlocked
                      ? 'bg-gray-900 border-gray-700 hover:border-gray-600 cursor-pointer'
                      : 'bg-gray-950 border-gray-800 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-2xl">{node.icon}</div>
                    {isUnlocked && <div className="text-green-400">✓</div>}
                  </div>
                  <div className="font-semibold text-sm">{node.name}</div>
                  <div className="text-xs text-gray-400">Cost: {node.cost}</div>
                  {!parentsUnlocked && !isUnlocked && <div className="text-xs text-red-400 mt-1">Requires parent skill</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="text-2xl mr-2">{selectedNode?.icon}</span>
              {selectedNode?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{selectedNode?.description}</p>
            
            {selectedNode?.stat_bonuses && Object.keys(selectedNode.stat_bonuses).length > 0 && (
              <div className="bg-gray-900 p-2 rounded text-sm">
                <div className="font-semibold mb-1">Stat Bonuses:</div>
                {Object.entries(selectedNode.stat_bonuses).map(([stat, bonus]) => (
                  <div key={stat} className="text-gray-300">
                    {stat}: <span className="text-green-400">+{bonus}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedNode?.max_hp_bonus && (
              <div className="bg-gray-900 p-2 rounded text-sm">
                <div className="text-gray-300">Max HP: <span className="text-green-400">+{selectedNode.max_hp_bonus}</span></div>
              </div>
            )}

            {selectedNode?.unlocks_ability && (
              <div className="bg-blue-900 p-2 rounded text-sm">
                <div className="font-semibold mb-1">Unlocks Ability:</div>
                <div className="font-semibold">{selectedNode.unlocks_ability.name}</div>
                <div className="text-gray-300">{selectedNode.unlocks_ability.description}</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedNode(null)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              {!unlockedIds.includes(selectedNode?.id || '') && (
                <Button
                  onClick={handleUnlockSkill}
                  disabled={!canUnlock}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  Unlock ({selectedNode?.cost} Points)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}