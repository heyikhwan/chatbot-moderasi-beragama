"use client"

import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header"
import ChatBot from "@/components/pages/chat/chat-bot"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/useUser"

export default function ChatPage() {
    const { user } = useUser()
    return (
        <SidebarProvider>
            {/* {user && <AppSidebar />} */}
            <SidebarInset>
                <Header />

                <ChatBot />

            </SidebarInset>

        </SidebarProvider>
    )
}
