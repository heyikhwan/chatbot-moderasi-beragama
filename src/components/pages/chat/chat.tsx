import { useEffect, useRef } from "react";
import { TypingEffect } from "@/components/typing-effect";
import { Bot, TriangleAlert } from "lucide-react";

type ChatProps = {
    messages: { success: boolean; content: string; role: "user" | "bot"; isNew?: boolean }[];
    isTyping: boolean;
    isWaitingResponse: boolean;
};

const Chat = ({ messages, isTyping, isWaitingResponse }: ChatProps) => {
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const scrollToBottom = () => {
            if (chatContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

                if (isNearBottom || isTyping || messages.length > 0) {
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
        <div ref={chatContainerRef} className="chat-container mb-2">
            {messages.map((item, index) => (
                <div key={index} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"} mb-5`}>
                    <div className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                        <div
                            className={`${
                                item.role === "user"
                                    ? "bg-input text-foreground"
                                    : "bg-none"
                            } rounded-xl py-2.5 px-4`}
                        >
                            <div className={`flex items-start gap-3 ${!item.success && "text-destructive"}`}>
                                {!item.success && <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-1" />}
                                {item.role === "bot" && (
                                    <Bot className="w-6 h-6 flex-shrink-0 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                    {item.role === "bot" && item.success && item.isNew ? (
                                        <TypingEffect text={item.content} />
                                    ) : (
                                        <span>{item.content}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

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