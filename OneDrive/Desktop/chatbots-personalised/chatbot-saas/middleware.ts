import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password", "/favicon.ico", "/embed.js", "/checkout", "/privacy", "/terms"]);
const PUBLIC_PREFIXES = ["/api/chat", "/api/embed", "/api/leads", "/widget", "/auth", "/_next"];
const PROTECTED_PREFIXES = ["/clients", "/dashboard", "/settings", "/api/admin"];
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

  if (!user && isProtectedPath(pathname)) {
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
    dashboardUrl.pathname = "/clients";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  // Subscription gate: If user is authenticated and accessing protected routes,
  // check if they have an active subscription. Skip for billing/checkout pages.
  if (user && isProtectedPath(pathname) && !pathname.includes('/billing') && pathname !== '/checkout' && !pathname.startsWith('/settings') && !pathname.startsWith('/api/admin/account')) {
    const db = supabase as any;
    const { data: clients } = await db
      .from('clients')
      .select('id, subscription_status')
      .eq('user_id', user.id)
      .limit(1);

    const client = clients?.[0];

    // If user has a client but no active/trialing subscription, redirect to checkout
    if (client && !['active', 'trialing'].includes(client.subscription_status)) {
      // Allow access to billing page so they can subscribe
      if (!pathname.includes('/billing')) {
        const checkoutUrl = request.nextUrl.clone();
        checkoutUrl.pathname = '/checkout';
        checkoutUrl.search = '';
        return NextResponse.redirect(checkoutUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|embed.js|api/chat|api/embed).*)"],
};
