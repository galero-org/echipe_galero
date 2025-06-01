import React, { useState, useEffect } from "react";
import type { Player, Team } from "../lib/types"; // Asigură-te că ai aceste tipuri definite
import PlayerSelectionAndConfig from "./PlayerSelectionAndConfig";
import GeneratedTeamsDisplay from "./GenerateTeamsDisplay";
import { generateTeams } from "../lib/teamService"; // Presupunem că această funcție există și funcționează

interface Props {
  allPlayers: Player[];
  registeredPlayerIds: string[];
  edition_id: number;
}

const TeamOrchestrator: React.FC<Props> = ({
  allPlayers,
  registeredPlayerIds,
  edition_id,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [teamCount, setTeamCount] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [showTeams, setShowTeams] = useState<boolean>(false);

  // Opțional: resetează echipele generate dacă se schimbă jucătorii sau configurația
  useEffect(() => {
    const registered = allPlayers.filter((p) =>
      registeredPlayerIds.includes(p.id)
    );
    setSelectedPlayers(registered);
  }, [allPlayers, registeredPlayerIds]);

  const handleGenerateTeams = () => {
    if (selectedPlayers.length === 0) {
      alert("Te rog selectează cel puțin un jucător.");
      return;
    }

    const totalPlayersNeeded = teamCount * playersPerTeam;
    if (selectedPlayers.length < totalPlayersNeeded) {
      alert(
        `Nu sunt suficienți jucători selectați (${selectedPlayers.length}) pentru a forma ${teamCount} echipe a câte ${playersPerTeam} jucători (${totalPlayersNeeded} necesari). Consideră toți jucătorii selectați?`
      );
      // Aici poți decide să continui cu toți jucătorii selectați și să ajustezi playersPerTeam sau teamCount,
      // sau să oprești generarea. Pentru simplitate, vom continua cu ce se poate.
      // Sau, mai bine, să validăm înainte.
    }

    // Asigură-te că ai suficienți jucători pentru numărul de echipe și jucători/echipă
    // Această logică poate fi rafinată în funcția `generateTeams` sau aici.
    // Exemplul original sorta și tăia, ceea ce e o abordare.
    // O altă abordare ar fi să se asigure că `selectedPlayers` sunt cei care intră în calcul.

    const teams = generateTeams(selectedPlayers, teamCount, playersPerTeam); // Modificăm `generateTeams` să accepte și `playersPerTeam`
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
      />

      {showTeams && generatedTeams.length > 0 && (
        <GeneratedTeamsDisplay
          teams={generatedTeams}
          teamCount={teamCount}
          edition_id={edition_id}
        />
      )}
    </div>
  );
};

export default TeamOrchestrator;
