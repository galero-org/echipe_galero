import React, { useState, Suspense } from "react";
import type { Player, Team, PlayerPreferences } from "../lib/types";
import PlayerSelectionAndConfig from "./players/PlayerSelectionAndConfig";
import GeneratedTeamsDisplay from "./GenerateTeamsDisplay";

import { generateTeams } from "../lib/teamService";

interface Props {
  allPlayers: Player[];
  editions: Array<{ id: string; numar_editie: number }>;
  registeredPlayerIdsByEdition: Record<string, string[]>;
}

// generateTeams încă acceptă un al 4-lea parametru de preferințe (perechi/separări),
// dar algoritmul de snake draft nu-l mai folosește — trimitem un obiect gol constant
// în loc să menținem state și UI pentru o funcționalitate inactivă.
const EMPTY_PREFERENCES: PlayerPreferences = { pairs: [], separations: [] };

const TeamOrchestrator: React.FC<Props> = ({
  allPlayers,
  editions,
  registeredPlayerIdsByEdition,
}) => {
  const [selectedEditionId, setSelectedEditionId] = useState(
    editions[0]?.id ?? "",
  );
  const [teamCount, setTeamCount] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [goalkeepersInSeparateTeams, setGoalkeepersInSeparateTeams] =
    useState(true);
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [showTeams, setShowTeams] = useState<boolean>(false);

  const selectedEdition = editions.find(
    (edition) => edition.id === selectedEditionId,
  );
  const registeredPlayerIds = new Set(
    registeredPlayerIdsByEdition[selectedEditionId] ?? [],
  );
  const selectedPlayers = allPlayers.filter((player) =>
    registeredPlayerIds.has(player.id),
  );

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
      { goalkeepersInSeparateTeams },
    );

    setGeneratedTeams(teams);
    setShowTeams(true);
  };

  return (
    <div>
      <div className="mb-6 max-w-sm">
        <label
          htmlFor="generation-edition"
          className="mb-2 block font-medium text-gray-700"
        >
          Alege ediția pentru generare:
        </label>
        <select
          id="generation-edition"
          value={selectedEditionId}
          onChange={(event) => {
            setSelectedEditionId(event.target.value);
            setGeneratedTeams([]);
            setShowTeams(false);
          }}
          disabled={editions.length === 0}
          className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editions.map((edition) => (
            <option key={edition.id} value={edition.id}>
              Ediția #{edition.numar_editie}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-600" role="status">
          {selectedPlayers.length === 0
            ? "Ediția selectată nu are jucători înscriși."
            : `${selectedPlayers.length} jucători înscriși`}
        </p>
      </div>

      <PlayerSelectionAndConfig
        selectedPlayers={selectedPlayers}
        teamCount={teamCount}
        setTeamCount={setTeamCount}
        playersPerTeam={playersPerTeam}
        setPlayersPerTeam={setPlayersPerTeam}
        goalkeepersInSeparateTeams={goalkeepersInSeparateTeams}
        setGoalkeepersInSeparateTeams={setGoalkeepersInSeparateTeams}
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
            numarEditie={selectedEdition?.numar_editie ?? 0}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TeamOrchestrator;
