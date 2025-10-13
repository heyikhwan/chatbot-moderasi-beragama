import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export async function GET(req: Request) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!clientId || !clientSecret || !redirectUri || !jwtSecret) {
        const error = encodeURIComponent("Konfigurasi server tidak lengkap");
        return NextResponse.redirect(new URL(`/auth/login?error=${error}`, req.url));
    }

    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            const error = encodeURIComponent("Kode otorisasi tidak ditemukan");
            return NextResponse.redirect(new URL(`/auth/login?error=${error}`, req.url));
        }

        // Tukar code ke token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenRes.json();

        if (!tokens.id_token) {
            const error = encodeURIComponent(tokens.error_description || "Gagal mendapatkan ID token");
            return NextResponse.redirect(new URL(`/auth/login?error=${error}`, req.url));
        }

        // Decode ID token
        const userInfo = JSON.parse(
            Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
        );

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

        // Cek apakah user diblokir
        if (user.bannedUntil && user.bannedUntil > new Date()) {
            const bannedUntil = user.bannedUntil.toLocaleString("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
            });
            const error = encodeURIComponent(`Akun Anda diblokir sampai ${bannedUntil} WIB.`);
            return NextResponse.redirect(new URL(`/auth/login?error=${error}`, req.url));
        }

        // Buat JWT
        const secretKey = new TextEncoder().encode(jwtSecret);
        const appToken = await new SignJWT({ id: user.id, email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secretKey);

        // Redirect ke /chat
        const res = NextResponse.redirect(new URL("/chat", req.url));
        res.cookies.set("token", appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (err) {
        const error = encodeURIComponent("Terjadi kesalahan saat login");
        return NextResponse.redirect(new URL(`/auth/login?error=${error}`, req.url));
    }
}
