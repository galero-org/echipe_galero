import React, { useState } from "react";
import type { Player, PlayerPreferences } from "../../lib/types";

interface Props {
  allPlayers: Player[];
  selectedPlayers: Player[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teamCount: number;
  setTeamCount: React.Dispatch<React.SetStateAction<number>>;
  playersPerTeam: number;
  setPlayersPerTeam: React.Dispatch<React.SetStateAction<number>>;
  onGenerate: () => void;
  edition_id: string;
  preferences: PlayerPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<PlayerPreferences>>;
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
  preferences,
  setPreferences,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [p3, setP3] = useState<string>("");

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayers((prevSelected) =>
      prevSelected.find((p) => p.id === player.id)
        ? prevSelected.filter((p) => p.id !== player.id)
        : [...prevSelected, player],
    );
  };

  const filteredPlayers = allPlayers.filter((player) =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPlayersNeeded = teamCount * playersPerTeam;
  const canGenerate =
    selectedPlayers.length >= totalPlayersNeeded && totalPlayersNeeded > 0;

  const getPlayerName = (id: string): string => {
    return selectedPlayers.find((p) => p.id === id)?.full_name || "N/A";
  };

  const resetDropdowns = () => {
    setP1("");
    setP2("");
    setP3("");
  };

  const handleAddPair = () => {
    if (!p1 || !p2 || p1 === p2) return;

    if (p3 && p3 !== p1 && p3 !== p2) {
      const pairs: [string, string][] = [
        [p1, p2],
        [p2, p3],
        [p1, p3],
      ];
      setPreferences((prev) => ({
        ...prev,
        pairs: [...(prev.pairs || []), ...pairs],
      }));
      resetDropdowns();
      return;
    }

    const newPair: [string, string] = [p1, p2];
    setPreferences((prev) => ({
      ...prev,
      pairs: [...(prev.pairs || []), newPair],
    }));
    resetDropdowns();
  };

  const handleAddSeparation = () => {
    if (!p1 || !p2 || p1 === p2) return;
    const newSeparation: [string, string] = [p1, p2];
    setPreferences((prev) => ({
      ...prev,
      separations: [...(prev.separations || []), newSeparation],
    }));
    resetDropdowns();
  };

  const handleRemovePair = (indexToRemove: number) => {
    setPreferences((prev) => ({
      ...prev,
      pairs: prev.pairs?.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleRemoveSeparation = (indexToRemove: number) => {
    setPreferences((prev) => ({
      ...prev,
      separations: prev.separations?.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };

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
      <p className="text-sm text-center text-gray-600 mb-6">
        Jucători selectați: <strong>{selectedPlayers.length}</strong> /{" "}
        <strong>{totalPlayersNeeded}</strong> necesari.
      </p>

      {/* Preferences section */}
      <div className="mb-6 p-4 bg-white rounded-md shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Preferințe (opțional)
        </h3>

        <div className="grid md:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label
              htmlFor="player1"
              className="block text-sm font-medium text-gray-700"
            >
              Jucător 1
            </label>
            <select
              id="player1"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={selectedPlayers.length === 0}
            >
              <option value="">Alege jucător...</option>
              {selectedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="player2"
              className="block text-sm font-medium text-gray-700"
            >
              Jucător 2
            </label>
            <select
              id="player2"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={!p1}
            >
              <option value="">Alege jucător...</option>
              {selectedPlayers
                .filter((p) => p.id !== p1)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="player3"
              className="block text-sm font-medium text-gray-700"
            >
              Jucător 3 (opțional)
            </label>
            <select
              id="player3"
              value={p3}
              onChange={(e) => setP3(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={!p2}
            >
              <option value="">Niciun 3-lea...</option>
              {selectedPlayers
                .filter((p) => p.id !== p1 && p.id !== p2)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleAddPair}
            disabled={!p1 || !p2}
            className="flex-1 py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {p3 ? `Vreau toți 3 împreună` : `Vreau împreună`}
          </button>
          <button
            onClick={handleAddSeparation}
            disabled={!p1 || !p2}
            className="flex-1 py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
          >
            Vreau separat
          </button>
        </div>

        {(preferences.pairs?.length || 0) > 0 ||
        (preferences.separations?.length || 0) > 0 ? (
          <div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-600">Perechi dorite:</h4>
                <ul className="list-disc list-inside text-sm">
                  {preferences.pairs?.map(([id1, id2], i) => (
                    <li key={`pair-${i}`} className="text-blue-700">
                      {getPlayerName(id1)} + {getPlayerName(id2)}
                      <button
                        onClick={() => handleRemovePair(i)}
                        className="ml-2 text-red-500 font-bold"
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-600">Separări dorite:</h4>
                <ul className="list-disc list-inside text-sm">
                  {preferences.separations?.map(([id1, id2], i) => (
                    <li key={`sep-${i}`} className="text-red-700">
                      {getPlayerName(id1)} ≠ {getPlayerName(id2)}
                      <button
                        onClick={() => handleRemoveSeparation(i)}
                        className="ml-2 text-red-500 font-bold"
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Player selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Selectează Jucătorii
        </h3>
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
                <p className="text-xs">
                  {player.position} - {player.grade}
                </p>
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

      {/* Generate button */}
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
