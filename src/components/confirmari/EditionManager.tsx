// components/confirmari/EditionManager.tsx
import React, { useState, useEffect } from "react";
import type { Registration } from "../../lib/types";
import { useDebouncedCallback } from "use-debounce"; // Importăm hook-ul

interface EditionManagerProps {
  editionId: number | "";
  onEditionIdChange: (value: number | "") => void;
  onNavigateToEdition: (editionNum: number | "") => void;
  editionDate: string;
  onEditionDateChange: (date: string) => void;
  registrationsForPdf: Registration[];
  disabled: boolean;
}

export const EditionManager: React.FC<EditionManagerProps> = ({
  editionId,
  onEditionIdChange,
  onNavigateToEdition,
  editionDate,
  onEditionDateChange,
  registrationsForPdf,
  disabled,
}) => {
  // Starea locală pentru valoarea curentă a inputului (se actualizează la fiecare tastare)
  // Aceasta asigură că input-ul este reactiv imediat ce utilizatorul tastează.
  const [localEditionInput, setLocalEditionInput] = useState<string>(
    editionId === "" ? "" : String(editionId)
  );

  // Sincronizează `localEditionInput` cu prop-ul `editionId`
  // Acest lucru este important dacă `editionId` poate fi modificat de un alt loc (ex: URL la încărcarea inițială)
  useEffect(() => {
    setLocalEditionInput(editionId === "" ? "" : String(editionId));
  }, [editionId]);

  // Creăm o versiune debounced a funcției care actualizează starea și navighează.
  // Aceasta se va executa la 500ms după ultima modificare a inputului.
  const debouncedUpdateEdition = useDebouncedCallback(
    (value: string) => {
      const newEditionNum = value === "" ? "" : parseInt(value, 10);
      onEditionIdChange(newEditionNum); // Actualizează starea în componenta părinte
      onNavigateToEdition(newEditionNum); // Declanșează navigarea URL
    },
    500 // Delay-ul de 500 milisecunde
  );

  const handleEditionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Actualizăm imediat starea locală pentru a menține controlul inputului
    setLocalEditionInput(e.target.value);
    // Apelăm funcția debounced. Aceasta va programa execuția actualizării
    // și navigării, dar doar după ce utilizatorul se oprește din tastat pentru 500ms.
    debouncedUpdateEdition(e.target.value);
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg flex flex-col sm:flex-row gap-6 items-center border border-blue-100">
      <label
        htmlFor="editionIdInput"
        className="block text-gray-800 text-lg font-bold min-w-[120px]"
      >
        Număr Ediție:
      </label>
      <input
        type="number"
        id="editionIdInput"
        className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
        value={localEditionInput} // Folosim starea locală aici
        onChange={handleEditionInputChange} // Și handler-ul care apelează funcția debounced
        placeholder="Ex: 1, 2, 3..."
        min="1"
        disabled={disabled}
      />
      <label
        htmlFor="editionDateInput"
        className="block text-gray-800 text-lg font-bold min-w-[120px] sm:ml-4"
      >
        Data Ediției:
      </label>
      <input
        type="date"
        id="editionDateInput"
        className="shadow-inner appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
        value={editionDate}
        onChange={(e) => onEditionDateChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};
