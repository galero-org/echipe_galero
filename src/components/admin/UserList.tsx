import React, { useEffect, useState } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface DisplayUser extends SupabaseAuthUser {
  app_role?: string;
}

const UserListClient: React.FC = () => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin-users");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Eroare la preluarea utilizatorilor și parsarea erorii.",
          }));
          throw new Error(
            errorData.error ||
              `Eroare ${response.status}: ${response.statusText}`
          );
        }
        const data: SupabaseAuthUser[] = await response.json();

        const processedUsers = data.map((u) => ({
          ...u,
          app_role:
            (u as DisplayUser).app_role ||
            (u.app_metadata?.role as string) ||
            (Array.isArray(u.app_metadata?.roles)
              ? (u.app_metadata.roles[0] as string)
              : "N/A"),
        }));

        setUsers(processedUsers);
      } catch (err) {
        console.error("Eroare la preluarea utilizatorilor:", err);
        setError(
          err instanceof Error ? err.message : "A apărut o eroare necunoscută."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10 font-sans text-text-base">
        Se încarcă utilizatorii...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center mt-10 text-error font-sans">
        Eroare la încărcarea utilizatorilor: {error}
      </p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-center mt-10 font-sans text-text-base">
        Nu s-au găsit utilizatori.
      </p>
    );
  }

  return (
    <div className="bg-surface shadow-lg rounded-lg p-4 md:p-6 overflow-x-auto border border-border">
      {" "}
      {/* Am folosit clase din tema ta */}
      <table className="min-w-full table-auto text-sm font-sans">
        <thead className="bg-gray-light">
          {" "}
          {/* Sau o altă culoare de fundal din temă */}
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-black-alt uppercase tracking-wider">
              ID Utilizator
            </th>
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
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-surface/50 transition-colors duration-100"
            >
              {" "}
              {/* ușor hover */}
              <td className="px-4 py-3 whitespace-nowrap text-text-base text-xs">
                {user.id}
              </td>
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
                      : user.app_role === "user"
                      ? "bg-success/20 text-success"
                      : "bg-gray-light text-text-muted"
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListClient;
