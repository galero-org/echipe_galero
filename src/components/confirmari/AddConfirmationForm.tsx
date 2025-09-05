// src/components/confirmari/AddConfirmationForm.tsx
import React, { useState } from "react";
import type { Player } from "../../lib/types"; //

interface AddConfirmationFormProps {
  players: Player[]; // Pentru datalist
  onAddConfirmation: (
    playerId: string,
    registeredAt: string,
    selectedPlayer: Player
  ) => void;
  disabled: boolean;
  isLoading: boolean;
}

export const AddConfirmationForm: React.FC<AddConfirmationFormProps> = ({
  players,
  onAddConfirmation,
  disabled,
  isLoading,
}) => {
  const [fullName, setFullName] = useState(""); //
  const [registeredAt, setRegisteredAt] = useState(() => {
    //
    const now = new Date(); //
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajustează pentru fusul orar local
    return now.toISOString().slice(0, 16); //
  });

  const handleSubmit = () => {
    const selectedPlayer = players.find(
      //
      (p) => p.full_name.toLowerCase() === fullName.trim().toLowerCase() //
    );
    if (!selectedPlayer) {
      //
      alert("Te rugăm să selectezi un jucător valid din listă."); // Consideră o funcție showCustomAlert pasată ca prop
      return;
    }
    onAddConfirmation(selectedPlayer.id, registeredAt, selectedPlayer);
    setFullName(""); // Golește formularul
    const now = new Date(); //
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); //
    setRegisteredAt(now.toISOString().slice(0, 16)); // Resetează data la momentul curent
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-lg flex flex-col md:flex-row gap-6 items-center border border-green-100">
      {" "}
      {/* */}
      <input
        list="players-list" //
        type="text"
        placeholder="Nume complet jucător" //
        value={fullName} //
        onChange={(e) => setFullName(e.target.value)} //
        className="border border-gray-300 px-4 py-3 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200" //
        disabled={disabled || isLoading}
      />
      <datalist id="players-list">
        {" "}
        {/* */}
        {players.map(
          (
            player //
          ) => (
            <option key={player.id} value={player.full_name} /> //
          )
        )}
      </datalist>
      <input
        type="datetime-local" //
        value={registeredAt} //
        onChange={(e) => setRegisteredAt(e.target.value)} //
        className="border border-gray-300 px-4 py-3 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200" //
        disabled={disabled || isLoading}
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="bg-blue-600  px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto" //
        disabled={disabled || isLoading} //
      >
        {isLoading ? "Se adaugă..." : "Adaugă Confirmare"} {/* */}
      </button>
    </div>
  );
};
