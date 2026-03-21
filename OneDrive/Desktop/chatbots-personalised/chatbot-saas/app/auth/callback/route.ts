import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  // Validate next parameter to prevent open redirect attacks
  let next = requestUrl.searchParams.get("next") || "/clients";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    next = "/clients";
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
