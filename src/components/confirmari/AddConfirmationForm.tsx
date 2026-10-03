import React, { useState } from "react";
import type { Player } from "../../lib/types";
import { normalizeSearchText } from "../../lib/normalizeSearchText";

interface AddConfirmationFormProps {
  players: Player[];
  onAddConfirmation: (
    playerId: string,
    registeredAt: string,
    selectedPlayer: Player,
  ) => void;
  disabled: boolean;
  isLoading: boolean;
  canAddPlayer: boolean;
  onQuickAddPlayer: (fullName: string) => Promise<Player | null>;
}

export const AddConfirmationForm: React.FC<AddConfirmationFormProps> = ({
  players,
  onAddConfirmation,
  disabled,
  isLoading,
  canAddPlayer,
  onQuickAddPlayer,
}) => {
  const [fullName, setFullName] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [registeredAt, setRegisteredAt] = useState(() => {
    const now = new Date(); //
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const matchingPlayer = players.find(
    (player) =>
      normalizeSearchText(player.full_name) === normalizeSearchText(fullName),
  );

  const handleSubmit = () => {
    const selectedPlayer = matchingPlayer;
    if (!selectedPlayer) {
      alert("Te rugăm să selectezi un jucător valid din listă.");
      return;
    }
    onAddConfirmation(selectedPlayer.id, registeredAt, selectedPlayer);
    setFullName("");
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setRegisteredAt(now.toISOString().slice(0, 16));
  };

  const handleQuickAddPlayer = async () => {
    const createdPlayer = await onQuickAddPlayer(fullName.trim());
    if (createdPlayer) setFullName(createdPlayer.full_name);
  };

  return (
    <div className="mb-6 flex flex-col items-center gap-6 rounded-xl border border-border bg-[linear-gradient(135deg,var(--color-success-soft),var(--color-info-soft))] p-6 shadow-lg md:flex-row">
      <input
        list="players-list"
        type="text"
        placeholder="Nume complet jucător"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="input-shell w-full md:w-1/3"
        disabled={disabled || isLoading}
      />
      {fullName.trim() && !matchingPlayer && canAddPlayer && (
        <button
          type="button"
          onClick={async () => {
            setIsAddingPlayer(true);
            await handleQuickAddPlayer();
            setIsAddingPlayer(false);
          }}
          className="text-sm text-info underline underline-offset-2 disabled:opacity-50"
          disabled={disabled || isLoading || isAddingPlayer}
        >
          {isAddingPlayer
            ? "Se adaugă jucătorul..."
            : `Adaugă „${fullName.trim()}” în lista jucătorilor`}
        </button>
      )}
      <datalist id="players-list">
        {" "}
        {/* */}
        {players.map((player) => (
          <option key={player.id} value={player.full_name} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-lg bg-primary px-6 py-3 text-on-primary shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        disabled={disabled || isLoading}
      >
        {isLoading ? "Se adaugă..." : "Adaugă Confirmare"}
      </button>
    </div>
  );
};
