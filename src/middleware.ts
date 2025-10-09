import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET!;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname.startsWith("/auth/login");

  // Jika tidak ada token
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));

    // Token valid
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Token tidak valid
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    res.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    return res;
  }
}

export const config = {
  matcher: ["/chat/:path*", "/auth/login"],
};
