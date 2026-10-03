import { useState, useCallback, useRef } from "react";
import type { Registration, Player } from "../lib/types";

interface UseConfirmationsReturn {
  registrations: Registration[];
  loading: boolean;
  error: string | null;
  fetchRegistrations: (editionId: number | "") => void;
  addConfirmation: (
    newRegData: Omit<Registration, "id" | "edition_id"> & {
      player_id: string;
      players?: Player;
      numar_editie: number;
    },
  ) => Promise<Registration | null>;
  updateConfirmationStatus: (
    id: string,
    status: Registration["status"],
    newRegisteredAt: string,
  ) => Promise<void>;
  updateConfirmationPayment: (id: string, payment: number) => Promise<void>;
  deleteConfirmation: (id: string) => Promise<void>;
}

const API_URL = "/api/confirmari";

export const useConfirmations = (): UseConfirmationsReturn => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Ordinea Statusurilor
  const registrationsCacheRef = useRef<Map<number, Registration[]>>(new Map());

  const statusOrder = { inscris: 1, rezerva: 2, retras: 3 };

  const sortRegistrations = useCallback(
    (regs: Registration[]): Registration[] => {
      return [...regs].sort((a, b) => {
        const statusA = statusOrder[a.status] || 99; // 99 pentru statusuri necunoscute
        const statusB = statusOrder[b.status] || 99; // 1. Prioritate după status

        if (statusA !== statusB) {
          return statusA - statusB;
        } // 2. Dacă statusurile sunt identice ("inscris" sau "rezerva"), sortăm după data înregistrării
        // Aceasta este crucială pentru a menține ordinea corectă a rezervelor.

        return (
          new Date(a.registered_at).getTime() -
          new Date(b.registered_at).getTime()
        );
      });
    },
    [],
  );

  const fetchRegistrations = useCallback(
    async (editionId: number | "") => {
      if (editionId === "") {
        setRegistrations([]);
        setLoading(false);
        return;
      }

      const cachedRegistrations = registrationsCacheRef.current.get(editionId);
      if (cachedRegistrations) {
        setRegistrations(cachedRegistrations);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?editionId=${editionId}`);
        if (!res.ok)
          throw new Error(
            `Eroare API la preluarea confirmărilor: ${res.statusText}`,
          );
        const data = await res.json();
        const sortedRegistrations = sortRegistrations(data);
        registrationsCacheRef.current.set(editionId, sortedRegistrations);
        setRegistrations(sortedRegistrations);
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
    [sortRegistrations],
  );

  const addConfirmation = async (
    newRegData: Omit<Registration, "id" | "edition_id"> & {
      player_id: string;
      players?: Player;
      numar_editie: number;
    },
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
        }),
      });
      if (!res.ok)
        throw new Error(
          `Eroare API la adăugarea confirmării: ${res.statusText}`,
        );
      const addedReg = await res.json();

      // Ensure we have the complete registration with players data
      if (addedReg && addedReg.id) {
        const updatedRegistrations = sortRegistrations([
          ...(registrationsCacheRef.current.get(newRegData.numar_editie) ?? []),
          addedReg,
        ]);
        registrationsCacheRef.current.set(
          newRegData.numar_editie,
          updatedRegistrations,
        );
        setRegistrations(updatedRegistrations);
      }

      return addedReg;
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
    newRegisteredAt: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, registered_at: newRegisteredAt }),
      });
      if (!res.ok)
        throw new Error(
          `Eroare API la actualizarea statusului: ${res.statusText}`,
        );
      const currentEditionId = registrationsCacheRef.current
        ? Array.from(registrationsCacheRef.current.entries()).find(
            ([, value]) => value.some((registration) => registration.id === id),
          )?.[0]
        : undefined;

      if (typeof currentEditionId === "number") {
        const updatedRegistrations = sortRegistrations(
          (registrationsCacheRef.current.get(currentEditionId) ?? []).map(
            (r) =>
              r.id === id
                ? { ...r, status, registered_at: newRegisteredAt }
                : r,
          ),
        );
        registrationsCacheRef.current.set(
          currentEditionId,
          updatedRegistrations,
        );
        setRegistrations(updatedRegistrations);
      }
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

  const updateConfirmationPayment = async (id: string, payment: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payment }),
      });
      if (!res.ok)
        throw new Error(`Eroare API la actualizarea plății: ${res.statusText}`);
      const currentEditionId = registrationsCacheRef.current
        ? Array.from(registrationsCacheRef.current.entries()).find(
            ([, value]) => value.some((registration) => registration.id === id),
          )?.[0]
        : undefined;

      if (typeof currentEditionId === "number") {
        const updatedRegistrations = sortRegistrations(
          (registrationsCacheRef.current.get(currentEditionId) ?? []).map(
            (r) => (r.id === id ? { ...r, payment } : r),
          ),
        );
        registrationsCacheRef.current.set(
          currentEditionId,
          updatedRegistrations,
        );
        setRegistrations(updatedRegistrations);
      }
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
          `Eroare API la ștergerea confirmării: ${res.statusText}`,
        );
      const currentEditionId = registrationsCacheRef.current
        ? Array.from(registrationsCacheRef.current.entries()).find(
            ([, value]) => value.some((registration) => registration.id === id),
          )?.[0]
        : undefined;

      if (typeof currentEditionId === "number") {
        const updatedRegistrations = sortRegistrations(
          (registrationsCacheRef.current.get(currentEditionId) ?? []).filter(
            (r) => r.id !== id,
          ),
        );
        registrationsCacheRef.current.set(
          currentEditionId,
          updatedRegistrations,
        );
        setRegistrations(updatedRegistrations);
      }
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
    updateConfirmationPayment,
    deleteConfirmation,
  };
};
