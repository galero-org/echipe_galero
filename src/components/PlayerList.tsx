import React, { useEffect, useState, type FormEvent } from "react";
import { Edit2, Trash2, PlusCircle, X } from "lucide-react"; // Icons
import type { Player } from "../lib/types";

const initialPlayerFormData: Omit<Player, "id" | "created_at"> = {
  full_name: "",
  grade: 5,
};

export const PlayerList: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null); // If null, it's an "add" modal
  const [playerFormData, setPlayerFormData] = useState<
    Omit<Player, "id" | "created_at">
  >(initialPlayerFormData);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const displayMessage = (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    message: string
  ) => {
    setter(message);
    setTimeout(() => setter(null), 3000);
  };

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Failed to fetch players:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch players. Check console."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (player: Player | null = null) => {
    setError(null); // Clear previous errors
    setSuccessMessage(null);
    if (player) {
      setEditingPlayer(player);
      setPlayerFormData({
        full_name: player.full_name,
        birthdate: player.birthdate ? player.birthdate.split("T")[0] : "", // Format for input type="date"
        grade: player.grade,
      });
    } else {
      setEditingPlayer(null);
      setPlayerFormData(initialPlayerFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setPlayerFormData(initialPlayerFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setPlayerFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmitPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!playerFormData.full_name.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    setSuccessMessage(null);

    const payload = { ...playerFormData };
    // Ensure empty strings are not sent for optional fields if backend expects null/undefined
    if (payload.email === "") delete payload.email;
    if (payload.phone === "") delete payload.phone;
    if (payload.birthdate === "") delete payload.birthdate;
    if (payload.grade === undefined) delete payload.grade;

    try {
      let response;
      if (editingPlayer) {
        // Update existing player
        response = await fetch(`/api/players/${editingPlayer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok)
          throw new Error(`Failed to update player: ${response.statusText}`);
        displayMessage(setSuccessMessage, "Player updated successfully!");
      } else {
        // Add new player
        response = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok)
          throw new Error(`Failed to add player: ${response.statusText}`);
        displayMessage(setSuccessMessage, "Player added successfully!");
      }
      handleCloseModal();
      fetchPlayers(); // Re-fetch players
    } catch (err) {
      console.error("Failed to save player:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save player. Check console."
      );
    }
  };

  const deletePlayer = async (id: string) => {
    if (window.confirm("Ești sigur că vrei să ștergi acest jucător?")) {
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await fetch(`/api/players/${id}`, {
          method: "DELETE",
        });
        if (!response.ok)
          throw new Error(`Failed to delete player: ${response.statusText}`);
        displayMessage(setSuccessMessage, "Player deleted successfully!");
        fetchPlayers(); // Re-fetch after deleting player
      } catch (err) {
        console.error("Failed to delete player:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete player. Check console."
        );
      }
    }
  };

  if (loading && !players.length) {
    // Show loading only on initial load or if players array is empty
    return (
      <p className="text-center text-text mt-10 text-xl">
        Se încarcă jucătorii...
      </p>
    );
  }

  // Determine which optional columns to show
  const showEmail = players.some((p) => p.email);
  const showPhone = players.some((p) => p.phone);
  const showBirthdate = players.some((p) => p.birthdate);
  const showGrade = players.some((p) => p.grade !== undefined);
  const showCreatedAt = players.some((p) => p.created_at);

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 p-4 font-text">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-khand text-primary">
          Listă Jucători
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-secondary text-blue font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-150"
        >
          <PlusCircle size={20} className="mr-2" />
          Adaugă Jucător
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded">
          {successMessage}
        </div>
      )}

      {players.length === 0 && !loading ? (
        <p className="text-center text-gray-500 mt-10 text-lg">
          Nu există jucători înregistrați.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow-xl overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-text">
            <thead className="bg-grayLight text-left text-blackAlt uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Nume Complet</th>
                {showGrade && <th className="px-5 py-3">Nivel</th>}
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => {
                const isExpanded = expandedRows.has(player.id);
                return (
                  <React.Fragment key={player.id}>
                    <tr className="hover:bg-gray-50 transition-colors duration-100">
                      <td className="px-5 py-4 font-medium text-blackAlt">
                        {player.full_name}
                      </td>
                      {showGrade && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          {player.grade !== undefined ? player.grade : "—"}
                        </td>
                      )}
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => toggleRow(player.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? "Ascunde detalii" : "Arată detalii"}
                        </button>
                        <button
                          onClick={() => handleOpenModal(player)}
                          className="text-accent hover:text-primary p-1"
                          title="Editează"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deletePlayer(player.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Șterge"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td
                          colSpan={5}
                          className="px-5 py-4 text-sm text-gray-700"
                        >
                          <div>
                            <strong>Email:</strong> {player.email || "—"}
                          </div>
                          <div>
                            <strong>Telefon:</strong> {player.phone || "—"}
                          </div>
                          <div>
                            <strong>Data Nașterii:</strong>{" "}
                            {player.birthdate
                              ? new Date(player.birthdate).toLocaleDateString()
                              : "—"}
                          </div>
                          <div>
                            <strong>Înregistrat La:</strong>{" "}
                            {player.created_at
                              ? new Date(player.created_at).toLocaleDateString()
                              : "—"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Player */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blackAlt bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-khand text-primary">
                {editingPlayer ? "Modifică Jucător" : "Adaugă Jucător Nou"}
              </h2>
              <button
                type="button"
                title="edit player"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 border border-red-300 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitPlayer}>
              <div className="mb-4">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-text mb-1"
                >
                  Nume Complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={playerFormData.full_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={playerFormData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-text mb-1"
                >
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={playerFormData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="birthdate"
                  className="block text-sm font-medium text-text mb-1"
                >
                  Data Nașterii
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={playerFormData.birthdate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="grade"
                  className="block text-sm font-medium text-text mb-1"
                >
                  Nivel (1-10)
                </label>
                <input
                  type="number"
                  id="grade"
                  name="grade"
                  min="1"
                  max="10"
                  step="0.1"
                  value={
                    playerFormData.grade === undefined
                      ? ""
                      : playerFormData.grade
                  }
                  onChange={handleInputChange}
                  className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-md"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-blue-800 bg-primary hover:bg-secondary rounded-md shadow-sm"
                >
                  {editingPlayer ? "Salvează Modificări" : "Adaugă Jucător"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
