import { useEffect, useState } from "react";
import type { UserProfile } from "../lib/types";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaStar,
  FaShieldAlt,
  FaTools,
} from "react-icons/fa";

export default function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Stare nouă pentru eroare

  useEffect(() => {
    fetch("/api/get-profile")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Eroare la preluarea profilului."); // Aruncăm eroare pentru status-uri non-2xx
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Eroare fetching profile:", err);
        setError(err.message || "A apărut o eroare necunoscută."); // Salvăm mesajul de eroare
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-700 animate-pulse">
          Se încarcă profilul tău...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-500">
          Nu am putut găsi profilul. Te rugăm să te conectezi.
        </p>
      </div>
    );
  }

  // Helper pentru a returna iconița și textul în funcție de rol
  const getRoleDisplay = (role: UserProfile["role"]) => {
    switch (role) {
      case "admin":
        return {
          icon: <FaShieldAlt className="text-yellow-700 mr-2" />,
          text: "Administrator (Acces Complet)",
        };
      case "moderator":
        return {
          icon: <FaTools className="text-green-700 mr-2" />,
          text: "Moderator (Gestiune Utilizatori)",
        };
      case "user":
        return {
          icon: <FaStar className="text-blue-700 mr-2" />,
          text: "Utilizator (Acces Standard)",
        };
      default:
        return {
          icon: <FaUser className="text-gray-700 mr-2" />,
          text: "Necunoscut",
        };
    }
  };

  const { icon: roleIcon, text: roleText } = getRoleDisplay(profile.role);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full transform hover:scale-105 transition-transform duration-300 ease-in-out border border-gray-200">
        <img
          src={
            profile.avatar_url ||
            "https://via.placeholder.com/150/CBD5E0/FFFFFF?text=Avatar"
          } // Placeholder mai mare și mai plăcut
          alt="Avatar utilizator"
          className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-blue-400 shadow-lg object-cover"
        />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
          {profile.full_name || profile.username}
        </h1>
        {profile.full_name && (
          <p className="text-md text-gray-600 mb-4 italic">
            @{profile.username}
          </p>
        )}

        <div className="space-y-3 text-left mb-6">
          <p className="text-gray-700 flex items-center">
            {roleIcon}
            <span className="font-semibold">Rol:</span> {roleText}
          </p>
          {profile.email && (
            <p className="text-gray-700 flex items-center">
              <FaEnvelope className="text-gray-500 mr-2" />
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
          )}
          {profile.phone && (
            <p className="text-gray-700 flex items-center">
              <FaPhone className="text-gray-500 mr-2" />
              <span className="font-semibold">Telefon:</span> {profile.phone}
            </p>
          )}
          <p className="text-gray-700 flex items-center">
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <span className="font-semibold">Cont creat la:</span>{" "}
            {new Date(profile.created_at).toLocaleDateString("ro-RO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="mt-6">
          {profile.role === "admin" && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg shadow-sm">
              <p className="font-medium flex items-center justify-center">
                <FaShieldAlt className="mr-2 text-xl" />
                Administrare completă
              </p>
            </div>
          )}

          {profile.role === "user" && (
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg shadow-sm">
              <p className="font-medium flex items-center justify-center">
                <FaStar className="mr-2 text-xl" />
                Acces standard la evenimente
              </p>
            </div>
          )}

          {profile.role === "moderator" && (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg shadow-sm">
              <p className="font-medium flex items-center justify-center">
                <FaTools className="mr-2 text-xl" />
                Gestionare utilizatori
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
