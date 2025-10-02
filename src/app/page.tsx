import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header"
import Chat from "@/components/pages/home/chat"
import ChatBot from "@/components/pages/home/chat-bot"
import InputChat from "@/components/pages/home/input-chat"
import Introduce from "@/components/pages/home/introduce"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function HomePage() {

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
