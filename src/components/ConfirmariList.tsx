import React, { useEffect, useState, useCallback } from "react";
import { ConfirmationsDisplay } from "./ConfirmationDisplay";
import { AlertDialog } from "./AlertDialog"; //
import { EditionManager } from "./confirmari/EditionManager"; //
import { AddConfirmationForm } from "./confirmari/AddConfirmationForm"; //

import { usePlayersSimpleList } from "../hooks/usePlayerSimpleList";
import { useConfirmations } from "../hooks/useConfirmations";

import type { Player, Registration } from "../lib/types"; //

interface ConfirmariListProps {
  initialEditionId?: string;
}

export const ConfirmariList: React.FC<ConfirmariListProps> = ({
  initialEditionId,
}) => {
  const [currentEditionId, setCurrentEditionId] = useState<number | "">( //
    initialEditionId ? parseInt(initialEditionId, 10) : "" //
  );
  const [editionDate, setEditionDate] = useState<string>( //
    new Date().toISOString().slice(0, 10) //
  );
  const [showAlert, setShowAlert] = useState(false); //
  const [alertMessage, setAlertMessage] = useState(""); //

  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = usePlayersSimpleList();

  const {
    registrations,
    loading: confirmationsLoading,
    error: confirmationsError,
    fetchRegistrations,
    addConfirmation,
    updateConfirmationStatus: hookUpdateStatus, // Redenumim pentru a evita conflictul
    deleteConfirmation: hookDeleteConfirm, // Redenumim
  } = useConfirmations();

  const showCustomAlert = useCallback((message: string) => {
    //
    setAlertMessage(message); //
    setShowAlert(true); //
  }, []);

  useEffect(() => {
    // Preluăm confirmările când currentEditionId se schimbă
    fetchRegistrations(currentEditionId);
  }, [currentEditionId, fetchRegistrations]);

  useEffect(() => {
    if (playersError) showCustomAlert(playersError);
  }, [playersError, showCustomAlert]);

  useEffect(() => {
    if (confirmationsError) showCustomAlert(confirmationsError);
  }, [confirmationsError, showCustomAlert]);

  const handleNavigateToEdition = (editionNum: number | "") => {
    //
    if (editionNum !== "") {
      //
      window.location.href = `/confirmari/${editionNum}`; //
    } else {
      //
      window.location.href = `/confirmari`; //
    }
  };

  const handleAddConfirmationSubmit = async (
    playerId: string,
    registeredAtStr: string,
    selectedPlayer: Player
  ) => {
    //
    if (currentEditionId === "") {
      //
      showCustomAlert(
        "Te rugăm să selectezi o ediție înainte de a adăuga o confirmare."
      ); //
      return;
    }
    const newRegData = {
      //
      status: "inscris" as Registration["status"], //
      registered_at: registeredAtStr, //
      player_id: playerId, //
      numar_editie: currentEditionId, //
      players: selectedPlayer, //
    };
    await addConfirmation(newRegData);
    // Mesajul de succes/eroare e gestionat de hook și useEffect
  };

  const handleUpdateRegStatus = async (
    id: string,
    status: Registration["status"]
  ) => {
    //
    const now = new Date(); //
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); //
    const updatedRegisteredAt = now.toISOString(); //
    await hookUpdateStatus(id, status, updatedRegisteredAt);
  };

  const handleDeleteReg = async (id: string) => {
    //
    await hookDeleteConfirm(id);
  };

  // Stare generală de încărcare pentru UI
  const overallLoading =
    playersLoading || (confirmationsLoading && currentEditionId !== "");

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-4 font-inter">
      {" "}
      {/* */}
      <EditionManager
        editionId={currentEditionId}
        onEditionIdChange={setCurrentEditionId} // Pentru input controlat
        onNavigateToEdition={handleNavigateToEdition}
        editionDate={editionDate}
        onEditionDateChange={setEditionDate}
        registrationsForPdf={registrations}
        disabled={overallLoading}
      />
      <AddConfirmationForm
        players={players}
        onAddConfirmation={handleAddConfirmationSubmit}
        disabled={currentEditionId === "" || overallLoading}
        isLoading={confirmationsLoading} // Specific pentru butonul de adăugare
      />
      {overallLoading &&
        currentEditionId !== "" && ( //
          <p className="text-center text-blue-600 text-lg mt-8 animate-pulse p-4 bg-white rounded-lg shadow">
            Se încarcă datele...
          </p>
        )}
      {!overallLoading &&
        currentEditionId !== "" &&
        registrations.length > 0 && ( //
          <ConfirmationsDisplay
            editionNumber={currentEditionId}
            onUpdatePayment={handleUpdateRegStatus}
            registrations={registrations}
            onUpdateStatus={handleUpdateRegStatus}
            onDelete={handleDeleteReg}
          />
        )}
      {/* Mesaj dacă nu sunt confirmări pentru ediția selectată (după încărcare) */}
      {!overallLoading &&
        currentEditionId !== "" &&
        registrations.length === 0 && (
          <p className="text-center text-gray-500 text-lg mt-4 p-4 bg-white rounded-lg shadow">
            {" "}
            {/* */}
            Nu există confirmări pentru această ediție.
          </p>
        )}
      {!overallLoading &&
        currentEditionId === "" && ( //
          <p className="text-center text-gray-500 text-lg mt-8 p-4 bg-white rounded-lg shadow">
            Selectează un număr de ediție pentru a vizualiza confirmările.
          </p>
        )}
      {showAlert && ( //
        <AlertDialog
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        /> //
      )}
    </div>
  );
};

export default ConfirmariList;
