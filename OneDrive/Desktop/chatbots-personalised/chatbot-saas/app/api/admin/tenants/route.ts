import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(48)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens, start and end with a letter or number"
    ),
});

/**
 * POST /api/admin/tenants — Create a new tenant (organization/workspace)
 * Automatically adds the current user as the owner.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate payload
    const body = await req.json();
    const result = createTenantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, slug } = result.data;

    // 3. Check if slug is already taken
    const { data: existing } = await db
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This workspace URL is already taken. Try a different slug." },
        { status: 409 }
      );
    }

    // 4. Create tenant
    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .insert({
        name,
        slug,
        owner_id: user.id,
      })
      .select("id, name, slug")
      .single();

    if (tenantError) {
      if (tenantError.code === "23505") {
        return NextResponse.json(
          { error: "This workspace URL is already taken." },
          { status: 409 }
        );
      }
      console.error("Failed to create tenant:", tenantError);
      return NextResponse.json(
        { error: `Failed to create workspace: ${tenantError.message}` },
        { status: 500 }
      );
    }

    // 5. Add the user as owner member
    const { error: memberError } = await db.from("tenant_members").insert({
      tenant_id: tenant.id,
      profile_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("Failed to add owner membership:", memberError);
      // Cleanup: delete the orphan tenant
      await db.from("tenants").delete().eq("id", tenant.id);
      return NextResponse.json(
        { error: "Failed to set up workspace membership." },
        { status: 500 }
      );
    }

    // 6. Migrate any existing clients owned by this user to the new tenant
    await db
      .from("clients")
      .update({ tenant_id: tenant.id })
      .eq("user_id", user.id)
      .is("tenant_id", null);

    return NextResponse.json(
      { message: "Workspace created successfully", tenant },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/tenants — Get current user's tenants
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: memberships, error } = await db
      .from("tenant_members")
      .select(
        "tenant_id, role, joined_at, tenants(id, name, slug, owner_id, plan, created_at)"
      )
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch tenants:", error);
      return NextResponse.json(
        { error: "Failed to fetch workspaces" },
        { status: 500 }
      );
    }

    const tenants = (memberships || []).map((m: any) => ({
      ...m.tenants,
      role: m.role,
      joined_at: m.joined_at,
    }));

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
