import type { Player, Team } from "./types";

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

const generateFallbackCardClasses = (baseColor: string): string => {
  const colorName = baseColor.split("-")[1];
  return `bg-${colorName}-100 border-${colorName}-500 text-${colorName}-800`;
};

export function generateTeams(
  selectedPlayers: Player[],
  teamCount: number,
  playersPerTeam: number
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

  const goalkeepers = selectedPlayers.filter((p) => p.position === "GK");
  const fieldPlayers = selectedPlayers.filter((p) => p.position === "FIELD");

  if (goalkeepers.length < teamCount) {
    console.warn(
      `Avertisment: Sunt ${goalkeepers.length} portari, dar se cer ${teamCount} echipe. Unele echipe nu vor avea portar.`
    );
  }

  if (selectedPlayers.length < totalPlayersNeeded) {
    console.warn(
      `Deficit de jucători: ${selectedPlayers.length} selectați, ${totalPlayersNeeded} necesari pentru ${teamCount} echipe a câte ${playersPerTeam} jucători. Ajustează selecția sau configurația.`
    );
    return [];
  }

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
      teamName = `Echipa ${i + 1}`;
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

  const sortedGoalkeepers = [...goalkeepers].sort((a, b) => b.grade - a.grade);
  const sortedFieldPlayers = [...fieldPlayers].sort(
    (a, b) => b.grade - a.grade
  );

  // --- Începutul modificării ---
  let nextTeamIndexForFieldPlayers = 0; // Indexul de la care începem distribuția jucătorilor de câmp

  // Pasul 1: Alocăm câte un portar fiecărei echipe, dacă este posibil
  for (let i = 0; i < goalkeepers.length && i < teamCount; i++) {
    const gk = goalkeepers[i];
    teams[i].players.push(gk);
    teams[i].totalGrade += gk.grade;
    nextTeamIndexForFieldPlayers = (i + 1) % teamCount; // Următoarea echipă pentru distribuție, circular
  }
  // --- Sfârșitul modificării ---

  // Pasul 2: Distribuim jucătorii de câmp rămași
  let currentTeamIndex = nextTeamIndexForFieldPlayers; // Pornim de la echipa următoare după ultimul portar
  let direction = 1;

  for (const player of sortedFieldPlayers) {
    // Verificăm dacă am atins numărul total de jucători necesari
    if (
      teams.reduce((sum, team) => sum + team.players.length, 0) >=
      totalPlayersNeeded
    ) {
      break;
    }

    let teamFound = false;
    let attempts = 0;
    const maxAttempts = teamCount * 2;

    while (!teamFound && attempts < maxAttempts) {
      const targetTeam = teams[currentTeamIndex];

      if (targetTeam && targetTeam.players.length < playersPerTeam) {
        targetTeam.players.push(player);
        targetTeam.totalGrade += player.grade;
        teamFound = true;
      }

      currentTeamIndex += direction;

      if (currentTeamIndex >= teamCount) {
        currentTeamIndex = teamCount - 1; // Rămânem la ultima echipă
        direction = -1; // Schimbăm direcția
      } else if (currentTeamIndex < 0) {
        currentTeamIndex = 0; // Rămânem la prima echipă
        direction = 1; // Schimbăm direcția
      }
      attempts++;
    }

    if (!teamFound) {
      console.warn(`Jucător de câmp ${player.full_name} nu a putut fi alocat.`);
    }
  }

  // Recalculează averageGrade pentru că jucătorii au fost adăugați
  teams.forEach((team) => {
    team.totalGrade = team.players.reduce(
      (sum, player) => sum + player.grade,
      0
    );
    if (team.players.length > 0) {
      team.averageGrade = team.totalGrade / team.players.length;
    } else {
      team.averageGrade = 0;
    }
  });

  return teams;
}
