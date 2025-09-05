import React from "react";
import { Users } from "lucide-react";

type WithdrawnPlayer = {
  full_name: string;
  retrageri: number;
  prezente: number;
};

type Props = {
  players: WithdrawnPlayer[];
};

export const PlayersWithdrawnList: React.FC<Props> = ({ players }) => {
  return (
    <div className="w-full max-w-7xl mx-auto mt-8 p-4 font-text">
      {/* Antetul paginii */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-khand text-primary flex items-center gap-2">
          <Users size={28} /> Statistici retrageri
        </h1>
      </div>

      {/* Fără date */}
      {players.length === 0 ? (
        <p className="text-center text-gray-500 mt-10 text-lg">
          Nu există jucători retrași.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow-xl overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-text">
            <thead className="bg-grayLight text-left text-blackAlt uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-3">Nume complet</th>
                <th className="px-5 py-3 text-center">Retrageri</th>
                <th className="px-5 py-3 text-center">Prezențe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.full_name} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-medium">{player.full_name}</td>
                  <td className="px-5 py-2 text-center">{player.retrageri}</td>
                  <td className="px-5 py-2 text-center">{player.prezente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayersWithdrawnList;
