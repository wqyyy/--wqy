export type PolicyReportTask = {
  id: string;
  title: string;
  status: "已完成" | "生成中";
  chartType: "bar" | "pie" | "line";
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "policy-report-tasks";

const CHART_TYPE_LABELS: Record<PolicyReportTask["chartType"], string> = {
  bar: "柱状图",
  pie: "饼图",
  line: "折线图",
};

export function getReportChartTypeLabel(chartType: PolicyReportTask["chartType"]) {
  return CHART_TYPE_LABELS[chartType];
}

export const POLICY_REPORT_TASKS: PolicyReportTask[] = [
  {
    id: "1",
    title: "2024年第四季度政策兑现专报",
    status: "已完成",
    chartType: "bar",
    createdAt: "2024-12-10 09:30:00",
    updatedAt: "2024-12-15 16:20:00",
  },
  {
    id: "2",
    title: "2024年第三季度政策兑现专报",
    status: "已完成",
    chartType: "pie",
    createdAt: "2024-09-15 10:12:00",
    updatedAt: "2024-09-20 14:45:00",
  },
  {
    id: "3",
    title: "2024年上半年度政策兑现专报",
    status: "已完成",
    chartType: "line",
    createdAt: "2024-07-05 11:08:00",
    updatedAt: "2024-07-10 17:32:00",
  },
  {
    id: "4",
    title: "2024年科技创新政策专项报告",
    status: "已完成",
    chartType: "bar",
    createdAt: "2024-06-01 08:55:00",
    updatedAt: "2024-06-05 15:18:00",
  },
  {
    id: "5",
    title: "2024年中小企业扶持政策专报",
    status: "生成中",
    chartType: "pie",
    createdAt: "2024-05-16 13:40:00",
    updatedAt: "2024-05-18 10:22:00",
  },
  {
    id: "6",
    title: "2024年产业升级政策兑现报告",
    status: "已完成",
    chartType: "line",
    createdAt: "2024-04-18 09:15:00",
    updatedAt: "2024-04-22 18:06:00",
  },
  {
    id: "7",
    title: "2025年一季度兑现监测专报",
    status: "已完成",
    chartType: "bar",
    createdAt: "2025-04-02 10:00:00",
    updatedAt: "2025-04-08 11:30:00",
  },
  {
    id: "8",
    title: "外资政策兑现成效分析专报",
    status: "生成中",
    chartType: "line",
    createdAt: "2025-05-12 14:20:00",
    updatedAt: "2025-05-14 09:45:00",
  },
];

export function loadPolicyReportTasks(): PolicyReportTask[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PolicyReportTask[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return POLICY_REPORT_TASKS.map((task) => ({ ...task }));
}

export function savePolicyReportTasks(tasks: PolicyReportTask[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function formatPolicyReportUpdatedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function downloadPolicyReportTask(task: PolicyReportTask) {
  const content = [
    task.title,
    "",
    "【整体情况评估】",
    "本季度政策兑现工作整体推进顺利，兑现效率持续提升。重点领域政策覆盖面广，资金使用效率较高。",
    "",
    "本季度共涉及政策兑现事项156项，兑现资金总额达8.2亿元，惠及企业1,256家。整体兑现率为89.7%。",
    "",
    `导出时间：${new Date().toLocaleString("zh-CN")}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${task.title}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getPolicyReportTaskById(taskId: string): PolicyReportTask | undefined {
  return loadPolicyReportTasks().find((task) => task.id === taskId);
}
