import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ConfirmationsDisplay } from "./ConfirmationDisplay";
import { AlertDialog } from "../AlertDialog";
import { EditionManager } from "../editii/EditionManager";
import { AddConfirmationForm } from "./AddConfirmationForm";
import { useConfirmations } from "../../hooks/useConfirmations";
import { usePlayersSimpleList } from "../../hooks/usePlayerSimpleList";
import type { Player, Registration } from "../../lib/types";

// --- Sub-components ---

const Toast: React.FC<{ message: string; onDismiss: () => void }> = ({
  message,
  onDismiss,
}) => (
  <div
    className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-5 py-3 rounded-lg shadow-xl animate-pulse flex items-center"
    role="alert"
  >
    <span>{message}</span>
    <button onClick={onDismiss} className="ml-4 font-bold text-lg leading-none">
      &times;
    </button>
  </div>
);

const ContentDisplay: React.FC<{
  loading: boolean;
  editionSelected: boolean;
  registrations: Registration[];
  editionNumber: number | "";
  location: string;
  onUpdateStatus: (id: string, status: Registration["status"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({
  loading,
  editionSelected,
  registrations,
  editionNumber,
  location,
  onUpdateStatus,
  onDelete,
}) => {
  if (!editionSelected) {
    return (
      <p className="text-center text-gray-500 text-lg mt-8 p-4 bg-white rounded-lg shadow">
        Selectează un număr de ediție pentru a vizualiza confirmările.
      </p>
    );
  }

  if (loading && registrations.length === 0) {
    return (
      <p className="text-center text-blue-600 text-lg mt-8 animate-pulse p-4 bg-white rounded-lg shadow">
        Se încarcă datele...
      </p>
    );
  }

  if (registrations.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg mt-4 p-4 bg-white rounded-lg shadow">
        Nu există confirmări pentru această ediție.
      </p>
    );
  }

  return (
    <ConfirmationsDisplay
      editionNumber={editionNumber as number}
      location={location}
      registrations={registrations}
      onUpdateStatus={onUpdateStatus}
      onDelete={onDelete}
    />
  );
};

// --- Main Component ---

interface ConfirmariListProps {
  initialEditionId?: string;
  canAddPlayer: boolean;
}

export const ConfirmariList: React.FC<ConfirmariListProps> = ({
  initialEditionId,
  canAddPlayer,
}) => {
  const [currentEditionId, setCurrentEditionId] = useState<number | "">(
    initialEditionId ? parseInt(initialEditionId, 10) : "",
  );
  const [editionDate, setEditionDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [location, setLocation] = useState<string>("Galero");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);

  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = usePlayersSimpleList();
  const [confirmationPlayers, setConfirmationPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setConfirmationPlayers(players);
  }, [players]);

  const {
    registrations,
    loading: confirmationsLoading,
    error: confirmationsError,
    fetchRegistrations,
    addConfirmation,
    updateConfirmationStatus: hookUpdateStatus,
    deleteConfirmation: hookDeleteConfirm,
  } = useConfirmations();

  // Helper for notifications
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Sync Errors
  useEffect(() => {
    if (playersError) showToast(playersError);
    if (confirmationsError) showToast(confirmationsError);
  }, [playersError, confirmationsError, showToast]);

  // Fetch registrations when edition changes
  useEffect(() => {
    if (currentEditionId !== "") {
      fetchRegistrations(currentEditionId);
    }
  }, [currentEditionId, fetchRegistrations]);

  // Calculate current enrollment count
  const activeRegistrationsCount = useMemo(() => {
    return registrations.filter((reg) => reg.status === "inscris").length;
  }, [registrations]);

  const handleAddConfirmationSubmit = useCallback(
    async (playerId: string, registeredAt: string, selectedPlayer: Player) => {
      if (currentEditionId === "") {
        showToast("Selectează o ediție înainte de a adăuga o confirmare.");
        return;
      }

      // Check if player is already in the list to prevent duplicates
      const isAlreadyAdded = registrations.some(
        (reg) => reg.players.id === playerId,
      );
      if (isAlreadyAdded) {
        showToast("Jucătorul este deja adăugat la această ediție.");
        return;
      }

      const status: Registration["status"] =
        activeRegistrationsCount >= 24 ? "rezerva" : "inscris";

      if (status === "rezerva") {
        showToast(
          `Locuri epuizate. Jucătorul a fost adăugat pe lista de rezervă.`,
        );
      }

      const newRegData = {
        status,
        registered_at: registeredAt ?? new Date().toISOString(),
        player_id: playerId,
        numar_editie: currentEditionId as number,
        players: selectedPlayer,
      };

      const added = await addConfirmation(newRegData);
      if (added) {
        showToast("Confirmare adăugată cu succes.");
      } else {
        showToast("Eroare la adăugarea confirmării.");
      }
    },
    [
      currentEditionId,
      registrations,
      activeRegistrationsCount,
      addConfirmation,
      showToast,
    ],
  );

  const handleQuickAddPlayer = useCallback(
    async (fullName: string): Promise<Player | null> => {
      try {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            grade: 5,
            position: "FIELD",
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Eroare la adăugarea jucătorului.");
        }

        const newPlayer: Player = { ...result, totalEditions: 0 };
        setConfirmationPlayers((currentPlayers) => [
          ...currentPlayers,
          newPlayer,
        ]);
        showToast("Jucător adăugat în listă.");
        return newPlayer;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : "Eroare la adăugarea jucătorului.",
        );
        return null;
      }
    },
    [showToast],
  );

  const handleUpdateRegStatus = useCallback(
    async (id: string, status: Registration["status"]) => {
      await hookUpdateStatus(id, status, new Date().toISOString());
    },
    [hookUpdateStatus],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRegId) return;
    await hookDeleteConfirm(deletingRegId);
    setDeletingRegId(null);
  }, [deletingRegId, hookDeleteConfirm]);

  const handleDeleteClick = useCallback(async (id: string) => {
    setDeletingRegId(id);
  }, []);

  const overallLoading =
    playersLoading || (confirmationsLoading && registrations.length === 0);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-4 font-inter">
      <EditionManager
        editionId={currentEditionId}
        onEditionIdChange={setCurrentEditionId}
        onNavigateToEdition={setCurrentEditionId}
        editionDate={editionDate}
        onEditionDateChange={setEditionDate}
        registrationsForPdf={registrations}
        disabled={overallLoading}
      />

      <AddConfirmationForm
        players={confirmationPlayers}
        onAddConfirmation={handleAddConfirmationSubmit}
        disabled={currentEditionId === "" || overallLoading}
        isLoading={confirmationsLoading}
        canAddPlayer={canAddPlayer}
        onQuickAddPlayer={handleQuickAddPlayer}
      />

      <ContentDisplay
        loading={overallLoading}
        editionSelected={currentEditionId !== ""}
        registrations={registrations}
        editionNumber={currentEditionId}
        location={location}
        onUpdateStatus={handleUpdateRegStatus}
        onDelete={handleDeleteClick}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {deletingRegId && (
        <AlertDialog
          title="Confirmare Ștergere"
          message="Ești sigur că vrei să ștergi această înregistrare?"
          onClose={() => setDeletingRegId(null)}
          onConfirm={handleConfirmDelete}
          confirmText="Da, șterge"
          cancelText="Anulează"
        />
      )}
    </div>
  );
};

export default ConfirmariList;
