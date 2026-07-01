import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Download, Pencil, Plus, Trash2 } from "lucide-react";
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
import { EditPolicyEvaluationTaskDialog } from "@/components/policy-evaluation/EditPolicyEvaluationTaskDialog";
import {
  downloadPolicyEvaluationTask,
  formatPolicyEvaluationUpdatedAt,
  loadPolicyEvaluationTasks,
  resolveEvaluationEntryFromTask,
  savePolicyEvaluationTasks,
  type PolicyEvaluationTask,
} from "@/lib/policyEvaluationTasks";
import { TaskListPagination } from "@/components/TaskListPagination";
import { useTaskListPagination } from "@/hooks/useTaskListPagination";

export default function PolicyEvaluationTaskList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<PolicyEvaluationTask[]>(() => loadPolicyEvaluationTasks());
  const [editingTask, setEditingTask] = useState<PolicyEvaluationTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<PolicyEvaluationTask | null>(null);

  const persistTasks = (nextTasks: PolicyEvaluationTask[]) => {
    setTasks(nextTasks);
    savePolicyEvaluationTasks(nextTasks);
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.department.toLowerCase().includes(q) ||
        task.domain.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q),
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

  const openTask = (task: PolicyEvaluationTask) => {
    const { directFinal } = resolveEvaluationEntryFromTask(task);
    const params = new URLSearchParams({
      policy: task.title,
      taskId: task.id,
    });
    if (directFinal) params.set("directFinal", "1");
    navigate(`/policy-analysis?${params.toString()}`, {
      state: { fromTaskList: true, policyTitle: task.title },
    });
  };

  const handleEditConfirm = (title: string) => {
    if (!editingTask) return;
    const nextTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, title, updatedAt: formatPolicyEvaluationUpdatedAt() }
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

  const handleDownload = (task: PolicyEvaluationTask) => {
    if (task.status !== "已完成") {
      toast.message("评价完成后才可下载报告");
      return;
    }
    downloadPolicyEvaluationTask(task);
    toast.success("报告已开始下载");
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/policy-evaluation")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回政策评价
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground">政策评价任务列表</h1>
          <Button
            className="h-9 gap-1.5 px-4 gov-gradient text-primary-foreground hover:opacity-90"
            onClick={() => navigate("/policy-evaluation")}
          >
            <Plus className="h-4 w-4" />
            新建评价报告
          </Button>
        </div>

        <TaskListSearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          placeholder="请输入评价任务名称进行搜索"
        />

        {filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            暂无匹配的历史评价任务
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
                      label={`下载 ${task.title}`}
                      disabled={task.status !== "已完成"}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDownload(task);
                      }}
                    >
                      <Download className="h-4 w-4" />
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

      <EditPolicyEvaluationTaskDialog
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
