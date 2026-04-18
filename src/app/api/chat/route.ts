import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_INPUT_CHARS = 1200;
const RECENT_CHAT_LIMIT = 24;
const HISTORY_SUMMARY_MAX_CHARS = 1200;

type Sentiment = "positif" | "negatif" | "netral";

type ApiErrorCode =
    | "UNAUTHORIZED"
    | "INVALID_PAYLOAD"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "MODEL_CONFIG_ERROR"
    | "MODEL_TEMPORARY_ERROR"
    | "MODEL_OUTPUT_INVALID"
    | "INTERNAL_ERROR";

class ChatApiError extends Error {
    status: number;
    code: ApiErrorCode;
    retryable: boolean;

    constructor(message: string, status: number, code: ApiErrorCode, retryable = false) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryable = retryable;
    }
}

const isValidSentiment = (value: unknown): value is Sentiment =>
    value === "positif" || value === "negatif" || value === "netral";

const normalizeUserText = (value: string) => value.replace(/\s+/g, " ").trim();

const safeSlice = (text: string, maxLength: number) => (text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`);

const formatErrorResponse = (error: unknown) => {
    if (error instanceof ChatApiError) {
        return NextResponse.json(
            { error: error.message, code: error.code, retryable: error.retryable },
            { status: error.status }
        );
    }

    return NextResponse.json(
        { error: "Terjadi kesalahan", code: "INTERNAL_ERROR", retryable: false },
        { status: 500 }
    );
};

function parseModelResponse(rawText: string): { response: string; sentiment: Sentiment } {
    if (!rawText) {
        throw new ChatApiError("Respons model kosong", 502, "MODEL_OUTPUT_INVALID", true);
    }

    const jsonCandidate = rawText.match(/\{[\s\S]*\}/)?.[0] || rawText;
    let parsed: unknown;

    try {
        parsed = JSON.parse(jsonCandidate);
    } catch {
        throw new ChatApiError("Format respons model tidak valid", 502, "MODEL_OUTPUT_INVALID", true);
    }

    if (typeof parsed !== "object" || parsed === null) {
        throw new ChatApiError("Respons model tidak dapat dibaca", 502, "MODEL_OUTPUT_INVALID", true);
    }

    const parsedResponse = (parsed as { response?: unknown }).response;
    const parsedSentiment = (parsed as { sentiment?: unknown }).sentiment;

    if (typeof parsedResponse !== "string" || !parsedResponse.trim()) {
        throw new ChatApiError("Respons model kosong", 502, "MODEL_OUTPUT_INVALID", true);
    }

    return {
        response: parsedResponse.trim(),
        sentiment: isValidSentiment(parsedSentiment) ? parsedSentiment : "netral",
    };
}

function buildHistorySummary(
    chats: { role: "user" | "bot"; content: string }[],
    sessionTitle: string
) {
    if (!chats.length) return "";

    const compact = chats
        .map((chat) => `${chat.role === "user" ? "Pengguna" : "Bot"}: ${normalizeUserText(chat.content)}`)
        .join("\n");

    return safeSlice(
        `Ringkasan konteks percakapan sebelumnya untuk sesi \"${sessionTitle}\":\n${compact}`,
        HISTORY_SUMMARY_MAX_CHARS
    );
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activeSessions = await prisma.chatSession.findMany({
            where: { userId: session.user.id, deletedAt: null },
            include: { chats: { orderBy: { createdAt: "asc" } } },
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
                createdAt: chat.createdAt.toISOString(),
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
            throw new ChatApiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const { text, chatSessionId } = await req.json();

        if (!text && !chatSessionId) {
            const newSession = await prisma.chatSession.create({
                data: { userId: session.user.id, title: "Obrolan Baru" },
            });
            return NextResponse.json({ chatSessionId: newSession.id, title: newSession.title });
        }

        if (typeof text !== "string") {
            throw new ChatApiError("Payload teks tidak valid", 400, "INVALID_PAYLOAD");
        }

        const cleanedText = normalizeUserText(text);
        if (!cleanedText) {
            throw new ChatApiError("Teks tidak boleh kosong", 400, "INVALID_PAYLOAD");
        }

        if (cleanedText.length > MAX_INPUT_CHARS) {
            throw new ChatApiError(
                `Teks terlalu panjang. Maksimal ${MAX_INPUT_CHARS} karakter.`,
                400,
                "INVALID_PAYLOAD"
            );
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) throw new ChatApiError("User tidak ditemukan", 404, "NOT_FOUND");
        if (user.bannedUntil && user.bannedUntil > new Date())
            return NextResponse.redirect(new URL("/api/auth/logout", req.url));

        let currentSessionId = chatSessionId;
        if (!currentSessionId) {
            const newSession = await prisma.chatSession.create({
                data: { userId: session.user.id, title: cleanedText.slice(0, 40) || "Obrolan Baru" },
            });
            currentSessionId = newSession.id;
        }

        const sessionExists = await prisma.chatSession.findFirst({
            where: { id: currentSessionId, userId: session.user.id, deletedAt: null },
        });
        if (!sessionExists)
            throw new ChatApiError("Sesi tidak valid", 400, "INVALID_PAYLOAD");

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: cleanedText,
                role: "user",
                sentiment: "netral",
            },
        });

        const previousChats = await prisma.chat.findMany({
            where: { chatSessionId: currentSessionId },
            orderBy: { createdAt: "asc" },
            take: RECENT_CHAT_LIMIT,
            select: { role: true, content: true },
        });

        const summarySource = previousChats.length > 10 ? previousChats.slice(0, previousChats.length - 10) : [];
        const summaryText = buildHistorySummary(summarySource, sessionExists.title);
        const recentChats = previousChats.slice(-10);

        const history = recentChats.map((c) => ({
            role: c.role === "bot" ? "model" : "user",
            parts: [{ text: c.content }],
        }));

        const contextPrelude = summaryText
            ? [{ role: "user", parts: [{ text: `Gunakan konteks berikut sebagai memori percakapan:\n${summaryText}` }] }]
            : [];

        let response = "Maaf, saya tidak bisa menjawab pertanyaan itu.";
        let sentiment: Sentiment = "netral";

        try {
            if (!process.env.GEMINI_API_KEY)
                throw new ChatApiError("GEMINI_API_KEY belum diatur", 500, "MODEL_CONFIG_ERROR");

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: {
                    role: "system",
                    parts: [{
                        text: `Anda adalah "Modera AI", asisten edukatif moderasi beragama yang dikembangkan oleh tim riset Universitas Islam Negeri Sultan Syarif Kasim Riau.

Aturan utama:
1. Anda hanya melayani topik moderasi beragama.
2. Jika pertanyaan di luar topik, tolak dengan sopan dan arahkan kembali ke moderasi beragama.
3. Gunakan bahasa Indonesia yang empatik, non-konfrontatif, dan terstruktur dalam poin singkat.
4. Hindari klaim berlebihan dan jangan mengarang fakta.

Format output WAJIB berupa JSON valid, tanpa teks tambahan:
{
  "response": "...",
  "sentiment": "netral|positif|negatif"
}

Aturan sentimen:
- netral: relevan dengan moderasi beragama.
- negatif: berisi ujaran kebencian, caci maki, hasutan, atau kekerasan verbal.
- positif: di luar topik tetapi tidak mengandung kebencian/kasar.`,
                    }],
                },
            });

            const contents = [
                ...contextPrelude,
                ...history,
                { role: "user", parts: [{ text: cleanedText }] },
            ];

            let result = await generateWithRetry(model, {
                contents,
                generationConfig: {
                    temperature: 0.35,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                    responseMimeType: "application/json",
                },
            });

            let rawText = "";
            try {
                rawText = await result.response.text();
            } catch (e) {
                console.error("⚠️ Gagal baca response Gemini:", e);
                throw new ChatApiError("Gagal membaca respons model", 502, "MODEL_OUTPUT_INVALID", true);
            }

            const parsed = parseModelResponse(rawText);
            response = parsed.response;
            sentiment = parsed.sentiment;

            // if (sentiment === "netral" && process.env.NEXT_PUBLIC_API_URL) {
            //     const predictRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify({ text }),
            //     });
            //     if (predictRes.ok) {
            //         const predictData = await predictRes.json();
            //         response = predictData.response || response;
            //         sentiment = predictData.sentiment || sentiment;
            //     }
            // }

        } catch (geminiError) {
            if (geminiError instanceof ChatApiError) {
                throw geminiError;
            }

            const status = (geminiError as { status?: number })?.status;
            const message = (geminiError as { message?: string })?.message || "";
            const isTransient = [429, 500, 502, 503, 504].includes(status || 0) || /timeout|temporar|overload/i.test(message);

            throw new ChatApiError(
                "Terjadi kesalahan saat memproses respons model",
                isTransient ? 503 : 500,
                isTransient ? "MODEL_TEMPORARY_ERROR" : "INTERNAL_ERROR",
                isTransient
            );
        }

        await prisma.chat.create({
            data: {
                chatSessionId: currentSessionId,
                content: response,
                role: "bot",
                sentiment,
            },
        });

        const chatCount = await prisma.chat.count({ where: { chatSessionId: currentSessionId } });
        if (chatCount === 2) {
            await prisma.chatSession.update({
                where: { id: currentSessionId },
                data: { title: cleanedText.slice(0, 40) || "Obrolan Baru" },
            });
        }

        const negativeCount = await prisma.chat.count({
            where: { chatSessionId: currentSessionId, sentiment: "negatif" },
        });

        if (negativeCount >= 7) {
            const banDuration = 12 * 60 * 60 * 1000;
            await prisma.user.update({
                where: { id: session.user.id },
                data: { bannedUntil: new Date(Date.now() + banDuration) },
            });
            return NextResponse.json({
                error: "Akun Anda dibanned karena terdeteksi sentimen negatif.",
                code: "FORBIDDEN",
                redirectTo: "/api/auth/logout",
            }, { status: 403 });
        }

        const moderationWarning =
            negativeCount >= 5
                ? "Peringatan keras: konten terdeteksi mengandung unsur negatif berulang. Lanjutkan dengan bahasa yang lebih santun."
                : negativeCount >= 3
                    ? "Peringatan: mohon gunakan bahasa yang santun dan hindari ujaran negatif."
                    : null;

        return NextResponse.json({ response, sentiment, chatSessionId: currentSessionId, moderationWarning });
    } catch (error) {
        return formatErrorResponse(error);
    }
}

async function generateWithRetry(model: any, payload: any, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(payload);
        } catch (err: any) {
            const status = err?.status;
            const message = err?.message || "";
            const isTransient = [429, 500, 502, 503, 504].includes(status) || /timeout|temporar|overload/i.test(message);

            if (isTransient && i < retries - 1) {
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
            throw new ChatApiError("Unauthorized", 401, "UNAUTHORIZED");

        const { chatSessionId } = await req.json();
        if (!chatSessionId)
            throw new ChatApiError("chatSessionId diperlukan", 400, "INVALID_PAYLOAD");

        const chatSession = await prisma.chatSession.findFirst({
            where: { id: chatSessionId, userId: session.user.id, deletedAt: null },
            select: { id: true },
        });

        if (!chatSession) {
            throw new ChatApiError("Sesi tidak ditemukan", 404, "NOT_FOUND");
        }

        await prisma.chatSession.update({
            where: { id: chatSessionId },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return formatErrorResponse(error);
    }
}
