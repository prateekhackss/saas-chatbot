import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password", "/favicon.ico", "/embed.js", "/checkout", "/privacy", "/terms"]);
const PUBLIC_PREFIXES = ["/api/chat", "/api/embed", "/api/leads", "/widget", "/auth", "/_next"];
const PROTECTED_PREFIXES = ["/clients", "/dashboard", "/settings", "/api/admin"];
// Routes that require auth but NOT a tenant (user is onboarding)
const AUTH_ONLY_ROUTES = new Set(["/onboarding"]);
const PUBLIC_FILE = /\.(?:ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map)$/;

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return PUBLIC_FILE.test(pathname);
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (pathname !== "/login" && pathname !== "/signup" && isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("authError", "missing_env");
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Pass current pathname to server components via custom header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (isProtectedPath(pathname) || AUTH_ONLY_ROUTES.has(pathname))) {
    // API routes get 401, pages get redirected to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Validate next param to prevent open redirect
    const nextPath = `${pathname}${search}`;
    if (nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      loginUrl.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  // Tenant check: authenticated users hitting protected pages
  // must have at least one tenant, otherwise redirect to onboarding.
  // Skip this check for /onboarding itself, API routes, and admin users.
  if (user && isProtectedPath(pathname) && !pathname.startsWith("/api/")) {
    const { count } = await supabase
      .from("tenant_members")
      .select("tenant_id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if ((count || 0) === 0) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      onboardingUrl.search = "";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // If user is on /onboarding but already has a tenant, send to dashboard
  if (user && pathname === "/onboarding") {
    const { count } = await supabase
      .from("tenant_members")
      .select("tenant_id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if ((count || 0) > 0) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Subscription check removed from middleware.
  // Users can freely browse the dashboard after login.
  // Paywall is enforced at the action level (creating bots, uploading docs, etc.)

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|embed.js|api/chat|api/embed).*)"],
};
