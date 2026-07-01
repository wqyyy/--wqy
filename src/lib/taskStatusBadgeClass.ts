const TASK_STATUS_BADGE_CLASS: Record<string, string> = {
  生成中: "bg-amber-50 text-amber-600 border-amber-200",
  进行中: "bg-amber-50 text-amber-600 border-amber-200",
  已完成: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export function getTaskStatusBadgeClass(status: string): string {
  return TASK_STATUS_BADGE_CLASS[status] ?? "";
}
