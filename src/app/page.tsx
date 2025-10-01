import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header"
import InputChat from "@/components/pages/home/input-chat"
import Introduce from "@/components/pages/home/introduce"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      {/* <AppSidebar /> */}
      <SidebarInset>
        <Header />

        <div className={`w-full lg:max-w-3xl mx-auto relative flex flex-col ${!true ? "" : "my-auto"}`}>
          {!true ? (
            <>
              <main className="p-4 flex-1 overflow-y-auto pb-32">
                <div className="mb-2">
                  Chat muncul disini
                </div>
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
