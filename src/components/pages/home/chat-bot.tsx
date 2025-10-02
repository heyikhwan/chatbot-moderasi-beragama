"use client"

import React, { useState } from 'react'
import Chat from './chat'
import InputChat from './input-chat'
import Introduce from './introduce'

const ChatBot = () => {

    const [messages, setMessages] = useState<{ content: string; role: "user" | "bot" }[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return

        setMessages((prev) => [...prev, { content: text, role: "user" }])

        setIsTyping(true)

        setTimeout(() => {
            setIsTyping(false)
            setMessages((prev) => [...prev, { content: "Oke, aku paham 👍", role: "bot" }])
        }, 1000)
    }

    return (
        <div className={`w-full lg:max-w-3xl mx-auto flex flex-col ${messages.length > 0 ? "" : "my-auto"}`}>
            {messages.length > 0 ? (
                <>
                    <main className="p-4 flex-1 overflow-y-auto pb-32">
                        <Chat messages={messages} isTyping={isTyping} />
                    </main>

                    <div className="fixed bottom-0 left-0 right-0 bg-background">
                        <div className="mx-auto w-full lg:max-w-3xl px-4 py-3">
                            <InputChat onSendMessage={handleSendMessage} isTyping={isTyping}  />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-4 h-screen">
                    <Introduce />

                    <div className="w-full lg:max-w-3xl">
                        <InputChat onSendMessage={handleSendMessage} isTyping={isTyping} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBot
