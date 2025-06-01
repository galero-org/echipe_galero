import type { Player, Team } from "./types";

// Numele și culorile prioritare pentru primele echipe

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

// Culori de rezervă dacă sunt mai mult de 4 echipe

const fallbackTeamBaseColors = [
  "bg-pink-500",

  "bg-purple-500",

  "bg-indigo-500",

  "bg-teal-500",

  "bg-cyan-500",

  "bg-lime-500",

  "bg-emerald-500",

  "bg-red-500", // Am pus roșu la final, ca alternativă
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

  if (selectedPlayers.length < totalPlayersNeeded) {
    console.warn(
      `Deficit de jucători: ${selectedPlayers.length} selectați, ${totalPlayersNeeded} necesari. Ajustează selecția sau configurația.`
    ); // Este important ca UI-ul să prevină această situație. // Dacă totuși se ajunge aici, echipele generate pot fi incomplete sau mai puține. // Pentru simplitate, aici vom returna un array gol dacă nu sunt suficienți jucători.

    return [];
  }

  let sortedPlayers = [...selectedPlayers].sort((a, b) => b.grade - a.grade);

  const playersForDistribution = sortedPlayers.slice(0, totalPlayersNeeded);

  const teams: Team[] = Array.from({ length: teamCount }, (_, i) => {
    let teamName: string;

    let teamColorClasses: string;

    if (i < priorityTeamsConfig.length) {
      teamName = priorityTeamsConfig[i].name;

      teamColorClasses = priorityTeamsConfig[i].cardClasses;
    } else {
      // Pentru echipele suplimentare (peste 4)

      const fallbackIndex = i - priorityTeamsConfig.length;

      const baseColor =
        fallbackTeamBaseColors[fallbackIndex % fallbackTeamBaseColors.length];

      teamName = `Echipa ${i + 1}`; // Sau poți folosi numele culorii de bază dacă preferi

      teamColorClasses = generateFallbackCardClasses(baseColor);
    }

    return {
      name: teamName, // Numele va fi "Verde", "Albastru", etc. sau "Echipa 5"

      players: [],

      totalGrade: 0,

      averageGrade: 0,

      color: teamColorClasses, // Clasele pentru card (ex: "bg-green-100 border-green-500 text-green-800")
    };
  });

  for (let i = 0; i < playersForDistribution.length; i++) {
    const player = playersForDistribution[i];

    const round = Math.floor(i / teamCount);

    let teamIndex: number;

    if (round % 2 === 0) {
      teamIndex = i % teamCount;
    } else {
      teamIndex = teamCount - 1 - (i % teamCount);
    }

    if (teams[teamIndex] && teams[teamIndex].players.length < playersPerTeam) {
      teams[teamIndex].players.push(player);
    } else {
      const availableTeam = teams.find(
        (t) => t.players.length < playersPerTeam
      );

      if (availableTeam) {
        availableTeam.players.push(player);
      } else {
        console.warn("Jucător rămas fără echipă, deși nu ar trebui:", player);
      }
    }
  }

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
