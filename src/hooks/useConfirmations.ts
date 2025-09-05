import { useState, useCallback } from "react";
import type { Registration, Player } from "../lib/types";

interface UseConfirmationsReturn {
  registrations: Registration[];
  loading: boolean;
  error: string | null;
  fetchRegistrations: (editionId: number | "") => void;
  addConfirmation: (
    newRegData: Omit<Registration, "id"> & {
      player_id: string;
      numar_editie: number;
      players?: Player;
    }
  ) => Promise<Registration | null>;
  updateConfirmationStatus: (
    id: string,
    status: Registration["status"],
    newRegisteredAt: string
  ) => Promise<void>;
  updateConfirmationPayment: (id: string, payment: number) => Promise<void>;
  deleteConfirmation: (id: string) => Promise<void>;
}

const API_URL = "/api/confirmari";

export const useConfirmations = (): UseConfirmationsReturn => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOrder = { inscris: 1, rezerva: 2, retras: 3 };

  const sortRegistrations = useCallback(
    (regs: Registration[]): Registration[] => {
      return [...regs].sort((a, b) => {
        const statusA = statusOrder[a.status];
        const statusB = statusOrder[b.status];
        if (statusA !== statusB) return statusA - statusB;
        return (
          new Date(a.registered_at).getTime() -
          new Date(b.registered_at).getTime()
        );
      });
    },
    []
  );

  const fetchRegistrations = useCallback(
    async (editionId: number | "") => {
      if (editionId === "") {
        setRegistrations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?editionId=${editionId}`);
        if (!res.ok)
          throw new Error(
            `Eroare API la preluarea confirmărilor: ${res.statusText}`
          );
        const data = await res.json();
        setRegistrations(sortRegistrations(data));
      } catch (err) {
        console.error("Eroare la preluarea confirmărilor:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Eroare la încărcarea confirmărilor.";
        setError(message);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    },
    [sortRegistrations]
  );

  const addConfirmation = async (
    newRegData: Omit<Registration, "id"> & {
      player_id: string;
      numar_editie: number;
      players?: Player;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newRegData.status,
          registered_at: newRegData.registered_at,
          player_id: newRegData.player_id,
          numar_editie: newRegData.numar_editie,
          payment: newRegData.payment || 25,
        }),
      });
      if (!res.ok)
        throw new Error(
          `Eroare API la adăugarea confirmării: ${res.statusText}`
        );
      const addedReg = await res.json();
      const augmentedNewReg = { ...addedReg, players: newRegData.players };
      setRegistrations((prev) => sortRegistrations([...prev, augmentedNewReg]));
      return augmentedNewReg;
    } catch (err) {
      console.error("Eroare la adăugarea confirmării:", err);
      const message =
        err instanceof Error ? err.message : "Eroare la adăugarea confirmării.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateConfirmationStatus = async (
    id: string,
    status: Registration["status"],
    newRegisteredAt: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "PUT", // Sau PATCH, depinde cum e configurat backend-ul tău
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, registered_at: newRegisteredAt }),
      });
      if (!res.ok)
        throw new Error(
          `Eroare API la actualizarea statusului: ${res.statusText}`
        );
      setRegistrations((prev) =>
        sortRegistrations(
          prev.map((r) =>
            r.id === id ? { ...r, status, registered_at: newRegisteredAt } : r
          )
        )
      );
    } catch (err) {
      console.error("Eroare la actualizarea statusului:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Eroare la actualizarea statusului.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // NOUA FUNCȚIE: Actualizează doar câmpul 'payment'
  const updateConfirmationPayment = async (id: string, payment: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "PUT", // Folosește PUT sau PATCH, în funcție de API-ul tău
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payment }), // Trimitem ID-ul și noua valoare a plății
      });
      if (!res.ok)
        throw new Error(`Eroare API la actualizarea plății: ${res.statusText}`);
      // Actualizează starea locală cu noua valoare a plății
      setRegistrations((prev) =>
        sortRegistrations(
          prev.map((r) => (r.id === id ? { ...r, payment } : r))
        )
      );
    } catch (err) {
      console.error("Eroare la actualizarea plății:", err);
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea plății.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteConfirmation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok)
        throw new Error(
          `Eroare API la ștergerea confirmării: ${res.statusText}`
        );
      setRegistrations((prev) =>
        sortRegistrations(prev.filter((r) => r.id !== id))
      );
    } catch (err) {
      console.error("Eroare la ștergerea confirmării:", err);
      const message =
        err instanceof Error ? err.message : "Eroare la ștergerea confirmării.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    addConfirmation,
    updateConfirmationStatus,
    updateConfirmationPayment, // Exportăm noua funcție
    deleteConfirmation,
  };
};
