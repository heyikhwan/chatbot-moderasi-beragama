import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header"
import Chat from "@/components/pages/home/chat"
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

        <div className={`w-full lg:max-w-3xl mx-auto flex flex-col ${true ? "" : "my-auto"}`}>
          {true ? (
            <>
              <main className="p-4 flex-1 overflow-y-auto pb-32">
                <Chat />
              </main>

              <div className="fixed bottom-0 left-0 right-0 bg-background">
                <div className="mx-auto w-full lg:max-w-3xl px-4 py-3">
                  <InputChat />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-4 h-screen">
              <Introduce />

              <div className="w-full lg:max-w-3xl">
                <InputChat />
              </div>
            </div>
          )}
        </div>

      </SidebarInset>

    </SidebarProvider>
  )
}
