import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// LemonSqueezy handles payment verification via webhooks, not client-side signatures.
// This route returns subscription status for the authenticated user.

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Payment verification is handled via webhooks. No action needed.",
    success: true,
  });
}
