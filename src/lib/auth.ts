import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function getServerSession() {
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;
    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secretKey);
        return { user: { id: payload.id as string, email: payload.email as string } };
    } catch {
        return null;
    }
}