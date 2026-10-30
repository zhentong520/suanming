"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface UserProfile {
  id: string;
  userId: string | null;
  name: string | null;
  gender: string;
  calendarType: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null;
  birthMinute: number | null;
  birthLongitude?: number | null;
  birthLatitude?: number | null;
  birthLocation?: string | null;
  ziSect?: number | null;
  leapMonth?: boolean | null;
  createdAt: string;
}

export interface UserInfo {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  activeProfileId: string | null;
  role?: string;
  status?: string;
}

export interface PointsInfo {
  balance: number;
  unlimited: boolean;
  billingEnabled: boolean;
}

/** @deprecated */
export interface AiQuotaInfo {
  used: number;
  limit: number;
  remaining: number | null;
  unlimited: boolean;
}

interface UserContextValue {
  user: UserInfo | null;
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  points: PointsInfo | null;
  aiQuota: AiQuotaInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

const AUTH_ONLY_PATHS = ["/login", "/register"];
const AUTH_REQUIRED_PREFIXES = ["/profiles", "/reports", "/onboarding", "/recharge"];

function requiresAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [points, setPoints] = useState<PointsInfo | null>(null);
  const [aiQuota, setAiQuota] = useState<AiQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setProfiles([]);
        setPoints(null);
        setAiQuota(null);
        if (requiresAuth(pathname) && !AUTH_ONLY_PATHS.includes(pathname)) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setProfiles(data.profiles ?? []);
      setPoints(data.points ?? null);
      setAiQuota(data.aiQuota ?? null);
    } catch {
      setUser(null);
      setPoints(null);
      setAiQuota(null);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    if (AUTH_ONLY_PATHS.includes(pathname)) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [pathname, refresh]);

  const activeProfile =
    profiles.find((p) => p.id === user?.activeProfileId) ?? profiles[0] ?? null;

  async function setActiveProfile(profileId: string) {
    const res = await fetch("/api/auth/active-profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    if (!res.ok) throw new Error("切换档案失败");
    await refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setProfiles([]);
    setPoints(null);
    setAiQuota(null);
    router.replace("/");
  }

  return (
    <UserContext.Provider
      value={{
        user,
        profiles,
        activeProfile,
        points,
        aiQuota,
        loading,
        refresh,
        setActiveProfile,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function useOptionalUser() {
  return useContext(UserContext);
}
