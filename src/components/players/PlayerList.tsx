import { useState, useCallback, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import type { Player } from "../../lib/types";
import { usePlayerManagement } from "../../hooks/usePlayerManagement";
import { PlayerFormModal } from "./PlayerFormModal";
import { PlayerRow } from "./PlayerRow";
import { AlertDialog } from "../AlertDialog";

type PlayerFormData = Omit<Player, "id" | "created_at">;

export const PlayerList: React.FC = () => {
  const {
    players,
    loading,
    error: hookError,
    successMessage,
    addPlayer,
    updatePlayer,
    deletePlayer: hookDeletePlayer,
    clearMessages,
  } = usePlayerManagement();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  const showAppAlert = useCallback((message: string) => {
    setAlertDialog({ isOpen: true, message });
  }, []);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleOpenModal = useCallback(
    (player: Player | null = null) => {
      clearMessages();
      setEditingPlayer(player);
      setIsModalOpen(true);
    },
    [clearMessages],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPlayer(null);
  }, []);

  const handleSubmitPlayerForm = useCallback(
    async (playerData: PlayerFormData, editingPlayerId: string | null) => {
      clearMessages();

      const action = editingPlayerId
        ? updatePlayer(editingPlayerId, playerData)
        : addPlayer(playerData);

      const result = await action;
      return !!result;
    },
    [clearMessages, updatePlayer, addPlayer],
  );

  const handleDeletePlayer = useCallback(
    async (id: string) => {
      clearMessages();
      if (window.confirm("Ești sigur că vrei să ștergi acest jucător?")) {
        const success = await hookDeletePlayer(id);
        if (!success && hookError) {
          showAppAlert(hookError);
        }
      }
    },
    [clearMessages, hookDeletePlayer, hookError, showAppAlert],
  );

  const showGradeColumnInTable = useMemo(
    () => players.some((p) => p.grade !== undefined),
    [players],
  );

  if (loading && !players.length) {
    return (
      <p className="text-center text-text mt-10 text-xl">
        Se încarcă jucătorii...
      </p>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 p-4 font-text">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-khand text-primary">
          Listă Jucători
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-secondary font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-150"
        >
          <PlusCircle size={20} className="mr-2" /> Adaugă Jucător
        </button>
      </div>

      {hookError && !isModalOpen && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
          {hookError}
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
                {showGradeColumnInTable && <th className="px-5 py-3">Nivel</th>}
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isExpanded={expandedRows.has(player.id)}
                  onToggleExpand={toggleRow}
                  onEdit={handleOpenModal}
                  onDelete={handleDeletePlayer}
                  showGradeInRow={showGradeColumnInTable}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPlayerForm}
        editingPlayer={editingPlayer}
        formError={isModalOpen ? hookError : null}
      />

      {alertDialog.isOpen && (
        <AlertDialog
          title="Notificare"
          message={alertDialog.message}
          onClose={() => setAlertDialog({ isOpen: false, message: "" })}
          onConfirm={() => setAlertDialog({ isOpen: false, message: "" })}
        />
      )}
    </div>
  );
};

export default PlayerList;
