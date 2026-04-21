import { useState } from "react";
import type { UserProfile } from "../lib/types";

interface NavbarProps {
  profile: UserProfile | null;
}

// Acceptăm profilul direct ca prop
export default function Navbar({ profile }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const userRole = profile?.user_role || "guest";

  const navLinks = [
    {
      name: "Genereaza Echipe",
      href: "/genereaza",
      roles: ["admin", "moderator", "user"],
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
      roles: ["admin"],
    },
    {
      name: "Despre Galero Cup",
      href: "/about",
      // Păstrăm guest aici
      roles: ["admin", "moderator", "user", "guest"],
    },
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
    // Afișează Sign In doar dacă nu este autentificat
    { name: "Sign In", href: "/signin", roles: ["guest"] },
  ];

  return (
    <nav className="bg-background border-b border-border px-4 py-3 md:px-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl mx-auto">
        <a href="/" className="flex items-center space-x-2">
          <img
            src="https://galero.ro/wp-content/uploads/2022/06/GaleroHD_Logo-e1672300612257.png"
            alt="Galero Logo"
            className="h-8 w-auto"
          />
        </a>

        <button
          title="Meniu Mobil"
          type="button"
          onClick={() => {
            console.log("Buton mobil clicked, isOpen was:", isOpen);
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center p-2 ml-3 text-sm text-text-muted rounded-lg md:hidden hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">Deschide meniul principal</span>
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

        {/* Meniu - show/hide based on isOpen state */}
        {isOpen && (
          <div className="w-full md:hidden block" id="mobile-menu">
            <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm font-medium font-sans">
              {navLinks
                // Filtrează Sign In dacă utilizatorul este autentificat (profile?.id există)
                .filter((link) => {
                  const isGuestLink = link.name === "Sign In";
                  const isAuthenticated = profile?.id;

                  // Dacă este linkul de Sign In, afișează-l doar dacă NU e autentificat
                  if (isGuestLink) {
                    return !isAuthenticated;
                  }

                  // Altfel, afișează linkul dacă rolul este inclus
                  return link.roles.includes(userRole);
                })
                .map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 pr-4 pl-3 text-text-base rounded hover:text-primary transition-colors"
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
                      await fetch("/api/auth/signout", { method: "POST" });
                      window.location.href = "/signin";
                    }}
                    className="text-error hover:underline pl-3 py-2 block font-medium"
                  >
                    Logout ({userRole})
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Desktop menu */}
        <div className="hidden md:flex items-center md:space-x-8">
          <ul className="flex flex-row md:space-x-8 md:text-sm font-medium font-sans">
            {navLinks
              .filter((link) => {
                const isGuestLink = link.name === "Sign In";
                const isAuthenticated = profile?.id;

                if (isGuestLink) {
                  return !isAuthenticated;
                }

                return link.roles.includes(userRole);
              })
              .map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="py-2 pr-4 pl-3 text-text-base rounded hover:text-primary transition-colors"
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
                    await fetch("/api/auth/signout", { method: "POST" });
                    window.location.href = "/signin";
                  }}
                  className="text-error hover:underline pl-3 py-2 font-medium"
                >
                  Logout ({userRole})
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
