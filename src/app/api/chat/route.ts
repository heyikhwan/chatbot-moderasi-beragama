import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activeSession = await prisma.chatSession.findFirst({
            where: { userId: session.user.id, deletedAt: null },
            include: { chats: true }
        });

        const messages = activeSession ? activeSession.chats.map(chat => ({
            success: true,
            content: chat.content,
            role: chat.role as "user" | "bot"
        })) : [];

        return NextResponse.json({ session: activeSession, messages });
    } catch (error) {
        console.error("Get session error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, chatSessionId } = await req.json();

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
        }

        // Cek apakah user dibanned
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.bannedUntil && user.bannedUntil > new Date()) {
            return NextResponse.redirect(new URL("/api/auth/logout", req.url));
        }

        // Cek atau buat sesi aktif
        let currentSessionId = chatSessionId;
        if (!currentSessionId) {
            const existingSession = await prisma.chatSession.findFirst({
                where: { userId: session.user.id, deletedAt: null }
            });
            if (existingSession) {
                currentSessionId = existingSession.id;
            } else {
                const newSession = await prisma.chatSession.create({
                    data: { userId: session.user.id }
                });
                currentSessionId = newSession.id;
            }
        }

        // Simpan pesan user
        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: text,
                role: "user",
                sentiment: "POSITIVE" // Default, ubah dengan analisis sentimen
            }
        });

        // Kirim ke API prediksi
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Gagal mendapatkan respons dari API" }, { status: 500 });
        }

        const { response, sentiment } = await res.json();
        if (!response) {
            return NextResponse.json({ error: "Respons tidak valid" }, { status: 500 });
        }

        // Simpan respons bot
        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: response,
                role: "bot",
                sentiment: sentiment === "NEGATIVE" ? "NEGATIVE" : "POSITIVE"
            }
        });

        // Cek jumlah sentimen negatif
        const negativeCount = await prisma.chat.count({
            where: {
                chatSessionId: currentSessionId,
                sentiment: "NEGATIVE"
            }
        });

        if (negativeCount >= 3) {
            const banDuration = 7 * 24 * 60 * 60 * 1000; // 7 hari
            await prisma.user.update({
                where: { id: session.user.id },
                data: { bannedUntil: new Date(Date.now() + banDuration) }
            });
            return NextResponse.redirect(new URL("/api/auth/logout", req.url));
        }

        return NextResponse.json({ response, sentiment, chatSessionId: currentSessionId });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chatSessionId } = await req.json();
        if (!chatSessionId) {
            return NextResponse.json({ error: "ID sesi tidak ditemukan" }, { status: 400 });
        }

        await prisma.chatSession.update({
            where: { id: chatSessionId },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ message: "Sesi dihapus" });
    } catch (error) {
        console.error("Delete session error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}