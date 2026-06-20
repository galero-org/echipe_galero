import React, { useState, useEffect } from "react";
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
  const [preferences, setPreferences] = useState<PlayerPreferences>({
    pairs: [],
    separations: [],
  });

  // Auto-populate from registered players
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
      preferences,
    );

    setGeneratedTeams(teams);
    setShowTeams(true);
  };

  return (
    <div>
      <PlayerSelectionAndConfig
        allPlayers={allPlayers}
        selectedPlayers={selectedPlayers}
        setSelectedPlayers={setSelectedPlayers}
        teamCount={teamCount}
        setTeamCount={setTeamCount}
        playersPerTeam={playersPerTeam}
        setPlayersPerTeam={setPlayersPerTeam}
        onGenerate={handleGenerateTeams}
        edition_id={edition_id}
        preferences={preferences}
        setPreferences={setPreferences}
      />

      {showTeams && generatedTeams.length > 0 && (
        <GeneratedTeamsDisplay
          teams={generatedTeams}
          teamCount={teamCount}
          edition_id={edition_id}
          numarEditie={numarEditie}
          preferences={preferences}
          allPlayers={allPlayers}
        />
      )}
    </div>
  );
};

export default TeamOrchestrator;
