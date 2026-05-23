import type { Player, Team, PlayerPreferences } from "./types";

// ========================================================================
// Configurare
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
// Funcții Ajutătoare (Helpers)
// ========================================================================

/**
 * Amestecă un array pe loc folosind algoritmul Fisher-Yates.
 */
const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * Generează clase CSS de fallback.
 */
const generateFallbackCardClasses = (baseColor: string): string => {
  const colorName = baseColor.split("-")[1];
  return `bg-${colorName}-100 border-${colorName}-500 text-${colorName}-800`;
};

/**
 * Construiește Map-uri pentru căutare rapidă a preferințelor.
 * (Folosește player.id)
 */
interface PreferenceMaps {
  pairMap: Map<string, Set<string>>;
  separationMap: Map<string, Set<string>>;
}

const buildPreferenceMaps = (
  preferences: PlayerPreferences,
): PreferenceMaps => {
  const { pairs = [], separations = [] } = preferences;

  // Schimb: pairMap e acum Map<string, Set<string>> pentru a stoca TOATE perechele
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
 * (OPTIMIZARE) Verifică dacă un grup de jucători (1 sau 2)
 * poate fi adăugat într-o echipă, respectând regulile.
 * (Actualizat să folosească player.id)
 */
const canPlaceInTeam = (
  playersToPlace: Player[],
  targetTeam: Team,
  playersPerTeam: number,
  separationMap: Map<string, Set<string>>,
): boolean => {
  // 1. Verifică spațiul
  if (targetTeam.players.length + playersToPlace.length > playersPerTeam) {
    return false;
  }

  // 2. Verifică separările
  const teamPlayerIds = new Set(targetTeam.players.map((p) => p.id)); // <-- MODIFICAT

  for (const player of playersToPlace) {
    const forbiddenPartners = separationMap.get(player.id); // <-- MODIFICAT
    if (forbiddenPartners) {
      for (const forbiddenName of forbiddenPartners) {
        if (teamPlayerIds.has(forbiddenName)) {
          return false; // Conflict! Un jucător din echipă nu e dorit.
        }
      }
    }
  }

  return true; // Totul e ok
};

// ========================================================================
// Funcția Principală de Generare (Actualizată cu player.id)
// ========================================================================

export function generateTeams(
  selectedPlayers: Player[],
  teamCount: number,
  playersPerTeam: number,
  preferences: PlayerPreferences = {},
  randomizationLevel: number = 0,
): Team[] {
  if (
    !selectedPlayers ||
    selectedPlayers.length === 0 ||
    teamCount <= 0 ||
    playersPerTeam <= 0
  ) {
    return [];
  }

  // Normalizează randomizationLevel la 0-100
  const normalizedRandomization = Math.max(0, Math.min(100, randomizationLevel));

  const totalPlayersNeeded = teamCount * playersPerTeam;

  // --- 1. Validare și sortare inițială ---
  const goalkeepers = selectedPlayers.filter((p) => p.position === "GK");
  const fieldPlayers = selectedPlayers.filter((p) => p.position === "FIELD");

  if (goalkeepers.length < teamCount) {
    console.warn(
      `Avertisment: ${goalkeepers.length} portari, ${teamCount} echipe. Unele echipe nu vor avea portar.`,
    );
  }
  if (selectedPlayers.length < totalPlayersNeeded) {
    console.warn(
      `Deficit de jucători: ${selectedPlayers.length} selectați, ${totalPlayersNeeded} necesari.`,
    );
    // Nu oprim, dar vom umple cât putem
  }

  // --- 2. Crearea Echipelor (goale) ---
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

  // --- 3. Pregătirea listei de distribuție randomizate ---
  const sortedGoalkeepers = [...goalkeepers].sort((a, b) => b.grade - a.grade);

  const playersByGrade = new Map<number, Player[]>();
  for (const player of fieldPlayers) {
    if (!playersByGrade.has(player.grade)) {
      playersByGrade.set(player.grade, []);
    }
    playersByGrade.get(player.grade)!.push(player);
  }

  const sortedGrades = Array.from(playersByGrade.keys()).sort((a, b) => b - a);
  let playersToDistribute: Player[] = [];
  
  // Aplicăm randomizare bazată pe nivel
  if (normalizedRandomization === 0) {
    // 0%: Distribuție sistematică originală
    for (const grade of sortedGrades) {
      const players = playersByGrade.get(grade)!;
      playersToDistribute.push(...shuffle(players));
    }
  } else if (normalizedRandomization === 100) {
    // 100%: Shuffle complet
    playersToDistribute = shuffle(fieldPlayers);
  } else {
    // Parțial (ex: 50%): Mix de sistematic și random
    for (const grade of sortedGrades) {
      const players = playersByGrade.get(grade)!;
      const shuffledPlayers = shuffle([...players]);
      const randomCount = Math.ceil((shuffledPlayers.length * normalizedRandomization) / 100);
      
      // Ia randomCount jucători random din acest grad
      const randomFromGrade = shuffledPlayers.slice(0, randomCount);
      const systematicFromGrade = shuffledPlayers.slice(randomCount);
      
      // Adaugă întâi random, apoi sistematic
      playersToDistribute.push(...randomFromGrade);
      playersToDistribute.push(...systematicFromGrade);
    }
    
    // Amestecă puțin pentru a sparge pattern-ul sistematic
    const partialShuffle = Math.floor((playersToDistribute.length * normalizedRandomization) / 100);
    for (let i = 0; i < partialShuffle; i++) {
      const idx1 = Math.floor(Math.random() * playersToDistribute.length);
      const idx2 = Math.floor(Math.random() * playersToDistribute.length);
      [playersToDistribute[idx1], playersToDistribute[idx2]] = [playersToDistribute[idx2], playersToDistribute[idx1]];
    }
  }

  // --- 4. Procesarea Preferințelor (folosind noul helper) ---
  const { pairMap, separationMap } = buildPreferenceMaps(preferences);
  const placedPlayerIds = new Set<string>();

  // --- 5. Distribuția Jucătorilor ---

  // Pasul 5.1: Alocăm portarii
  for (let i = 0; i < sortedGoalkeepers.length && i < teamCount; i++) {
    const gk = sortedGoalkeepers[i];
    teams[i].players.push(gk);
    teams[i].totalGrade += gk.grade;
    placedPlayerIds.add(gk.id); // <-- MODIFICAT
  }

  // Filtrăm jucătorii rămași
  let playersRemaining = playersToDistribute.filter(
    (p) => !placedPlayerIds.has(p.id), // <-- MODIFICAT
  );

  let currentTeamIndex = Math.floor(Math.random() * teamCount);
  let direction = Math.random() < 0.5 ? 1 : -1;

  let totalPlacedPlayers = teams.reduce(
    (sum, team) => sum + team.players.length,
    0,
  );

  // Pasul 5.2: Distribuim jucătorii de câmp
  while (
    playersRemaining.length > 0 &&
    totalPlacedPlayers < totalPlayersNeeded
  ) {
    const player = playersRemaining.shift();
    if (!player) break;
    if (placedPlayerIds.has(player.id)) continue; // <-- MODIFICAT

    // Căutăm TOȚI partenerii (poate fi set gol, 1 sau mai mulți)
    const partnerIds = pairMap.get(player.id) || new Set<string>();

    // Căutăm toți partenerii în playersRemaining
    const partnersInRemaining = playersRemaining.filter((p) =>
      partnerIds.has(p.id),
    );

    // Dacă jucătorul e într-o pereche și partenerii sunt în remaining,
    // încerc să-i plasez pe toți
    const playersToPlace = [player, ...partnersInRemaining];

    let teamFound = false;
    let attempts = 0;
    const maxAttempts = teamCount * 3; // Măresc încercări

    while (!teamFound && attempts < maxAttempts) {
      const targetTeam = teams[currentTeamIndex];

      if (
        canPlaceInTeam(
          playersToPlace,
          targetTeam,
          playersPerTeam,
          separationMap,
        )
      ) {
        // Plasarea
        for (const p of playersToPlace) {
          targetTeam.players.push(p);
          targetTeam.totalGrade += p.grade;
          placedPlayerIds.add(p.id); // <-- MODIFICAT
        }
        totalPlacedPlayers += playersToPlace.length;

        // Scoatem din remaining toți partenerii care au fost plasat
        playersRemaining = playersRemaining.filter(
          (p) => !partnersInRemaining.some((partner) => partner.id === p.id),
        );

        teamFound = true;
      } else {
        // Avansăm la următoarea echipă (snake draft)
        currentTeamIndex += direction;
        if (currentTeamIndex >= teamCount) {
          currentTeamIndex = teamCount - 1;
          direction = -1;
        } else if (currentTeamIndex < 0) {
          currentTeamIndex = 0;
          direction = 1;
        }
        attempts++;
      }
    } // end while(!teamFound)

    if (!teamFound) {
      console.warn(
        `Jucătorul ${player.full_name} (și partenerii, dacă există) nu a putut fi alocat conform regulilor.`,
      );
      // Dacă e în pereche și nu găsim loc, punem înapoi pe toți
      if (partnersInRemaining.length > 0) {
        playersRemaining.push(player);
        playersRemaining.push(...partnersInRemaining);
      } else {
        // Dacă e singur și nu găsim loc, punem înapoi
        playersRemaining.push(player);
      }
    }

    // Actualizăm lista 'remaining'
    playersRemaining = playersRemaining.filter(
      (p) => !placedPlayerIds.has(p.id), // <-- MODIFICAT
    );
  }

  // --- 6. Calcul Final ---
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
// START: Codul Lipsă (Post-Procesare)
// ========================================================================

/**
 * Verifică dacă un schimb de jucători este "sigur" conform preferințelor.
 * (Folosește player.id)
 */
const canSwapPlayers = (
  playerA: Player,
  teamA: Team,
  playerB: Player,
  teamB: Team,
  { pairMap, separationMap }: PreferenceMaps,
): boolean => {
  // 1. Nu spargem o pereche - Nu schimbăm jucători care sunt parte dintr-o pereche
  if (pairMap.has(playerA.id) || pairMap.has(playerB.id)) {
    return false;
  }

  // 2. Nu schimbăm poziții (GK cu FIELD)
  if (playerA.position !== playerB.position) {
    return false;
  }

  // 3. Verificăm separările pentru playerA (care merge în teamB)
  const teamB_Ids = new Set(teamB.players.map((p) => p.id));
  teamB_Ids.delete(playerB.id); // Îl scoatem pe cel care pleacă
  const separationsA = separationMap.get(playerA.id);
  if (separationsA) {
    for (const forbiddenId of separationsA) {
      if (teamB_Ids.has(forbiddenId)) return false; // Conflict!
    }
  }

  // 4. Verificăm separările pentru playerB (care merge în teamA)
  const teamA_Ids = new Set(teamA.players.map((p) => p.id));
  teamA_Ids.delete(playerA.id); // Îl scoatem pe cel care pleacă
  const separationsB = separationMap.get(playerB.id);
  if (separationsB) {
    for (const forbiddenId of separationsB) {
      if (teamA_Ids.has(forbiddenId)) return false; // Conflict!
    }
  }

  return true; // Schimbul e sigur
};

/**
 * Încearcă să echilibreze echipele făcând schimburi de jucători.
 */
export function balanceTeamsPostProcess(
  teams: Team[],
  preferences: PlayerPreferences,
  maxIterations: number = 20,
  tolerance: number = 1,
): Team[] {
  // Dacă nu avem ce echilibra, returnăm
  if (teams.length < 2) return teams;

  const { pairMap, separationMap } = buildPreferenceMaps(preferences);
  const prefMaps = { pairMap, separationMap };

  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Găsește echipa cea mai slabă și cea mai puternică
    // Sortăm echipele după nota totală, de la cea mai slabă la cea mai puternică
    teams.sort((a, b) => a.totalGrade - b.totalGrade);

    const weakestTeam = teams[0];
    const strongestTeam = teams[teams.length - 1];

    const currentDiff = strongestTeam.totalGrade - weakestTeam.totalGrade;

    // 2. Verifică dacă suntem suficient de echilibrați
    if (currentDiff <= tolerance) {
      break; // Gata. Echipele sunt echilibrate.
    }

    let bestSwap: { pStrong: Player; pWeak: Player; newDiff: number } | null =
      null;

    // 3. Caută cel mai bun schimb posibil
    for (const pStrong of strongestTeam.players) {
      for (const pWeak of weakestTeam.players) {
        // Verificăm dacă pStrong e mai bun ca pWeak (schimbul are sens)
        if (pStrong.grade <= pWeak.grade) {
          continue;
        }

        // 3.1 Verifică dacă schimbul e permis
        if (
          !canSwapPlayers(pStrong, strongestTeam, pWeak, weakestTeam, prefMaps)
        ) {
          continue;
        }

        // 3.2 Calculează noul scor
        const newStrongGrade =
          strongestTeam.totalGrade - pStrong.grade + pWeak.grade;
        const newWeakGrade =
          weakestTeam.totalGrade - pWeak.grade + pStrong.grade;
        const newDiff = Math.abs(newStrongGrade - newWeakGrade);

        // 3.3 Verifică dacă acest schimb îmbunătățește situația
        if (newDiff < currentDiff) {
          if (!bestSwap || newDiff < bestSwap.newDiff) {
            bestSwap = { pStrong, pWeak, newDiff };
          }
        }
      }
    }

    // 4. Execută cel mai bun schimb găsit
    if (bestSwap) {
      const { pStrong, pWeak } = bestSwap;

      // Scoate jucătorii
      strongestTeam.players = strongestTeam.players.filter(
        (p) => p.id !== pStrong.id,
      );
      weakestTeam.players = weakestTeam.players.filter(
        (p) => p.id !== pWeak.id,
      );

      // Adaugă jucătorii
      strongestTeam.players.push(pWeak);
      weakestTeam.players.push(pStrong);

      // Recalculează notele
      strongestTeam.totalGrade =
        strongestTeam.totalGrade - pStrong.grade + pWeak.grade;
      weakestTeam.totalGrade =
        weakestTeam.totalGrade - pWeak.grade + pStrong.grade;
    } else {
      // Nu s-a găsit niciun schimb util. Oprește-te.
      break;
    }
  } // end for iterations

  // Recalculăm media la final
  teams.forEach((team) => {
    team.averageGrade =
      team.players.length > 0 ? team.totalGrade / team.players.length : 0;
  });

  return teams;
}
// ========================================================================
// END: Codul Lipsă
// ========================================================================
