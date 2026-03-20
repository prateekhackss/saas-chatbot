import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const verifySignatureSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan_id: z.string().min(1), // Passed from frontend so we know what they signed up for
  client_id: z.string().uuid(),
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
    const result = verifySignatureSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 },
      );
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan_id,
      client_id,
    } = result.data;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay Key Secret");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    // Step 1: Verify the signature
    const text = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("Invalid payment signature detected!");
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // Step 2: Extract plan tier. 
    // Usually your system should map razorpay plan IDs to internal plan tiers.
    // For simplicity, we assume the frontend sends the internal plan tier ID ('pro', 'business')
    // via a separate payload field or derived from `plan_id`. 
    // Here we'll expect the frontend sets planStatus internally (this is just the trial->paid jump).
    let plan_tier = "pro"; // Default to pro if we can't map it right here
    if (plan_id.includes("business")) plan_tier = "business";
    if (plan_id.includes("starter")) plan_tier = "starter";

    // Step 3: Insert the subscription record
    const { error: subError } = await db.from("subscriptions").insert({
      client_id,
      razorpay_subscription_id,
      plan_id,
      status: "authenticated", // Waiting for first charge webhook to move to active
    });

    if (subError && subError.code !== "23505") { // Ignore unique violation if already inserted
      console.error("Failed to insert subscription record:", subError);
      // We don't fail the request here, as the webhook can also handle this
    }

    // Step 4: Update the client's tier immediately so they have access
    const { error: clientError } = await db
      .from("clients")
      .update({
        plan_tier,
        subscription_status: "active",
      })
      .eq("id", client_id)
      .eq("user_id", user.id);

    if (clientError) {
      console.error("Failed to update client tier:", clientError);
      return NextResponse.json(
        { error: "Failed to update client subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("Verify Subscription Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
