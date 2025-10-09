import { NextResponse } from "next/server";

export async function GET() {
    const res = NextResponse.json({ success: true });
    res.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        path: "/",
    });
    
    return res;
}