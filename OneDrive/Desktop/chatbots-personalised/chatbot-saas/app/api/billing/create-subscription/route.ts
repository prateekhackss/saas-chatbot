import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "Razorpay Plan ID is required"),
  clientId: z.string().uuid("Invalid Client ID"),
});

export async function POST(req: NextRequest) {
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
    const result = createSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 },
      );
    }

    const { planId, clientId } = result.data;

    // Razorpay generates random Plan IDs (e.g. plan_MaZ1x2y3). 
    // We map our frontend plan string (e.g. 'starter_monthly') to the environment variables
    const planToEnvMap: Record<string, string | undefined> = {
      "starter_monthly": process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
      "starter_annual": process.env.RAZORPAY_PLAN_STARTER_ANNUAL,
      "pro_monthly": process.env.RAZORPAY_PLAN_PRO_MONTHLY,
      "pro_annual": process.env.RAZORPAY_PLAN_PRO_ANNUAL,
      "business_monthly": process.env.RAZORPAY_PLAN_BUSINESS_MONTHLY,
      "business_annual": process.env.RAZORPAY_PLAN_BUSINESS_ANNUAL,
    };

    const razorpayEquivalentPlanId = planToEnvMap[planId];

    if (!razorpayEquivalentPlanId) {
      console.error(`Missing Razorpay Plan ID in .env for ${planId}`);
      return NextResponse.json(
        { error: "Plan configuration missing in environment" },
        { status: 500 }
      );
    }

    // Verify the client belongs to this user
    const { data: client, error: clientError } = await db
      .from("clients")
      .select("id, name, subscription_status")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      );
    }

    if (client.subscription_status === "active") {
      return NextResponse.json(
        { error: "Client is already on an active subscription" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay Keys in Environment Variables");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Set start_at to 7 days from now for the free trial delay
    const sevenDaysFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    // Create a Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayEquivalentPlanId,
      customer_notify: 1, // Razorpay handles email notifications
      total_count: 12, // Usually 12 for monthly, but adjust based on your strategy
      start_at: sevenDaysFromNow,
      notes: {
        clientId: client.id,
        userId: user.id,
      },
    });

    if (!subscription || !subscription.id) {
      throw new Error("Failed to generate Razorpay subscription");
    }

    // Return the subscription ID to the frontend to launch standard checkout
    return NextResponse.json({
      subscriptionId: subscription.id,
    });

  } catch (error: any) {
    console.error("Create Subscription Error:", error);
    
    // Razorpay specific error handling
    if (error.statusCode) {
       return NextResponse.json(
        { error: error.error?.description || "Razorpay API Error" },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
