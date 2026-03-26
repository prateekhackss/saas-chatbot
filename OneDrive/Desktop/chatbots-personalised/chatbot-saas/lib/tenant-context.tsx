"use client";

import { createContext, useContext } from "react";
import type { Tenant } from "@/lib/tenant";

type TenantContextValue = {
  tenant: Tenant;
  role: "owner" | "admin" | "member";
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenant,
  role,
  children,
}: TenantContextValue & { children: React.ReactNode }) {
  return (
    <TenantContext.Provider value={{ tenant, role }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return ctx;
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
