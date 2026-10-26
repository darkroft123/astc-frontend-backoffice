"use client";
import { useEffect, useState, useRef, useMemo } from "react";

import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

// [MOCK LOCAL] Devuelve usuario administrador mock siempre autenticado
const MOCK_TOKEN = "mock_jwt_token_local_admin_12345";
const MOCK_USER = {
  id: "admin-001",
  sub: "admin-001",
  email: "admin@astc.joyit.io",
  username: "admin-principal",
  firstName: "Administrador",
  lastName: "Global",
  role: "ADMIN",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  exp: 1893456000,
};

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();
  const rolesKey = allowedRoles.join(",");

  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || checkedRef.current) return;

    if (!token || !user) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    if (user.exp && user.exp < Date.now() / 1000) {
      logout();
      return;
    }

    const currentAllowed = rolesKey.split(",").filter(Boolean);
    if (!role || !currentAllowed.includes(role)) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    checkedRef.current = true;
    setChecking(false);
  }, [hydrated, token, user, role, rolesKey, logout]);

  const activeToken = token || MOCK_TOKEN;
  const activeUser = user || (MOCK_USER as any);
  const activeRole = role || "ADMIN";

  return useMemo(
    () => ({
      hydrated: true,
      token: activeToken,
      user: activeUser,
      role: activeRole,
      checkingAuth: false,
    }),
    [activeToken, activeUser, activeRole]
  );
}
