import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/account/delete
 *
 * Permanently deletes the authenticated user's account and ALL associated data:
 * 1. Snapshots account info into `deleted_accounts` audit table (admin-visible forever)
 * 2. Cancels active LemonSqueezy subscriptions
 * 3. Deletes all clients (CASCADE: documents, chunks, conversations, leads, subscriptions)
 * 4. Deletes auth user (CASCADE: profiles)
 *
 * Requires: { confirmation: "DELETE MY ACCOUNT" } in request body
 * This is irreversible — but admin retains the audit record.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Authenticate the user ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Step 2: Validate confirmation text ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Please type 'DELETE MY ACCOUNT' to confirm deletion" },
        { status: 400 }
      );
    }

    const userId = user.id;
    const adminClient = createAdminClient();
    const db = adminClient as any;

    // ── Step 3: Get all clients owned by this user ──
    const { data: clients, error: clientsError } = await db
      .from("clients")
      .select("id, plan_tier, subscription_status")
      .eq("user_id", userId);

    if (clientsError) {
      console.error("Account deletion - failed to fetch clients:", clientsError);
      return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
    }

    const clientIds = (clients || []).map((c: any) => c.id);

    // ── Step 4: Snapshot account data into audit table (BEFORE deleting anything) ──
    // This record is immutable and only visible to admins.
    try {
      // Fetch profile info
      const { data: profile } = await db
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .maybeSingle();

      // Aggregate usage stats across all clients
      let totalConversations = 0;
      let totalMessages = 0;
      let totalLeads = 0;
      let totalDocuments = 0;
      let subscriptionStatus = null;
      let lemonSubscriptionId = null;

      if (clientIds.length > 0) {
        const [convResult, leadsResult, docsResult, subResult] = await Promise.all([
          db.from("conversations").select("message_count").in("client_id", clientIds),
          db.from("leads").select("id").in("client_id", clientIds),
          db.from("documents").select("id").in("client_id", clientIds),
          db.from("subscriptions").select("lemon_subscription_id, status").in("client_id", clientIds).limit(1),
        ]);

        totalConversations = convResult.data?.length || 0;
        totalMessages = (convResult.data || []).reduce((acc: number, c: any) => acc + (c.message_count || 0), 0);
        totalLeads = leadsResult.data?.length || 0;
        totalDocuments = docsResult.data?.length || 0;

        if (subResult.data && subResult.data.length > 0) {
          subscriptionStatus = subResult.data[0].status;
          lemonSubscriptionId = subResult.data[0].lemon_subscription_id;
        }
      }

      await db.from("deleted_accounts").insert({
        user_id: userId,
        email: user.email,
        full_name: profile?.full_name || null,
        role: profile?.role || "user",
        plan_tier: clients?.[0]?.plan_tier || null,
        total_clients: clientIds.length,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_leads: totalLeads,
        total_documents: totalDocuments,
        subscription_status: subscriptionStatus,
        lemon_subscription_id: lemonSubscriptionId,
        deletion_reason: "user_requested",
      });
    } catch (auditError) {
      // Log but don't block deletion — audit failure should not prevent GDPR compliance
      console.error("Account deletion - failed to create audit record:", auditError);
    }

    // ── Step 5: Cancel all active LemonSqueezy subscriptions ──
    if (clientIds.length > 0) {
      const { data: subscriptions, error: subError } = await db
        .from("subscriptions")
        .select("lemon_subscription_id, status")
        .in("client_id", clientIds);

      if (subError) {
        console.error("Account deletion - failed to fetch subscriptions:", subError);
        return NextResponse.json({ error: "Failed to fetch subscription data" }, { status: 500 });
      }

      const apiKey = process.env.LEMONSQUEEZY_API_KEY;

      if (apiKey && subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          // Only cancel subscriptions that are still active/trialing
          if (["active", "on_trial", "trialing", "past_due", "paused"].includes(sub.status)) {
            try {
              const cancelResponse = await fetch(
                `https://api.lemonsqueezy.com/v1/subscriptions/${sub.lemon_subscription_id}`,
                {
                  method: "DELETE",
                  headers: {
                    Accept: "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                }
              );

              if (!cancelResponse.ok) {
                // Log but don't block deletion — subscription will expire on its own
                console.error(
                  `Account deletion - failed to cancel subscription ${sub.lemon_subscription_id}:`,
                  await cancelResponse.text()
                );
              }
            } catch (cancelError) {
              // Log but don't block deletion
              console.error(
                `Account deletion - error cancelling subscription ${sub.lemon_subscription_id}:`,
                cancelError
              );
            }
          }
        }
      }

      // ── Step 6: Delete all clients (CASCADE deletes: documents, chunks, conversations, leads, subscriptions) ──
      const { error: deleteClientsError } = await db
        .from("clients")
        .delete()
        .in("id", clientIds);

      if (deleteClientsError) {
        console.error("Account deletion - failed to delete clients:", deleteClientsError);
        return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
      }
    }

    // ── Step 7: Delete profile (in case CASCADE doesn't handle it) ──
    await db
      .from("profiles")
      .delete()
      .eq("id", userId);

    // ── Step 8: Delete the auth user (using admin client) ──
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Account deletion - failed to delete auth user:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to delete authentication account. Please contact support." },
        { status: 500 }
      );
    }

    // ── Step 9: Return success ──
    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });

  } catch (error) {
    console.error("Account deletion - unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during account deletion" },
      { status: 500 }
    );
  }
}
