import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  NEW_COMPARE_ANALYSIS_PATH,
  POLICY_COMPARE_ANALYSIS_TASKS,
} from "@/lib/policyCompareAnalysisTasks";

export default function PolicyCompareAnalysisTaskList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const filteredTasks = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return POLICY_COMPARE_ANALYSIS_TASKS;
    return POLICY_COMPARE_ANALYSIS_TASKS.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.taskType.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q),
    );
  }, [keyword]);

  const openTask = (taskId: string, title: string) => {
    navigate(
      `/policy-analysis?mode=compare&taskId=${taskId}&taskName=${encodeURIComponent(title)}`,
    );
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(NEW_COMPARE_ANALYSIS_PATH)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回对比分析
        </button>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">历史任务列表</h1>
          <p className="text-sm text-muted-foreground">查看并打开历史政策对比分析任务，继续分析或查阅对比结果。</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索任务名称、分析类型或状态"
              className="h-10 pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setKeyword("")}>
            重置
          </Button>
        </div>

        {filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            暂无匹配的历史对比分析任务
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <Card
                key={task.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer border border-border p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                onClick={() => openTask(task.id, task.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openTask(task.id, task.title);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-base font-semibold text-foreground">{task.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {task.taskType}
                      </Badge>
                      <Badge variant={task.status === "已完成" ? "default" : "secondary"} className="text-[10px]">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>创建时间：{task.createdAt}</p>
                  <p>修改时间：{task.updatedAt}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">共 {filteredTasks.length} 条</p>
      </div>
    </div>
  );
}
