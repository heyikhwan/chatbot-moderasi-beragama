import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
                data: { userId: session.user.id, title: "Obrolan Baru" },
            });
            return NextResponse.json({ chatSessionId: newSession.id, title: newSession.title });
        }

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        if (user.bannedUntil && user.bannedUntil > new Date())
            return NextResponse.redirect(new URL("/api/auth/logout", req.url));

        let currentSessionId = chatSessionId;
        if (!currentSessionId) {
            const newSession = await prisma.chatSession.create({
                data: { userId: session.user.id, title: text.slice(0, 20) || "Obrolan Baru" },
            });
            currentSessionId = newSession.id;
        }

        const sessionExists = await prisma.chatSession.findUnique({ where: { id: currentSessionId } });
        if (!sessionExists)
            return NextResponse.json({ error: "Sesi tidak valid" }, { status: 400 });

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: text,
                role: "user",
                sentiment: "netral",
            },
        });

        const previousChats = await prisma.chat.findMany({
            where: { chatSessionId: currentSessionId },
            orderBy: { createdAt: "asc" },
            take: 10,
        });

        const history = previousChats.map((c) => ({
            role: c.role === "bot" ? "model" : "user",
            parts: [{ text: c.content }],
        }));

        let response = "Maaf, saya tidak bisa menjawab pertanyaan itu.";
        let sentiment: "positif" | "negatif" | "netral" = "netral";

        try {
            if (!process.env.GEMINI_API_KEY)
                throw new Error("❌ GEMINI_API_KEY belum diatur di .env");

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: {
                    role: "system",
                    parts: [{
                        text: `Anda adalah bot bernama "Modera AI" yang dikembangkan oleh tim riset Universitas Islam Negeri Sultan Syarif Kasim Riau.
                                Tugas utama Anda adalah menjawab pertanyaan tentang moderasi beragama.
                                - Jika pertanyaan di luar topik, sampaikan bahwa Anda tidak tahu.
                                - Jawab dengan jujur, ramah, dan singkat.

                                Anda **hanya boleh merespon dalam format JSON**. Tidak ada teks tambahan, penjelasan, atau format lain.

                                Struktur JSON yang WAJIB Anda gunakan adalah:
                                {
                                    "text": "[isi dari input user]",
                                    "response": "[jawaban Anda]",
                                    "sentiment": "[netral|positif|negatif]"
                                }

                                Penentuan sentimen:
                                - Sentimen "netral" jika pertanyaan berhubungan spesifik dengan moderasi beragama.
                                - Sentimen "negatif" jika input adalah ujaran kebencian, perkataan kasar, atau hal buruk lainnya.
                                - Sentimen "positif" untuk input lainnya (basa-basi, pertanyaan di luar topik yang tidak negatif).`,
                    }],
                },
            });

            const contents = [
                ...history,
                { role: "user", parts: [{ text: text.trim() }] },
            ];

            let result = await generateWithRetry(model, {
                contents,
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    maxOutputTokens: 5120,
                    responseMimeType: "application/json",
                },
            });

            let rawText = "";
            try {
                rawText = await result.response.text();
            } catch (e) {
                console.error("⚠️ Gagal baca response Gemini:", e);
            }

            let parsedResponse: any = {};
            try {
                parsedResponse = JSON.parse(rawText);
            } catch (parseErr) {
                const match = rawText.match(/"response"\s*:\s*"([^"]+)"/);
                parsedResponse.response = match ? match[1] : response;
                parsedResponse.sentiment = "netral";
            }

            response = parsedResponse.response || response;
            sentiment = parsedResponse.sentiment || sentiment;

            if (sentiment === "netral" && process.env.NEXT_PUBLIC_API_URL) {
                const predictRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                });
                if (predictRes.ok) {
                    const predictData = await predictRes.json();
                    response = predictData.response || response;
                    sentiment = predictData.sentiment || sentiment;
                }
            }

        } catch (geminiError) {
            return NextResponse.json({ error: "Terjadi kesalahan, silahkan coba lagi." }, { status: 500 });
        }

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: response,
                role: "bot",
                sentiment: sentiment as any,
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
            const banDuration = 12 * 60 * 60 * 1000; // 12 jam
            await prisma.user.update({
                where: { id: session.user.id },
                data: { bannedUntil: new Date(Date.now() + banDuration) },
            });
            return NextResponse.json({
                error: "Akun Anda dibanned karena terdeteksi sentimen negatif.",
                redirectTo: "/api/auth/logout",
            }, { status: 403 });
        }

        return NextResponse.json({ response, sentiment, chatSessionId: currentSessionId });
    } catch (error) {
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}

async function generateWithRetry(model: any, payload: any, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(payload);
        } catch (err: any) {
            const isOverloaded = err.message?.includes("503") || err.status === 503;
            if (isOverloaded && i < retries - 1) {
                await new Promise(r => setTimeout(r, delay * (i + 1)));
            } else {
                throw err;
            }
        }
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { chatSessionId } = await req.json();
        if (!chatSessionId)
            return NextResponse.json({ error: "chatSessionId diperlukan" }, { status: 400 });

        await prisma.chatSession.update({
            where: { id: chatSessionId, userId: session.user.id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
}
