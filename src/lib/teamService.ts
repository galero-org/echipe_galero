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

const GRADE_BALANCE_WEIGHT = 0.75;
const PRESENCE_BALANCE_WEIGHT = 0.25;

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

const getPresenceCount = (player: Player): number =>
  Math.max(0, player.totalEditions ?? 0);

function createDraftScoreMap(players: Player[]): Map<string, number> {
  const grades = players.map((player) => player.grade);
  const presences = players.map(getPresenceCount);
  const minGrade = Math.min(...grades);
  const maxGrade = Math.max(...grades);
  const minPresence = Math.min(...presences);
  const maxPresence = Math.max(...presences);

  const normalize = (value: number, min: number, max: number) =>
    max === min ? 0 : (value - min) / (max - min);

  return new Map(
    players.map((player) => {
      const gradeScore = normalize(player.grade, minGrade, maxGrade);
      const presenceScore = normalize(
        getPresenceCount(player),
        minPresence,
        maxPresence,
      );
      return [
        player.id,
        gradeScore * GRADE_BALANCE_WEIGHT +
          presenceScore * PRESENCE_BALANCE_WEIGHT,
      ];
    }),
  );
}

interface TeamBalanceTargets {
  grade: number;
  presence: number;
  gradeScale: number;
  presenceScale: number;
}

function createTeamBalanceTargets(
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): TeamBalanceTargets {
  const grades = players.map((player) => player.grade);
  const presences = players.map(getPresenceCount);

  return {
    grade: grades.reduce((sum, grade) => sum + grade, 0) / teamCount,
    presence: presences.reduce((sum, count) => sum + count, 0) / teamCount,
    gradeScale: Math.max(
      1,
      (Math.max(...grades) - Math.min(...grades)) * playersPerTeam,
    ),
    presenceScale: Math.max(
      1,
      (Math.max(...presences) - Math.min(...presences)) * playersPerTeam,
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
  const presenceBefore =
    ((team.totalEditionsPlayed ?? 0) - targets.presence) /
    targets.presenceScale;
  const presenceAfter =
    ((team.totalEditionsPlayed ?? 0) +
      getPresenceCount(player) -
      targets.presence) /
    targets.presenceScale;

  return (
    GRADE_BALANCE_WEIGHT * (gradeAfter ** 2 - gradeBefore ** 2) +
    PRESENCE_BALANCE_WEIGHT * (presenceAfter ** 2 - presenceBefore ** 2)
  );
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
  const draftScores = createDraftScoreMap(selectedPlayers);

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
      totalEditionsPlayed: 0,
      averageEditionsPlayed: 0,
      color: teamColorClasses,
    };
  });

  // --- Step 3: Build preference maps ---
  const { separationMap } = buildPreferenceMaps(preferences);
  const sortedGoalkeepers = [...goalkeepers].sort(
    (left, right) =>
      (draftScores.get(right.id) ?? 0) - (draftScores.get(left.id) ?? 0),
  );
  const goalkeeperQueue = sortedGoalkeepers.slice(0, teamCount);
  const fieldSlots = Math.max(0, totalPlayersNeeded - goalkeeperQueue.length);
  const playerQueue = [...fieldPlayers]
    .sort((left, right) => {
      const leftSeparationCount = separationMap.get(left.id)?.size ?? 0;
      const rightSeparationCount = separationMap.get(right.id)?.size ?? 0;
      return (
        rightSeparationCount - leftSeparationCount ||
        (draftScores.get(right.id) ?? 0) - (draftScores.get(left.id) ?? 0) ||
        right.grade - left.grade ||
        getPresenceCount(right) - getPresenceCount(left)
      );
    })
    .slice(0, fieldSlots);
  const balanceTargets = createTeamBalanceTargets(
    [...goalkeeperQueue, ...playerQueue],
    teamCount,
    playersPerTeam,
  );

  // --- Step 4: Distribute goalkeepers (one per team if possible) ---
  const availableGoalkeeperTeams = shuffle(
    Array.from({ length: teamCount }, (_, index) => index),
  );
  for (const goalkeeper of goalkeeperQueue) {
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
    team.totalEditionsPlayed =
      (team.totalEditionsPlayed ?? 0) + getPresenceCount(goalkeeper);
    availableGoalkeeperTeams.splice(
      availableGoalkeeperTeams.indexOf(teamIndex),
      1,
    );
  }

  // --- Step 5: Place field players by weighted balance ---
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
    teams[teamIndex].totalEditionsPlayed =
      (teams[teamIndex].totalEditionsPlayed ?? 0) + getPresenceCount(player);
    direction = direction === 1 ? -1 : 1;
  }

  // --- Step 7: Calculate final stats ---
  teams.forEach((team) => {
    team.totalGrade = team.players.reduce(
      (sum, player) => sum + player.grade,
      0,
    );
    team.totalEditionsPlayed = team.players.reduce(
      (sum, player) => sum + getPresenceCount(player),
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
