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

// Helper: update user-level subscription on profiles table
async function updateUserSubscription(
  supabaseAdmin: any,
  userId: string,
  status: string,
  planTier: string,
  subscriptionId: string,
  periodEnd: string | null
) {
  const appStatus =
    status === "on_trial" ? "active" :
    status === "active" ? "active" :
    status === "past_due" || status === "unpaid" ? "past_due" :
    status === "cancelled" || status === "expired" || status === "paused" ? "canceled" :
    status;

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: appStatus,
      plan_tier: planTier,
      subscription_id: subscriptionId,
      subscription_current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Sync all user's clients to match the user's plan tier
  await supabaseAdmin
    .from("clients")
    .update({
      plan_tier: planTier,
      subscription_status: appStatus,
    })
    .eq("user_id", userId);
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

    // Extract custom data passed during checkout
    const clientId = customData?.client_id;
    const userId = customData?.user_id;
    const planId = customData?.plan_id || "";

    // Determine plan tier from plan_id
    let plan_tier = "pro";
    if (planId.includes("business")) plan_tier = "business";
    if (planId.includes("starter")) plan_tier = "starter";

    switch (eventName) {
      case "subscription_created": {
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

        // ALWAYS update USER-LEVEL subscription (this is the source of truth for paywalls)
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

      case "subscription_updated": {
        const { data: subRecord } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .maybeSingle();

        const lsStatus = subscriptionData?.status;
        let appStatus = "active";
        if (lsStatus === "active" || lsStatus === "on_trial") {
          appStatus = "active";
        } else if (lsStatus === "past_due") {
          appStatus = "past_due";
        } else if (lsStatus === "cancelled" || lsStatus === "expired") {
          appStatus = "canceled";
        } else if (lsStatus === "paused") {
          appStatus = "canceled";
        } else if (lsStatus === "unpaid") {
          appStatus = "past_due";
        }

        // Update subscription record if it exists
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: lsStatus || "active",
            current_period_end: subscriptionData?.renews_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        if (subRecord?.client_id) {
          // Update client
          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: appStatus })
            .eq("id", subRecord.client_id);

          // Update USER-LEVEL subscription via client
          const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("user_id")
            .eq("id", subRecord.client_id)
            .single();
          if (clientData?.user_id) {
            await updateUserSubscription(
              supabaseAdmin,
              userId || clientData.user_id,
              lsStatus || "active",
              plan_tier,
              lemonSubscriptionId,
              subscriptionData?.renews_at || null
            );
          }
        } else if (userId) {
          // No client record — update user-level subscription directly
          await updateUserSubscription(
            supabaseAdmin,
            userId,
            lsStatus || "active",
            plan_tier,
            lemonSubscriptionId,
            subscriptionData?.renews_at || null
          );
        }

        console.log("subscription_updated processed:", { userId, clientId: subRecord?.client_id, appStatus });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const { data: cancelledSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        if (cancelledSub) {
          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: "canceled" })
            .eq("id", cancelledSub.client_id);

          // Update USER-LEVEL subscription
          const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("user_id")
            .eq("id", cancelledSub.client_id)
            .single();
          if (clientData?.user_id) {
            await updateUserSubscription(
              supabaseAdmin,
              clientData.user_id,
              "cancelled",
              plan_tier,
              lemonSubscriptionId,
              null
            );
          }
        }
        break;
      }

      case "subscription_payment_success": {
        const { data: paidSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: subscriptionData?.renews_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", lemonSubscriptionId);

        if (paidSub) {
          await supabaseAdmin
            .from("clients")
            .update({
              subscription_status: "active",
              messages_this_month: 0,
            })
            .eq("id", paidSub.client_id);

          // Update USER-LEVEL subscription
          const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("user_id")
            .eq("id", paidSub.client_id)
            .single();
          if (clientData?.user_id) {
            await updateUserSubscription(
              supabaseAdmin,
              clientData.user_id,
              "active",
              plan_tier,
              lemonSubscriptionId,
              subscriptionData?.renews_at || null
            );
          }
        }
        break;
      }

      case "subscription_payment_failed": {
        console.warn("Payment failed for LemonSqueezy subscription:", lemonSubscriptionId);
        const { data: failedSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        if (failedSub) {
          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: "past_due" })
            .eq("id", failedSub.client_id);

          // Update USER-LEVEL subscription
          const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("user_id")
            .eq("id", failedSub.client_id)
            .single();
          if (clientData?.user_id) {
            await updateUserSubscription(
              supabaseAdmin,
              clientData.user_id,
              "past_due",
              plan_tier,
              lemonSubscriptionId,
              null
            );
          }
        }
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
