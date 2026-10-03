import { useState, useCallback, useMemo } from "react";
import { Search, X, PlusCircle } from "lucide-react";
import type { EditablePlayerFields, Player, UserRole } from "../../lib/types";
import { normalizeSearchText } from "../../lib/normalizeSearchText";
import { usePlayerManagement } from "../../hooks/usePlayerManagement";
import { PlayerFormModal } from "./PlayerFormModal";
import { PlayerRow } from "./PlayerRow";
import { AlertDialog } from "../AlertDialog";

type PlayerFormData = EditablePlayerFields;

interface PlayerListProps {
  userRole: UserRole;
}

export const PlayerList: React.FC<PlayerListProps> = ({ userRole }) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const canManagePlayers = userRole === "admin" || userRole === "moderator";
  const canCreateOrDelete = userRole === "admin";

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

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm);
    if (!normalizedSearch) return players;

    return players.filter((player) =>
      [player.full_name, player.phone, player.email]
        .filter(Boolean)
        .some((value) =>
          normalizeSearchText(String(value)).includes(normalizedSearch),
        ),
    );
  }, [players, searchTerm]);

  if (loading && !players.length) {
    return (
      <p className="text-center text-text mt-10 text-xl">
        Se încarcă jucătorii...
      </p>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-2 sm:px-4 font-text">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <h1 className="text-3xl font-bold font-khand text-primary mb-0">
          Listă Jucători
        </h1>
        {canCreateOrDelete && (
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-primary text-on-primary hover:bg-secondary font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center justify-center transition-colors duration-150"
          >
            <PlusCircle size={20} className="mr-2" /> Adaugă Jucător
          </button>
        )}
      </div>

      {hookError && !isModalOpen && (
        <div className="status-error mb-4">{hookError}</div>
      )}
      {successMessage && (
        <div className="status-success mb-4">{successMessage}</div>
      )}

      {players.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Caută după nume, telefon sau email"
              aria-label="Caută jucători"
              className="input-shell py-2.5 pl-10 pr-10 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Șterge căutarea"
                title="Șterge căutarea"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-surface-muted hover:text-text"
              >
                <X size={17} />
              </button>
            )}
          </label>
          <span className="text-sm text-muted">
            {filteredPlayers.length} din {players.length} jucători
          </span>
        </div>
      )}

      {players.length === 0 && !loading ? (
        <p className="text-center text-muted mt-10 text-lg">
          Nu există jucători înregistrați.
        </p>
      ) : filteredPlayers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-4 py-10 text-center">
          <p className="text-lg font-medium text-text">
            Nu am găsit niciun jucător.
          </p>
          <p className="mt-1 text-sm text-muted">
            Încearcă un alt nume, telefon sau email.
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="mt-4 text-sm font-semibold text-primary underline underline-offset-2 hover:text-secondary"
          >
            Șterge căutarea
          </button>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full table-auto text-sm text-text max-md:block">
            <thead className="bg-surface-muted text-left text-blackAlt uppercase tracking-wider max-md:hidden">
              <tr>
                <th className="px-5 py-3">Nume Complet</th>
                {showGradeColumnInTable && <th className="px-5 py-3">Nivel</th>}
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 max-md:block max-md:divide-y-0 max-md:p-2">
              {filteredPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isExpanded={expandedRows.has(player.id)}
                  onToggleExpand={toggleRow}
                  onEdit={handleOpenModal}
                  onDelete={handleDeletePlayer}
                  canManage={canManagePlayers}
                  canDelete={canCreateOrDelete}
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
