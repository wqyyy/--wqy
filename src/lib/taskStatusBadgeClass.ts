const TASK_STATUS_BADGE_CLASS: Record<string, string> = {
  已创建: "bg-blue-50 text-blue-600 border-blue-200",
  分析中: "bg-amber-50 text-amber-600 border-amber-200",
  生成中: "bg-amber-50 text-amber-600 border-amber-200",
  进行中: "bg-amber-50 text-amber-600 border-amber-200",
  已完成: "bg-emerald-50 text-emerald-600 border-emerald-200",
  已分析完成: "bg-emerald-50 text-emerald-600 border-emerald-200",
  已归档: "bg-gray-100 text-gray-700 border-gray-300",
  失败: "bg-red-50 text-red-600 border-red-200",
};

export function getTaskStatusBadgeClass(status: string): string {
  return TASK_STATUS_BADGE_CLASS[status] ?? "";
}
