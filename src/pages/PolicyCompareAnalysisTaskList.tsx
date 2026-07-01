import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskListCard, TaskListIconButton } from "@/components/TaskListCard";
import { TaskListSearchBar } from "@/components/TaskListSearchBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditPolicyCompareAnalysisTaskDialog } from "@/components/policy-analysis/EditPolicyCompareAnalysisTaskDialog";
import {
  formatPolicyCompareAnalysisUpdatedAt,
  loadPolicyCompareAnalysisTasks,
  NEW_COMPARE_ANALYSIS_PATH,
  type PolicyCompareAnalysisTask,
  savePolicyCompareAnalysisTasks,
} from "@/lib/policyCompareAnalysisTasks";
import { TaskListPagination } from "@/components/TaskListPagination";
import { useTaskListPagination } from "@/hooks/useTaskListPagination";

export default function PolicyCompareAnalysisTaskList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<PolicyCompareAnalysisTask[]>(() => loadPolicyCompareAnalysisTasks());
  const [editingTask, setEditingTask] = useState<PolicyCompareAnalysisTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<PolicyCompareAnalysisTask | null>(null);

  const persistTasks = (nextTasks: PolicyCompareAnalysisTask[]) => {
    setTasks(nextTasks);
    savePolicyCompareAnalysisTasks(nextTasks);
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) => task.title.toLowerCase().includes(q));
  }, [searchQuery, tasks]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems,
  } = useTaskListPagination(filteredTasks, searchQuery);

  const handleSearch = () => {
    setSearchQuery(keyword.trim());
  };

  const handleReset = () => {
    setKeyword("");
    setSearchQuery("");
  };

  const openTask = (task: PolicyCompareAnalysisTask) => {
    navigate(
      `/policy-analysis?mode=compare&taskId=${task.id}&taskName=${encodeURIComponent(task.title)}`,
    );
  };

  const handleEditConfirm = (title: string) => {
    if (!editingTask) return;
    const nextTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, title, updatedAt: formatPolicyCompareAnalysisUpdatedAt() }
        : task,
    );
    persistTasks(nextTasks);
    toast.success("任务名称已更新");
    setEditingTask(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTask) return;
    const nextTasks = tasks.filter((task) => task.id !== deletingTask.id);
    persistTasks(nextTasks);
    toast.success("任务已删除");
    setDeletingTask(null);
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/policy-writing/analysis")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回对比分析
        </button>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">政策对比分析任务列表</h1>
        </div>

        <TaskListSearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          placeholder="请输入分析任务名称进行搜索"
          extraActions={
            <Button
              className="h-9 gap-1.5 px-4 gov-gradient text-primary-foreground hover:opacity-90"
              onClick={() => navigate(NEW_COMPARE_ANALYSIS_PATH)}
            >
              <Plus className="h-4 w-4" />
              新建分析任务
            </Button>
          }
        />

        {filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            暂无匹配的历史对比分析任务
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedItems.map((task) => (
              <TaskListCard
                key={task.id}
                title={task.title}
                status={task.status}
                icon={BarChart3}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                onOpen={() => openTask(task)}
                actions={
                  <>
                    <TaskListIconButton
                      label={`编辑 ${task.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingTask(task);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </TaskListIconButton>
                    <TaskListIconButton
                      label={`删除 ${task.title}`}
                      destructive
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeletingTask(task);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </TaskListIconButton>
                  </>
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

      <EditPolicyCompareAnalysisTaskDialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        initialTitle={editingTask?.title ?? ""}
        onConfirm={handleEditConfirm}
      />

      <AlertDialog open={Boolean(deletingTask)} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复「{deletingTask?.title}」，请确认是否继续。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
