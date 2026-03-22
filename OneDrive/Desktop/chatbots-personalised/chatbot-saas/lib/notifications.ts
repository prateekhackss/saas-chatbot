import { createAdminClient } from "@/lib/supabase/admin";

type NotificationType = "lead_captured" | "new_conversation" | "usage_warning";

/**
 * Create an in-app notification for a user.
 * Uses admin client to bypass RLS (since this is called from API routes).
 * Checks the user's notification preferences before creating.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  clientId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  clientId?: string;
}) {
  try {
    const supabase = createAdminClient() as any;

    // Check user's notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();

    const prefs = profile?.notification_preferences || {};

    // Map notification type to preference key
    const prefMap: Record<NotificationType, string> = {
      lead_captured: "newLeadCaptured",
      new_conversation: "newConversation",
      usage_warning: "usageLimitWarning",
    };

    const prefKey = prefMap[type];
    // Default to true if preference not explicitly set
    if (prefKey && prefs[prefKey] === false) {
      return; // User disabled this notification type
    }

    // Deduplicate: don't create duplicate notifications within 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("title", title)
      .gte("created_at", oneMinuteAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Skip duplicate
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      client_id: clientId || null,
    });
  } catch (error) {
    // Never let notification errors break the main flow
    console.error("Failed to create notification:", error);
  }
}
