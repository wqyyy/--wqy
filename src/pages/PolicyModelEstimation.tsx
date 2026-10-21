import { ArrowLeft, List } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FundingWorkspace } from "@/components/funding/FundingWorkspace";
import { readFundingTasks } from "@/lib/fundingTasks";
import { useState } from "react";
import { PageHero } from "@/components/PageHero";

export default function PolicyModelEstimation() {
  const location = useLocation();
  return <PolicyModelEstimationSession key={location.key} />;
}

function PolicyModelEstimationSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  const clause = searchParams.get("clause") ?? "";
  const [savedTask] = useState(() => {
    const tasks = readFundingTasks();
    if (taskId) return tasks.find(task => task.id === taskId);
    if (clause || searchParams.has("new")) return undefined;
    return tasks[0]?.archived ? undefined : tasks[0];
  });
  return <div className="h-full overflow-y-auto p-5 md:p-6"><div className="mx-auto max-w-[1400px] space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><button className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate("/policy-writing")}><ArrowLeft className="h-4 w-4" />返回政策制定</button><Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/policy-writing/model-estimation/tasks")}><List className="h-4 w-4" />历史任务列表</Button></div>
    <PageHero title="资金测算" className="[&_p]:max-w-none" description="基于大模型语义理解与政策规则解析能力，智能提取政策条款中的企业适用条件、资金扶持标准及测算规则，结合企业实际经营数据，自动识别符合政策条件的企业，测算预计受益企业数量及所需扶持资金总规模，为政策制定、财政资金预算编制及资金配置提供科学依据。" />
    <FundingWorkspace initialClauseContent={clause} savedTask={savedTask} persistent />
  </div></div>;
}
