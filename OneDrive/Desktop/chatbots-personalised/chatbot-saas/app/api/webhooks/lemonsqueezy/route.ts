import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Verify the webhook signature from LemonSqueezy
function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  const digestBuf = Buffer.from(digest, "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (digestBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(digestBuf, sigBuf);
}

// Derive plan tier from plan_id string (e.g. "pro_monthly" → "pro")
function derivePlanTier(planId: string): string {
  if (planId.includes("business")) return "business";
  if (planId.includes("starter")) return "starter";
  if (planId.includes("pro")) return "pro";
  return ""; // unknown — caller must handle
}

// Map LemonSqueezy subscription status → app status
function toAppStatus(lsStatus: string): string {
  if (lsStatus === "active" || lsStatus === "on_trial") return "active";
  if (lsStatus === "past_due" || lsStatus === "unpaid") return "past_due";
  if (lsStatus === "cancelled" || lsStatus === "expired" || lsStatus === "paused") return "canceled";
  return lsStatus;
}

// Helper: update user-level subscription on profiles table
async function updateUserSubscription(
  supabaseAdmin: any,
  userId: string,
  status: string,
  planTier: string,
  subscriptionId: string,
  periodEnd: string | null
) {
  const appStatus = toAppStatus(status);

  // Only update plan_tier if we actually have one (don't overwrite with empty)
  const updatePayload: any = {
    subscription_status: appStatus,
    subscription_id: subscriptionId,
    subscription_current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };
  if (planTier) {
    updatePayload.plan_tier = planTier;
  }

  await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  // Sync all user's clients to match the user's plan tier
  const clientUpdate: any = { subscription_status: appStatus };
  if (planTier) {
    clientUpdate.plan_tier = planTier;
  }
  await supabaseAdmin
    .from("clients")
    .update(clientUpdate)
    .eq("user_id", userId);
}

// Resolve the plan_tier for non-creation events by looking up the DB
// LemonSqueezy does NOT echo custom_data on update/cancel/payment events
async function resolveExistingPlanTier(
  supabaseAdmin: any,
  lemonSubscriptionId: string,
  userId: string | undefined
): Promise<string> {
  // Try 1: Look up from subscriptions table (has plan_id from creation)
  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_id, client_id")
    .eq("lemon_subscription_id", lemonSubscriptionId)
    .maybeSingle();

  if (subRecord?.plan_id) {
    const tier = derivePlanTier(subRecord.plan_id);
    if (tier) return tier;
  }

  // Try 2: Look up from user's profile (already stored from creation event)
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan_tier")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.plan_tier && profile.plan_tier !== "starter") {
      return profile.plan_tier;
    }
  }

  // Try 3: Look up via client linked to subscription
  if (subRecord?.client_id) {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("plan_tier, user_id")
      .eq("id", subRecord.client_id)
      .maybeSingle();

    if (client?.plan_tier) return client.plan_tier;

    // Also try the user profile via client's user_id
    if (client?.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan_tier")
        .eq("id", client.user_id)
        .maybeSingle();
      if (profile?.plan_tier) return profile.plan_tier;
    }
  }

  return ""; // couldn't determine — don't overwrite
}

// Resolve user_id when not in custom_data (for non-creation events)
async function resolveUserId(
  supabaseAdmin: any,
  userId: string | undefined,
  lemonSubscriptionId: string
): Promise<string | null> {
  if (userId) return userId;

  // Look up via subscription → client → user_id
  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("client_id")
    .eq("lemon_subscription_id", lemonSubscriptionId)
    .maybeSingle();

  if (subRecord?.client_id) {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("user_id")
      .eq("id", subRecord.client_id)
      .maybeSingle();
    if (client?.user_id) return client.user_id;
  }

  // Look up from profiles by subscription_id
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("subscription_id", lemonSubscriptionId)
    .maybeSingle();

  return profile?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature");

    if (!signature || !process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      console.error("Missing webhook signature or secret");
      return NextResponse.json(
        { error: "Missing webhook signature or secret" },
        { status: 400 }
      );
    }

    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Invalid LemonSqueezy webhook signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;

    if (!eventName) {
      return NextResponse.json({ received: true });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const subscriptionData = event.data?.attributes;
    const lemonSubscriptionId = String(event.data?.id || "");

    // Extract custom data (only reliably present on subscription_created)
    const clientId = customData?.client_id;
    const userId = customData?.user_id;
    const planId = customData?.plan_id || "";

    switch (eventName) {
      // ─── SUBSCRIPTION CREATED ─────────────────────────────────────
      // This is the ONLY event where custom_data is reliably present.
      // We derive plan_tier from plan_id and store it everywhere.
      case "subscription_created": {
        const plan_tier = derivePlanTier(planId) || "pro"; // fallback for safety

        // Client-level subscription record (only if clientId exists)
        if (clientId) {
          const { error: subError } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
              client_id: clientId,
              lemon_subscription_id: lemonSubscriptionId,
              plan_id: planId,
              status: subscriptionData?.status || "active",
              current_period_start: subscriptionData?.created_at || null,
              current_period_end: subscriptionData?.renews_at || null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "lemon_subscription_id",
            });

          if (subError) {
            console.error("Failed to upsert subscription:", subError);
          }

          // Update client plan tier and subscription status
          const status = subscriptionData?.status === "on_trial" ? "active" : (subscriptionData?.status || "active");
          await supabaseAdmin
            .from("clients")
            .update({
              subscription_status: status,
              plan_tier,
              messages_this_month: 0,
            })
            .eq("id", clientId);
        }

        // ALWAYS update USER-LEVEL subscription (source of truth for paywalls)
        if (userId) {
          await updateUserSubscription(
            supabaseAdmin,
            userId,
            subscriptionData?.status || "active",
            plan_tier,
            lemonSubscriptionId,
            subscriptionData?.renews_at || null
          );
        } else if (clientId) {
          // Fallback: get user_id from the client
          const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("user_id")
            .eq("id", clientId)
            .single();
          if (clientData?.user_id) {
            await updateUserSubscription(
              supabaseAdmin,
              clientData.user_id,
              subscriptionData?.status || "active",
              plan_tier,
              lemonSubscriptionId,
              subscriptionData?.renews_at || null
            );
          }
        }

        console.log("subscription_created processed:", { userId, clientId, plan_tier, status: subscriptionData?.status });
        break;
      }

      // ─── SUBSCRIPTION UPDATED ─────────────────────────────────────
      // custom_data is NOT present — must look up plan_tier from DB
      case "subscription_updated": {
        const lsStatus = subscriptionData?.status || "active";
        const appStatus = toAppStatus(lsStatus);

        // Resolve plan_tier from DB (don't re-derive from missing custom_data)
        const plan_tier = derivePlanTier(planId) || await resolveExistingPlanTier(supabaseAdmin, lemonSubscriptionId, userId);
        const resolvedUserId = await resolveUserId(supabaseAdmin, userId, lemonSubscriptionId);

        // Update subscription record if it exists
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: lsStatus,
            current_period_end: subscriptionData?.renews_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        // Update client if linked
        const { data: subRecord } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .maybeSingle();

        if (subRecord?.client_id) {
          const clientUpdate: any = { subscription_status: appStatus };
          if (plan_tier) clientUpdate.plan_tier = plan_tier;
          await supabaseAdmin
            .from("clients")
            .update(clientUpdate)
            .eq("id", subRecord.client_id);
        }

        // Update user-level subscription
        if (resolvedUserId) {
          await updateUserSubscription(
            supabaseAdmin,
            resolvedUserId,
            lsStatus,
            plan_tier,
            lemonSubscriptionId,
            subscriptionData?.renews_at || null
          );
        }

        console.log("subscription_updated processed:", { resolvedUserId, plan_tier, appStatus });
        break;
      }

      // ─── SUBSCRIPTION CANCELLED / EXPIRED ─────────────────────────
      // Only update status to canceled — preserve plan_tier for grace period
      case "subscription_cancelled":
      case "subscription_expired": {
        const resolvedUserId = await resolveUserId(supabaseAdmin, userId, lemonSubscriptionId);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        const { data: cancelledSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .maybeSingle();

        if (cancelledSub?.client_id) {
          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: "canceled" })
            .eq("id", cancelledSub.client_id);
        }

        // Update user status to canceled but DON'T change plan_tier
        // (preserves "pro"/"business" so they see what they had during grace period)
        if (resolvedUserId) {
          await updateUserSubscription(
            supabaseAdmin,
            resolvedUserId,
            "cancelled",
            "", // empty = don't overwrite plan_tier
            lemonSubscriptionId,
            null
          );
        }

        console.log("subscription_cancelled processed:", { resolvedUserId });
        break;
      }

      // ─── PAYMENT SUCCESS ──────────────────────────────────────────
      case "subscription_payment_success": {
        const resolvedUserId = await resolveUserId(supabaseAdmin, userId, lemonSubscriptionId);
        const plan_tier = derivePlanTier(planId) || await resolveExistingPlanTier(supabaseAdmin, lemonSubscriptionId, resolvedUserId || undefined);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: subscriptionData?.renews_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        const { data: paidSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .maybeSingle();

        if (paidSub?.client_id) {
          const clientUpdate: any = {
            subscription_status: "active",
            messages_this_month: 0,
          };
          if (plan_tier) clientUpdate.plan_tier = plan_tier;
          await supabaseAdmin
            .from("clients")
            .update(clientUpdate)
            .eq("id", paidSub.client_id);
        }

        if (resolvedUserId) {
          await updateUserSubscription(
            supabaseAdmin,
            resolvedUserId,
            "active",
            plan_tier,
            lemonSubscriptionId,
            subscriptionData?.renews_at || null
          );
        }

        console.log("subscription_payment_success processed:", { resolvedUserId, plan_tier });
        break;
      }

      // ─── PAYMENT FAILED ───────────────────────────────────────────
      case "subscription_payment_failed": {
        console.warn("Payment failed for LemonSqueezy subscription:", lemonSubscriptionId);
        const resolvedUserId = await resolveUserId(supabaseAdmin, userId, lemonSubscriptionId);

        const { data: failedSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .maybeSingle();

        if (failedSub?.client_id) {
          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: "past_due" })
            .eq("id", failedSub.client_id);
        }

        // Update status to past_due but don't touch plan_tier
        if (resolvedUserId) {
          await updateUserSubscription(
            supabaseAdmin,
            resolvedUserId,
            "past_due",
            "", // don't overwrite plan_tier
            lemonSubscriptionId,
            null
          );
        }

        console.log("subscription_payment_failed processed:", { resolvedUserId });
        break;
      }

      default:
        console.log(`Unhandled LemonSqueezy event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("LemonSqueezy webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
