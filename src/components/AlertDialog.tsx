// src/components/AlertDialog.tsx
import React from "react";

interface AlertDialogProps {
  message: string;
  onClose: () => void;
}

/**
 * A custom alert dialog component to display messages to the user.
 * Replaces native browser alert() for better UI control.
 *
 * @param {string} message - The message to be displayed in the dialog.
 * @param {function} onClose - Callback function when the dialog is closed.
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  message,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 font-inter">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto">
        {/* Dialog Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificare</h3>
        {/* Dialog Message */}
        <p className="text-gray-700 mb-6">{message}</p>
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};
