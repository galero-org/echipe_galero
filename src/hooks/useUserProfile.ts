import { useEffect, useState } from "react";
import type { UserProfile, UserRole } from "../lib/types";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const userRole: UserRole = profile?.user_role;

  return { profile, loading, userRole };
}
