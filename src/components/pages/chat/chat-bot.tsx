"use client";

import React, { useEffect } from "react";
import Chat from "./chat";
import InputChat from "./input-chat";
import { useUser } from "@/hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import { useChatStore } from "@/stores/chatStore";

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
  const [isWaitingResponse, setIsWaitingResponse] = React.useState(false);
  const [isTypingEffect, setIsTypingEffect] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const messages = sessions.find((s) => s.id === selectedSessionId)?.chats || [];

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
              chats: [{ success: false, content: "Gagal memuat sesi", role: "bot" }],
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

    let currentSessionId: string;
    if (!selectedSessionId) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const { chatSessionId, title } = await res.json();
      if (!chatSessionId) {
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
      { success: true, content: text, role: "user" as const, isNew: true },
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
      const data = await res.json();
      if (!res.ok) {
        updateSessionMessages(currentSessionId, [
          ...newMessages,
          { success: false, content: data.error || "Maaf, terjadi kesalahan", role: "bot" as const, isNew: true },
        ]);
        return;
      }

      const updatedMessages = [
        ...newMessages,
        { success: true, content: data.response, role: "bot" as const, isNew: true, sentiment: data.sentiment },
      ];
      updateSessionMessages(currentSessionId, updatedMessages);
      if (newMessages.length === 1) {
        updateSessionTitle(currentSessionId, text.slice(0, 20) || "Obrolan Baru");
      }

      setIsWaitingResponse(false);
      setIsTypingEffect(true);
      const typingDuration = data.response.length * 40;
      await new Promise((resolve) => setTimeout(resolve, typingDuration));
      updateSessionMessages(currentSessionId, updatedMessages.map((msg, idx) =>
        idx === updatedMessages.length - 1 ? { ...msg, isNew: false } : msg
      ));
      setIsTypingEffect(false);
    } catch (error) {
      updateSessionMessages(currentSessionId, [
        ...newMessages,
        { success: false, content: "Maaf, terjadi kesalahan", role: "bot" as const, isNew: true },
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
          <main className="p-4 flex-1 overflow-y-auto">
            <Chat messages={messages} isTyping={isWaitingResponse || isTypingEffect} isWaitingResponse={isWaitingResponse} />
          </main>
          <div className="sticky bottom-0 left-0 right-0 bg-background">
            <div className="mx-auto w-full lg:max-w-3xl px-4 py-3">
              <InputChat
                onSendMessage={handleSendMessage}
                isTyping={isWaitingResponse || isTypingEffect}
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
              isTyping={isWaitingResponse || isTypingEffect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;