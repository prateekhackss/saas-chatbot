import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/admin/notifications — fetch user's notifications
export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    let query = db
      .from("notifications")
      .select("id, type, title, message, client_id, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Also get unread count
    const { count: unreadCount } = await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: data || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/notifications — mark notifications as read
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
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all unread as read
      await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific ones as read
      await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("id", notificationIds);
    } else {
      return NextResponse.json({ error: "Provide notificationIds or markAllRead" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
