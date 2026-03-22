import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    // Gather all user data for GDPR data portability
    const [
      { data: profile },
      { data: clients },
      { data: documents },
      { data: conversations },
      { data: leads },
    ] = await Promise.all([
      db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      db
        .from("clients")
        .select("id, name, slug, config, is_active, plan_tier, created_at")
        .eq("user_id", user.id),
      db
        .from("documents")
        .select("id, client_id, title, file_type, created_at")
        .in(
          "client_id",
          (
            await db
              .from("clients")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((c: any) => c.id) || []
        ),
      db
        .from("conversations")
        .select("id, client_id, visitor_name, visitor_email, status, created_at")
        .in(
          "client_id",
          (
            await db
              .from("clients")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((c: any) => c.id) || []
        ),
      db
        .from("leads")
        .select("id, client_id, name, email, created_at")
        .in(
          "client_id",
          (
            await db
              .from("clients")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((c: any) => c.id) || []
        ),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || {},
      clients: clients || [],
      documents: documents || [],
      conversations: conversations || [],
      leads: leads || [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nexuschat-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
