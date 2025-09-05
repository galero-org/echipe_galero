import { useState, useEffect } from "react";
import type { Player } from "../lib/types";

interface UsePlayersSimpleListReturn {
  players: Player[];
  loading: boolean;
  error: string | null;
}

export const usePlayersSimpleList = (): UsePlayersSimpleListReturn => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayersData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/players");
        if (!res.ok) throw new Error(`Eroare API: ${res.statusText}`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Eroare la preluarea jucătorilor:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Eroare la încărcarea listei de jucători.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersData();
  }, []);

  return { players, loading, error };
};
