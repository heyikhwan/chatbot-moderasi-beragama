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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sessions, selectedSessionId, setSelectedSessionId, addSession } = useChatStore();

  const createNewSession = () => {
    const tempId = crypto.randomUUID();
    addSession({ id: tempId, title: "Obrolan Baru", chats: [] });
    setSelectedSessionId(tempId);
  };

  const navMain = [
    {
      title: "Riwayat Obrolan",
      url: "#",
      items: sessions.map((s) => ({
        title: s.title,
        url: "#",
        isActive: s.id === selectedSessionId,
      })),
    },
  ];

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
        {navMain.map((item, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url} onClick={() => setSelectedSessionId(sessions[index].id)}>
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}