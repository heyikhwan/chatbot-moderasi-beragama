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

        let response, sentiment;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
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
            const contents = [{ role: "user", parts: [{ text: text.trim() }] }];

            const result = await model.generateContent({
                contents,
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    maxOutputTokens: 512,
                    responseMimeType: "application/json",
                },
            });

            const parsedResponse = JSON.parse(result.response.text());
            response = parsedResponse.response;
            sentiment = parsedResponse.sentiment;

            if (sentiment === "netral") {
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
            return NextResponse.json({ error: "Terjadi kesalahan, silahkan coba lagi" }, { status: 500 });
        }

        if (!response) {
            return NextResponse.json({ error: "Response tidak valid" }, { status: 500 });
        }

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: response,
                role: "bot",
                sentiment: sentiment,
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
            // await prisma.chatSession.update({
            //     where: { id: currentSessionId },
            //     data: { deletedAt: new Date() },
            // });

            const banDuration = 12 * 60 * 60 * 1000
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