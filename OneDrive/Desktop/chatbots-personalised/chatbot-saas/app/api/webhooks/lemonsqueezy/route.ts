import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Verify the webhook signature from LemonSqueezy
function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  // timingSafeEqual throws if lengths differ — guard against that
  const digestBuf = Buffer.from(digest, "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (digestBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(digestBuf, sigBuf);
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

    // Verify webhook signature
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

    // Create admin supabase client (webhooks aren't authenticated as users)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const subscriptionData = event.data?.attributes;
    const lemonSubscriptionId = String(event.data?.id || "");

    // Extract custom data passed during checkout
    const clientId = customData?.client_id;
    const planId = customData?.plan_id || "";

    // Determine plan tier from plan_id
    let plan_tier = "pro";
    if (planId.includes("business")) plan_tier = "business";
    if (planId.includes("starter")) plan_tier = "starter";

    switch (eventName) {
      case "subscription_created": {
        if (!clientId) {
          console.error("No client_id in subscription_created custom data");
          break;
        }

        // Insert subscription record
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

        break;
      }

      case "subscription_updated": {
        // Find the client from the subscription record
        const { data: subRecord } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        if (subRecord) {
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

          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: lsStatus || "active",
              current_period_end: subscriptionData?.renews_at || null,
              updated_at: new Date().toISOString(),
            })
            .eq("lemon_subscription_id", lemonSubscriptionId);

          await supabaseAdmin
            .from("clients")
            .update({
              subscription_status: appStatus,
            })
            .eq("id", subRecord.client_id);
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const { data: cancelledSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        if (cancelledSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("lemon_subscription_id", lemonSubscriptionId);

          await supabaseAdmin
            .from("clients")
            .update({ subscription_status: "canceled" })
            .eq("id", cancelledSub.client_id);
        }
        break;
      }

      case "subscription_payment_success": {
        // Payment successful — reset monthly usage
        const { data: paidSub } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("lemon_subscription_id", lemonSubscriptionId)
          .single();

        if (paidSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: subscriptionData?.renews_at || null,
              updated_at: new Date().toISOString(),
            })
            .eq("lemon_subscription_id", lemonSubscriptionId);

          await supabaseAdmin
            .from("clients")
            .update({
              subscription_status: "active",
              messages_this_month: 0, // Reset usage on new billing cycle
            })
            .eq("id", paidSub.client_id);
        }
        break;
      }

      case "subscription_payment_failed": {
        console.warn("Payment failed for LemonSqueezy subscription:", lemonSubscriptionId);
        // LemonSqueezy handles retries automatically
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
