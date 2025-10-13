import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// TODO: tambah query session id agar ketika refresh dia ga pindah chat (app-sidebar)
// TODO: ketika klik tombol tambah obrolan baru, urutannya di paling atas, hilangkan # di url nya

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activeSessions = await prisma.chatSession.findMany({
            where: { userId: session.user.id, deletedAt: null },
            include: { chats: true },
            orderBy: { createdAt: "desc" },
        });

        const sessions = activeSessions.map((s) => ({
            id: s.id,
            title: s.title,
            chats: s.chats.map((chat) => ({
                success: true,
                content: chat.content,
                role: chat.role as "user" | "bot",
                sentiment: chat.sentiment,
                isNew: false,
            })),
        }));

        return NextResponse.json({ sessions });
    } catch (error) {
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

        if (!text && !chatSessionId) {
            const newSession = await prisma.chatSession.create({
                data: {
                    userId: session.user.id,
                    title: "Obrolan Baru",
                },
            });
            return NextResponse.json({ chatSessionId: newSession.id, title: newSession.title });
        }

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }
        if (user.bannedUntil && user.bannedUntil > new Date()) {
            return NextResponse.redirect(new URL("/api/auth/logout", req.url));
        }

        let currentSessionId = chatSessionId;
        if (!currentSessionId) {
            const newSession = await prisma.chatSession.create({
                data: {
                    userId: session.user.id,
                    title: text.slice(0, 20) || "Obrolan Baru",
                },
            });
            currentSessionId = newSession.id;
        }

        // Validasi chatSessionId
        const sessionExists = await prisma.chatSession.findUnique({
            where: { id: currentSessionId },
        });
        if (!sessionExists) {
            return NextResponse.json({ error: "Sesi tidak valid" }, { status: 400 });
        }

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: text,
                role: "user",
                sentiment: "netral",
            },
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: "Gagal mendapatkan respons dari API", details: errorData }, { status: 500 });
        }

        const { response, sentiment } = await res.json();
        if (!response) {
            return NextResponse.json({ error: "Respons tidak valid" }, { status: 500 });
        }

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: response,
                role: "bot",
                sentiment: sentiment
            },
        });

        const chatCount = await prisma.chat.count({ where: { chatSessionId: currentSessionId } });
        if (chatCount === 2) {
            await prisma.chatSession.update({
                where: { id: currentSessionId },
                data: { title: text.slice(0, 20) || "Obrolan Baru" },
            });
        }

        const negativeCount = await prisma.chat.count({
            where: { chatSessionId: currentSessionId, sentiment: "negatif" },
        });

        if (negativeCount % 3 === 0 && negativeCount !== 0) {
            // tambahkan deletedAt di sesi chat nya
            await prisma.chatSession.update({
                where: { id: currentSessionId },
                data: { deletedAt: new Date() },
            });

            const banDuration = 7 * 24 * 60 * 60 * 1000;
            await prisma.user.update({
                where: { id: session.user.id },
                data: { bannedUntil: new Date(Date.now() + banDuration) },
            });
            return NextResponse.json(
                { error: "Akun Anda telah dibanned karena terdeteksi sentimen negatif", redirectTo: "/api/auth/logout" },
                { status: 403 }
            );
        }

        return NextResponse.json({ response, sentiment, chatSessionId: currentSessionId });
    } catch (error) {
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
            return NextResponse.json({ error: "chatSessionId diperlukan" }, { status: 400 });
        }

        await prisma.chatSession.update({
            where: { id: chatSessionId, userId: session.user.id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}