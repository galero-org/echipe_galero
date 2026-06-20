import { useState } from "react";

interface NavbarProps {
  profile?: any | null;
}

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
    { name: "Editii", href: "/editii", roles: ["admin", "moderator", "user"] },
    { name: "Utilizatori (Admin)", href: "/admin/users", roles: ["admin"] },
    {
      name: "Despre Galero Cup",
      href: "/about",
      roles: ["admin", "moderator", "user", "guest"],
    },
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
    { name: "Sign In", href: "/signin", roles: ["guest"] },
  ];

  const filteredLinks = navLinks.filter((link) =>
    link.roles.includes(userRole),
  );

  async function handleSignOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") window.location.href = "/signin";
    }
  }

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
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center p-2 ml-3 text-sm text-text-muted rounded-lg md:hidden hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">Deschide meniul principal</span>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        {isOpen && (
          <div className="w-full md:hidden block" id="mobile-menu">
            <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm font-medium font-sans">
              {filteredLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-2 pr-4 pl-3 text-text-base rounded hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}

              {!profile && (
                <>
                  <li>
                    <a href="/signin" className="block py-2 pr-4 pl-3">
                      Sign In
                    </a>
                  </li>
                  <li>
                    <a href="/register" className="block py-2 pr-4 pl-3">
                      Register
                    </a>
                  </li>
                </>
              )}

              {profile && (
                <li>
                  <button
                    onClick={handleSignOut}
                    className="text-error hover:underline pl-3 py-2 block font-medium"
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="hidden md:flex items-center md:space-x-8">
          <ul className="flex flex-row md:space-x-8 md:text-sm font-medium font-sans">
            {filteredLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="py-2 pr-4 pl-3 text-text-base rounded hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}

            {!profile && (
              <>
                <li>
                  <a href="/signin" className="py-2 pr-4 pl-3">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="/register" className="py-2 pr-4 pl-3">
                    Register
                  </a>
                </li>
              </>
            )}

            {profile && (
              <li>
                <button
                  onClick={handleSignOut}
                  className="text-error hover:underline pl-3 py-2 font-medium"
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
