import { createClient } from "@/lib/supabase/server";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
  created_at: string;
};

export type TenantMembership = {
  tenant_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  tenant: Tenant;
};

/**
 * Get the current user's tenant membership(s).
 * Returns the first tenant (most users will have exactly one).
 * Returns null if the user has no tenant yet (needs onboarding).
 */
export async function getCurrentTenant(): Promise<{
  tenant: Tenant;
  role: "owner" | "admin" | "member";
} | null> {
  const supabase = await createClient();
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the user's first tenant membership with tenant details
  const { data: membership, error } = await db
    .from("tenant_members")
    .select("tenant_id, profile_id, role, joined_at, tenants(id, name, slug, owner_id, plan, created_at)")
    .eq("profile_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !membership) return null;

  const tenant = membership.tenants as Tenant;
  if (!tenant) return null;

  return {
    tenant,
    role: membership.role as "owner" | "admin" | "member",
  };
}

/**
 * Get all tenants the current user belongs to.
 * Useful for a future tenant switcher.
 */
export async function getUserTenants(): Promise<TenantMembership[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await db
    .from("tenant_members")
    .select("tenant_id, profile_id, role, joined_at, tenants(id, name, slug, owner_id, plan, created_at)")
    .eq("profile_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return data.map((m: any) => ({
    tenant_id: m.tenant_id,
    profile_id: m.profile_id,
    role: m.role,
    joined_at: m.joined_at,
    tenant: m.tenants as Tenant,
  }));
}

/**
 * Check if a user has any tenant. Used by middleware
 * to decide whether to redirect to onboarding.
 */
export async function userHasTenant(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const db = supabase as any;

  const { count } = await db
    .from("tenant_members")
    .select("tenant_id", { count: "exact", head: true })
    .eq("profile_id", userId);

  return (count || 0) > 0;
}
