import type { UserRole } from "../lib/types";

export interface NavLink {
  name: string;
  href: string;
  roles: Array<UserRole>;
}

export const navigationConfig = {
  main: [
    {
      name: "Generează echipe",
      href: "/genereaza",
      roles: ["admin", "moderator", "user"],
    },
    {
      name: "Confirmări",
      href: "/confirmari",
      roles: ["admin", "user", "moderator"],
    },
    {
      name: "Jucători",
      href: "/players",
      roles: ["admin", "moderator", "user"],
    },
  ] as NavLink[],

  management: [
    {
      name: "Utilizatori",
      href: "/admin/users",
      roles: ["admin", "moderator"],
    },
    {
      name: "Retrageri",
      href: "/retrageri",
      roles: ["admin", "moderator"],
    },
  ] as NavLink[],

  userAccount: [
    { name: "Profil", href: "/profil", roles: ["admin", "moderator", "user"] },
  ] as NavLink[],

  guestAction: {
    name: "Autentifică-te",
    href: "/signin",
    roles: ["guest"],
  } as NavLink,
};
