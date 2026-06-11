import { useEffect } from "react";
import { ChevronLeft, List } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PolicyReportWorkspace } from "@/components/policy-report/PolicyReportWorkspace";

const PolicyReport = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#report-generate") {
      document.getElementById("report-generate")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div className="h-full overflow-y-auto bg-background p-5 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            返回政策兑现
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/policy-report/tasks")}
          >
            <List className="h-4 w-4" />
            历史任务列表
          </Button>
        </div>

        <Card id="report-generate" className="border border-border bg-card p-5 shadow-sm md:p-6">
          <PolicyReportWorkspace embedded />
        </Card>
      </div>
    </div>
  );
};

export default PolicyReport;
