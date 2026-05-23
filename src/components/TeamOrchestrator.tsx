import React, { useState, useEffect } from "react";
import type { Player, Team, PlayerPreferences } from "../lib/types";
import PlayerSelectionAndConfig from "./players/PlayerSelectionAndConfig";
import GeneratedTeamsDisplay from "./GenerateTeamsDisplay";
import { generateTeams, balanceTeamsPostProcess } from "../lib/teamService";

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

  // --- Setările noi pentru preferințe și echilibrare ---
  const [preferences, setPreferences] = useState<PlayerPreferences>({
    pairs: [],
    separations: [],
  });
  const [balanceTolerance, setBalanceTolerance] = useState<number>(1);
  const [balanceIterations, setBalanceIterations] = useState<number>(20);
  const [randomizationLevel, setRandomizationLevel] = useState<number>(0);

  // --- Logica de preselecție (din ediția anterioară) ---
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
        `Nu sunt suficienți jucători selectați (${selectedPlayers.length}) pentru ${teamCount} echipe a câte ${playersPerTeam} jucători (${totalPlayersNeeded} necesari).`,
      );
      return;
    }

    // Pasul 1: Generare inițială
    const initialTeams = generateTeams(
      selectedPlayers,
      teamCount,
      playersPerTeam,
      preferences,
      randomizationLevel,
    );

    // Pasul 2: Post-procesare
    const balancedTeams = balanceTeamsPostProcess(
      initialTeams,
      preferences,
      balanceIterations,
      balanceTolerance,
    );

    setGeneratedTeams(balancedTeams);
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
        // --- Props noi pentru configurare ---
        preferences={preferences}
        setPreferences={setPreferences}
        balanceTolerance={balanceTolerance}
        setBalanceTolerance={setBalanceTolerance}
        balanceIterations={balanceIterations}
        setBalanceIterations={setBalanceIterations}
        randomizationLevel={randomizationLevel}
        setRandomizationLevel={setRandomizationLevel}
      />

      {showTeams && generatedTeams.length > 0 && (
        <GeneratedTeamsDisplay
          teams={generatedTeams}
          teamCount={teamCount}
          edition_id={edition_id}
          numarEditie={numarEditie}
          preferences={preferences} // <-- Trimitem preferințele
          allPlayers={allPlayers} // <-- Trimitem toți jucătorii (pentru nume)
        />
      )}
    </div>
  );
};

export default TeamOrchestrator;
