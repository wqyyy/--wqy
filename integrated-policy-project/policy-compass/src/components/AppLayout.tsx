import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";
import { AiAssistant } from "@/components/AiAssistant";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-14 flex items-center justify-between bg-primary px-4 shrink-0 w-full z-10 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-primary-foreground tracking-wide">惠企政策大脑</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10">
            <Bot className="h-4 w-4" />
            AI 智能助手
          </Button>
        </div>
      </header>
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden w-full mt-14">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
      <AiAssistant />
    </div>
  );
}
