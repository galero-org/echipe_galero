import React, { useState, useEffect, useRef, type FormEvent } from "react";
import { X } from "lucide-react"; //
import type {
  EditablePlayerFields,
  Player,
  PlayerField,
} from "../../lib/types"; //

type PlayerFormData = EditablePlayerFields; //
// Datele inițiale pentru formularul de adăugare
const initialModalFormData: PlayerFormData = {
  //
  full_name: "", //
  grade: 5, // Default grade
  email: "",
  phone: "",
  birthdate: "", // Format YYYY-MM-DD pentru input type="date"
  position: "FIELD", // Default position
};

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Funcția de submit primește datele și ID-ul (dacă e editare), returnează un boolean pentru succes
  onSubmit: (
    playerData: PlayerFormData,
    editingPlayerId: string | null,
  ) => Promise<boolean>;
  editingPlayer: Player | null; // Jucătorul curent pentru editare, sau null pentru adăugare
  // Eroare specifică formularului, pasată de componenta părinte (dacă e cazul, ex: validare complexă)
  formError?: string | null;
}

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingPlayer,
  formError, // Eroarea externă
}) => {
  const [playerFormData, setPlayerFormData] =
    useState<PlayerFormData>(initialModalFormData);
  // Eroare internă a formularului (ex: câmp obligatoriu necompletat)
  const [internalError, setInternalError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Lock scroll pe body
      document.body.style.overflow = "hidden";

      // Focus management - focus pe modal container
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // Resetează formularul și erorile când modalul (re)devine vizibil
      if (editingPlayer) {
        //
        setPlayerFormData({
          //
          full_name: editingPlayer.full_name, //
          grade: editingPlayer.grade, //
          email: editingPlayer.email || "",
          phone: editingPlayer.phone || "",
          position: editingPlayer.position, //
          // Formatează data pentru input type="date"
          birthdate: editingPlayer.birthdate
            ? editingPlayer.birthdate.split("T")[0]
            : "", //
        });
      } else {
        setPlayerFormData(initialModalFormData); //
      }
      setInternalError(null); // Curăță eroarea internă la deschidere/schimbare jucător
    } else {
      // Unlock scroll cand modalul se inchide
      document.body.style.overflow = "unset";
    }

    return () => {
      // Cleanup: restore scroll on unmount
      document.body.style.overflow = "unset";
    };
  }, [isOpen, editingPlayer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //
    const { name, value, type } = e.target; //
    setPlayerFormData((prev) => ({
      //
      ...prev, //
      [name]:
        type === "number" ? (value === "" ? undefined : Number(value)) : value, //
    }));
  };

  const handleSubmitForm = async (e: FormEvent) => {
    //
    e.preventDefault(); //
    setInternalError(null); // Resetează eroarea internă
    if (!playerFormData.full_name.trim()) {
      //
      setInternalError("Numele complet este obligatoriu."); // Setează eroare internă
      return;
    }

    const payload = { ...playerFormData }; //
    if (payload.email === "") delete payload.email; //
    if (payload.phone === "") delete payload.phone; //
    if (payload.birthdate === "") delete payload.birthdate; //
    // Asigură-te că `grade` este un număr sau gestionează cazul `undefined`
    if (payload.grade === undefined || isNaN(payload.grade)) payload.grade = 0; // Sau altă valoare default

    const success = await onSubmit(
      payload,
      editingPlayer ? editingPlayer.id : null,
    );
    if (success) {
      onClose(); // Închide modalul doar la succes
    }
    // Dacă `success` este false, eroarea e gestionată de hook-ul părinte și ar trebui afișată
    // în `PlayerList` sau pasată înapoi aici prin `formError` la următoarea randare.
  };

  if (!isOpen) return null; // Nu randa nimic dacă modalul nu e deschis

  return (
    // Fundal semi-transparent pentru modal
    <div
      className="fixed inset-0 bg-blackAlt/60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={(e) => {
        // Close only if clicking outside the modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {" "}
      {/* */}
      {/* Containerul modalului */}
      <div
        className="bg-surface p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100 border border-border"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {" "}
        {/* */}
        {/* Antetul modalului */}
        <div className="flex justify-between items-center mb-4">
          {" "}
          {/* */}
          <h2 className="text-2xl font-khand text-primary" id="modal-title">
            {" "}
            {/* */}
            {editingPlayer ? "Modifică Jucător" : "Adaugă Jucător Nou"} {/* */}
          </h2>
          <button
            type="button"
            title="Închide modal"
            onClick={onClose}
            className="text-muted hover:text-text"
          >
            {" "}
            {/* */}
            <X size={24} /> {/* */}
          </button>
        </div>
        {/* Afișează eroarea (fie cea internă, fie cea pasată) */}
        {(internalError || formError) && (
          <div className="status-error mb-3">{internalError || formError}</div>
        )}
        {/* Formularul */}
        <form onSubmit={handleSubmitForm}>
          {" "}
          {/* */}
          {/* Câmp Nume Complet */}
          <div className="mb-4">
            {" "}
            {/* */}
            <label
              htmlFor="full_name_modal"
              className="block text-sm font-medium text-text mb-1"
            >
              Nume Complet <span className="text-red-500">*</span>
            </label>{" "}
            {/* */}
            <input
              type="text"
              id="full_name_modal"
              name="full_name"
              value={playerFormData.full_name}
              onChange={handleInputChange}
              className="input-shell"
              required
            />{" "}
            {/* */}
          </div>
          {/* Câmp Email */}
          <div className="mb-4">
            {" "}
            {/* */}
            <label
              htmlFor="email_modal"
              className="block text-sm font-medium text-text mb-1"
            >
              Email
            </label>{" "}
            {/* */}
            <input
              type="email"
              id="email_modal"
              name="email"
              value={playerFormData.email || ""}
              onChange={handleInputChange}
              className="input-shell"
            />{" "}
            {/* */}
          </div>
          {/* Câmp Telefon */}
          <div className="mb-4">
            {" "}
            {/* */}
            <label
              htmlFor="phone_modal"
              className="block text-sm font-medium text-text mb-1"
            >
              Telefon
            </label>{" "}
            {/* */}
            <input
              type="tel"
              id="phone_modal"
              name="phone"
              value={playerFormData.phone || ""}
              onChange={handleInputChange}
              className="input-shell"
            />{" "}
            {/* */}
          </div>
          {/* Câmp Data Nașterii */}
          <div className="mb-4">
            {" "}
            {/* */}
            <label
              htmlFor="birthdate_modal"
              className="block text-sm font-medium text-text mb-1"
            >
              Data Nașterii
            </label>{" "}
            {/* */}
            <input
              type="date"
              id="birthdate_modal"
              name="birthdate"
              value={playerFormData.birthdate || ""}
              onChange={handleInputChange}
              className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
            />{" "}
            {/* */}
          </div>
          {/* Câmp Nivel */}
          <div className="mb-4">
            {" "}
            {/* */}
            <label
              htmlFor="grade_modal"
              className="block text-sm font-medium text-text mb-1"
            >
              Nivel (1-10)
            </label>{" "}
            {/* */}
            <input
              type="number"
              id="grade_modal"
              name="grade"
              min="1"
              max="10"
              step="0.1"
              value={
                playerFormData.grade === undefined ? "" : playerFormData.grade
              }
              onChange={handleInputChange}
              className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
            />{" "}
            {/* */}
            {/* Câmp Poziție */}
            <div className="mb-4">
              <label
                htmlFor="position_modal"
                className="block text-sm font-medium text-text mb-1"
              >
                Poziție
              </label>
              <select
                id="position_modal"
                name="position"
                value={playerFormData.position}
                onChange={(e) =>
                  setPlayerFormData((prev) => ({
                    ...prev,
                    position: e.target.value as PlayerField,
                  }))
                }
                className="w-full p-2 border border-grayLight rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="FIELD">Jucător de câmp</option>
                <option value="GK">Portar</option>
              </select>
            </div>
          </div>
          {/* Butoane Acțiune */}
          <div className="flex justify-end space-x-3 mt-6">
            {" "}
            {/* */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-md"
            >
              Anulează
            </button>{" "}
            {/* */}
            {/* Am ajustat culoarea textului butonului de submit pentru contrast cu fundalul primar, dacă e închis la culoare */}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium  bg-primary hover:bg-secondary rounded-md shadow-sm"
            >
              {" "}
              {/* */}
              {editingPlayer ? "Salvează Modificări" : "Adaugă Jucător"} {/* */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
