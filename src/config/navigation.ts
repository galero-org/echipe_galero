import type { UserRole } from "../lib/types";

export interface NavLink {
  name: string;
  href: string;
  roles: Array<UserRole>;
}

export const navigationConfig = {
  main: [
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
      name: "Despre",
      href: "/about",
      roles: ["guest", "user", "moderator", "admin"],
    },
  ] as NavLink[],

  management: [
    {
      name: "Genereaza Echipe",
      href: "/genereaza",
      roles: ["admin", "moderator", "user"],
    },
    { name: "Utilizatori", href: "/admin/users", roles: ["admin"] },
    {
      name: "Retrageri",
      href: "/retrageri",
      roles: ["admin", "moderator", "user"],
    },
  ] as NavLink[],

  userAccount: [
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
  ] as NavLink[],

  guestAction: {
    name: "Sign In",
    href: "/signin",
    roles: ["guest"],
  } as NavLink,
};
