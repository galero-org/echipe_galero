// src/components/ConfirmationCard.tsx
import React, { useState } from "react";

// Define types for Player and Registration for self-containment
type Player = {
  id: string;
  full_name: string;
};

type Registration = {
  id: string;
  status: "inscris" | "rezerva" | "retras";
  registered_at: string; // ISO string
  player_id: string;
  numar_editie: number;
  players: Player; // This implies a join or nested object from the API response
};

interface ConfirmationCardProps {
  registration: Registration;
  onUpdateStatus: (
    id: string,
    status: "inscris" | "rezerva" | "retras"
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Renders a single confirmation entry as a card.
 * Includes player name, status (with dropdown to change), registration date, and edition number.
 *
 * @param {object} registration - The registration data.
 * @param {function} onUpdateStatus - Callback to update the status of a registration.
 * @param {function} onDelete - Callback to delete a registration.
 */
export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  registration,
  onUpdateStatus,
  onDelete,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  /**
   * Determines the Tailwind CSS classes for the status badge based on the status value.
   * @param {string} status - The current status of the registration.
   * @returns {string} Tailwind CSS classes for styling.
   */
  const getStatusColor = (status: Registration["status"]) => {
    switch (status) {
      case "inscris":
        return "bg-green-100 text-green-800";
      case "rezerva":
        return "bg-yellow-100 text-yellow-800";
      case "retras":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Formats the registration date into a human-readable string for Romanian locale and Bucharest timezone.
  const formattedDate = (() => {
    const registeredDate = new Date(registration.registered_at);
    // Using toLocaleString with timeZone option to correctly display date in Europe/Bucharest timezone.
    return registeredDate.toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  })();

  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-200 font-inter transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
      <div className="flex justify-between items-start mb-3">
        {/* Player Full Name */}
        <h3 className="text-xl font-bold text-gray-800">
          {registration.players.full_name}
        </h3>
        {/* Status Dropdown */}
        <div className="relative">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors duration-200 ${getStatusColor(
              registration.status
            )}`}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            {registration.status}
          </span>
          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {/* Status Change Options */}
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                onClick={() => {
                  onUpdateStatus(registration.id, "inscris");
                  setShowStatusDropdown(false);
                }}
              >
                Inscris
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                onClick={() => {
                  onUpdateStatus(registration.id, "rezerva");
                  setShowStatusDropdown(false);
                }}
              >
                Rezerva
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                onClick={() => {
                  onUpdateStatus(registration.id, "retras");
                  setShowStatusDropdown(false);
                }}
              >
                Retras
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              {/* Delete Button */}
              <button
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                onClick={() => {
                  onDelete(registration.id);
                  setShowStatusDropdown(false);
                }}
              >
                Șterge
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Registration Details */}
      <p className="text-gray-600 text-sm mb-1">
        <span className="font-semibold">Înregistrat la:</span> {formattedDate}
      </p>
      <p className="text-gray-600 text-sm">
        <span className="font-semibold">Ediția:</span>{" "}
        {registration.numar_editie}
      </p>
    </div>
  );
};
