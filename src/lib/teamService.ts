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
// Main Team Generation - Grade-Balanced Draft
// ========================================================================

/**
 * Sorts players by grade and distributes them in alternating snake-draft rounds.
 * Attendance is collected only for display statistics.
 */
export function generateTeams(
  selectedPlayers: Player[],
  teamCount: number,
  playersPerTeam: number,
  preferences: PlayerPreferences = {},
  options: { goalkeepersInSeparateTeams?: boolean } = {},
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
  const goalkeepersInSeparateTeams = options.goalkeepersInSeparateTeams ?? true;

  // --- Step 1: Separate players by position ---
  const goalkeepers = selectedPlayers.filter((p) => p.position === "GK");

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
      totalEditionsPlayed: 0,
      averageEditionsPlayed: 0,
      color: teamColorClasses,
    };
  });

  // --- Step 3: Build preference maps ---
  const { separationMap } = buildPreferenceMaps(preferences);
  const separatedGoalkeepers = goalkeepersInSeparateTeams
    ? [...goalkeepers]
        .sort((left, right) => right.grade - left.grade)
        .slice(0, teamCount)
    : [];
  const reservedGoalkeeperIds = new Set(
    separatedGoalkeepers.map((goalkeeper) => goalkeeper.id),
  );
  const remainingSlots = Math.max(
    0,
    totalPlayersNeeded - separatedGoalkeepers.length,
  );
  const playerQueue = [...selectedPlayers]
    .filter((player) => !reservedGoalkeeperIds.has(player.id))
    .sort((left, right) => right.grade - left.grade)
    .slice(0, remainingSlots);

  // --- Step 4: Optionally reserve one goalkeeper per team ---
  const availableGoalkeeperTeams = shuffle(
    Array.from({ length: teamCount }, (_, index) => index),
  );
  for (const goalkeeper of separatedGoalkeepers) {
    const teamIndex = availableGoalkeeperTeams.shift();
    if (teamIndex === undefined) break;
    const team = teams[teamIndex];
    team.players.push(goalkeeper);
    team.totalGrade += goalkeeper.grade;
  }

  // --- Step 5: Snake draft the remaining players by grade ---
  let direction = 1; // 1 = forward (0→N), -1 = backward (N→0)

  while (playerQueue.length > 0) {
    const teamIndices =
      direction === 1
        ? Array.from({ length: teamCount }, (_, i) => i)
        : Array.from({ length: teamCount }, (_, i) => teamCount - 1 - i);
    let placedInRound = false;

    for (const teamIndex of teamIndices) {
      if (playerQueue.length === 0) break;
      const team = teams[teamIndex];
      if (team.players.length >= playersPerTeam) continue;

      const eligiblePlayerIndex = playerQueue.findIndex((player) =>
        canPlacePlayerInTeam(player, team, playersPerTeam, separationMap),
      );
      const playerIndex = eligiblePlayerIndex >= 0 ? eligiblePlayerIndex : 0;
      const [player] = playerQueue.splice(playerIndex, 1);
      team.players.push(player);
      team.totalGrade += player.grade;
      placedInRound = true;
    }

    if (!placedInRound) break;
    direction = direction === 1 ? -1 : 1;
  }

  // --- Step 7: Calculate final stats ---
  teams.forEach((team) => {
    team.totalGrade = team.players.reduce(
      (sum, player) => sum + player.grade,
      0,
    );
    team.totalEditionsPlayed = team.players.reduce(
      (sum, player) => sum + Math.max(0, player.totalEditions ?? 0),
      0,
    );
    if (team.players.length > 0) {
      team.averageGrade = team.totalGrade / team.players.length;
      team.averageEditionsPlayed =
        team.totalEditionsPlayed / team.players.length;
    } else {
      team.averageGrade = 0;
      team.averageEditionsPlayed = 0;
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
