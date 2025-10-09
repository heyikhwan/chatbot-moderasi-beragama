import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "No code provided" }, { status: 400 });
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenRes.json();

        if (!tokens.id_token) {
            return NextResponse.json({ error: "Failed to get id_token" }, { status: 400 });
        }

        const userInfo = JSON.parse(
            Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
        );

        // Cari user di database
        let user = await prisma.user.findUnique({ where: { email: userInfo.email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userInfo.email,
                    name: userInfo.name,
                    image: userInfo.picture,
                    provider: "google",
                },
            });
        }

        // Cek apakah user sedang dibanned
        if (user.bannedUntil && user.bannedUntil > new Date()) {
            const bannedUntil = user.bannedUntil.toLocaleString("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
            });

            return NextResponse.json(
                { error: `Akun Anda diblokir sampai ${bannedUntil}` },
                { status: 403 }
            );
        }

        // Buat JWT jika user tidak diblokir
        const appToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        // Simpan token di cookie dan redirect ke /chat
        const url = new URL("/chat", req.url);
        const res = NextResponse.redirect(url);
        res.cookies.set("token", appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }
}
