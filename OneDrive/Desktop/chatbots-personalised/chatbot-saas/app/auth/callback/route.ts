import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  // Validate next parameter to prevent open redirect attacks
  let next = requestUrl.searchParams.get("next") || "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    next = "/dashboard";
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";

  if ((!code && !token_hash) || !supabaseUrl || !supabaseAnonKey) {
    redirectUrl.searchParams.set("authError", "callback_failed");
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Handle PKCE code exchange (email confirmation, OAuth callback)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectUrl.searchParams.set("authError", "callback_failed");
      redirectUrl.searchParams.set("message", error.message);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has a tenant — if not, redirect to onboarding
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await (supabase as any)
        .from("tenant_members")
        .select("tenant_id", { count: "exact", head: true })
        .eq("profile_id", user.id);

      if ((count || 0) === 0) {
        // Build a NEW redirect but copy session cookies from the original response
        const onboardingResponse = NextResponse.redirect(new URL("/onboarding", request.url));
        response.cookies.getAll().forEach((cookie) => {
          onboardingResponse.cookies.set(cookie.name, cookie.value, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
          });
        });
        return onboardingResponse;
      }
    }

    return response;
  }

  // Handle token_hash verification (magic link, password recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "recovery" | "magiclink" | "signup" | "email",
    });

    if (error) {
      redirectUrl.searchParams.set("authError", "callback_failed");
      redirectUrl.searchParams.set("message", error.message);
      return NextResponse.redirect(redirectUrl);
    }

    // For password recovery, redirect to reset password page
    if (type === "recovery") {
      response = NextResponse.redirect(
        new URL("/reset-password", request.url),
      );
      // Re-apply cookies to the new response
      const supabase2 = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        },
      );
      // Trigger a session refresh to ensure cookies are set
      await supabase2.auth.getUser();
      return response;
    }

    return response;
  }

  redirectUrl.searchParams.set("authError", "callback_failed");
  return NextResponse.redirect(redirectUrl);
}
