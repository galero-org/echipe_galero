import React, { useState, useEffect, Suspense, lazy } from "react";
import type { Player, Team, PlayerPreferences } from "../lib/types";
import PlayerSelectionAndConfig from "./players/PlayerSelectionAndConfig";
import GeneratedTeamsDisplay from "./GenerateTeamsDisplay";

import { generateTeams } from "../lib/teamService";

interface Props {
  allPlayers: Player[];
  registeredPlayerIds: string[];
  edition_id: string;
  numarEditie?: number;
}

// generateTeams încă acceptă un al 4-lea parametru de preferințe (perechi/separări),
// dar algoritmul de snake draft nu-l mai folosește — trimitem un obiect gol constant
// în loc să menținem state și UI pentru o funcționalitate inactivă.
const EMPTY_PREFERENCES: PlayerPreferences = { pairs: [], separations: [] };

const TeamOrchestrator: React.FC<Props> = ({
  allPlayers,
  registeredPlayerIds,
  edition_id,
  numarEditie = 0,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [teamCount, setTeamCount] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [showTeams, setShowTeams] = useState<boolean>(false);

  // Jucătorii sunt preselectați automat din lista celor înregistrați la ediția curentă.
  useEffect(() => {
    const registered = allPlayers.filter((p) =>
      registeredPlayerIds.includes(p.id),
    );
    setSelectedPlayers(registered);
  }, [allPlayers, registeredPlayerIds]);

  const handleGenerateTeams = () => {
    const totalPlayersNeeded = teamCount * playersPerTeam;
    if (selectedPlayers.length < totalPlayersNeeded) {
      alert(
        `Not enough players selected (${selectedPlayers.length}) for ${teamCount} teams of ${playersPerTeam} players (${totalPlayersNeeded} needed).`,
      );
      return;
    }

    // Generate teams using snake draft algorithm
    const teams = generateTeams(
      selectedPlayers,
      teamCount,
      playersPerTeam,
      EMPTY_PREFERENCES,
    );

    setGeneratedTeams(teams);
    setShowTeams(true);
  };

  return (
    <div>
      <PlayerSelectionAndConfig
        selectedPlayers={selectedPlayers}
        teamCount={teamCount}
        setTeamCount={setTeamCount}
        playersPerTeam={playersPerTeam}
        setPlayersPerTeam={setPlayersPerTeam}
        onGenerate={handleGenerateTeams}
      />

      {showTeams && generatedTeams.length > 0 && (
        <Suspense
          fallback={
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Se pregătește vizualizarea echipelor...
            </div>
          }
        >
          <GeneratedTeamsDisplay
            teams={generatedTeams}
            teamCount={teamCount}
            edition_id={edition_id}
            numarEditie={numarEditie}
            playersPerTeam={playersPerTeam}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TeamOrchestrator;
