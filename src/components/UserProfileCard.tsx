import { useEffect, useState } from "react";
import type { UserProfile } from "../lib/types";

export default function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Se încarcă profilul...</p>;
  }

  if (!profile) {
    return (
      <p className="text-center text-red-500">Profilul nu a fost găsit.</p>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-md">
        <img
          src={profile.avatar_url || "https://via.placeholder.com/100"}
          alt="Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold">{profile.username}</h1>
        <p className="text-gray-600 mb-2">Rol: {profile.role}</p>
        <p className="text-sm text-gray-400">
          Creat la: {new Date(profile.created_at).toLocaleDateString()}
        </p>

        {profile.role === "admin" && (
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="text-yellow-800 font-medium">
              Ești administrator. Ai acces complet.
            </p>
          </div>
        )}

        {profile.role === "user" && (
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-blue-800 font-medium">
              Ești utilizator. Poți vedea scoruri și echipe.
            </p>
          </div>
        )}

        {profile.role === "moderator" && (
          <div className="mt-4 p-3 bg-green-100 rounded">
            <p className="text-green-800 font-medium">
              Ești moderator. Poți gestiona utilizatorii.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
