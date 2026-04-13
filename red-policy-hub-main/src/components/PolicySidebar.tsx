import {
  FileText,
  Send,
  Gift,
  BarChart3,
  FolderOpen,
  Database,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const topMenuItems = [
  { title: "政策制定", url: "/", icon: FileText },
  { title: "政策触达", url: "/policy-reach", icon: Send },
  { title: "政策兑现", url: "/policy-fulfillment", icon: Gift },
  { title: "政策评价", url: "/policy-evaluation", icon: BarChart3 },
];

const bottomMenuItems = [
  { title: "我的文档", url: "/my-documents", icon: FolderOpen },
  { title: "储备库", url: "/reserve", icon: Database },
];

interface PolicySidebarProps {
  variant?: 1 | 2 | 3;
}

export function PolicySidebar({ variant = 1 }: PolicySidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row w-full items-center justify-between px-3 py-2">
        {/* 品牌名：展開時顯示，折疊時隱藏（sidebar data-state="collapsed"） */}
        <span className="text-sm font-bold text-foreground truncate group-data-[collapsible=icon]:hidden">
          惠企政策大脑
        </span>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            文档管理
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
