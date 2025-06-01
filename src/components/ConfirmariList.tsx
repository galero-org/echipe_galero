// src/components/ConfirmariList.tsx
import React, { useEffect, useState } from "react";
import { ConfirmationsDisplay } from "./ConfirmationDisplay"; // Import the new display component
import { AlertDialog } from "./AlertDialog"; // Import the custom alert dialog
import { jsPDF } from "jspdf"; // Import jsPDF library
import autoTable from "jspdf-autotable"; // Import autoTable function directly

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
  players?: Player; // Made optional for safer access
};

interface ConfirmariListProps {
  initialEditionId?: string; // Prop to receive editionId from Astro URL
}

/**
 * Main component for managing confirmations.
 * Handles fetching players and registrations, adding new confirmations,
 * updating status, and deleting confirmations.
 * Displays confirmations using a table-based layout.
 *
 * @param {string} initialEditionId - The edition ID passed from the URL (optional).
 */
export const ConfirmariList: React.FC<ConfirmariListProps> = ({
  initialEditionId,
}) => {
  // State for registrations data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for new confirmation form inputs
  const [fullName, setFullName] = useState("");
  const [registeredAt, setRegisteredAt] = useState(() => {
    // Initialize registeredAt with the current local date and time in ISO format (YYYY-MM-DDTHH:MM)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone offset
    return now.toISOString().slice(0, 16);
  });
  // State for selected edition ID, initialized from prop or empty
  const [editionId, setEditionId] = useState<number | "">(
    initialEditionId ? parseInt(initialEditionId, 10) : ""
  );
  // State for the edition date (for PDF export)
  const [editionDate, setEditionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  ); // Default to current date
  // State for players list (for datalist)
  const [players, setPlayers] = useState<Player[]>([]);
  // State for custom alert dialog visibility and message
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  /**
   * Displays a custom alert dialog with a given message.
   * @param {string} message - The message to display.
   */
  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  /**
   * Helper function to sort registrations based on status and then registered_at.
   * Order: "inscris", "rezerva", "retras".
   * Within each status, sort by registered_at (oldest first).
   * @param {Registration[]} regs - The array of registrations to sort.
   * @returns {Registration[]} The sorted array of registrations.
   */
  const sortRegistrations = (regs: Registration[]) => {
    const statusOrder = {
      inscris: 1,
      rezerva: 2,
      retras: 3,
    };

    return [...regs].sort((a, b) => {
      // Primary sort by status order
      const statusA = statusOrder[a.status];
      const statusB = statusOrder[b.status];

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Secondary sort by registered_at (oldest first)
      return (
        new Date(a.registered_at).getTime() -
        new Date(b.registered_at).getTime()
      );
    });
  };

  /**
   * Fetches the list of players from the API.
   */
  const fetchPlayers = async () => {
    setLoading(true); // Set loading true while fetching players
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Failed to fetch players:", err);
      showCustomAlert("Eroare la încărcarea listei de jucători.");
    } finally {
      setLoading(false); // Set loading false after fetch attempt
    }
  };

  // Effect hook to fetch players on component mount and registrations when editionId changes
  useEffect(() => {
    fetchPlayers(); // Fetch players once on mount

    if (editionId !== "") {
      setLoading(true); // Set loading true when fetching registrations for a specific edition
      fetch(`/api/confirmari?editionId=${editionId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          setRegistrations(sortRegistrations(data)); // Sort data after fetching
          setLoading(false); // Set loading false after successful fetch
        })
        .catch((err) => {
          console.error("Failed to fetch registrations:", err);
          showCustomAlert(
            "Eroare la încărcarea confirmărilor pentru ediția selectată."
          );
          setLoading(false); // Set loading false on error
        });
    } else {
      setRegistrations([]); // Clear registrations if no edition is selected
      setLoading(false); // Set loading false if no edition is selected
    }
  }, [editionId]); // Re-run effect when editionId changes

  /**
   * Handles adding a new confirmation.
   * Validates player selection and edition, then sends POST request to API.
   */
  async function handleAdd() {
    // Find the selected player from the players list
    const player = players.find(
      (p) => p.full_name.toLowerCase() === fullName.trim().toLowerCase()
    );

    // Validate player selection
    if (!player) {
      showCustomAlert("Te rugăm să selectezi un jucător valid din listă.");
      return;
    }

    // Validate edition selection
    if (editionId === "") {
      showCustomAlert(
        "Te rugăm să selectezi o ediție înainte de a adăuga o confirmare."
      );
      return;
    }

    try {
      // Send POST request to add new confirmation
      const res = await fetch("/api/confirmari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "inscris", // Default status for new registrations
          registered_at: registeredAt,
          player_id: player.id,
          numar_editie: editionId,
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

      // Add the new registration to the state
      const newReg = await res.json();
      // IMPORTANT: Augment newReg with the full player object before adding to state
      // This ensures that `reg.players.full_name` is available immediately.
      const augmentedNewReg = { ...newReg, players: player };
      setRegistrations((prev) => sortRegistrations([...prev, augmentedNewReg])); // Sort after adding
      // Clear form inputs
      setFullName("");
      // Reset registeredAt to current time after adding
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setRegisteredAt(now.toISOString().slice(0, 16));
    } catch (err) {
      console.error("Failed to add registration:", err);
      showCustomAlert("Eroare la adăugarea confirmării.");
    }
  }

  /**
   * Handles updating the status of an existing confirmation.
   * Sends PUT request to API.
   *
   * @param {string} id - The ID of the registration to update.
   * @param {"inscris" | "rezerva" | "retras"} status - The new status.
   */
  async function handleUpdateStatus(
    id: string,
    status: "inscris" | "rezerva" | "retras"
  ) {
    // Get current timestamp for registered_at update
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const updatedRegisteredAt = now.toISOString();

    try {
      // Send PUT request to update confirmation status and registered_at
      const res = await fetch("/api/confirmari", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          registered_at: updatedRegisteredAt,
        }), // Include updated timestamp
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

      // Update the status and registered_at in the local state, then sort
      const updated = await res.json();
      setRegistrations((prev) =>
        sortRegistrations(
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: updated.status,
                  registered_at: updatedRegisteredAt,
                }
              : r
          )
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      showCustomAlert("Eroare la actualizarea statusului.");
    }
  }

  /**
   * Handles deleting an existing confirmation.
   * Sends DELETE request to API.
   *
   * @param {string} id - The ID of the registration to delete.
   */
  async function handleDelete(id: string) {
    try {
      // Send DELETE request to remove confirmation
      const res = await fetch("/api/confirmari", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

      // Filter out the deleted registration from the local state, then sort
      setRegistrations((prev) =>
        sortRegistrations(prev.filter((r) => r.id !== id))
      ); // Sort after deleting
    } catch (err) {
      console.error("Failed to delete registration:", err);
      showCustomAlert("Eroare la ștergerea confirmării.");
    }
  }

  /**
   * Handles changing the edition ID and navigating to the new URL.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the input.
   */
  const handleEditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newEditionNum = value === "" ? "" : parseInt(value, 10);
    setEditionId(newEditionNum); // Update local state immediately for input control

    // Navigate to the new URL to reflect the selected edition
    // This will trigger a full page reload, as it's a navigation action.
    if (newEditionNum !== "") {
      window.location.href = `/confirmari/${newEditionNum}`;
    } else {
      window.location.href = `/confirmari`; // Go to base path if input is cleared
    }
  };

  /**
   * Handles exporting the current confirmations list to a PDF.
   */
  const handleExportPdf = () => {
    if (registrations.length === 0) {
      showCustomAlert("Nu există confirmări de exportat în PDF.");
      return;
    }
    if (editionId === "") {
      showCustomAlert("Selectează o ediție pentru a exporta confirmările.");
      return;
    }

    const doc = new jsPDF();

    // --- IMPORTANT: Adăugarea fontului pentru diacritice ---
    // 1. Obțineți un fișier .ttf al unui font care suportă diacritice (ex: Open Sans, Arial, Lato, Roboto).
    // 2. Convertiți fișierul .ttf într-un șir Base64. Puteți folosi unelte online (ex: https://www.fontsquirrel.com/tools/webfont-generator)
    //    sau biblioteci Node.js (ex: jspdf-customfonts).
    // 3. Inserați codul de mai jos, înlocuind 'YOUR_FONT_BASE64_STRING' cu șirul Base64 al fontului dvs.
    //    și 'YourFontName' cu numele real al fontului.
    /*
    const fontBase64 = 'YOUR_FONT_BASE64_STRING'; // Exemplu: 'AAEAAAASA...'
    doc.addFileToVFS('YourFontName-normal.ttf', fontBase64);
    doc.addFont('YourFontName-normal.ttf', 'YourFontName', 'normal');
    */
    // Pentru acest exemplu, vom folosi un font generic, dar RECOMANDAT este să încorporați un font real.
    // Dacă nu încorporați un font, diacriticele s-ar putea să nu se afișeze corect.
    doc.setFont("helvetica", "normal"); // Folosim helvetica ca fallback, dar ar trebui să fie fontul dvs. personalizat

    // --- Add Galero Logo ---
    // Replace 'YOUR_GALERO_LOGO_BASE64_STRING' with your actual base64 encoded image string.
    // Example: const galeroLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
    // Notă: Calea '/images/galero-logo.jpg' funcționează doar dacă serverul web expune această cale direct.
    // Pentru o imagine locală într-un proiect React/Astro, ar trebui să o importați (ex: import galeroLogo from '../assets/galero-logo.jpg';)
    // sau să folosiți o imagine base64 pentru fiabilitate maximă în PDF.
    const galeroLogo = "/images/galero-logo.jpg"; // Placeholder for your image path or base64 string
    if (galeroLogo) {
      doc.addImage(galeroLogo, "PNG", 10, 10, 50, 20); // x, y, width, height
    } else {
      doc.setFontSize(16);
      doc.text("Galero Logo Placeholder", 10, 20); // Text placeholder if no logo provided
    }

    // --- Add Edition Number and Date ---
    doc.setFontSize(14);
    doc.text(`Număr Ediție: ${editionId}`, 10, 40);
    doc.text(`Data Ediției: ${editionDate}`, 10, 50);

    // --- Prepare Table Data ---
    const tableColumn = ["Nume Jucător", "Suma Plătită"];
    const tableRows: string[][] = [];

    registrations.forEach((reg) => {
      // Ensure player name is available
      const playerName = reg.players?.full_name || "N/A";
      // "Suma Plătită" column is intentionally left blank as per request
      tableRows.push([playerName, ""]);
    });

    // --- Generate Table ---
    // autoTable is now directly imported and callable as a function
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60, // Start table below the header information
      theme: "grid", // Add grid lines for better readability
      styles: {
        font: "helvetica", // Folosiți numele fontului dvs. personalizat aici (ex: 'YourFontName')
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [200, 200, 200], // Light grey header
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" }, // Player Name column adjusts width
        1: { cellWidth: "auto" }, // Suma Plătită column adjusts width
      },
      margin: { left: 10, right: 10 },
      // `autoPage` is true by default, so it will only break if content exceeds page
      // `pageBreak` can be 'auto', 'avoid', 'always'
    });

    // --- Save PDF ---
    doc.save(`Prezenta_Editia_${editionId}_${editionDate}.pdf`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-4 font-inter">
      {/* Selector pentru ediție */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg flex flex-col sm:flex-row gap-6 items-center border border-blue-100">
        <label
          htmlFor="editionId"
          className="block text-gray-800 text-lg font-bold min-w-[120px]"
        >
          Număr Ediție:
        </label>
        <input
          type="number"
          id="editionId"
          className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
          value={editionId}
          onChange={handleEditionChange} // Use the new handler
          placeholder="Ex: 1, 2, 3..."
          min="1" // Ensure positive numbers
        />
        {/* Input for Edition Date */}
        <label
          htmlFor="editionDate"
          className="block text-gray-800 text-lg font-bold min-w-[120px] sm:ml-4"
        >
          Data Ediției:
        </label>
        <input
          type="date"
          id="editionDate"
          className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
          value={editionDate}
          onChange={(e) => setEditionDate(e.target.value)}
        />
        {/* Export PDF Button */}
        <button
          type="button"
          onClick={handleExportPdf}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          disabled={editionId === "" || registrations.length === 0}
        >
          Exportă PDF
        </button>
      </div>

      {/* Formular de adaugare */}
      <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-lg flex flex-col md:flex-row gap-6 items-center border border-green-100">
        {/* Player Name Input with Datalist */}
        <input
          list="players-list"
          type="text"
          placeholder="Nume complet jucător"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-gray-300 px-4 py-3 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200"
        />
        <datalist id="players-list">
          {players.map((player) => (
            <option key={player.id} value={player.full_name} />
          ))}
        </datalist>
        {/* Registration Date/Time Input */}
        <input
          type="datetime-local"
          value={registeredAt}
          onChange={(e) => setRegisteredAt(e.target.value)}
          className="border border-gray-300 px-4 py-3 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200"
        />
        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          disabled={editionId === "" || loading} // Disable if no edition selected or while loading
        >
          {loading && editionId !== "" ? "Se adaugă..." : "Adaugă Confirmare"}
        </button>
      </div>

      {/* Conditional Loading and Display Messages */}
      {loading && editionId !== "" && (
        <p className="text-center text-blue-600 text-lg mt-8 animate-pulse p-4 bg-white rounded-lg shadow">
          Se încarcă confirmările...
        </p>
      )}

      {/* Display Confirmations as Cards */}
      {!loading && editionId !== "" && (
        <ConfirmationsDisplay
          registrations={registrations}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
        />
      )}

      {/* Message when no edition is selected */}
      {!loading && editionId === "" && (
        <p className="text-center text-gray-500 text-lg mt-8 p-4 bg-white rounded-lg shadow">
          Selectează un număr de ediție pentru a vizualiza confirmările.
        </p>
      )}

      {/* Custom Alert Dialog */}
      {showAlert && (
        <AlertDialog
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
};

export default ConfirmariList;
