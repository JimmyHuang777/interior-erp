import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const HR_ONLY = ["/dashboard/hr"];
const ADMIN_ONLY = ["/dashboard/customers"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  if (
    isLoggedIn &&
    role !== "ADMIN" &&
    role !== "HR" &&
    HR_ONLY.some((p) => nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (
    isLoggedIn &&
    role !== "ADMIN" &&
    ADMIN_ONLY.some((p) => nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
