import React from "react";
import type { Player } from "../../lib/types";

interface Props {
  selectedPlayers: Player[];
  teamCount: number;
  setTeamCount: React.Dispatch<React.SetStateAction<number>>;
  playersPerTeam: number;
  setPlayersPerTeam: React.Dispatch<React.SetStateAction<number>>;
  onGenerate: () => void;
}

const PlayerSelectionAndConfig: React.FC<Props> = ({
  selectedPlayers,
  teamCount,
  setTeamCount,
  playersPerTeam,
  setPlayersPerTeam,
  onGenerate,
}) => {
  const totalPlayersNeeded = teamCount * playersPerTeam;
  const canGenerate =
    selectedPlayers.length >= totalPlayersNeeded && totalPlayersNeeded > 0;

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">
        Configurează Echipele
      </h2>

      {/* Team configuration */}
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
            min="1"
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
            placeholder="ex: 6"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="text-sm text-center text-gray-600 mb-6">
        <span>
          Jucători selectați: <strong>{selectedPlayers.length}</strong> /{" "}
          <strong>{totalPlayersNeeded}</strong> necesari.
        </span>
      </div>

      {/* Generate button */}
      <button
        type="button"
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
          ? "🎲 Generează Echipe (Snake Draft)"
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
