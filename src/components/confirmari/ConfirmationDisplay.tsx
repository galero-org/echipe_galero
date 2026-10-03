import React, { useState, useMemo } from "react";
import type { Registration } from "../../lib/types";

interface ConfirmationsDisplayProps {
  editionNumber: number;
  location: string;
  registrations: Registration[];
  onUpdateStatus: (
    id: string,
    status: "inscris" | "rezerva" | "retras",
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function buildWhatsappMessage(
  inscrisi: Registration[],
  rezerve: Registration[],
  retrasi: Registration[],
  editionNumber: number,
  location: string,
): string {
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
    message += `\n📋 Lista Rușinii:\n`;
    retrasi.forEach((reg, i) => {
      message += `${i + 1}. ${reg.players?.full_name || "N/A"}\n`;
    });
  }

  return message.trim();
}

const Toast: React.FC<{ message: string; onDismiss: () => void }> = ({
  message,
  onDismiss,
}) => (
  <div
    className="fixed bottom-4 right-4 bg-gray-800 text-white px-5 py-3 rounded-lg shadow-xl transition-all duration-300 animate-pulse"
    role="alert"
  >
    <span>{message}</span>
    <button onClick={onDismiss} className="ml-4 font-bold text-lg">
      &times;
    </button>
  </div>
);

export const ConfirmationsDisplay: React.FC<ConfirmationsDisplayProps> = ({
  editionNumber,
  location,
  registrations,
  onUpdateStatus,
  onDelete,
}) => {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("ro-RO", {
        timeZone: "Europe/Bucharest",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  const { inscrisi, rezerve, retrasi } = useMemo(() => {
    const sorted = [...registrations].sort(
      (a, b) =>
        new Date(a.registered_at).getTime() -
        new Date(b.registered_at).getTime(),
    );
    return {
      inscrisi: sorted.filter((r) => r.status === "inscris"),
      rezerve: sorted.filter((r) => r.status === "rezerva"),
      retrasi: sorted.filter((r) => r.status === "retras"),
    };
  }, [registrations]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyWhatsapp = () => {
    const msg = buildWhatsappMessage(
      inscrisi,
      rezerve,
      retrasi,
      editionNumber,
      location,
    );
    navigator.clipboard.writeText(msg).then(() => {
      showToast("📋 Mesajul a fost copiat!"); // Am înlocuit alert()
    });
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

  const renderRegistrationRow = (
    reg: Registration,
    index: number,
    listType: "inscris" | "rezerva" | "retras",
  ) => {
    const displayIndex =
      listType === "inscris"
        ? index + 1
        : listType === "rezerva"
          ? `R${index + 1}`
          : `T${index + 1}`;

    return (
      <tr
        key={reg.id}
        className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-4 py-3 font-mono text-gray-600">{displayIndex}</td>
        <td className="px-4 py-3 font-medium text-gray-800">
          {reg.players?.full_name || "N/A"}
        </td>
        <td className="px-4 py-3">
          <div className="relative inline-block">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-colors duration-200 ${getStatusColor(
                reg.status,
              )}`}
              onClick={() =>
                setActiveDropdownId(activeDropdownId === reg.id ? null : reg.id)
              }
            >
              {reg.status}
            </span>
            {activeDropdownId === reg.id && (
              <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onUpdateStatus(reg.id, "inscris");
                    setActiveDropdownId(null);
                  }}
                >
                  Înscris
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onUpdateStatus(reg.id, "rezerva");
                    setActiveDropdownId(null);
                  }}
                >
                  Rezervă
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onUpdateStatus(reg.id, "retras");
                    setActiveDropdownId(null);
                  }}
                >
                  Retras
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
        <td className="px-4 py-3 text-gray-600">
          {dateFormatter.format(new Date(reg.registered_at))}
        </td>
      </tr>
    );
  };

  if (registrations.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg mt-4 p-4 bg-white rounded-lg shadow">
        Nu există confirmări pentru această ediție.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 font-inter">
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <div className="flex flex-col gap-3 p-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-3 flex-1">
          <div className="rounded-lg border border-green-100 bg-green-50 p-3">
            <p className="text-sm text-green-700">Înscriși</p>
            <p className="text-xl font-semibold text-green-800">
              {inscrisi.length}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-700">Rezerve</p>
            <p className="text-xl font-semibold text-yellow-800">
              {rezerve.length}
            </p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-3">
            <p className="text-sm text-red-700">Retrasi</p>
            <p className="text-xl font-semibold text-red-800">
              {retrasi.length}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCopyWhatsapp}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors"
          >
            Copiază mesaj WhatsApp
          </button>
        </div>
      </div>

      <section className="p-4">
        <h3 className="text-xl font-semibold text-green-700 mb-2">
          Înscriși ({inscrisi.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 text-left border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-gray-700 font-semibold">#</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Nume</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-gray-700 font-semibold">
                  Data înscrierii
                </th>
              </tr>
            </thead>
            <tbody>
              {inscrisi.map((reg, index) =>
                renderRegistrationRow(reg, index, "inscris"),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Lista Rezerve */}
      {rezerve.length > 0 && (
        <section className="p-4 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-yellow-700 mb-2">
            Rezerve ({rezerve.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              {/* Antetul e duplicat pentru lizibilitate pe mobil */}
              <thead className="bg-gray-100 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-gray-700 font-semibold">#</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Nume
                  </th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Data înscrierii
                  </th>
                </tr>
              </thead>
              <tbody>
                {rezerve.map((reg, index) =>
                  renderRegistrationRow(reg, index, "rezerva"),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Lista Retrași */}
      {retrasi.length > 0 && (
        <section className="p-4 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-red-700 mb-2">
            Retrași ({retrasi.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-gray-700 font-semibold">#</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Nume
                  </th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">
                    Data înscrierii
                  </th>
                </tr>
              </thead>
              <tbody>
                {retrasi.map((reg, index) =>
                  renderRegistrationRow(reg, index, "retras"),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
