import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type JwtPayload = {
  role?: "viewer" | "editor" | "admin";
  exp?: number;
};

const adminOnlyPaths = ["/admin"];
const editOnlyPaths = ["/import", "/parser"];

function hasAccess(pathname: string, role?: JwtPayload["role"]) {
  if (
    adminOnlyPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return role === "admin";
  }

  if (
    editOnlyPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return role === "admin" || role === "editor";
  }

  return true;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;
  const payload = token ? decodeJwtPayload(token) : null;
  const role = payload?.role;
  const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : false;

  if (token && (!role || isExpired)) {
    const response = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.delete("token");
    return response;
  }

  if (token && pathname === "/auth") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && pathname !== "/auth" && pathname !== "/onboard.jpg") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (token && !hasAccess(pathname, role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|logo.png|icons/|images/).*)",
  ],
};
