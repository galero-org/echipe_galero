import React, { useEffect, useMemo, useState } from "react";
import type { ManagedUser, UserRole } from "../../../lib/types";
import UserTable from "./UsersTable";
import EditUserModal from "./EditUserModal";

const UserList: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin-users");

        // PASUL 1: Verifică răspunsul și aruncă o eroare dacă nu e OK
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Eroare la preluarea utilizatorilor.",
          }));
          throw new Error(errorData.error || `Eroare HTTP: ${response.status}`);
        }

        // PASUL 2: Extrage și procesează datele dacă răspunsul e OK
        const responseData: { users: ManagedUser[]; warnings?: string[] } =
          await response.json();
        const processedUsers = responseData.users;
        // PASUL 3: Actualizează starea cu utilizatorii procesați
        setUsers(processedUsers);
        if (responseData.warnings?.length) {
          setWarning(
            `Erori la încărcarea paginilor Auth: ${responseData.warnings.join("; ")}`,
          );
        }
      } catch (err) {
        // PASUL 4: Prinde orice eroare și actualizează starea de eroare
        console.error("Eroare la preluarea utilizatorilor:", err);
        setError(
          err instanceof Error ? err.message : "A apărut o eroare necunoscută.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  // Funcție pentru a deschide modalul
  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Funcție pentru a închide modalul
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Funcție pentru a salva modificările
  const handleSaveUser = async (userId: string, newRole: UserRole) => {
    // Logică de update pe backend
    try {
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: "PATCH", // sau PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Nu s-a putut actualiza utilizatorul.");

      // Actualizăm starea locală pentru un feedback instant
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, app_role: newRole } : u)),
      );
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("ro-RO");
    if (!query) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.phone]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("ro-RO").includes(query)),
    );
  }, [searchTerm, users]);

  if (loading) return <p>Se încarcă utilizatorii...</p>;
  if (error) return <p>Eroare: {error}</p>;
  if (users.length === 0) return <p>Nu s-au găsit utilizatori.</p>;

  return (
    <div className="space-y-4">
      {warning && (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="status"
        >
          {warning}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 shadow-sm">
          <p className="text-xs text-sky-700">Moderatori</p>
          <p className="text-xl font-semibold text-sky-900">
            {users.filter((user) => user.app_role === "moderator").length}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <p className="text-xs text-emerald-700">Utilizatori</p>
          <p className="text-xl font-semibold text-emerald-900">
            {users.filter((user) => user.app_role === "user").length}
          </p>
        </div>
      </div>
      <label className="block">
        <span className="sr-only">Caută utilizatori</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Caută după nume, email sau telefon"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </label>
      <UserTable users={filteredUsers} onEditUser={handleEditUser} />
      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default UserList;
