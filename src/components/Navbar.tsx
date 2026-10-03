import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { navigationConfig } from "../config/navigation";
import type { UserProfile } from "../lib/types";

interface NavbarProps {
  profile?: UserProfile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const userRole = profile?.user_role || "guest";
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    setIsHydrated(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("galero-theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  }

  const visibleLinks = [
    ...navigationConfig.main,
    ...(userRole === "admin" ? navigationConfig.management : []),
    ...navigationConfig.userAccount,
  ].filter((link) => link.roles.includes(userRole));

  async function handleSignOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") window.location.href = "/signin";
    }
  }

  function renderLinks(mobile = false) {
    return (
      <ul
        className={`flex ${mobile ? "flex-col" : "flex-row items-center"} gap-1 md:gap-2 text-sm font-medium`}
      >
        {visibleLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={() => setIsOpen(false)}
              aria-current={currentPath === link.href ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 transition hover:bg-[var(--color-surface-muted)] hover:text-primary ${currentPath === link.href ? "bg-[var(--color-surface-muted)] font-semibold text-primary" : "text-text"}`}
            >
              {link.name}
            </a>
          </li>
        ))}

        {userRole === "guest" ? (
          <li>
            <a
              href={navigationConfig.guestAction.href}
              onClick={() => setIsOpen(false)}
              className="ml-1 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-on-primary transition hover:bg-primary-hover"
            >
              {navigationConfig.guestAction.name}
            </a>
          </li>
        ) : (
          <li>
            <button
              onClick={handleSignOut}
              className="rounded-full px-3 py-2 text-sm text-error transition hover:bg-[var(--color-error-soft)]"
            >
              Deconectare
            </button>
          </li>
        )}
      </ul>
    );
  }

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!isHydrated}
      aria-label={
        isDark ? "Activează modul luminos" : "Activează modul întunecat"
      }
      title={isDark ? "Mod luminos" : "Mod întunecat"}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border bg-surface text-text transition hover:bg-surface-muted hover:text-primary disabled:opacity-50"
    >
      {isDark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur transition-colors md:px-6">
      <div className="mx-auto flex min-h-11 max-w-6xl items-center justify-between gap-3">
        <a
          href="/"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-primary"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-on-accent shadow-sm">
            G
          </span>
          <span>Galero Cup</span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">{themeButton}</div>

          <button
            title="Meniu Mobil"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={!isHydrated}
            aria-label={
              isOpen ? "Închide meniul principal" : "Deschide meniul principal"
            }
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface-muted p-2 text-text shadow-sm hover:bg-[var(--color-surface-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Deschide meniul principal</span>
            {isOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>

        {!isOpen && <div className="hidden md:block">{renderLinks(false)}</div>}
      </div>

      {isOpen && (
        <div
          className="absolute inset-x-0 top-full border-b border-border bg-surface px-4 py-3 shadow-lg md:hidden"
          id="mobile-menu"
        >
          {renderLinks(true)}
        </div>
      )}
    </nav>
  );
}
