import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = process.env.JWT_SECRET!;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        provider: true,
      },
    });

    if (!user) {
      const res = NextResponse.json(
        { error: "User not found", redirectTo: "/login" },
        { status: 404 }
      );
      res.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
      });
      return res;
    }

    return NextResponse.json({ user });
  } catch (err) {
    const res = NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    res.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    return res;
  }
}