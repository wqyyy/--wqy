import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskListCard } from "@/components/TaskListCard";
import { TaskListSearchBar } from "@/components/TaskListSearchBar";
import { POLICY_ESTIMATION_TASKS } from "@/lib/policyEstimationTasks";
import { readFundingTasks } from "@/lib/fundingTasks";
import { TaskListPagination } from "@/components/TaskListPagination";
import { useTaskListPagination } from "@/hooks/useTaskListPagination";

export default function PolicyEstimationTaskList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks] = useState(() => [
    ...readFundingTasks().map(task => ({ ...task, scene: task.clause, budgetRange: task.result ? `${task.result.total} 万元` : "", status: task.archived ? "已归档" : task.result ? "已分析完成" : "进行中" })),
    ...POLICY_ESTIMATION_TASKS.map(task => ({ ...task, status: "已完成" })),
  ]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.scene.toLowerCase().includes(q) ||
        task.budgetRange.toLowerCase().includes(q),
    );
  }, [searchQuery, tasks]);

  const handleSearch = () => {
    setSearchQuery(keyword.trim());
  };

  const handleReset = () => {
    setKeyword("");
    setSearchQuery("");
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems,
  } = useTaskListPagination(filteredTasks, searchQuery);

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/policy-writing/model-estimation")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回政策测算
        </button>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">政策测算任务列表</h1>
        </div>

        <TaskListSearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          placeholder="请输入测算任务名称进行搜索"
          extraActions={
            <Button
              className="h-9 gap-1.5 px-4 gov-gradient text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/policy-writing/model-estimation?new=1")}
            >
              <Plus className="h-4 w-4" />
              新建测算任务
            </Button>
          }
        />

        {filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            暂无匹配的历史测算任务
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedItems.map((task) => (
              <TaskListCard
                key={task.id}
                title={task.title}
                status={task.status}
                icon={Calculator}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                onOpen={() =>
                  navigate(
                    `/policy-writing/model-estimation?taskId=${task.id}&taskName=${encodeURIComponent(task.title)}`,
                  )
                }
              />
            ))}
          </div>
        )}

        <TaskListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
