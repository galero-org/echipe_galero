import type { Player, Team, PlayerPreferences } from "./types";

// ========================================================================
// Team Configuration
// ========================================================================

const priorityTeamsConfig = [
  {
    name: "Verde",
    baseColor: "bg-green-500",
    cardClasses: "bg-green-100 border-green-500 text-green-800",
  },
  {
    name: "Albastru",
    baseColor: "bg-blue-500",
    cardClasses: "bg-blue-100 border-blue-500 text-blue-800",
  },
  {
    name: "Portocaliu",
    baseColor: "bg-orange-500",
    cardClasses: "bg-orange-100 border-orange-500 text-orange-800",
  },
  {
    name: "Gri",
    baseColor: "bg-gray-500",
    cardClasses: "bg-gray-100 border-gray-500 text-gray-800",
  },
];

const fallbackTeamBaseColors = [
  "bg-pink-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-red-500",
];

// ========================================================================
// Helper Functions
// ========================================================================

/**
 * Fisher-Yates shuffle algorithm
 */
const shuffle = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Generate fallback CSS classes for teams
 */
const generateFallbackCardClasses = (baseColor: string): string => {
  const colorName = baseColor.split("-")[1];
  return `bg-${colorName}-100 border-${colorName}-500 text-${colorName}-800`;
};

/**
 * Build preference maps for quick lookup
 */
interface PreferenceMaps {
  pairMap: Map<string, Set<string>>;
  separationMap: Map<string, Set<string>>;
}

const buildPreferenceMaps = (
  preferences: PlayerPreferences,
): PreferenceMaps => {
  const { pairs = [], separations = [] } = preferences;

  const pairMap = new Map<string, Set<string>>();
  pairs.forEach(([p1Id, p2Id]) => {
    if (!pairMap.has(p1Id)) pairMap.set(p1Id, new Set());
    if (!pairMap.has(p2Id)) pairMap.set(p2Id, new Set());
    pairMap.get(p1Id)!.add(p2Id);
    pairMap.get(p2Id)!.add(p1Id);
  });

  const separationMap = new Map<string, Set<string>>();
  separations.forEach(([p1Id, p2Id]) => {
    if (!separationMap.has(p1Id)) separationMap.set(p1Id, new Set());
    if (!separationMap.has(p2Id)) separationMap.set(p2Id, new Set());
    separationMap.get(p1Id)!.add(p2Id);
    separationMap.get(p2Id)!.add(p1Id);
  });

  return { pairMap, separationMap };
};

/**
 * Check if a player can be placed in a team (respects separations)
 */
const canPlacePlayerInTeam = (
  player: Player,
  targetTeam: Team,
  playersPerTeam: number,
  separationMap: Map<string, Set<string>>,
): boolean => {
  // Check if team is full
  if (targetTeam.players.length >= playersPerTeam) {
    return false;
  }

  // Check separations
  const teamPlayerIds = new Set(targetTeam.players.map((p) => p.id));
  const forbiddenPartners = separationMap.get(player.id);

  if (forbiddenPartners) {
    for (const forbiddenId of forbiddenPartners) {
      if (teamPlayerIds.has(forbiddenId)) {
        return false;
      }
    }
  }

  return true;
};

// ========================================================================
// Main Team Generation - Snake Draft Algorithm
// ========================================================================

/**
 * Generate teams using a fair snake draft algorithm.
 *
 * How it works:
 * 1. Create all teams
 * 2. Distribute players in snake order (alternating direction each round)
 *    - Round 1: Team 1 → Team 2 → ... → Team N
 *    - Round 2: Team N → Team N-1 → ... → Team 1
 *    - Repeat until all players placed
 * 3. This ensures fair distribution of skill levels across teams
 */
export function generateTeams(
  selectedPlayers: Player[],
  teamCount: number,
  playersPerTeam: number,
  preferences: PlayerPreferences = {},
): Team[] {
  if (
    !selectedPlayers ||
    selectedPlayers.length === 0 ||
    teamCount <= 0 ||
    playersPerTeam <= 0
  ) {
    return [];
  }

  const totalPlayersNeeded = teamCount * playersPerTeam;

  // --- Step 1: Separate players by position ---
  const goalkeepers = selectedPlayers.filter((p) => p.position === "GK");
  const fieldPlayers = selectedPlayers.filter((p) => p.position === "FIELD");

  if (goalkeepers.length < teamCount) {
    console.warn(
      `Warning: ${goalkeepers.length} goalkeepers, ${teamCount} teams. Some teams won't have a goalkeeper.`,
    );
  }
  if (selectedPlayers.length < totalPlayersNeeded) {
    console.warn(
      `Player deficit: ${selectedPlayers.length} selected, ${totalPlayersNeeded} needed.`,
    );
  }

  // --- Step 2: Initialize empty teams ---
  const teams: Team[] = Array.from({ length: teamCount }, (_, i) => {
    let teamName: string;
    let teamColorClasses: string;

    if (i < priorityTeamsConfig.length) {
      teamName = priorityTeamsConfig[i].name;
      teamColorClasses = priorityTeamsConfig[i].cardClasses;
    } else {
      const fallbackIndex = i - priorityTeamsConfig.length;
      const baseColor =
        fallbackTeamBaseColors[fallbackIndex % fallbackTeamBaseColors.length];
      teamName = `Team ${i + 1}`;
      teamColorClasses = generateFallbackCardClasses(baseColor);
    }
    return {
      name: teamName,
      players: [],
      totalGrade: 0,
      averageGrade: 0,
      color: teamColorClasses,
    };
  });

  // --- Step 3: Build preference maps ---
  const { pairMap, separationMap } = buildPreferenceMaps(preferences);
  const placedPlayerIds = new Set<string>();

  // --- Step 4: Distribute goalkeepers (one per team if possible) ---
  const sortedGoalkeepers = shuffle([...goalkeepers]);
  for (let i = 0; i < sortedGoalkeepers.length && i < teamCount; i++) {
    teams[i].players.push(sortedGoalkeepers[i]);
    teams[i].totalGrade += sortedGoalkeepers[i].grade;
    placedPlayerIds.add(sortedGoalkeepers[i].id);
  }

  // --- Step 5: Prepare field players for snake draft ---
  let playerQueue = fieldPlayers.filter((p) => !placedPlayerIds.has(p.id));

  // Sort by grade (highest first) for fair distribution
  playerQueue.sort((a, b) => b.grade - a.grade);

  // --- Step 6: True Snake Draft Distribution ---
  // Each round: all teams pick one player in snake order (alternating direction)
  let direction = 1; // 1 = forward (0→N), -1 = backward (N→0)

  while (playerQueue.length > 0) {
    // Get team indices in current direction order
    const teamIndices =
      direction === 1
        ? Array.from({ length: teamCount }, (_, i) => i)
        : Array.from({ length: teamCount }, (_, i) => teamCount - 1 - i);

    // Each team picks one player this round (if it has space)
    for (const teamIdx of teamIndices) {
      if (playerQueue.length === 0) break;

      const targetTeam = teams[teamIdx];

      // Skip if team is full
      if (targetTeam.players.length >= playersPerTeam) continue;

      // Find a player that respects separation constraints
      let placed = false;
      for (let i = 0; i < playerQueue.length; i++) {
        const player = playerQueue[i];
        if (
          canPlacePlayerInTeam(
            player,
            targetTeam,
            playersPerTeam,
            separationMap,
          )
        ) {
          targetTeam.players.push(player);
          targetTeam.totalGrade += player.grade;
          placedPlayerIds.add(player.id);
          playerQueue.splice(i, 1);
          placed = true;
          break;
        }
      }

      // If we couldn't respect separation constraints, just take the first player
      if (!placed && playerQueue.length > 0) {
        const player = playerQueue.shift()!;
        targetTeam.players.push(player);
        targetTeam.totalGrade += player.grade;
        placedPlayerIds.add(player.id);
      }
    }

    // Reverse direction for next round (snake effect)
    direction = direction === 1 ? -1 : 1;
  }

  // --- Step 7: Calculate final stats ---
  teams.forEach((team) => {
    team.totalGrade = team.players.reduce(
      (sum, player) => sum + player.grade,
      0,
    );
    if (team.players.length > 0) {
      team.averageGrade = team.totalGrade / team.players.length;
    } else {
      team.averageGrade = 0;
    }
  });

  return teams;
}

// ========================================================================
// Export (no additional post-processing needed with snake draft)
// ========================================================================

/**
 * No longer needed - snake draft provides fair distribution by default.
 * Keeping for backwards compatibility, but it just returns teams as-is.
 */
export function balanceTeamsPostProcess(teams: Team[]): Team[] {
  return teams;
}
