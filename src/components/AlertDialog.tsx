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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 font-inter"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-sm rounded-lg bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-primary">{title}</h3>

        <p className="mb-6 text-sm text-text">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-md bg-surface-muted px-4 py-2 text-sm font-medium text-text transition hover:bg-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-error px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-error)] focus:outline-none focus:ring-2 focus:ring-error"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
