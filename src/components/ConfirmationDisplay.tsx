import React, { useState } from "react";
import type { Registration } from "../lib/types";

interface ConfirmationsDisplayProps {
  editionNumber: number;
  registrations: Registration[];
  onUpdateStatus: (
    id: string,
    status: "inscris" | "rezerva" | "retras"
  ) => Promise<void>;
  onUpdatePayment: (id: string, payment: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// 🔹 Funcție care construiește mesajul pentru WhatsApp
function buildWhatsappMessage(
  registrations: Registration[],
  editionNumber: number,
  location: string
): string {
  const inscrisi = registrations
    .filter((r) => r.status === "inscris")
    .sort((a, b) => a.registered_at.localeCompare(b.registered_at));

  const retrasi = registrations
    .filter((r) => r.status === "retras")
    .sort((a, b) => a.registered_at.localeCompare(b.registered_at));

  const rezerve = registrations
    .filter((r) => r.status === "rezerva")
    .sort((a, b) => a.registered_at.localeCompare(b.registered_at));

  let message = `📋 Prezență pentru ediția ${editionNumber} - ${location}:\n`;

  inscrisi.forEach((reg, i) => {
    message += `${i + 1}. ${reg.players?.full_name || "N/A"}\n`;
  });

  if (rezerve.length > 0) {
    message += `\n📋 Rezerve:\n`;
    rezerve.forEach((reg, i) => {
      message += `${i + 1}. ${reg.players?.full_name || "N/A"}\n`;
    });
  }

  if (retrasi.length > 0) {
    message += `\n📋 Lista Rusinii:\n`;
    retrasi.forEach((reg, i) => {
      message += `${i + 1}. ${reg.players?.full_name || "N/A"}\n`;
    });
  }

  return message.trim();
}

export const ConfirmationsDisplay: React.FC<ConfirmationsDisplayProps> = ({
  editionNumber,
  registrations,
  onUpdateStatus,
  onUpdatePayment,
  onDelete,
}) => {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [currentPaymentValue, setCurrentPaymentValue] = useState<number | null>(
    null
  );

  if (registrations.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg mt-4 p-4 bg-white rounded-lg shadow">
        Nu există confirmări pentru această ediție.
      </p>
    );
  }

  const handleCopyWhatsapp = () => {
    const msg = buildWhatsappMessage(registrations, editionNumber, "Galero"); // aici poți schimba ediția/locația
    navigator.clipboard.writeText(msg);
    alert("📋 Mesajul a fost copiat! Poți să-l lipești în WhatsApp ✅");
  };

  const getStatusColor = (status: Registration["status"]) => {
    switch (status) {
      case "inscris":
        return "bg-green-100 text-green-800";
      case "rezerva":
        return "bg-yellow-100 text-yellow-800";
      case "retras":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    regId: string
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) || e.target.value === "") {
      setCurrentPaymentValue(e.target.value === "" ? null : value);
    }
  };

  const handlePaymentBlur = async (regId: string) => {
    setEditingPaymentId(null);
    if (currentPaymentValue !== null) {
      await onUpdatePayment(regId, currentPaymentValue);
    } else {
      await onUpdatePayment(regId, 25);
    }
    setCurrentPaymentValue(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 font-inter">
      {/* 🔹 Butonul de copiere mesaj WhatsApp */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleCopyWhatsapp}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
        >
          Copy WhatsApp message
        </button>
      </div>

      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-100 text-left border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-gray-700 font-semibold">#</th>
            <th className="px-4 py-3 text-gray-700 font-semibold">Nume</th>
            <th className="px-4 py-3 text-gray-700 font-semibold">Status</th>
            <th className="px-4 py-3 text-gray-700 font-semibold">
              Data înscrierii
            </th>
            <th className="px-4 py-3 text-gray-700 font-semibold">Plată</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg, index) => {
            const formattedDate = new Date(reg.registered_at).toLocaleString(
              "ro-RO",
              {
                timeZone: "Europe/Bucharest",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );

            return (
              <tr
                key={reg.id}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {reg.players?.full_name || "N/A"}
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-colors duration-200 ${getStatusColor(
                        reg.status
                      )}`}
                      onClick={() =>
                        setActiveDropdownId(
                          activeDropdownId === reg.id ? null : reg.id
                        )
                      }
                    >
                      {reg.status}
                    </span>
                    {activeDropdownId === reg.id && (
                      <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => {
                            onUpdateStatus(reg.id, "inscris");
                            setActiveDropdownId(null);
                          }}
                        >
                          Inscris
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => {
                            onUpdateStatus(reg.id, "rezerva");
                            setActiveDropdownId(null);
                          }}
                        >
                          Rezerva
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => {
                            onUpdateStatus(reg.id, "retras");
                            setActiveDropdownId(null);
                          }}
                        >
                          Retras
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          onClick={() => {
                            onDelete(reg.id);
                            setActiveDropdownId(null);
                          }}
                        >
                          Șterge
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{formattedDate}</td>
                <td className="px-4 py-3">
                  {editingPaymentId === reg.id ? (
                    <input
                      type="number"
                      value={currentPaymentValue ?? ""}
                      onChange={(e) => handlePaymentChange(e, reg.id)}
                      onBlur={() => handlePaymentBlur(reg.id)}
                      className="w-20 p-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-blue-600 font-semibold"
                      onClick={() => {
                        setEditingPaymentId(reg.id);
                        setCurrentPaymentValue(reg.payment);
                      }}
                    >
                      {reg.payment} RON
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
