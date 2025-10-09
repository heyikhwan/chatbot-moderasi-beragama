import { NextResponse } from "next/server";

export async function GET() {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const scope = "openid email profile";

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);

    return NextResponse.redirect(url.toString());
}
