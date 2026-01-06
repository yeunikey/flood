import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  if (token && pathname === "/auth") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && pathname !== "/auth" && pathname !== "/onboard.jpg") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|logo.png|icons/).*)",
  ],
};