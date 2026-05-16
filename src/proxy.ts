import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * V2 Phase 1.9 — global session + role + first-login gate.
 *
 * Public routes (no checks):
 *   - /                          (redirects below)
 *   - /login                     (signed-in users get bounced to dashboard)
 *   - /onboarding/set-password   (token-gated by the page itself; no session yet)
 *   - /api/auth/*                (auth callbacks)
 *
 * Gated routes:
 *   - /onboarding/confirm-profile  require session
 *   - /tenant/*, /dr/*, /manager/*, /admin/*  require session + matching role + both onboarding flags false
 *   - anything else                require session
 */

type Role = "tenant" | "admin" | "manager" | "dr";

const ROLE_DASHBOARDS: Record<Role, string> = {
  tenant: "/tenant/dashboard",
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  dr: "/dr/dashboard",
};

const ROLES = Object.keys(ROLE_DASHBOARDS) as Role[];

function isSetPasswordPath(pathname: string): boolean {
  return pathname === "/onboarding/set-password";
}

function isConfirmProfilePath(pathname: string): boolean {
  return pathname === "/onboarding/confirm-profile";
}

interface UserMeta {
  role: Role;
  needs_password_set: boolean;
  needs_profile_confirm: boolean;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // The first-login set-password page is reached BEFORE the user has a
  // session — they hold a signed short-lived token instead. Skip all auth
  // logic for it; the page itself verifies the token.
  //
  // API route handlers handle their own auth via createClient() — let
  // them return 401 JSON instead of redirecting the browser to /login
  // (which would break <img src="/api/attachments/..."> for instance).
  if (isSetPasswordPath(pathname) || pathname.startsWith("/api/")) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname === "/login") return response;
    const to = new URL("/login", request.url);
    return NextResponse.redirect(to);
  }

  // Look up role + onboarding flags. Single PostgREST call per request.
  const { data } = await supabase
    .from("users")
    .select("role, needs_password_set, needs_profile_confirm")
    .eq("id", user.id)
    .maybeSingle<UserMeta>();

  if (!data) {
    // Signed in to auth.users but no public.users row — orphan state.
    // Sign them out and send to /login.
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const dashboard = ROLE_DASHBOARDS[data.role];

  // Signed-in user visiting /login → bounce to their dashboard (or onboarding).
  if (pathname === "/login") {
    if (data.needs_password_set) return NextResponse.redirect(new URL("/onboarding/set-password", request.url));
    if (data.needs_profile_confirm) return NextResponse.redirect(new URL("/onboarding/confirm-profile", request.url));
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Root: route to onboarding or dashboard.
  if (pathname === "/") {
    if (data.needs_password_set) return NextResponse.redirect(new URL("/onboarding/set-password", request.url));
    if (data.needs_profile_confirm) return NextResponse.redirect(new URL("/onboarding/confirm-profile", request.url));
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // /onboarding/confirm-profile — only the right state may visit.
  if (isConfirmProfilePath(pathname)) {
    if (data.needs_password_set) return NextResponse.redirect(new URL("/onboarding/set-password", request.url));
    if (!data.needs_profile_confirm) return NextResponse.redirect(new URL(dashboard, request.url));
    return response;
  }

  // Role-gated dashboards.
  for (const role of ROLES) {
    if (pathname === `/${role}` || pathname.startsWith(`/${role}/`)) {
      if (data.needs_password_set) return NextResponse.redirect(new URL("/onboarding/set-password", request.url));
      if (data.needs_profile_confirm) return NextResponse.redirect(new URL("/onboarding/confirm-profile", request.url));
      if (data.role !== role) return NextResponse.redirect(new URL(dashboard, request.url));
      return response;
    }
  }

  // Any other authed route: enforce onboarding completion only.
  if (data.needs_password_set) return NextResponse.redirect(new URL("/onboarding/set-password", request.url));
  if (data.needs_profile_confirm) return NextResponse.redirect(new URL("/onboarding/confirm-profile", request.url));
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp).*)",
  ],
};
