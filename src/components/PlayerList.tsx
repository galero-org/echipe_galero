import React, { useState, useCallback } from "react";
import { PlusCircle } from "lucide-react"; // Iconiță pentru butonul de adăugare
import type { Player } from "../lib/types"; // Tipul Player
import { usePlayerManagement } from "../hooks/usePlayerManagement"; // Hook-ul custom pentru logică
import { PlayerFormModal } from "./players/PlayerFormModal"; // Componenta modal refactorizată
import { PlayerRow } from "./players/PlayerRow"; // Componenta pentru rândul din tabel
import { AlertDialog } from "./AlertDialog"; // Componenta AlertDialog existentă

type PlayerFormData = Omit<Player, "id" | "created_at">; //

export const PlayerList: React.FC = () => {
  const {
    players,
    loading,
    error: hookError, // Eroarea din hook (ex: eroare la preluare)
    successMessage,
    // fetchPlayers, // Nu mai e necesar să fie apelat direct, hook-ul o face la inițializare
    addPlayer,
    updatePlayer,
    deletePlayer: hookDeletePlayer, // Redenumit pentru claritate
    clearMessages, // Funcție pentru a curăța mesajele din hook
  } = usePlayerManagement();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set()); // Gestionează rândurile extinse
  const [isModalOpen, setIsModalOpen] = useState(false); // Controlează vizibilitatea modalului
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null); // Jucătorul curent pentru editare
  // Starea pentru erorile specifice formularului din modal (poate fi setată la validare locală sau după un submit eșuat)
  const [modalFormError, setModalFormError] = useState<string | null>(null);

  // Starea pentru AlertDialog general
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  // Funcție helper pentru a afișa un AlertDialog
  const showAppAlert = useCallback((message: string) => {
    setAlertDialog({ isOpen: true, message });
  }, []);

  const toggleRow = useCallback((id: string) => {
    // Funcție pentru a comuta extinderea unui rând
    setExpandedRows((prev) => {
      //
      const newSet = new Set(prev); //
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id); //
      return newSet; //
    });
  }, []); // Fără dependențe, `setExpandedRows` e stabil

  const handleOpenModal = useCallback(
    (player: Player | null = null) => {
      // Deschide modalul pentru adăugare/editare
      clearMessages(); // Curăță mesajele anterioare din hook
      setModalFormError(null); // Curăță eroarea specifică formularului
      setEditingPlayer(player); // Setează jucătorul pentru editare (sau null pentru adăugare)
      setIsModalOpen(true); // Deschide modalul
    },
    [clearMessages]
  );

  const handleCloseModal = useCallback(() => {
    // Închide modalul
    setIsModalOpen(false); //
    setEditingPlayer(null); //
    setModalFormError(null); // Curăță eroarea la închidere
  }, []);

  const handleSubmitPlayerForm = async (
    playerData: PlayerFormData,
    editingPlayerId: string | null
  ) => {
    //
    clearMessages(); // Curăță mesajele vechi
    setModalFormError(null); // Resetează eroarea locală a formularului
    let resultSuccess = false;
    if (editingPlayerId) {
      // Dacă există un ID, actualizăm jucătorul
      const updated = await updatePlayer(editingPlayerId, playerData);
      resultSuccess = !!updated;
    } else {
      // Altfel, adăugăm un jucător nou
      const added = await addPlayer(playerData);
      resultSuccess = !!added;
    }

    if (resultSuccess) {
      // Mesajul de succes e gestionat de hook
      return true; // Indică succesul către modal pentru a se închide
    } else {
      // Eroarea e setată în hook. O putem prelua și afișa specific în modal dacă e relevant.
      // setModalFormError(hookError || "A apărut o eroare la salvare."); // hookError ar trebui să fie actualizat
      return false; // Indică eșecul către modal
    }
  };

  const handleDeletePlayer = async (id: string) => {
    // Gestionează ștergerea unui jucător
    clearMessages();
    // Confirmarea e acum în hook-ul `deletePlayer` din `usePlayerManagement`
    if (window.confirm("Ești sigur că vrei să ștergi acest jucător?")) {
      // Confirmare în UI
      const success = await hookDeletePlayer(id); // Apelează funcția din hook
      // Mesajele de succes/eroare sunt gestionate de hook
      if (!success && hookError) {
        // Dacă ștergerea eșuează și hook-ul setează o eroare
        showAppAlert(hookError); // Afișează un alert general
      }
    }
  };

  // Afișează mesaj de încărcare doar la încărcarea inițială sau dacă lista e goală
  if (loading && !players.length) {
    //
    return (
      <p className="text-center text-text mt-10 text-xl">
        Se încarcă jucătorii...
      </p>
    ); //
  }

  // Determină dacă trebuie afișată coloana "Nivel" pe baza datelor curente
  const showGradeColumnInTable = players.some((p) => p.grade !== undefined); //

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 p-4 font-text">
      {" "}
      {/* Container principal */}
      {/* Antetul paginii cu titlu și buton de adăugare */}
      <div className="flex justify-between items-center mb-6">
        {" "}
        {/* */}
        <h1 className="text-3xl font-bold font-khand text-primary">
          Listă Jucători
        </h1>{" "}
        {/* */}
        {/* Buton pentru a deschide modalul de adăugare */}
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-secondary font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-150" // Am schimbat text-blue în text-white pentru contrast
        >
          <PlusCircle size={20} className="mr-2" /> Adaugă Jucător {/* */}
        </button>
      </div>
      {/* Afișează mesajele de eroare/succes din hook */}
      {hookError && !isModalOpen && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
          {hookError}
        </div>
      )}{" "}
      {/* Nu afișa eroarea hook-ului dacă modalul e deschis și are propria eroare */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded">
          {successMessage}
        </div>
      )}{" "}
      {/* */}
      {/* Afișează tabelul sau un mesaj dacă nu există jucători */}
      {players.length === 0 && !loading ? ( //
        <p className="text-center text-gray-500 mt-10 text-lg">
          Nu există jucători înregistrați.
        </p> //
      ) : (
        <div className="bg-white rounded-lg shadow-xl overflow-x-auto">
          {" "}
          {/* Container tabel */}
          <table className="min-w-full table-auto text-sm text-text">
            {" "}
            {/* Tabel */}
            <thead className="bg-grayLight text-left text-blackAlt uppercase tracking-wider">
              {" "}
              {/* Antet tabel */}
              <tr>
                <th className="px-5 py-3">Nume Complet</th> {/* */}
                {showGradeColumnInTable && (
                  <th className="px-5 py-3">Nivel</th>
                )}{" "}
                {/* Coloana Nivel, condiționat */}
                <th className="px-5 py-3 text-right">Acțiuni</th> {/* */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {" "}
              {/* Corpul tabelului */}
              {/* Iterează prin jucători și afișează fiecare rând folosind componenta PlayerRow */}
              {players.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isExpanded={expandedRows.has(player.id)}
                  onToggleExpand={toggleRow}
                  onEdit={handleOpenModal} // Pasează funcția de deschidere a modalului pentru editare
                  onDelete={handleDeletePlayer} // Pasează funcția de ștergere
                  showGradeInRow={showGradeColumnInTable} // Indică dacă trebuie afișată coloana Nivel
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modalul pentru adăugare/editare jucător */}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPlayerForm}
        editingPlayer={editingPlayer}
        formError={modalFormError || (isModalOpen ? hookError : null)} // Afișează eroarea locală sau cea din hook dacă modalul e deschis
      />
      {/* AlertDialog general */}
      {alertDialog.isOpen && (
        <AlertDialog
          message={alertDialog.message}
          onClose={() => setAlertDialog({ isOpen: false, message: "" })}
        />
      )}
    </div>
  );
};

export default PlayerList;
