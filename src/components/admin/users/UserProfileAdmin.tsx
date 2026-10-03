import { useEffect, useState } from "react";
import type { ManagedUserDetail, Player, UserRole } from "../../../lib/types";

interface UserProfileAdminProps {
  userId: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  moderator: "Moderator",
  user: "Utilizator",
  guest: "Vizitator",
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("ro-RO") : "Niciodată";
}

export default function UserProfileAdmin({ userId }: UserProfileAdminProps) {
  const [user, setUser] = useState<ManagedUserDetail | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [role, setRole] = useState<UserRole>("user");
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [userResponse, playersResponse] = await Promise.all([
          fetch(`/api/admin-users/${userId}`),
          fetch("/api/players"),
        ]);
        if (!userResponse.ok)
          throw new Error("Profilul nu a putut fi încărcat.");
        if (!playersResponse.ok)
          throw new Error("Lista de jucători nu a putut fi încărcată.");

        const userData = (await userResponse.json()) as ManagedUserDetail;
        const playerData = (await playersResponse.json()) as Player[];
        setUser(userData);
        setRole(userData.app_role);
        setPlayerId(userData.linked_player?.id ?? "");
        setPlayers(playerData);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "A apărut o eroare.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, player_id: playerId || null }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Modificările nu au putut fi salvate.");
      setMessage("Profilul a fost actualizat.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "A apărut o eroare.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <p className="py-10 text-center text-muted">Se încarcă profilul...</p>
    );
  if (error && !user)
    return (
      <p className="rounded-lg bg-[var(--color-error-soft)] p-4 text-error">
        {error}
      </p>
    );
  if (!user)
    return <p className="py-10 text-center text-muted">Profil indisponibil.</p>;

  return (
    <div className="space-y-5">
      <a
        href="/admin/users"
        className="inline-flex text-sm font-semibold text-muted hover:text-primary"
      >
        ← Înapoi la utilizatori
      </a>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Profil utilizator</p>
            <h1 className="mt-1 text-2xl font-bold text-primary">
              {user.full_name || "Fără nume"}
            </h1>
            <p className="mt-1 text-text">{user.email || "Fără email"}</p>
          </div>
          <span className="w-fit rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-sm font-semibold text-primary">
            {roleLabels[user.app_role]}
          </span>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Telefon</dt>
            <dd className="mt-1 text-sm text-primary">
              {user.phone || "Nespecificat"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Provider</dt>
            <dd className="mt-1 text-sm text-primary">
              {user.providers?.join(", ") || "Email"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Cont creat</dt>
            <dd className="mt-1 text-sm text-primary">
              {formatDate(user.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Ultima conectare</dt>
            <dd className="mt-1 text-sm text-primary">
              {formatDate(user.last_sign_in_at)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-primary">
          Permisiuni și player asociat
        </h2>
        <p className="mt-1 text-sm text-muted">
          Rolul controlează accesul, iar playerul asociat leagă contul de
          prezențe și statistici.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-text">
            Rol
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="input-shell mt-1 px-3 py-3 font-normal"
            >
              <option value="user">Utilizator</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Player asociat
            <select
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              className="input-shell mt-1 px-3 py-3 font-normal"
            >
              <option value="">Fără player asociat</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {message && (
          <p
            className="mt-4 rounded-lg bg-[var(--color-success-soft)] px-4 py-3 text-sm text-success"
            role="status"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            className="mt-4 rounded-lg bg-[var(--color-error-soft)] px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-5 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Se salvează..." : "Salvează modificările"}
        </button>
      </section>
    </div>
  );
}
