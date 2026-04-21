import React, { useEffect, useState } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import UserTable from "./UsersTable";
import EditUserModal from "./EditUserModal";

interface DisplayUser extends SupabaseAuthUser {
  app_role: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null);

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
        const data: SupabaseAuthUser[] = await response.json();

        const processedUsers = data.map((u): DisplayUser => ({
          ...u,
          app_role:
            (u.app_metadata?.role as string) ||
            (Array.isArray(u.app_metadata?.roles) ? u.app_metadata.roles[0] : "N/A"),
        }));
        
        // PASUL 3: Actualizează starea cu utilizatorii procesați
        setUsers(processedUsers);

      } catch (err) {
        // PASUL 4: Prinde orice eroare și actualizează starea de eroare
        console.error("Eroare la preluarea utilizatorilor:", err);
        setError(err instanceof Error ? err.message : "A apărut o eroare necunoscută.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  // Funcție pentru a deschide modalul
  const handleEditUser = (user: DisplayUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Funcție pentru a închide modalul
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Funcție pentru a salva modificările
  const handleSaveUser = async (userId: string, newRole: string) => {
    // Logică de update pe backend
    try {
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: 'PATCH', // sau PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Nu s-a putut actualiza utilizatorul.");

      // Actualizăm starea locală pentru un feedback instant
      setUsers(users.map(u => u.id === userId ? { ...u, app_role: newRole } : u));
      handleCloseModal();

    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Se încarcă utilizatorii...</p>;
  if (error) return <p>Eroare: {error}</p>;
  if (users.length === 0) return <p>Nu s-au găsit utilizatori.</p>;

  return (
    <div>
      <UserTable users={users} onEditUser={handleEditUser} />
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