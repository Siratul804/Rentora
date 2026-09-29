"use client";

import { useState, useEffect } from "react";
import { ROLES, MOCK_USERS, getRoleDashboardPath } from "@/lib/auth";

const STORAGE_KEY = "rentora_current_user";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to Owner role for demo experience
        const defaultUser = MOCK_USERS[ROLES.OWNER];
        setUser(defaultUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch {
      setUser(MOCK_USERS[ROLES.OWNER]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAs = (role) => {
    const selected = MOCK_USERS[role] || MOCK_USERS[ROLES.OWNER];
    setUser(selected);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch (e) {
      console.error(e);
    }
    return getRoleDashboardPath(role);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    user,
    role: user?.role,
    loading,
    isAuthenticated: !!user,
    loginAs,
    logout,
  };
}
