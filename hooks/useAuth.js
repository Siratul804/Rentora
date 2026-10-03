"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRoleDashboardPath } from "@/lib/auth";

const STORAGE_KEY = "rentora_current_user";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session with server /api/auth/me
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          return data.user;
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
      }
    } catch (err) {
      console.error("Session refresh error:", err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    // 1. Initial quick load from local storage to prevent UI flicker
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse errors
    }

    // 2. Validate with server session
    refresh();
  }, [refresh]);

  /**
   * Log in with email & password
   */
  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));

      return {
        success: true,
        user: data.user,
        redirectUrl: data.redirectUrl || getRoleDashboardPath(data.user?.role),
      };
    } catch (err) {
      return { success: false, error: err.message || "Network error during login" };
    }
  };

  /**
   * Register as an Owner
   */
  const register = async ({ name, email, password, phone }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));

      return {
        success: true,
        user: data.user,
        redirectUrl: data.redirectUrl || "/owner/dashboard",
      };
    } catch (err) {
      return { success: false, error: err.message || "Network error during registration" };
    }
  };

  /**
   * Log out current user
   */
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout network error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      router.push("/login");
      router.refresh();
    }
  };

  return {
    user,
    role: user?.role,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refresh,
  };
}
