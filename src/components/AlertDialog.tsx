// src/components/ConfirmDialog.tsx
import React from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string; // Text buton confirmare (opțional)
  cancelText?: string; // Text buton anulare (opțional)
}

/**
 * Un dialog de confirmare care cere utilizatorului o acțiune.
 * Prezintă un titlu, mesaj și două butoane: Confirmare și Anulare.
 *
 * @param {string} title - Titlul dialogului.
 * @param {string} message - Mesajul de confirmare.
 * @param {function} onClose - Callback la click pe "Anulează" sau în afara.
 * @param {function} onConfirm - Callback la click pe "Confirmă".
 */
export const AlertDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirmă",
  cancelText = "Anulează",
}) => {
  return (
    // Fundal semi-transparent
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 font-inter"
      onClick={onClose} // Închide la click pe fundal
    >
      {/* Containerul dialogului */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()} // Oprește închiderea la click pe dialog
      >
        {/* Titlu */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        {/* Mesaj */}
        <p className="text-sm text-gray-700 mb-6">{message}</p>

        {/* Butoane */}
        <div className="flex justify-end space-x-3">
          {/* Buton Anulare */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
          >
            {cancelText}
          </button>

          {/* Buton Confirmare (cu stil de "pericol") */}
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
