import React, { useState } from "react";
import type { Player } from "../lib/types";

interface Props {
  allPlayers: Player[];
  selectedPlayers: Player[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teamCount: number;
  setTeamCount: React.Dispatch<React.SetStateAction<number>>;
  playersPerTeam: number;
  setPlayersPerTeam: React.Dispatch<React.SetStateAction<number>>;
  onGenerate: () => void;
  edition_id: number;
}

const PlayerSelectionAndConfig: React.FC<Props> = ({
  allPlayers,
  selectedPlayers,
  setSelectedPlayers,
  teamCount,
  setTeamCount,
  playersPerTeam,
  setPlayersPerTeam,
  onGenerate,
  edition_id,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayers((prevSelected) =>
      prevSelected.find((p) => p.id === player.id)
        ? prevSelected.filter((p) => p.id !== player.id)
        : [...prevSelected, player]
    );
  };

  const filteredPlayers = allPlayers.filter((player) =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlayersNeeded = teamCount * playersPerTeam;
  const canGenerate =
    selectedPlayers.length >= totalPlayersNeeded && totalPlayersNeeded > 0;

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">
        1. Configurează și Selectează Jucătorii
      </h2>

      {/* Setări Număr Echipe și Jucători/Echipă */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label
            htmlFor="team-count"
            className="block mb-2 font-medium text-gray-700"
          >
            Număr Echipe:
          </label>
          <select
            id="team-count"
            value={teamCount}
            onChange={(e) => setTeamCount(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num} echipe
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="players-per-team"
            className="block mb-2 font-medium text-gray-700"
          >
            Jucători / Echipă:
          </label>
          <input
            type="number"
            id="players-per-team"
            min="4" // Să zicem minim 1, dar realist ar fi mai mult
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
            placeholder="ex: 6"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Jucători selectați: {selectedPlayers.length} / {totalPlayersNeeded}{" "}
        necesari.
      </p>

      {/* Selecție Jucători */}
      <div className="mb-6">
        <label
          htmlFor="search-player"
          className="block mb-2 font-medium text-gray-700"
        >
          Caută Jucător:
        </label>
        <input
          type="text"
          id="search-player"
          placeholder="Nume jucător..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-4"
        />
        <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-md p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className={`p-3 border rounded-md cursor-pointer transition-all duration-150 ease-in-out
                  ${
                    selectedPlayers.find((p) => p.id === player.id)
                      ? "bg-blue-500 text-white ring-2 ring-blue-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                onClick={() => handlePlayerToggle(player)}
              >
                <p className="font-medium">{player.full_name}</p>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Niciun jucător găsit.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Total jucători disponibili: {allPlayers.length}
        </p>
      </div>

      {/* Buton Generare */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white 
                    ${
                      canGenerate
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
      >
        {canGenerate
          ? "🎲 Generează Echipe"
          : `Selectează ${
              totalPlayersNeeded - selectedPlayers.length
            } jucători`}
      </button>
      {!canGenerate &&
        selectedPlayers.length > 0 &&
        selectedPlayers.length < totalPlayersNeeded && (
          <p className="text-red-500 text-sm mt-2 text-center">
            Mai trebuie selectați {totalPlayersNeeded - selectedPlayers.length}{" "}
            jucători pentru configurația curentă.
          </p>
        )}
      {!canGenerate && totalPlayersNeeded <= 0 && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Numărul de jucători per echipă trebuie să fie mai mare ca 0.
        </p>
      )}
    </div>
  );
};

export default PlayerSelectionAndConfig;
