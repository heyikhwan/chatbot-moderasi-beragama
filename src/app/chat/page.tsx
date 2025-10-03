import Header from "@/components/header"
import ChatBot from "@/components/pages/chat/chat-bot"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function ChatPage() {

    return (
        <SidebarProvider>
            {/* <AppSidebar /> */}
            <SidebarInset>
                <Header />

                <ChatBot />

            </SidebarInset>

        </SidebarProvider>
    )
}
