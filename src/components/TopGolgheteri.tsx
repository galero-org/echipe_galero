import React, { useEffect, useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

//=========== TIPURI DE DATE ===========//

export interface Jucator {
  nume: string;
  gf: number;
  gc: number;
  gt: number;
  editii: number;
  eficienta: number;
  golgheter: number; // 👈 nou
}

export type PodiumCriterion =
  | "gt"
  | "gc"
  | "gf"
  | "editii"
  | "eficienta"
  | "golgheter"; // 👈 nou

export const CRITERION_LABELS: Record<PodiumCriterion, string> = {
  gt: "Goluri Totale",
  gc: "Goluri Campionat",
  gf: "Goluri Finală",
  editii: "Ediții Jucate",
  eficienta: "Eficiență",
  golgheter: "De câte ori Golgheter", // 👈 nou
};

//=========== SUB-COMPONENTA: PODIUM ===========//

export interface JucatorPodium extends Jucator {
  rank: number;
}

interface PodiumProps {
  jucatori?: JucatorPodium[];
  criterion: PodiumCriterion;
}

const Podium: React.FC<PodiumProps> = ({ jucatori, criterion }) => {
  if (!jucatori || jucatori.length < 1) {
    return (
      <div className="text-center p-4">Date insuficiente pentru podium...</div>
    );
  }

  const getPodiumStyle = (rank: number) => {
    if (rank === 1)
      return { bg: "bg-yellow-100", border: "border-yellow-400", emoji: "🥇" };
    if (rank === 2)
      return { bg: "bg-gray-100", border: "border-gray-300", emoji: "🥈" };
    if (rank === 3)
      return { bg: "bg-orange-100", border: "border-orange-400", emoji: "🥉" };
    return { bg: "bg-gray-100", border: "border-gray-200", emoji: "🏅" };
  };

  const getLabelForValue = (crit: PodiumCriterion) => {
    if (crit === "editii") return "ediții";
    if (crit === "eficienta") return "goluri / ediție";
    if (crit === "golgheter") return "titluri de golgheter";
    return "goluri";
  };

  const sortedForDisplay = [...jucatori].sort((a, b) => {
    if (a.rank === b.rank) return a[criterion] - b[criterion];
    if (a.rank === 2 && b.rank === 1) return -1;
    if (a.rank === 1 && b.rank === 2) return 1;
    return a.rank - b.rank;
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-center">
        🏆 Podium - {CRITERION_LABELS[criterion]}
      </h2>
      <div className="flex flex-col md:flex-row justify-center items-end gap-2 md:gap-4">
        {sortedForDisplay.map((jucator) => {
          const style = getPodiumStyle(jucator.rank);
          const height = jucator.rank === 1 ? "pt-6" : "pt-2";
          const value = jucator[criterion];

          return (
            <div
              key={jucator.nume}
              className={`w-full md:w-1/4 p-4 rounded-lg border-2 text-center ${style.bg} ${style.border} ${height}`}
            >
              <p className="text-3xl mb-2">{style.emoji}</p>
              <p className="font-bold text-lg">{jucator.nume}</p>
              <p className="text-2xl font-black">
                {criterion === "eficienta" ? Number(value).toFixed(2) : value}
              </p>
              <p className="text-sm text-gray-600">
                {jucator.rank === 1
                  ? "🥇 Locul 1"
                  : jucator.rank === 2
                  ? "🥈 Locul 2"
                  : "🥉 Locul 3"}
              </p>
              <p className="text-sm text-gray-600">
                {getLabelForValue(criterion)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

//=========== COMPONENTA PRINCIPALĂ ===========//

export default function TopGolgheteriTable() {
  const [data, setData] = useState<Jucator[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "gt", desc: true },
  ]);
  const [podiumCriterion, setPodiumCriterion] = useState<PodiumCriterion>("gt");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setSorting([{ id: podiumCriterion, desc: true }]);
  }, [podiumCriterion]);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      "https://script.google.com/macros/library/d/1EhYrR4otqI_yNezUJOWS3EBnYMuRaq4MkfY_qL7wHO29spPGFXT8aeEz/3"
    )
      .then((res) => res.json())
      .then((jucatori) => {
        const procesat = jucatori.map(
          (j: any): Jucator => ({
            ...j,
            eficienta: j.editii ? j.gt / j.editii : 0,
            golgheter: j.golgheter || 0,
          })
        );
        setData(procesat);
      })
      .catch((error) => {
        console.error("Eroare la încărcarea datelor:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const top3 = useMemo(() => {
    if (data.length === 0) return undefined;
    const sorted = [...data].sort(
      (a, b) => b[podiumCriterion] - a[podiumCriterion]
    );
    const podiumList: JucatorPodium[] = [];
    let currentRank = 1;

    for (let i = 0; i < sorted.length; i++) {
      if (
        i > 0 &&
        sorted[i][podiumCriterion] < sorted[i - 1][podiumCriterion]
      ) {
        currentRank = i + 1;
      }
      if (currentRank <= 3) {
        podiumList.push({ ...sorted[i], rank: currentRank });
      } else if (
        sorted[i][podiumCriterion] ===
        podiumList[podiumList.length - 1][podiumCriterion]
      ) {
        podiumList.push({ ...sorted[i], rank: currentRank });
      } else {
        break;
      }
    }
    return podiumList;
  }, [data, podiumCriterion]);

  const columns = useMemo<ColumnDef<Jucator>[]>(
    () => [
      { accessorKey: "nume", header: "Nume" },
      { accessorKey: "gf", header: "Finală" },
      { accessorKey: "gc", header: "Campionat" },
      { accessorKey: "gt", header: "Total" },
      { accessorKey: "editii", header: "Ediții" },
      {
        accessorKey: "eficienta",
        header: "Eficiență",
        cell: (info) => Number(info.getValue() as number).toFixed(2),
      },
      { accessorKey: "golgheter", header: "🏅 Golgheter" }, // 👈 nou
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600 text-lg">Se încarcă datele...</p>
          </div>
        ) : (
          <>
            {/* butoanele pentru criterii */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {(Object.keys(CRITERION_LABELS) as PodiumCriterion[]).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => setPodiumCriterion(key)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      podiumCriterion === key
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Top 3 {CRITERION_LABELS[key]}
                  </button>
                )
              )}
            </div>

            <Podium jucatori={top3} criterion={podiumCriterion} />

            <div className="mt-12">
              <h2 className="text-xl font-bold my-4 text-center md:text-left">
                📊 Clasament General
              </h2>

              {/* CARDURI MOBILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {table.getRowModel().rows.map((row) => (
                  <div
                    key={row.id}
                    className="bg-white p-4 rounded-lg shadow border"
                  >
                    <h3 className="text-lg font-bold mb-2 text-gray-800">
                      {row.original.nume}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Total Goluri:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {row.original.gt}
                        </span>
                      </p>
                      <p>
                        <strong>Ediții:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {row.original.editii}
                        </span>
                      </p>
                      <p>
                        <strong>Campionat:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {row.original.gc}
                        </span>
                      </p>
                      <p>
                        <strong>Finală:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {row.original.gf}
                        </span>
                      </p>
                      <p>
                        <strong>Eficiență:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {Number(row.original.eficienta).toFixed(2)}
                        </span>
                      </p>
                      <p className="col-span-2">
                        <strong>🏅 Golgheter:</strong>{" "}
                        <span className="font-mono text-base text-black">
                          {row.original.golgheter}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TABEL DESKTOP */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow border">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() === "asc"
                              ? " 🔼"
                              : header.column.getIsSorted() === "desc"
                              ? " 🔽"
                              : ""}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 border-b border-gray-200 text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
