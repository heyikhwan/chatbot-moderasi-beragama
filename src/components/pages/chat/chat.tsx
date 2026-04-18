import { useEffect, useRef, useState } from "react";
import { Bot, CircleSlash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatProps = {
  messages: {
    success: boolean;
    content: string;
    role: "user" | "bot";
    sentiment?: string;
    isNew?: boolean;
    createdAt?: string;
    retryable?: boolean;
    code?: string;
  }[];
  isTyping: boolean;
  isWaitingResponse: boolean;
  onRetry?: () => void;
};

const sectionLinePattern = /^(ringkasan|langkah(?:\s+praktis)?|catatan|kesimpulan|rekomendasi)\s*:\s*(.*)$/i;

const toSectionTitle = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (value === "ringkasan") return "Ringkasan";
    if (value === "langkah" || value === "langkah praktis") return "Langkah Praktis";
    if (value === "catatan") return "Catatan";
    if (value === "kesimpulan") return "Kesimpulan";
    if (value === "rekomendasi") return "Rekomendasi";
    return raw;
};

const enhanceSemanticSections = (text: string) => {
    const lines = text.split("\n");
    const enhanced: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(sectionLinePattern);

        if (!match) {
            enhanced.push(line);
            continue;
        }

        const sectionTitle = toSectionTitle(match[1]);
        const remainder = match[2]?.trim();

        enhanced.push(`### ${sectionTitle}`);
        if (remainder) {
            enhanced.push(remainder);
        }
    }

    return enhanced.join("\n");
};

const normalizeReadableText = (text: string) => {
    let normalized = text;

    if (!normalized.includes("\n")) {
        const markerMatches = normalized.match(/\d+\.\s/g) || [];
        if (markerMatches.length >= 2) {
            let markerIndex = 0;
            normalized = normalized.replace(/\d+\.\s/g, (match) => {
                markerIndex += 1;
                return markerIndex === 1 ? match : `\n${match}`;
            });
        }
    }

    // Ensure bullets and numeric markers always start on a new line for cleaner markdown parsing.
    normalized = normalized
        .replace(/\s+(-\s+)/g, "\n$1")
        .replace(/\s+(\*\s+)/g, "\n$1")
        .replace(/\s+(\d+\.\s+)/g, "\n$1");

    return enhanceSemanticSections(normalized);
};

const renderStructuredText = (rawText: string) => {
    const text = normalizeReadableText(rawText);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="leading-7 my-2 first:mt-0 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-7">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground my-2">
                        {children}
                    </blockquote>
                ),
                h1: ({ children }) => <h1 className="text-lg font-semibold mt-3 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => (
                    <h3 className="text-xs font-semibold uppercase tracking-wide mt-3 mb-1 inline-flex items-center rounded-md px-2.5 py-1 bg-primary/12 text-primary border border-primary/20">
                        {children}
                    </h3>
                ),
                code: ({ className, children }) => {
                    const raw = String(children ?? "");
                    const isBlock = Boolean(className?.includes("language-")) || raw.includes("\n");

                    return isBlock ? (
                        <code className="block p-3 rounded-lg bg-background/60 border border-border overflow-x-auto text-sm my-2">
                            {children}
                        </code>
                    ) : (
                        <code className="px-1 py-0.5 rounded bg-background/60 border border-border text-[0.9em]">
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <div className="my-2">{children}</div>,
                hr: () => <hr className="my-3 border-border" />,
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 text-primary break-words"
                    >
                        {children}
                    </a>
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                        <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                ),
                th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,
            }}
        >
            {text}
        </ReactMarkdown>
    );
};

const TypingMarkdown = ({ text, speed = 18 }: { text: string; speed?: number }) => {
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        setCharCount(0);

        if (!text) return;

        const interval = setInterval(() => {
            setCharCount((prev) => {
                if (prev >= text.length) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    const displayedText = text.slice(0, charCount);
    const isFinished = charCount >= text.length;

    return (
        <div onClick={() => setCharCount(text.length)} className="cursor-text">
            {renderStructuredText(displayedText)}
            {!isFinished && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:.3s]" />
                    <span className="ml-1">sedang mengetik</span>
                </div>
            )}
        </div>
    );
};

const formatTime = (value?: string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const Chat = ({ messages, isTyping, isWaitingResponse, onRetry }: ChatProps) => {
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const isPinnedToBottomRef = useRef(true);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            isPinnedToBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
        };

        container.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const scrollToBottom = () => {
            if (chatContainerRef.current) {
                if (isPinnedToBottomRef.current || isTyping) {
                    requestAnimationFrame(() => {
                        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    });
                }
            }
        };

        scrollToBottom();

        const observer = new ResizeObserver(() => {
            scrollToBottom();
        });

        if (chatContainerRef.current) {
            observer.observe(chatContainerRef.current);
        }

        return () => observer.disconnect();
    }, [messages, isTyping]);

    return (
        <div ref={chatContainerRef} className="chat-container mb-2 min-w-0 overflow-x-hidden" aria-live="polite" aria-busy={isTyping}>
            {messages.map((item, index) => {
                const messageKey = `${item.createdAt ?? "na"}-${item.role}-${item.code ?? "ok"}-${item.content.slice(0, 24)}-${index}`;

                return (
                <div key={messageKey} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"} mb-5`}>
                    <div className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"} max-w-[92%] sm:max-w-[85%] lg:max-w-[80%] min-w-0`}>
                        <div className="text-[11px] text-muted-foreground mb-1 px-1">
                            {item.role === "user" ? "Anda" : "Modera AI"} {formatTime(item.createdAt)}
                        </div>
                        <div
                            className={`${
                                item.role === "user"
                                    ? "bg-primary/10 text-foreground border border-primary/20"
                                    : item.success
                                        ? "bg-muted text-foreground border border-border"
                                        : "bg-destructive/10 text-foreground border border-destructive/20"
                            } rounded-2xl py-2.5 px-3 sm:px-4 break-words overflow-x-auto`}
                        >
                            <div className={`flex items-start gap-3 ${!item.success && "text-destructive"}`}>
                                {!item.success && <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-1" />}
                                {item.role === "bot" && (
                                    <Bot className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                )}
                                <div className="flex-1">
                                    {item.role === "bot" && item.success && item.isNew ? (
                                        <TypingMarkdown text={item.content} speed={18} />
                                    ) : (
                                        renderStructuredText(item.content)
                                    )}
                                    {item.role === "bot" && item.sentiment && item.sentiment == "negatif" && (
                                    <div className="text-xs text-destructive flex items-center gap-1 mt-3">
                                        <CircleSlash2 className="w-3 h-3" /> <span>Sentiment {item.sentiment}</span></div>
                            )}

                                    {!item.success && item.retryable && index === messages.length - 1 && onRetry && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 h-8"
                                            onClick={onRetry}
                                        >
                                            Coba lagi
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )})}

            {isWaitingResponse && (
                <div className="flex justify-start mb-2">
                    <div className="bg-muted rounded-4xl py-2.5 px-4 flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:.2s]" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:.4s]" />
                    </div>
                </div>
            )}

            <div ref={chatEndRef} />
        </div>
    );
};

export default Chat;