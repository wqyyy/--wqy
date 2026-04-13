import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PolicySidebar } from "@/components/PolicySidebar";
import { VersionThree } from "@/components/versions/VersionThree";
import { ChatDialog } from "@/components/ChatDialog";

const MODULE_NAMES: Record<string, string> = {
  "/": "政策制定",
  "/policy-reach": "政策触达",
  "/policy-fulfillment": "政策兑现",
  "/policy-evaluation": "政策评价",
  "/my-documents": "我的文档",
  "/reserve": "储备库",
};

const Index = () => {
  const location = useLocation();
  const moduleName = MODULE_NAMES[location.pathname] ?? "惠企政策大脑";

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <PolicySidebar variant={3} />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-14 flex items-center border-b px-4 bg-card shrink-0">
            <h1 className="text-base font-semibold text-foreground">{moduleName}</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto min-h-0 flex flex-col">
            <VersionThree />
          </main>
        </div>
        <ChatDialog />
      </div>
    </SidebarProvider>
  );
};

export default Index;
