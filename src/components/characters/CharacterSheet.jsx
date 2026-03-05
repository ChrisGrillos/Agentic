import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SKILL_CATEGORIES, getSkillById } from "@/components/shared/skillsData";
import { getTalentById } from "@/components/shared/talentsData";
import { getRace } from "@/components/shared/raceData";

const STAT_INFO = {
  strength:     { emoji: "💪", label: "STR" },
  dexterity:    { emoji: "🏹", label: "DEX" },
  intelligence: { emoji: "🧠", label: "INT" },
  wisdom:       { emoji: "👁️", label: "WIS" },
  constitution: { emoji: "🛡️", label: "CON" },
  charisma:     { emoji: "✨", label: "CHA" },
};

const STAT_ORDER = ["strength", "dexterity", "intelligence", "wisdom", "constitution", "charisma"];

export default function CharacterSheet({ character }) {
  if (!character) return <div className="text-gray-400">No character selected.</div>;

  const race = getRace(character.race);

  return (
    <div className="space-y-4 max-w-4xl">
      {/* ── Header ── */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${character.avatar_color || "bg-blue-900"}`}>
              {race?.emoji || "🧑"}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">{character.name}</CardTitle>
              <div className="text-sm text-gray-400 mt-1">
                <span className="inline-block mr-4">{race?.name || "Unknown"}</span>
                <span className="inline-block mr-4">Level {character.level || 1}</span>
                <span className="inline-block">{character.base_class || "—"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Core Attributes ── */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {STAT_ORDER.map(stat => {
              const value = character.stats?.[stat] || 10;
              const info = STAT_INFO[stat];
              return (
                <div key={stat} className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xl mb-1">{info.emoji}</div>
                  <div className="text-xs text-gray-400 mb-1">{info.label}</div>
                  <div className="text-lg font-bold text-amber-400">{value}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Adventuring Skills ── */}
      <SkillCategory
        categoryId="adventuring"
        character={character}
      />

      {/* ── Combat Disciplines ── */}
      <SkillCategory
        categoryId="combat"
        character={character}
      />

      {/* ── World / Craft / Trade ── */}
      <SkillCategory
        categoryId="world_craft"
        character={character}
      />

      {/* ── Talents ── */}
      {character.talents && character.talents.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Talents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {character.talents.map(talentId => {
                const talent = getTalentById(talentId);
                if (!talent) return null;
                return (
                  <div key={talentId} className="bg-gray-800 rounded-lg p-3">
                    <div className="font-semibold text-amber-400">{talent.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{talent.desc}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SkillCategory({ categoryId, character }) {
  const category = SKILL_CATEGORIES[categoryId];
  if (!category) return null;

  const skills = category.skills.filter(skill => (character.skills?.[skill.id] || 0) > 0);

  if (skills.length === 0) return null;

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg">{category.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {skills.map(skill => {
            const rank = character.skills?.[skill.id] || 0;
            return (
              <div key={skill.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{skill.name}</span>
                  <Badge className="bg-amber-700 text-amber-200">{rank}</Badge>
                </div>
                <div className="text-xs text-gray-400">{skill.desc}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}