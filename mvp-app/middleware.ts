import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en", "vi"];
const DEFAULT_LOCALE = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Set NEXT_LOCALE cookie from Accept-Language on first visit
  if (!request.cookies.get("NEXT_LOCALE")) {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const preferred = acceptLang
      .split(",")
      .map((l) => l.split(";")[0].trim().substring(0, 2));
    const matched =
      preferred.find((l) => SUPPORTED_LOCALES.includes(l)) ?? DEFAULT_LOCALE;
    response.cookies.set("NEXT_LOCALE", matched, {
      path: "/",
      maxAge: 31536000,
    });
  }

  // Protected routes check
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/profile",
    "/patients",
    "/records",
    "/tasks",
    "/unassigned",
    "/recording",
    "/soap",
    "/ehr",
    "/todo",
    "/raw",
    "/edit",
    "/review",
  ];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const token = request.cookies.get("auth_token");

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in, redirect from auth pages to dashboard
  const authPaths = ["/login", "/signup"];
  if (authPaths.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
