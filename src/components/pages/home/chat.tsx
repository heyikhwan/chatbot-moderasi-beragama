type ChatProps = {
    messages: { content: string; role: "user" | "bot" }[]
    isTyping: boolean
}

const Chat = ({ messages, isTyping }: ChatProps) => {
    return (
        <div className="mb-2">
            {messages.map((item, index) => (
                <div key={index} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                    <div className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`${item.role === "user" ? "bg-input" : "bg-none"} rounded-4xl py-2.5 px-4`}>
                            <p>{item.content}</p>
                        </div>
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex justify-start mb-2">
                    <div className="bg-muted rounded-4xl py-2.5 px-4 flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:.2s]" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:.4s]" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Chat
