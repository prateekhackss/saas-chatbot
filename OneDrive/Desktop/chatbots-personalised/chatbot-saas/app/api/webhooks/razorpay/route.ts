import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server"; // We need the service_role key for webhooks!

// Initialize a Supabase client with the SERVICE_ROLE key because webhooks
// are not authenticated as a normal user.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature");

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing webhook signature or secret" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Create admin supabase client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const subscriptionPayload = event.payload.subscription?.entity;
    if (!subscriptionPayload) {
      return NextResponse.json({ received: true });
    }

    const { id: razorpay_subscription_id, status, plan_id, end_at, current_start, current_end } = subscriptionPayload;

    let plan_tier = "pro";
    if (plan_id.includes("business")) plan_tier = "business";
    if (plan_id.includes("starter")) plan_tier = "starter";

    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
        // 1. Update the subscription record safely
        const { data: subData } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("razorpay_subscription_id", razorpay_subscription_id)
          .single();

        if (subData) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: current_start ? new Date(current_start * 1000).toISOString() : null,
              current_period_end: current_end ? new Date(current_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("razorpay_subscription_id", razorpay_subscription_id);

          // 2. Refresh monthly limits (messages) and sync tier
          await supabaseAdmin
            .from("clients")
            .update({
              subscription_status: "active",
              plan_tier, // ensure aligned
              messages_this_month: 0, // Reset usage at the start of new billing cycle
            })
            .eq("id", subData.client_id);
        }
        break;

      case "subscription.halted":
      case "subscription.cancelled":
      case "subscription.paused":
        const subStatus = event.event.split(".")[1]; // halted, cancelled, paused
        
        await supabaseAdmin
          .from("subscriptions")
          .update({
             status: subStatus,
             updated_at: new Date().toISOString()
          })
          .eq("razorpay_subscription_id", razorpay_subscription_id);

        const { data: cData } = await supabaseAdmin
          .from("subscriptions")
          .select("client_id")
          .eq("razorpay_subscription_id", razorpay_subscription_id)
          .single();

        if (cData) {
           await supabaseAdmin
             .from("clients")
             .update({ subscription_status: subStatus })
             .eq("id", cData.client_id);
        }
        break;

      case "payment.failed":
        console.warn("Payment failed for subscription:", razorpay_subscription_id);
        // Razorpay handles retries automatically (Smart Retries)
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
