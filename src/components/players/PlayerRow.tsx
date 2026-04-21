// src/components/players/PlayerRow.tsx
import React from "react";
import { Edit2, Trash2 } from "lucide-react"; // Iconițe pentru acțiuni
import type { Player } from "../../lib/types"; // Tipul Player

interface PlayerRowProps {
  player: Player;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
  showGradeInRow?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = React.memo(
  ({
    player,
    isExpanded,
    onToggleExpand,
    onEdit,
    onDelete,
    showGradeInRow,
  }) => {
    return (
      <React.Fragment>
        {/* Rândul principal din tabel */}
        <tr className="hover:bg-gray-50 transition-colors duration-100">
          {" "}
          {/* */}
          <td className="px-5 py-4 font-medium text-blackAlt">
            {player.full_name}
          </td>{" "}
          {/* */}
          {/* Afișează coloana Nivel doar dacă `showGradeInRow` este true */}
          {showGradeInRow && (
            <td className="px-5 py-4 whitespace-nowrap">
              {" "}
              {/* */}
              {player.grade !== undefined ? player.grade : "—"}{" "}
              {/* "—" dacă nivelul lipsește */}
            </td>
          )}
          {/* Celula pentru acțiuni */}
          <td className="px-5 py-4 text-right space-x-2">
            {" "}
            {/* */}
            <button
              onClick={() => onToggleExpand(player.id)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {" "}
              {/* */}
              {isExpanded ? "Ascunde detalii" : "Arată detalii"} {/* */}
            </button>
            <button
              onClick={() => onEdit(player)}
              className="text-accent hover:text-primary p-1"
              title="Editează"
            >
              {" "}
              {/* */}
              <Edit2 size={18} /> {/* */}
            </button>
            <button
              onClick={() => onDelete(player.id)}
              className="text-red-500 hover:text-red-700 p-1"
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
          <tr className="bg-gray-50">
            {" "}
            {/* */}
            {/* `colSpan` trebuie să acopere toate coloanele din rândul principal */}
            <td
              colSpan={showGradeInRow ? 3 : 2}
              className="px-5 py-4 text-sm text-gray-700"
            >
              {" "}
              {/* */}
              <div>
                <strong>Email:</strong> {player.email || "—"}
              </div>{" "}
              {/* */}
              <div>
                <strong>Telefon:</strong> {player.phone || "—"}
              </div>{" "}
              {/* */}
              <div>
                <strong>Data Nașterii:</strong>{" "}
                {player.birthdate
                  ? new Date(player.birthdate).toLocaleDateString()
                  : "—"}
              </div>{" "}
              {/* */}
              <div>
                <strong>Înregistrat La:</strong>{" "}
                {player.created_at
                  ? new Date(player.created_at).toLocaleDateString()
                  : "—"}
              </div>{" "}
              {/* */}
              <div>
                <strong>Nota Modificată La:</strong>{" "}
                {player.grade_updated_at
                  ? new Date(player.grade_updated_at).toLocaleDateString(
                      "ro-RO",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : "Niciodată"}
              </div>{" "}
              {/* */}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  },
);
