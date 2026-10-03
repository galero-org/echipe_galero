import { useState, useEffect, useCallback } from "react";
import type { EditablePlayerFields, Player } from "../lib/types";

type PlayerFormData = EditablePlayerFields;

interface UsePlayerManagementReturn {
  players: Player[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchPlayers: () => Promise<void>;
  addPlayer: (playerData: PlayerFormData) => Promise<Player | null>;
  updatePlayer: (
    id: string,
    playerData: PlayerFormData,
  ) => Promise<Player | null>;
  deletePlayer: (id: string) => Promise<boolean>;
  clearMessages: () => void;
}

const API_URL_PLAYERS = "/api/players";

export const usePlayerManagement = (): UsePlayerManagementReturn => {
  const [players, setPlayers] = useState<Player[]>([]); //
  const [loading, setLoading] = useState(true); //
  const [error, setError] = useState<string | null>(null); //
  const [successMessage, setSuccessMessage] = useState<string | null>(null); //

  const displayTempMessage = (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    message: string,
  ) => {
    //
    setter(message); //
    setTimeout(() => setter(null), 3000); //
  };

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const fetchPlayers = useCallback(async () => {
    //
    setLoading(true); //
    clearMessages();
    try {
      const res = await fetch(API_URL_PLAYERS); //
      if (!res.ok) throw new Error(`Eroare API: ${res.statusText}`); //
      const data = await res.json(); //
      setPlayers(data.sort((a: Player, b: Player) => b.grade - a.grade)); // Sortează la preluare
    } catch (err) {
      //
      console.error("Eroare la preluarea jucătorilor:", err); //
      setError(
        err instanceof Error ? err.message : "Eroare la preluarea jucătorilor.",
      ); //
    } finally {
      setLoading(false); //
    }
  }, [clearMessages]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = async (playerData: PlayerFormData) => {
    //
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(API_URL_PLAYERS, {
        //
        method: "POST", //
        headers: { "Content-Type": "application/json" }, //
        body: JSON.stringify(playerData), //
      });
      if (!response.ok)
        throw new Error(
          `Eroare la adăugarea jucătorului: ${response.statusText}`,
        ); //
      const newPlayer = await response.json(); //
      setPlayers((prev) =>
        [...prev, newPlayer].sort((a, b) => b.grade - a.grade),
      );
      displayTempMessage(setSuccessMessage, "Jucător adăugat cu succes!"); //
      return newPlayer;
    } catch (err) {
      //
      console.error("Eroare la adăugarea jucătorului:", err); //
      setError(
        err instanceof Error ? err.message : "Eroare la adăugarea jucătorului.",
      ); //
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePlayer = async (id: string, playerData: PlayerFormData) => {
    //
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(`${API_URL_PLAYERS}/${id}`, {
        // Folosește endpoint-ul dinamic
        method: "PUT", //
        headers: { "Content-Type": "application/json" }, //
        body: JSON.stringify(playerData), //
      });
      if (!response.ok)
        throw new Error(
          `Eroare la actualizarea jucătorului: ${response.statusText}`,
        ); //
      const updatedPlayer = await response.json(); //
      setPlayers((prev) =>
        prev
          .map((p) => (p.id === id ? updatedPlayer : p))
          .sort((a, b) => b.grade - a.grade),
      );
      displayTempMessage(setSuccessMessage, "Jucător actualizat cu succes!"); //
      return updatedPlayer;
    } catch (err) {
      //
      console.error("Eroare la actualizarea jucătorului:", err); //
      setError(
        err instanceof Error
          ? err.message
          : "Eroare la actualizarea jucătorului.",
      ); //
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    //
    // Confirmarea e mai bine gestionată în UI înainte de a apela hook-ul
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(`${API_URL_PLAYERS}/${id}`, {
        method: "DELETE",
      }); // Folosește endpoint-ul dinamic
      if (!response.ok)
        throw new Error(
          `Eroare la ștergerea jucătorului: ${response.statusText}`,
        ); //
      setPlayers((prev) => prev.filter((p) => p.id !== id)); //
      displayTempMessage(setSuccessMessage, "Jucător șters cu succes!"); //
      return true;
    } catch (err) {
      //
      console.error("Eroare la ștergerea jucătorului:", err); //
      setError(
        err instanceof Error ? err.message : "Eroare la ștergerea jucătorului.",
      ); //
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    players,
    loading,
    error,
    successMessage,
    fetchPlayers,
    addPlayer,
    updatePlayer,
    deletePlayer,
    clearMessages,
  };
};
