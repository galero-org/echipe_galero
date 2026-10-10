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

interface TeamBalanceTargets {
  grade: number;
  gradeScale: number;
}

function createTeamBalanceTargets(
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): TeamBalanceTargets {
  const grades = players.map((player) => player.grade);
  return {
    grade: grades.reduce((sum, grade) => sum + grade, 0) / teamCount,
    gradeScale: Math.max(
      1,
      (Math.max(...grades) - Math.min(...grades)) * playersPerTeam,
    ),
  };
}

function getPlacementCost(
  team: Team,
  player: Player,
  targets: TeamBalanceTargets,
): number {
  const gradeBefore = (team.totalGrade - targets.grade) / targets.gradeScale;
  const gradeAfter =
    (team.totalGrade + player.grade - targets.grade) / targets.gradeScale;
  return gradeAfter ** 2 - gradeBefore ** 2;
}

function findBestTeamIndex(
  player: Player,
  teamIndices: number[],
  teams: Team[],
  targets: TeamBalanceTargets,
): number | null {
  let bestTeamIndex: number | null = null;
  let lowestCost = Number.POSITIVE_INFINITY;

  for (const teamIndex of teamIndices) {
    const cost = getPlacementCost(teams[teamIndex], player, targets);
    if (cost < lowestCost) {
      lowestCost = cost;
      bestTeamIndex = teamIndex;
    }
  }

  return bestTeamIndex;
}

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
 * Balances teams by grade. Attendance is collected only for display statistics.
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
    .sort((left, right) => {
      const leftSeparationCount = separationMap.get(left.id)?.size ?? 0;
      const rightSeparationCount = separationMap.get(right.id)?.size ?? 0;
      return (
        rightSeparationCount - leftSeparationCount || right.grade - left.grade
      );
    })
    .slice(0, remainingSlots);
  const balanceTargets = createTeamBalanceTargets(
    [...separatedGoalkeepers, ...playerQueue],
    teamCount,
    playersPerTeam,
  );

  // --- Step 4: Optionally reserve one goalkeeper slot per team ---
  const availableGoalkeeperTeams = shuffle(
    Array.from({ length: teamCount }, (_, index) => index),
  );
  for (const goalkeeper of separatedGoalkeepers) {
    const teamIndex = findBestTeamIndex(
      goalkeeper,
      availableGoalkeeperTeams,
      teams,
      balanceTargets,
    );
    if (teamIndex === null) break;

    const team = teams[teamIndex];
    team.players.push(goalkeeper);
    team.totalGrade += goalkeeper.grade;
    availableGoalkeeperTeams.splice(
      availableGoalkeeperTeams.indexOf(teamIndex),
      1,
    );
  }

  // --- Step 5: Place remaining players by grade balance ---
  let direction = 1; // 1 = forward (0→N), -1 = backward (N→0)

  while (playerQueue.length > 0) {
    const teamIndices =
      direction === 1
        ? Array.from({ length: teamCount }, (_, i) => i)
        : Array.from({ length: teamCount }, (_, i) => teamCount - 1 - i);
    const player = playerQueue.shift()!;
    const availableTeams = teamIndices.filter(
      (index) => teams[index].players.length < playersPerTeam,
    );
    if (availableTeams.length === 0) break;

    const teamsRespectingSeparations = availableTeams.filter((index) =>
      canPlacePlayerInTeam(player, teams[index], playersPerTeam, separationMap),
    );
    const candidateTeams =
      teamsRespectingSeparations.length > 0
        ? teamsRespectingSeparations
        : availableTeams;
    const teamIndex = findBestTeamIndex(
      player,
      candidateTeams,
      teams,
      balanceTargets,
    );
    if (teamIndex === null) break;

    teams[teamIndex].players.push(player);
    teams[teamIndex].totalGrade += player.grade;
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
