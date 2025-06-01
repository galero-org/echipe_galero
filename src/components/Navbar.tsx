import { useEffect, useState } from "react";
import type { UserProfile } from "../lib/types";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/get-profile")
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  const navLinks = [
    {
      name: "Genereaza Echipe",
      href: "/genereaza",
      roles: ["admin", "moderator"],
    },
    {
      name: "Confirmari",
      href: "/confirmari",
      roles: ["admin", "user", "moderator"],
    },
    {
      name: "Jucatori",
      href: "/players",
      roles: ["admin", "moderator", "user"],
    },
    {
      name: "Despre Galero Cup",
      href: "/about",
      roles: ["admin", "moderator", "user"],
    },
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
    { name: "Sign In", href: "/signin", roles: ["guest"] },
  ];

  const userRole = profile?.role || "guest";

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl mx-auto">
        <a href="/" className="flex items-center space-x-2">
          <img
            src="https://galero.ro/wp-content/uploads/2022/06/GaleroHD_Logo-e1672300612257.png"
            alt="Galero Logo"
            className="h-8 w-auto"
          />
        </a>

        <button
          title="Buton Profil"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div
          className={`${isOpen ? "" : "hidden"} w-full md:block md:w-auto`}
          id="mobile-menu"
        >
          <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
            {navLinks
              .filter((link) => link.roles.includes(userRole))
              .map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block py-2 pr-4 pl-3 rounded md:bg-transparent md:p-0"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            {profile?.id && (
              <li>
                <button
                  onClick={async () => {
                    await fetch("/api/logout", { method: "POST" });
                    window.location.href = "/signin"; // Redirect după logout
                  }}
                  className="text-red-600 hover:underline pl-3 md:pl-0 py-2 block"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
