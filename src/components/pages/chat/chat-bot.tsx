"use client"

import React, { useState } from 'react'
import Chat from './chat'
import InputChat from './input-chat'

const ChatBot = () => {

    const [messages, setMessages] = useState<{ success: boolean; content: string; role: "user" | "bot" }[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return

        setMessages((prev) => [...prev, { success: true, content: text, role: "user" }])
        setIsTyping(true)

        const errorMessage = { success: false, content: "Maaf, terjadi kesalahan", role: "bot" } as const

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            })

            if (!res.ok) {
                setMessages((prev) => [...prev, errorMessage])
                return
            }

            const { response } = await res.json()
            if (!response) {
                setMessages((prev) => [...prev, errorMessage])
                return
            }

            setMessages((prev) => [...prev, { success: true, content: response, role: "bot" }])
        } catch {
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsTyping(false)
        }
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
                            <InputChat onSendMessage={handleSendMessage} isTyping={isTyping} />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-4 h-screen">
                    <div className="mb-8">
                        <h2 className="font-semibold text-2xl">Apa hal yang ingin Anda diskusikan hari ini ?</h2>
                    </div>

                    <div className="w-full lg:max-w-3xl">
                        <InputChat onSendMessage={handleSendMessage} isTyping={isTyping} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBot
