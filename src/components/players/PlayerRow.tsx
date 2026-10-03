// src/components/players/PlayerRow.tsx
import React, { useEffect, useState } from "react";
import { Edit2, Trash2, Flag } from "lucide-react"; // Iconițe pentru acțiuni
import type { Player } from "../../lib/types"; // Tipul Player

interface PlayerRowProps {
  player: Player;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
  canDelete: boolean;
  showGradeInRow?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = React.memo(
  ({
    player,
    isExpanded,
    onToggleExpand,
    onEdit,
    onDelete,
    canManage,
    canDelete,
    showGradeInRow,
  }) => {
    const thresholdDays = 30; // default staleness threshold used in UI
    const notaUpdatedAt = player.nota_updated_at
      ? new Date(player.nota_updated_at)
      : null;
    const isStale =
      !notaUpdatedAt ||
      notaUpdatedAt.getTime() <
        new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).getTime();
    const [lastPresence, setLastPresence] = useState<string | null>(null);
    const [presenceLoading, setPresenceLoading] = useState(false);
    const [flagging, setFlagging] = useState(false);
    const [flagged, setFlagged] = useState(player.flagged ?? false);
    const presenceThresholdDays = 60;
    const [isAbsentLong, setIsAbsentLong] = useState(false);
    const [lastEdition, setLastEdition] = useState<{
      id?: string | number | null;
      numar_editie?: number | null;
      date?: string | null;
    } | null>(null);

    useEffect(() => {
      let mounted = true;
      async function fetchLastPresence() {
        if (!isExpanded) return;
        setPresenceLoading(true);
        try {
          const res = await fetch(
            `/api/players/presence/last?playerId=${player.id}`,
          );
          if (!res.ok) throw new Error("Failed to fetch last presence");
          const json = await res.json();
          if (!mounted) return;
          setLastPresence(json.last || null);
          setLastEdition(json.edition || null);

          // determine absence based on edition date if available, otherwise registered_at
          let compareDate: Date | null = null;
          if (json.edition && (json.edition.date || json.edition.created_at)) {
            compareDate = new Date(
              json.edition.date || json.edition.created_at,
            );
          } else if (json.last) {
            compareDate = new Date(json.last);
          }

          if (compareDate) {
            const threshold = new Date(
              Date.now() - presenceThresholdDays * 24 * 60 * 60 * 1000,
            );
            setIsAbsentLong(compareDate < threshold);
          } else {
            setIsAbsentLong(true);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (mounted) setPresenceLoading(false);
        }
      }
      fetchLastPresence();
      return () => {
        mounted = false;
      };
    }, [isExpanded, player.id]);
    return (
      <React.Fragment>
        {/* Rândul principal din tabel */}
        <tr className="hover:bg-gray-50 transition-colors duration-100 max-md:block max-md:mb-2 max-md:rounded-lg max-md:border max-md:border-gray-200 max-md:bg-white max-md:shadow-sm">
          {" "}
          {/* */}
          <td className="px-5 py-4 font-medium text-blackAlt max-md:block max-md:px-3 max-md:py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="break-words">{player.full_name}</span>
              {flagged && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  Marcat
                </span>
              )}
              {isStale ? (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  Notă veche
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Notă recentă
                </span>
              )}
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {player.totalEditions || 0}{" "}
                {player.totalEditions === 1 ? "prezență" : "prezențe"}
              </span>
            </div>
          </td>{" "}
          {/* */}
          {/* Afișează coloana Nivel doar dacă `showGradeInRow` este true */}
          {showGradeInRow && (
            <td className="px-5 py-4 whitespace-nowrap max-md:flex max-md:items-center max-md:justify-between max-md:px-3 max-md:py-2">
              {" "}
              {/* */}
              {player.grade !== undefined ? player.grade : "—"}{" "}
              {/* "—" dacă nivelul lipsește */}
            </td>
          )}
          {/* Celula pentru acțiuni */}
          <td className="space-x-2 px-5 py-4 text-right max-md:flex max-md:items-center max-md:justify-between max-md:border-t max-md:border-border max-md:px-3 max-md:py-2">
            {canManage && (
              <button
                onClick={async () => {
                  try {
                    setFlagging(true);
                    const res = await fetch(`/api/players/flag`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        playerId: player.id,
                        flagged: !flagged,
                      }),
                    });
                    if (!res.ok) throw new Error("Flag request failed");
                    setFlagged((s) => !s);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setFlagging(false);
                  }
                }}
                className={`p-2 ${flagged ? "text-error" : "text-muted hover:text-error"}`}
                title={flagged ? "Elimină marca" : "Marchează pentru contact"}
                aria-label={
                  flagged ? "Elimină marca" : "Marchează pentru contact"
                }
                disabled={flagging}
              >
                <Flag size={18} fill={flagged ? "currentColor" : "none"} />
              </button>
            )}
            {canManage && (
              <button
                onClick={() => onToggleExpand(player.id)}
                className="px-1 text-sm text-primary hover:text-secondary"
              >
                {" "}
                {/* */}
                {isExpanded ? "Ascunde detalii" : "Arată detalii"} {/* */}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onEdit(player)}
                className="p-2 text-accent hover:text-primary"
                title="Editează"
              >
                {" "}
                {/* */}
                <Edit2 size={18} /> {/* */}
              </button>
            )}
            <button
              onClick={() => onDelete(player.id)}
              className="p-2 text-error hover:text-red-700"
              title="Șterge"
            >
              {" "}
              {/* */}
              <Trash2 size={18} /> {/* */}
            </button>
          </td>
        </tr>
        {/* Rândul extins cu detalii, afișat condiționat */}
        {isExpanded && (
          <tr className="bg-gray-50 max-md:block max-md:mb-2 max-md:rounded-lg max-md:border max-md:border-gray-200">
            {" "}
            {/* */}
            {/* `colSpan` trebuie să acopere toate coloanele din rândul principal */}
            <td
              colSpan={showGradeInRow ? 3 : 2}
              className="px-5 py-4 text-sm text-gray-700 max-md:block max-md:px-3 max-md:py-3"
            >
              {" "}
              {/* */}
              {/* */}
              <div>
                <strong>Telefon:</strong> {player.phone || "—"}
              </div>{" "}
              {/* */}
              <div>
                <strong>Ultima actualizare a notei:</strong>{" "}
                {notaUpdatedAt
                  ? notaUpdatedAt.toLocaleString("ro-RO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Niciodată"}
              </div>{" "}
              <div>
                <strong>Ultima prezență:</strong>{" "}
                {presenceLoading ? (
                  "Se încarcă..."
                ) : lastEdition && lastEdition.numar_editie ? (
                  <>
                    <span>Ediția #{lastEdition.numar_editie}</span>
                    {lastEdition.date && (
                      <span className="ml-2 text-sm text-gray-600">
                        (
                        {new Date(lastEdition.date).toLocaleDateString("ro-RO")}
                        )
                      </span>
                    )}
                  </>
                ) : lastPresence ? (
                  new Date(lastPresence).toLocaleString("ro-RO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                ) : (
                  "Niciodată"
                )}
                {isAbsentLong && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Fără prezență recentă
                  </span>
                )}
              </div>{" "}
              {/* */}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  },
);
