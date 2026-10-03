import React from "react";
import type { ManagedUser } from "../../../lib/types";

interface UserTableProps {
  users: ManagedUser[];
  onEditUser: (user: ManagedUser) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEditUser }) => {
  const roleLabel = (role: ManagedUser["app_role"]) =>
    role === "admin"
      ? "Administrator"
      : role === "moderator"
        ? "Moderator"
        : "Utilizator";
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString("ro-RO") : "Niciodată";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-lg border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-primary">
                  {user.full_name || "Fără nume"}
                </h2>
                <p className="truncate text-sm text-muted">
                  {user.email || "Fără email"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-primary">
                {roleLabel(user.app_role)}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted">Creat</dt>
                <dd className="mt-1 text-text">
                  {formatDate(user.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Ultima conectare</dt>
                <dd className="mt-1 text-text">
                  {formatDate(user.last_sign_in_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Provider</dt>
                <dd className="mt-1 text-text">
                  {user.providers?.join(", ") || "Email"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Email confirmat</dt>
                <dd className="mt-1 text-text">
                  {user.email_confirmed_at ? "Da" : "Nu"}
                </dd>
              </div>
            </dl>
            <button
              onClick={() => onEditUser(user)}
              className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Modifică rolul
            </button>
            <a
              href={`/admin/profil/${user.id}`}
              className="mt-2 block w-full rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-text hover:bg-[var(--color-surface-muted)]"
            >
              Vezi profilul și playerul
            </a>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface p-4 shadow-lg md:block md:p-6">
        <table className="min-w-full table-auto text-sm font-sans">
          <thead className="bg-gray-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Nume
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Creat
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Ultima conectare
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-[var(--color-surface-muted)] transition-colors duration-100"
              >
                <td className="px-4 py-3 whitespace-nowrap text-text-base font-medium">
                  {user.full_name || "Fără nume"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-base">
                  {user.email ?? "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-base">
                  <span
                    className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.app_role === "admin"
                        ? "bg-[var(--color-accent-soft)] text-accent"
                        : user.app_role === "moderator"
                          ? "bg-[var(--color-info-soft)] text-info"
                          : "bg-[var(--color-success-soft)] text-success"
                    }`}
                  >
                    {roleLabel(user.app_role)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-base">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("ro-RO")
                    : "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-base">
                  {formatDate(user.last_sign_in_at)}
                </td>
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
    </div>
  );
};

export default UserTable;
