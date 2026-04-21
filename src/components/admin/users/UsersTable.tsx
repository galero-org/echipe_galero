import React from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface DisplayUser extends SupabaseAuthUser {
  app_role: string;
}

interface UserTableProps {
  users: DisplayUser[];
  onEditUser: (user: DisplayUser) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEditUser }) => {
  return (
    <div className="bg-surface shadow-lg rounded-lg p-4 md:p-6 overflow-x-auto border border-border">
      <table className="min-w-full table-auto text-sm font-sans">
        <thead className="bg-gray-light">
          <tr>
            {/* ▼ AICI SUNT COLOANELE ADĂUGATE ▼ */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              Rol Aplicație
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              Creat La
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              Ultima Conectare
            </th>
            {/* ▲ SFÂRȘITUL COLOANELOR ADĂUGATE ▲ */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              Acțiuni
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-surface/50 transition-colors duration-100"
            >
              {/* ▼ AICI SUNT CELULELE ADĂUGATE ▼ */}
              <td className="px-4 py-3 whitespace-nowrap text-text-base">
                {user.email ?? "N/A"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-text-base">
                <span
                  className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.app_role === "admin"
                      ? "bg-accent/20 text-accent"
                      : user.app_role === "moderator"
                      ? "bg-info/20 text-info"
                      : "bg-success/20 text-success"
                  }`}
                >
                  {user.app_role}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-text-base">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("ro-RO")
                  : "N/A"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-text-base">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString("ro-RO")
                  : "Niciodată"}
              </td>
              {/* ▲ SFÂRȘITUL CELULELOR ADĂUGATE ▲ */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditUser(user)}
                    className="text-primary hover:underline text-xs font-semibold"
                  >
                    Modifică Rol
                  </button>
                  <a
                    href={`/admin/profil/${user.id}`} // Link către profilul utilizatorului
                    className="text-text-muted hover:underline text-xs"
                  >
                    Vezi Profil
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
