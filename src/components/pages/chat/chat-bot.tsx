"use client"

import React, { useState, useEffect } from 'react'
import Chat from './chat'
import InputChat from './input-chat'
import { useUser } from "@/hooks/useUser"
import { Spinner } from '@/components/ui/spinner'

const ChatBot = () => {
    const { user, loading: userLoading } = useUser()
    const [messages, setMessages] = useState<{ success: boolean; content: string; role: "user" | "bot"; isNew?: boolean }[]>([])
    const [isWaitingResponse, setIsWaitingResponse] = useState(false)
    const [isTypingEffect, setIsTypingEffect] = useState(false)
    const [chatSessionId, setChatSessionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Ambil sesi aktif
    useEffect(() => {
        const fetchActiveSession = async () => {
            if (user && !userLoading) {
                setIsLoading(true)
                try {
                    const res = await fetch('/api/chat', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    })
                    const { session, messages } = await res.json()
                    if (session) {
                        setChatSessionId(session.id)
                        setMessages(messages.map((msg: any) => ({ ...msg, isNew: false })) || [])
                    }
                } catch {
                    setMessages([{ success: false, content: "Gagal memuat sesi", role: "bot", isNew: false }])
                } finally {
                    setIsLoading(false)
                }
            }
        }
        fetchActiveSession()
    }, [user, userLoading])

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !user || userLoading) return

        setMessages((prev) => [...prev, { success: true, content: text, role: "user", isNew: true }])
        setIsWaitingResponse(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, chatSessionId })
            })

            setIsWaitingResponse(false)
            setIsTypingEffect(true)

            const data = await res.json()
            if (!res.ok) {
                setMessages((prev) => [...prev, { success: false, content: data.error || "Maaf, terjadi kesalahan", role: "bot", isNew: true }])
                return
            }

            setMessages((prev) => [...prev, { success: true, content: data.response, role: "bot", isNew: true }])
            setChatSessionId(data.chatSessionId)

            // Perpanjang isTypingEffect berdasarkan panjang teks dan kecepatan pengetikan (40ms per karakter)
            const typingDuration = data.response.length * 40
            await new Promise((resolve) => setTimeout(resolve, typingDuration))
        } catch {
            setMessages((prev) => [...prev, { success: false, content: "Maaf, terjadi kesalahan", role: "bot", isNew: true }])
        } finally {
            setIsTypingEffect(false)
        }
    }

    const handleDeleteSession = async () => {
        if (chatSessionId) {
            await fetch('/api/chat', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatSessionId })
            })
            setChatSessionId(null)
            setMessages([])
        }
    }

    return (
        <div className="w-full lg:max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-64px)]">
            {isLoading || userLoading ? (
                <div className="flex flex-1 items-center justify-center h-screen">
                    <div className="text-center flex items-center justify-center gap-2"><Spinner /> Tunggu Sebentar...</div>
                </div>
            ) : messages.length > 0 ? (
                <>
                    <main className="p-4 flex-1 overflow-y-auto">
                        <Chat messages={messages} isTyping={isWaitingResponse || isTypingEffect} isWaitingResponse={isWaitingResponse} />
                    </main>

                    <div className="sticky bottom-0 left-0 right-0 bg-background">
                        <div className="mx-auto w-full lg:max-w-3xl px-4 py-3">
                            <InputChat
                                onSendMessage={handleSendMessage}
                                onDeleteSession={handleDeleteSession}
                                isTyping={isWaitingResponse || isTypingEffect}
                                hasMessages={messages.length > 0}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
                    <div className="mb-8">
                        <h2 className="font-semibold text-2xl">Apa hal yang ingin Anda diskusikan hari ini?</h2>
                    </div>

                    <div className="w-full lg:max-w-3xl">
                        <InputChat
                            onSendMessage={handleSendMessage}
                            onDeleteSession={handleDeleteSession}
                            isTyping={isWaitingResponse || isTypingEffect}
                            hasMessages={messages.length > 0}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBot