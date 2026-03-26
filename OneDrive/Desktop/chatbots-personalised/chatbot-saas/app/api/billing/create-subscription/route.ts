import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createCheckoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  clientId: z.string().uuid("Invalid Client ID").optional().nullable(),
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
    const result = createCheckoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 },
      );
    }

    const { planId, clientId } = result.data;

    // Map frontend plan strings to LemonSqueezy Variant IDs from environment variables
    const planToVariantMap: Record<string, string | undefined> = {
      "starter_monthly": process.env.LEMONSQUEEZY_VARIANT_STARTER_MONTHLY,
      "starter_annual": process.env.LEMONSQUEEZY_VARIANT_STARTER_ANNUAL,
      "pro_monthly": process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY,
      "pro_annual": process.env.LEMONSQUEEZY_VARIANT_PRO_ANNUAL,
      "business_monthly": process.env.LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY,
      "business_annual": process.env.LEMONSQUEEZY_VARIANT_BUSINESS_ANNUAL,
    };

    const variantId = planToVariantMap[planId];

    if (!variantId) {
      console.error(`Missing LemonSqueezy Variant ID in .env for ${planId}`);
      return NextResponse.json(
        { error: "Plan configuration missing in environment" },
        { status: 500 }
      );
    }

    // If clientId provided, verify ownership via tenant or direct user_id.
    if (clientId) {
      // First get user's tenant
      const { data: membership } = await db
        .from("tenant_members")
        .select("tenant_id")
        .eq("profile_id", user.id)
        .limit(1)
        .maybeSingle();

      let clientQuery = db
        .from("clients")
        .select("id, name, subscription_status")
        .eq("id", clientId);

      // Check via tenant or direct user_id
      if (membership?.tenant_id) {
        clientQuery = clientQuery.eq("tenant_id", membership.tenant_id);
      } else {
        clientQuery = clientQuery.eq("user_id", user.id);
      }

      const { data: client, error: clientError } = await clientQuery.single();

      if (clientError || !client) {
        return NextResponse.json(
          { error: "Client not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Check user-level subscription (the real source of truth)
    const { data: profile } = await db
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    // Block if user already has an active subscription (unless upgrading)
    if (profile?.subscription_status === "active") {
      // Allow — the upgrade flow handles plan changes via LemonSqueezy
    }

    if (!process.env.LEMONSQUEEZY_API_KEY || !process.env.LEMONSQUEEZY_STORE_ID) {
      console.error("Missing LemonSqueezy API Key or Store ID", {
        hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
        hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
      });
      return NextResponse.json(
        { error: "Payment gateway not configured. Contact support." },
        { status: 500 }
      );
    }

    // Determine the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a LemonSqueezy Checkout via API
    const checkoutResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email || "",
              custom: {
                client_id: clientId || "",
                user_id: user.id,
                plan_id: planId,
              },
            },
            checkout_options: {
              embed: false,
              media: false,
              button_color: "#e11d48",
            },
            product_options: {
              name: `NexusChat - ${planId.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Plan`,
              redirect_url: clientId
                ? `${appUrl}/clients/${clientId}/billing?payment=success`
                : `${appUrl}/clients?payment=success`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMONSQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error("LemonSqueezy Checkout Error:", {
        status: checkoutResponse.status,
        body: errorText,
        variantId,
        storeId: process.env.LEMONSQUEEZY_STORE_ID,
      });
      return NextResponse.json(
        { error: `Checkout failed (${checkoutResponse.status}). Please try again or contact support.` },
        { status: 500 }
      );
    }

    const checkoutData = await checkoutResponse.json();
    const checkoutUrl = checkoutData.data?.attributes?.url;

    if (!checkoutUrl) {
      throw new Error("No checkout URL returned from LemonSqueezy");
    }

    return NextResponse.json({
      checkoutUrl,
    });

  } catch (error: any) {
    console.error("Create Checkout Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
