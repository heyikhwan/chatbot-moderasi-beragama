"use client";

import { useEffect, useState } from "react";
import Chat from "./chat";
import InputChat from "./input-chat";
import { useUser } from "@/hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import { useChatStore } from "@/stores/chatStore";
import { Button } from "@/components/ui/button";

type ApiChatError = {
    error?: string;
    code?: string;
    retryable?: boolean;
    redirectTo?: string;
};

type SuggestedPrompt = {
    id: string;
    label: string;
    text: string;
};

const TYPING_SPEED_MS = 18;
const MIN_TYPING_DURATION_MS = 500;
const MAX_TYPING_DURATION_MS = 7000;

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
    {
        id: "definisi",
        label: "Apa itu moderasi beragama?",
        text: "Apa itu moderasi beragama dalam kehidupan sehari-hari?",
    },
    {
        id: "kerja",
        label: "Toleransi di tempat kerja",
        text: "Bagaimana cara bersikap toleran di tempat kerja?",
    },
    {
        id: "beda-pendapat",
        label: "Saat beda pendapat",
        text: "Contoh sikap moderat saat beda pendapat agama apa saja?",
    },
    {
        id: "media-sosial",
        label: "Sikap di media sosial",
        text: "Bagaimana menghadapi konten provokatif soal agama di media sosial?",
    },
    {
        id: "kerukunan",
        label: "Menjaga kerukunan",
        text: "Langkah sederhana menjaga kerukunan antarumat beragama?",
    },
    {
        id: "remaja",
        label: "Menjelaskan ke remaja",
        text: "Bagaimana menjelaskan moderasi beragama ke remaja?",
    },
    {
        id: "keluarga",
        label: "Di lingkungan keluarga",
        text: "Bagaimana menerapkan moderasi beragama di lingkungan keluarga?",
    },
    {
        id: "konflik",
        label: "Mencegah konflik",
        text: "Apa cara sederhana mencegah konflik bernuansa agama?",
    },
];

const VISIBLE_SUGGESTION_COUNT = 3;

const pickRandomPrompts = (
    prompts: SuggestedPrompt[],
    count: number,
    previousKey?: string
) => {
    const shuffled = [...prompts].sort(() => Math.random() - 0.5);
    let picked = shuffled.slice(0, Math.min(count, shuffled.length));

    const nextKey = picked.map((item) => item.id).join("|");
    if (previousKey && nextKey === previousKey && prompts.length > count) {
        picked = shuffled.slice(1, 1 + Math.min(count, shuffled.length - 1));
    }

    return picked;
};

const ChatBot = () => {
    const { user, loading: userLoading } = useUser();
    const {
        sessions,
        selectedSessionId,
        setSessions,
        setSelectedSessionId,
        addSession,
        updateSessionMessages,
        updateSessionTitle,
    } = useChatStore();
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [isTypingEffect, setIsTypingEffect] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastFailedText, setLastFailedText] = useState<string | null>(null);
    const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>(
        () => pickRandomPrompts(SUGGESTED_PROMPTS, VISIBLE_SUGGESTION_COUNT)
    );

    const messages = sessions.find((s) => s.id === selectedSessionId)?.chats || [];

    useEffect(() => {
        if (messages.length > 0) return;

        setSuggestedPrompts((previous) => {
            const previousKey = previous.map((item) => item.id).join("|");
            return pickRandomPrompts(SUGGESTED_PROMPTS, VISIBLE_SUGGESTION_COUNT, previousKey);
        });
    }, [selectedSessionId, messages.length]);

    // Fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            if (user && !userLoading) {
                setIsLoading(true);
                try {
                    const res = await fetch("/api/chat", {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    });
                    const { sessions } = await res.json();
                    setSessions(sessions);
                    if (sessions.length > 0) {
                        setSelectedSessionId(sessions[0].id);
                    } else {
                        setSelectedSessionId(null);
                    }
                } catch {
                    setSessions([
                        {
                            id: "error",
                            title: "Error",
                            chats: [{ success: false, content: "Gagal memuat sesi", role: "bot", createdAt: new Date().toISOString() }],
                        },
                    ]);
                    setSelectedSessionId("error");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchSessions();
    }, [user, userLoading, setSessions, setSelectedSessionId]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !user || userLoading) return;
        setLastFailedText(null);

        let currentSessionId: string;
        if (!selectedSessionId) {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const { chatSessionId, title } = await res.json();
            if (!chatSessionId) {
                updateSessionMessages("temp", [
                    ...messages,
                    {
                        success: false,
                        content: "Gagal membuat sesi",
                        role: "bot" as const,
                        isNew: true,
                        retryable: true,
                        code: "SESSION_CREATE_FAILED",
                        createdAt: new Date().toISOString(),
                    },
                ]);
                return;
            }
            addSession({ id: chatSessionId, title, chats: [], temp: false });
            currentSessionId = chatSessionId;
            setSelectedSessionId(chatSessionId);
        } else {
            const currentSession = sessions.find(s => s.id === selectedSessionId);
            if (currentSession?.temp) {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                const { chatSessionId, title } = await res.json();
                if (!chatSessionId) {
                    updateSessionMessages(selectedSessionId, [
                        ...messages,
                        {
                            success: false,
                            content: "Gagal membuat sesi",
                            role: "bot" as const,
                            isNew: true,
                            retryable: true,
                            code: "SESSION_CREATE_FAILED",
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                    return;
                }
                setSessions(sessions.map(s => s.id === selectedSessionId ? { ...s, id: chatSessionId, temp: false, title } : s));
                currentSessionId = chatSessionId;
                setSelectedSessionId(chatSessionId);
            } else {
                currentSessionId = selectedSessionId;
            }
        }

        const newMessages = [
            ...messages,
            { success: true, content: text, role: "user" as const, isNew: true, createdAt: new Date().toISOString() },
        ];
        updateSessionMessages(currentSessionId, newMessages);
        setIsWaitingResponse(true);
        setIsTypingEffect(false);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, chatSessionId: currentSessionId }),
            });
            const data = (await res.json()) as ApiChatError & {
                response?: string;
                sentiment?: string;
                moderationWarning?: string | null;
            };

            if (!res.ok) {
                if (res.status === 403 && data.redirectTo) {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    });
                    window.location.href = "/auth/login?error=Akun Anda diblokir.";
                    return;
                }

                setLastFailedText(text);
                updateSessionMessages(currentSessionId, [
                    ...newMessages,
                    {
                        success: false,
                        content: data.error || "Maaf, terjadi kesalahan",
                        role: "bot" as const,
                        isNew: true,
                        retryable: Boolean(data.retryable),
                        code: data.code,
                        createdAt: new Date().toISOString(),
                    },
                ]);
                setIsWaitingResponse(false);
                setIsTypingEffect(false);
                return;
            }

            const updatedMessages = [
                ...newMessages,
                {
                    success: true,
                    content: data.response || "Maaf, saya tidak bisa menjawab pertanyaan itu.",
                    role: "bot" as const,
                    isNew: true,
                    sentiment: data.sentiment,
                    createdAt: new Date().toISOString(),
                },
            ];

            if (data.moderationWarning) {
                updatedMessages.push({
                    success: false,
                    content: data.moderationWarning,
                    role: "bot",
                    isNew: true,
                    retryable: false,
                    code: "MODERATION_WARNING",
                    createdAt: new Date().toISOString(),
                });
            }

            updateSessionMessages(currentSessionId, updatedMessages);
            if (newMessages.length === 1) {
                updateSessionTitle(currentSessionId, text.slice(0, 20) || "Obrolan Baru");
            }

            setIsWaitingResponse(false);
            setIsTypingEffect(true);
            const typingDuration = Math.max(
                MIN_TYPING_DURATION_MS,
                Math.min((data.response?.length || 0) * TYPING_SPEED_MS, MAX_TYPING_DURATION_MS)
            );
            await new Promise((resolve) => setTimeout(resolve, typingDuration));
            updateSessionMessages(
                currentSessionId,
                updatedMessages.map((msg) => (msg.isNew ? { ...msg, isNew: false } : msg))
            );
            setIsTypingEffect(false);
            setLastFailedText(null);
        } catch (error) {
            setLastFailedText(text);
            updateSessionMessages(currentSessionId, [
                ...newMessages,
                {
                    success: false,
                    content: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
                    role: "bot" as const,
                    isNew: true,
                    retryable: true,
                    code: "NETWORK_ERROR",
                    createdAt: new Date().toISOString(),
                },
            ]);
            setIsWaitingResponse(false);
            setIsTypingEffect(false);
        }
    };

    return (
        <div className="w-full lg:max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-64px)]">
            {isLoading || userLoading ? (
                <div className="flex flex-1 items-center justify-center h-screen">
                    <div className="text-center flex items-center justify-center gap-2">
                        <Spinner /> Tunggu Sebentar...
                    </div>
                </div>
            ) : messages.length > 0 ? (
                <>
                    <main className="p-4 pb-24 flex-1 overflow-y-auto">
                        <Chat
                            messages={messages}
                            isTyping={isWaitingResponse || isTypingEffect}
                            isWaitingResponse={isWaitingResponse}
                            onRetry={
                                lastFailedText && !isWaitingResponse && !isTypingEffect
                                    ? () => handleSendMessage(lastFailedText)
                                    : undefined
                            }
                        />
                    </main>
                    <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
                        <div className="mx-auto w-full lg:max-w-3xl px-4 py-3">
                            <InputChat onSendMessage={handleSendMessage} isTyping={isWaitingResponse || isTypingEffect} />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
                    <div className="mb-8">
                        <h2 className="font-semibold text-2xl">Apa hal yang ingin Anda diskusikan hari ini?</h2>

                        <div className="mt-5 w-full max-w-2xl mx-auto">
                            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-1">
                            {suggestedPrompts.map((prompt) => (
                                <Button
                                    key={prompt.id}
                                    type="button"
                                    variant="outline"
                                    className="shrink-0 rounded-full h-9 px-4 text-xs sm:text-sm"
                                    disabled={isWaitingResponse || isTypingEffect}
                                    onClick={() => handleSendMessage(prompt.text)}
                                >
                                    {prompt.label}
                                </Button>
                            ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:max-w-3xl">
                        <InputChat onSendMessage={handleSendMessage} isTyping={isWaitingResponse || isTypingEffect} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;