import { NextRequest, NextResponse } from "next/server";

// LemonSqueezy handles payment verification via webhooks, not client-side signatures.
// This route is kept as a no-op for backward compatibility.
// All subscription activation happens through the /api/webhooks/lemonsqueezy endpoint.

export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: "Payment verification is handled via webhooks. No action needed.",
    success: true,
  });
}
