import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100).optional(),
  company_name: z.string().max(100).optional().or(z.literal("")),
  timezone: z.string().max(60).optional().or(z.literal("")),
  notifications: z
    .object({
      newLead: z.boolean().optional(),
      newConversation: z.boolean().optional(),
      usageAlert: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 }
      );
    }

    const { full_name, company_name, timezone, notifications } = result.data;

    // Only update fields that were actually provided — prevents wiping data
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (company_name !== undefined) updatePayload.company_name = company_name || null;
    if (timezone !== undefined) updatePayload.timezone = timezone || null;
    if (notifications !== undefined) updatePayload.notification_preferences = notifications;

    const { error } = await db
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Profile updated" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { data: profile, error } = await db
      .from("profiles")
      .select(
        "full_name, company_name, role, timezone, notification_preferences"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: {
        email: user.email,
        id: user.id,
        full_name: profile?.full_name || "",
        company_name: profile?.company_name || "",
        role: profile?.role || "user",
        timezone: profile?.timezone || "",
        notifications: profile?.notification_preferences || {
          newLead: true,
          newConversation: false,
          usageAlert: true,
          weeklyDigest: false,
        },
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
