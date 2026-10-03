import { useEffect, useState } from "react";
import type { PlayerLinkCandidate, UserProfile } from "../lib/types";
import {
  CalendarDays,
  Edit3,
  Link2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Unlink,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AvatarUploader from "./profile/AvatarUploader";

const roleDetails: Record<
  UserProfile["user_role"],
  { Icon: LucideIcon; label: string; description: string }
> = {
  admin: {
    Icon: ShieldCheck,
    label: "Administrator",
    description: "Acces complet la administrare",
  },
  moderator: {
    Icon: Wrench,
    label: "Moderator",
    description: "Gestionarea utilizatorilor",
  },
  user: {
    Icon: Star,
    label: "Utilizator",
    description: "Acces standard la evenimente",
  },
  guest: {
    Icon: UserRound,
    label: "Vizitator",
    description: "Acces limitat",
  },
};

export default function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Stare nouă pentru eroare
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editData, setEditData] = useState({ full_name: "", phone: "" });
  const [playerOptions, setPlayerOptions] = useState<
    UserProfile["linked_player"][]
  >([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [suggestedPlayer, setSuggestedPlayer] =
    useState<PlayerLinkCandidate | null>(null);
  const [linkingPlayer, setLinkingPlayer] = useState(false);

  useEffect(() => {
    fetch("/api/get-profile")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Eroare la preluarea profilului.");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
        return fetch("/api/profile/player-options");
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data?.players) setPlayerOptions(data.players);
        if (data?.suggested_player) {
          setSuggestedPlayer(data.suggested_player);
          setSelectedPlayerId(data.suggested_player.id);
        }
      })
      .catch((err) => {
        console.error("Eroare fetching profile:", err);
        setError(err.message || "A apărut o eroare necunoscută."); // Salvăm mesajul de eroare
        setLoading(false);
      });
  }, []);

  const startEditing = () => {
    if (!profile) return;
    setEditData({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
    });
    setSaveMessage(null);
    setError(null);
    setIsEditing(true);
  };

  const linkPlayer = async (playerId: string | null) => {
    setLinkingPlayer(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/player-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Profilul de jucător nu a putut fi actualizat.",
        );

      setProfile((current) =>
        current
          ? {
              ...current,
              linked_player_id: playerId,
              linked_player: data.linked_player,
            }
          : current,
      );
      setSelectedPlayerId("");
      setSaveMessage(
        playerId
          ? "Profilul de jucător a fost asociat."
          : "Asocierea a fost eliminată.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profilul de jucător nu a putut fi actualizat.",
      );
    } finally {
      setLinkingPlayer(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveMessage(null);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Profilul nu a putut fi actualizat.");

      setProfile((current) =>
        current
          ? { ...current, full_name: editData.full_name, phone: editData.phone }
          : current,
      );
      setIsEditing(false);
      setSaveMessage("Profil actualizat.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profilul nu a putut fi actualizat.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse text-lg text-text">
          Se încarcă profilul tău...
        </p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="status-error" role="alert">
          <strong className="font-bold">Eroare!</strong>
          <span className="block sm:inline ml-2">
            {error} Vă rugăm să încercați din nou.
          </span>
        </div>
      </div>
    );
  }

  if (!profile) {
    // Acesta este cazul în care loading e false și error e null, dar profile e null (date lipsă de la server)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl text-muted">
          Nu am putut găsi profilul. Te rugăm să te conectezi.
        </p>
      </div>
    );
  }

  const {
    Icon: RoleIcon,
    label: roleLabel,
    description: roleDescription,
  } = roleDetails[profile.user_role];
  const createdAt = new Date(profile.created_at).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <header className="mb-7">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-secondary">
          Contul tău
        </p>
        <h1 className="text-3xl font-bold text-primary">Profilul meu</h1>
        <p className="mt-2 max-w-2xl text-text">
          Actualizează datele contului și conectează profilul tău de jucător
          pentru a-ți vedea activitatea.
        </p>
      </header>

      {error && (
        <p className="status-error mb-5" role="alert">
          {error}
        </p>
      )}
      {saveMessage && (
        <p className="status-success mb-5" role="status">
          {saveMessage}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.85fr)]">
        <section
          className="surface-panel p-5 md:p-7"
          aria-labelledby="personal-heading"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="personal-heading" className="text-xl font-bold text-text">
              Date personale
            </h2>
            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary transition hover:bg-surface-muted"
              >
                <Edit3 size={16} aria-hidden="true" /> Editează datele
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:gap-5">
            <AvatarUploader
              avatarUrl={profile.avatar_url ?? null}
              onUploaded={(newAvatarUrl) =>
                setProfile((current) =>
                  current ? { ...current, avatar_url: newAvatarUrl } : current,
                )
              }
            />
            <div className="min-w-0 pb-5 sm:pb-0">
              <h3 className="break-words text-2xl font-bold text-primary">
                {profile.full_name || profile.username}
              </h3>
              {profile.full_name && (
                <p className="mt-1 text-sm text-muted">@{profile.username}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-info-soft)] px-3 py-1.5 text-sm font-semibold text-info">
                <RoleIcon size={16} aria-hidden="true" />
                <span>{roleLabel}</span>
                <span className="font-normal">· {roleDescription}</span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-text">
                Nume
                <input
                  value={editData.full_name}
                  onChange={(event) =>
                    setEditData((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  className="input-shell mt-1"
                  maxLength={100}
                />
              </label>
              <label className="block text-sm font-semibold text-text">
                Telefon
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(event) =>
                    setEditData((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="input-shell mt-1"
                  maxLength={30}
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  <Save size={16} aria-hidden="true" />
                  {isSaving ? "Se salvează..." : "Salvează modificările"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 font-semibold text-text hover:bg-surface-muted disabled:opacity-50"
                >
                  <X size={16} aria-hidden="true" /> Anulează
                </button>
              </div>
            </div>
          ) : (
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Mail size={16} aria-hidden="true" /> Email
                </dt>
                <dd className="mt-1 break-words font-medium text-text">
                  {profile.email || "Neadăugat"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Phone size={16} aria-hidden="true" /> Telefon
                </dt>
                <dd className="mt-1 break-words font-medium text-text">
                  {profile.phone || "Neadăugat"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <CalendarDays size={16} aria-hidden="true" /> Cont creat la
                </dt>
                <dd className="mt-1 font-medium text-text">{createdAt}</dd>
              </div>
            </dl>
          )}
        </section>

        <section
          className="surface-panel p-5 md:p-7"
          aria-labelledby="player-heading"
        >
          <div className="mb-2 flex items-center gap-2">
            <Link2 size={18} aria-hidden="true" className="text-primary" />
            <h2 id="player-heading" className="text-xl font-bold text-text">
              Profil de jucător
            </h2>
          </div>
          <p className="mb-5 text-sm text-muted">
            Asociază contul cu fișa ta de jucător pentru a lega activitatea de
            meciuri și prezențe.
          </p>

          {profile.linked_player ? (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted">Asociat cu</p>
              <p className="mt-1 break-words text-lg font-bold text-primary">
                {profile.linked_player.full_name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {profile.linked_player.total_presences || 0}{" "}
                {profile.linked_player.total_presences === 1
                  ? "prezență"
                  : "prezențe"}
              </p>
              <button
                type="button"
                onClick={() => linkPlayer(null)}
                disabled={linkingPlayer}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-error hover:bg-[var(--color-error-soft)] disabled:opacity-50"
              >
                <Unlink size={16} aria-hidden="true" />
                {linkingPlayer ? "Se actualizează..." : "Elimină asocierea"}
              </button>
            </div>
          ) : playerOptions.length > 0 ? (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm text-text">Alege fișa care îți aparține.</p>
              {suggestedPlayer && (
                <p className="rounded-md border border-success/30 bg-[var(--color-success-soft)] px-3 py-2 text-sm text-success">
                  Potrivire sugerată:{" "}
                  <strong>{suggestedPlayer.full_name}</strong>
                </p>
              )}
              <label className="block text-sm font-semibold text-text">
                Fișă de jucător
                <select
                  value={selectedPlayerId}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                  className="input-shell mt-1 min-w-0 text-sm"
                >
                  <option value="">Selectează un profil</option>
                  {playerOptions.map((player) => (
                    <option key={player?.id} value={player?.id}>
                      {player?.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => linkPlayer(selectedPlayerId)}
                disabled={!selectedPlayerId || linkingPlayer}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                <Link2 size={16} aria-hidden="true" />
                {linkingPlayer ? "Se asociază..." : "Asociază profilul"}
              </button>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted">
              Nu există momentan o fișă de jucător disponibilă pentru asociere.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
