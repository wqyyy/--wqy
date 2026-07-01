import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Pencil, Plus, Trash2 } from "lucide-react";
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
import { EditPolicyReportDialog } from "@/components/policy-report/EditPolicyReportDialog";
import {
  downloadPolicyReportTask,
  formatPolicyReportUpdatedAt,
  loadPolicyReportTasks,
  type PolicyReportTask,
  savePolicyReportTasks,
} from "@/lib/policyReportTasks";
import { TaskListPagination } from "@/components/TaskListPagination";
import { useTaskListPagination } from "@/hooks/useTaskListPagination";

export default function PolicyReportTaskList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<PolicyReportTask[]>(() => loadPolicyReportTasks());
  const [editingTask, setEditingTask] = useState<PolicyReportTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<PolicyReportTask | null>(null);

  const persistTasks = (nextTasks: PolicyReportTask[]) => {
    setTasks(nextTasks);
    savePolicyReportTasks(nextTasks);
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) => task.title.toLowerCase().includes(q));
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

  const openTask = (task: PolicyReportTask) => {
    if (task.status === "已完成") {
      navigate(`/policy-report/${task.id}`);
      return;
    }
    navigate("/policy-report#report-generate");
  };

  const handleEditConfirm = (title: string) => {
    if (!editingTask) return;
    const nextTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, title, updatedAt: formatPolicyReportUpdatedAt() }
        : task,
    );
    persistTasks(nextTasks);
    toast.success("专报名称已更新");
    setEditingTask(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTask) return;
    const nextTasks = tasks.filter((task) => task.id !== deletingTask.id);
    persistTasks(nextTasks);
    toast.success("专报已删除");
    setDeletingTask(null);
  };

  const handleDownload = (task: PolicyReportTask) => {
    if (task.status !== "已完成") {
      toast.message("专报生成完成后才可下载");
      return;
    }
    downloadPolicyReportTask(task);
    toast.success("专报已开始下载");
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/policy-report")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回兑现专报
        </button>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">兑现专报任务列表</h1>
        </div>

        <TaskListSearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          placeholder="请输入专报名称进行搜索"
          extraActions={
            <Button
              className="h-9 gap-1.5 px-4 gov-gradient text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/policy-report")}
            >
              <Plus className="h-4 w-4" />
              新建专报
            </Button>
          }
        />

        {filteredTasks.length === 0 ? (
          <Card className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            暂无匹配的历史专报任务
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedItems.map((task) => (
              <TaskListCard
                key={task.id}
                title={task.title}
                status={task.status}
                icon={FileText}
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

      <EditPolicyReportDialog
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
            <AlertDialogTitle>确认删除专报？</AlertDialogTitle>
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
