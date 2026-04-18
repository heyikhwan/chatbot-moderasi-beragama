import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sessions, selectedSessionId, setSelectedSessionId, addSession, deleteSession, setSessions } = useChatStore();

  const createNewSession = () => {
    const tempId = crypto.randomUUID();
    addSession({ id: tempId, title: "Obrolan Baru", chats: [], temp: true });
    setSelectedSessionId(tempId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!sessions.find(s => s.id === sessionId)?.temp) {
      try {
        const res = await fetch("/api/chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatSessionId: sessionId }),
        });
        if (!res.ok) {
          return;
        }
      } catch (error) {
        return;
      }
    }
    deleteSession(sessionId);
    // Refresh daftar sesi dari server
    try {
      const res = await fetch("/api/chat", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const { sessions: updatedSessions } = await res.json();
      setSessions(updatedSessions);
      if (updatedSessions.length > 0) {
        setSelectedSessionId(updatedSessions[0].id);
      } else {
        setSelectedSessionId(null);
      }
    } catch (error) {
      setSessions([]);
      setSelectedSessionId(null);
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="text-center py-3">
          <Button variant="outline" size="sm" className="w-full cursor-pointer rounded" onClick={createNewSession}>
            <Plus /> Obrolan Baru
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Riwayat Obrolan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((chatSession) => (
                <SidebarMenuItem key={chatSession.id} className="flex items-center justify-between gap-1">
                  <SidebarMenuButton asChild isActive={chatSession.id === selectedSessionId}>
                    <a
                      href="#!"
                      onClick={() => setSelectedSessionId(chatSession.id)}
                      title={chatSession.title}
                      className="truncate"
                    >
                      {chatSession.title}
                    </a>
                  </SidebarMenuButton>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-1 size-9 shrink-0">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus obrolan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ini akan menghapus seluruh obrolan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batalkan</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSession(chatSession.id)}
                          className="bg-destructive hover:bg-destructive/80"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}