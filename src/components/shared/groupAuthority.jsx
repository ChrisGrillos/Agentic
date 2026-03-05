/**
 * GROUP AUTHORITY — Party formation, follow, and group state.
 *
 * Manages party membership, leader follow, and formation positioning.
 * Future: raid groups, guild war formations.
 */

// ─── PARTY STATE ──────────────────────────────────────────────────────────────

/**
 * Create a party authority instance.
 * In React: const [party, setParty] = useState(null);
 */
export function createGroupAuthority(setParty) {
  return {
    /**
     * Create a new party with the given leader.
     */
    createParty(leader) {
      const party = {
        id: `party_${leader.id}_${Date.now()}`,
        leaderId: leader.id,
        members: [{ id: leader.id, name: leader.name, role: "leader" }],
        formation: "follow", // "follow" | "spread" | "wedge"
        createdAt: Date.now(),
      };
      setParty(party);
      return party;
    },

    /**
     * Add a member to the party.
     */
    addMember(party, character) {
      if (!party) return null;
      if (party.members.length >= 6) return party; // Max 6

      if (party.members.find(m => m.id === character.id)) return party; // Already in

      const updated = {
        ...party,
        members: [...party.members, { id: character.id, name: character.name, role: "member" }],
      };
      setParty(updated);
      return updated;
    },

    /**
     * Remove a member from the party.
     */
    removeMember(party, characterId) {
      if (!party) return null;

      const updated = {
        ...party,
        members: party.members.filter(m => m.id !== characterId),
      };

      // If leader left, promote next member or disband
      if (characterId === party.leaderId) {
        if (updated.members.length > 0) {
          updated.leaderId = updated.members[0].id;
          updated.members[0] = { ...updated.members[0], role: "leader" };
        } else {
          setParty(null);
          return null;
        }
      }

      if (updated.members.length === 0) {
        setParty(null);
        return null;
      }

      setParty(updated);
      return updated;
    },

    /**
     * Disband the party.
     */
    disband() {
      setParty(null);
    },

    /**
     * Set formation type.
     */
    setFormation(party, formation) {
      if (!party) return null;
      const updated = { ...party, formation };
      setParty(updated);
      return updated;
    },
  };
}

// ─── FORMATION POSITIONS ──────────────────────────────────────────────────────

/**
 * Get formation offsets for party members relative to leader position.
 * Returns array of { dx, dy } for each member index (0 = leader).
 */
export function getFormationOffsets(formation, memberCount) {
  const offsets = [{ dx: 0, dy: 0 }]; // Leader at center

  if (formation === "follow") {
    // Single file behind leader
    for (let i = 1; i < memberCount; i++) {
      offsets.push({ dx: 0, dy: i });
    }
  } else if (formation === "spread") {
    // Spread horizontally
    const positions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
      { dx: 0, dy: -1 },
    ];
    for (let i = 1; i < memberCount; i++) {
      offsets.push(positions[i - 1] || { dx: 0, dy: i });
    }
  } else if (formation === "wedge") {
    // V-shape
    const positions = [
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
      { dx: -2, dy: 2 }, { dx: 2, dy: 2 },
      { dx: 0, dy: 2 },
    ];
    for (let i = 1; i < memberCount; i++) {
      offsets.push(positions[i - 1] || { dx: 0, dy: i });
    }
  }

  return offsets;
}

// ─── FORMATION TYPES ──────────────────────────────────────────────────────────

export const FORMATIONS = {
  follow: { id: "follow", label: "Follow", emoji: "🚶", desc: "Single file behind leader" },
  spread: { id: "spread", label: "Spread", emoji: "↔️",  desc: "Spread out horizontally" },
  wedge:  { id: "wedge",  label: "Wedge",  emoji: "🔻",  desc: "V-formation for combat" },
};

export const DEFAULT_FORMATION = "follow";

/**
 * Alias for getFormationOffsets for compatibility.
 */
export function computeFormationPositions(formation, memberCount) {
  return getFormationOffsets(formation, memberCount);
}

/**
 * Get the next tile in follow formation relative to leader.
 */
export function getFollowStep(stepIndex) {
  return { dx: 0, dy: stepIndex };
}