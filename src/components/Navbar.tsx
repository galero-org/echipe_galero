// src/components/Navbar.tsx
import { useEffect, useState } from "react";
import type { UserProfile } from "../lib/types";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/get-profile") //
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
      name: "Statistici",
      href: "/statistici",
      roles: ["admin", "moderator", "user"],
    },
    {
      name: "Editii",
      href: "/editii",
      roles: ["admin", "moderator", "user"],
    },

    {
      // LINK NOU PENTRU ADMIN
      name: "Utilizatori (Admin)",
      href: "/admin/users",
      roles: ["admin"], // Doar pentru admini
    },
    {
      name: "Despre Galero Cup",
      href: "/about",
      // Am adăugat 'guest' aici, presupunând că e o pagină publică
      roles: ["admin", "moderator", "user", "guest"],
    },
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
    { name: "Sign In", href: "/signin", roles: ["guest"] },
  ];

  const userRole = profile?.role || "guest";

  return (
    <nav className="bg-background border-b border-border px-4 py-3 md:px-6 shadow-sm">
      {" "}
      {/* Stiluri din temă */}
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl mx-auto">
        <a href="/" className="flex items-center space-x-2">
          <img
            src="https://galero.ro/wp-content/uploads/2022/06/GaleroHD_Logo-e1672300612257.png"
            alt="Galero Logo"
            className="h-8 w-auto" // Păstrează dimensiunea logo-ului
          />
        </a>

        <button
          title="Meniu Mobil" // Titlu mai descriptiv
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center p-2 ml-3 text-sm text-text-muted rounded-lg md:hidden hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary" // Stiluri din temă
        >
          <span className="sr-only">Deschide meniul principal</span>{" "}
          {/* Pentru accesibilitate */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        <div
          className={`${isOpen ? "block" : "hidden"} w-full md:block md:w-auto`} // 'block' e mai potrivit decât string gol
          id="mobile-menu"
        >
          <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm font-medium font-sans">
            {" "}
            {/* font-sans din temă */}
            {navLinks
              .filter((link) => link.roles.includes(userRole))
              .map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block py-2 pr-4 pl-3 text-text-base rounded md:bg-transparent hover:text-primary md:p-0 transition-colors" // Stiluri din temă
                    aria-current={
                      typeof window !== "undefined" &&
                      window.location.pathname === link.href
                        ? "page"
                        : undefined
                    }
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            {profile?.id && (
              <li>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/signout", { method: "GET" }); //
                    window.location.href = "/signin";
                  }}
                  className="text-error hover:underline pl-3 md:pl-0 py-2 block font-medium"
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
