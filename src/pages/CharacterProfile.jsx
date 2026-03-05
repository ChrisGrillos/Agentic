import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SkillTreePanel from '@/components/characters/SkillTreePanel';
import FactionStandingPanel from '@/components/characters/FactionStandingPanel';
import AchievementsPanel from '@/components/characters/AchievementsPanel';
import DerivedStatsPanel from '@/components/characters/DerivedStatsPanel';

export default function CharacterProfile() {
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get('id');
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacter();
  }, [characterId]);

  const loadCharacter = async () => {
    if (!characterId) return;
    setLoading(true);
    try {
      const c = await base44.entities.Character.get(characterId);
      setCharacter(c);
    } catch (err) {
      console.error('Failed to load character:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  if (!character) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Character not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('Characters')} className="text-gray-500 hover:text-amber-400 text-sm mb-4 block">
          ← Back to Characters
        </Link>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-6xl ${character.avatar_color || 'text-blue-500'}`}>
                {character.avatar_emoji || '⚔️'}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{character.name}</h1>
                <p className="text-gray-400">{character.base_class}</p>
                {character.active_title && <p className="text-amber-400 text-sm">{character.active_title}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-500">{character.level}</div>
              <div className="text-gray-400">Level</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="skills" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="factions">Factions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <SkillTreePanel character={character} onUpdateCharacter={setCharacter} />
            </div>
          </TabsContent>

          <TabsContent value="factions">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <FactionStandingPanel character={character} />
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <AchievementsPanel character={character} />
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <DerivedStatsPanel character={character} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}