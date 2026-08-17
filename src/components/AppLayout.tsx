import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FolderOpen,
  Home,
  LogOut,
  PenTool,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { AiAssistant } from "@/components/AiAssistant";
import { NavLink } from "@/components/NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";

const SIDEBAR_STORAGE_KEY = "policy-brain-sidebar-collapsed";

const CURRENT_USER = {
  name: "张三",
};

const sideNavItems = [
  { title: "首页", url: "/home", icon: Sparkles },
  { title: "政策制定", url: "/policy-writing", icon: PenTool },
  { title: "政策触达", url: "/policy-reach", icon: Send },
  { title: "政策兑现", url: "/dashboard", icon: Home },
  { title: "政策评价", url: "/policy-evaluation", icon: ClipboardCheck },
];

const documentNavItems = [
  { title: "智能生成成果", url: "/my-documents", icon: FolderOpen },
  { title: "我的素材库", url: "/reserve-library", icon: Database },
];

type NavItem = (typeof sideNavItems)[number];

function SidebarNavLink({
  item,
  collapsed,
  end,
}: {
  item: NavItem;
  collapsed: boolean;
  end?: boolean;
}) {
  const link = (
    <NavLink
      to={item.url}
      end={end}
      className={cn(
        "flex items-center rounded-2xl text-[17px] font-semibold text-white/90 transition-all hover:bg-white/10 hover:text-white",
        collapsed ? "mx-auto w-12 justify-center px-0 py-3.5" : "gap-4 px-5 py-4",
      )}
      activeClassName="bg-[#a90e2c] text-white shadow-[0_10px_22px_rgba(110,0,23,0.25)]"
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
      {collapsed && <span className="sr-only">{item.title}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="border-white/10 bg-[#1a1a1a] text-white">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function AppLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="h-screen bg-[#f7f4f4] text-foreground">
      <div className="relative h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-gradient-to-b from-[#d21639] via-[#c61033] to-[#b80f2f] text-white shadow-[18px_0_40px_rgba(157,12,38,0.22)] transition-[width] duration-200 ease-out",
            collapsed ? "w-[72px]" : "w-[244px]",
          )}
        >
          <div
            className={cn(
              "border-b border-white/12",
              collapsed ? "px-2 py-6" : "px-6 py-12",
            )}
          >
            <button
              onClick={() => navigate("/home")}
              className={cn(
                "flex w-full text-left transition-opacity hover:opacity-80",
                collapsed ? "justify-center" : "items-center gap-4",
              )}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/12 backdrop-blur">
                <img src={logoImg} alt="北京亦庄" className="h-full w-full object-cover" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-bold tracking-[0.02em]">惠企政策大脑</p>
                  <p className="mt-1 text-sm text-white/80">政策管理平台</p>
                </div>
              )}
            </button>
          </div>

          <nav className={cn("flex-1 overflow-y-auto py-7", collapsed ? "px-2" : "px-5")}>
            <div className="space-y-2">
              {sideNavItems.map((item) => (
                <SidebarNavLink key={item.title} item={item} collapsed={collapsed} end={item.url === "/home"} />
              ))}
            </div>

            <div className={cn("mt-8 border-t border-white/16 pt-8", collapsed && "mt-6 pt-6")}>
              <div className="space-y-2">
                {documentNavItems.map((item) => (
                  <SidebarNavLink key={item.title} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          </nav>

          <div className={cn("mt-auto", collapsed ? "px-2 pb-2" : "px-3 pb-2")}>
            <div className={cn(collapsed ? "px-0 pb-2" : "px-1 pb-2")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {collapsed ? (
                    <button
                      type="button"
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label={CURRENT_USER.name}
                    >
                      <UserRound className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {CURRENT_USER.name}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-white/70" />
                    </button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align={collapsed ? "center" : "start"}
                  sideOffset={8}
                  className="min-w-[160px]"
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={() => {
                      toast.success("已退出登录");
                      navigate("/home");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="border-t border-white/12 pt-2">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                aria-expanded={!collapsed}
                aria-label={collapsed ? "展开侧栏" : "折叠侧栏"}
              >
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <>
                    <ChevronLeft className="h-5 w-5 shrink-0" />
                    <span className="truncate">收起</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* 右侧内容区：随侧栏折叠调整 left；允许纵向滚动 */}
        <div
          className={cn(
            "absolute inset-0 overflow-x-hidden overflow-y-auto transition-[left] duration-200 ease-out",
            collapsed ? "left-[72px]" : "left-[244px]",
          )}
        >
          <Outlet />
        </div>
      </div>

      <AiAssistant />
    </div>
  );
}
