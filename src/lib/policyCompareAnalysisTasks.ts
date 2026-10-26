import type { AnalysisResultItem, ClauseItem } from "@/components/policy-analysis/compareAnalysisResults";
import type { ContrastType } from "@/components/policy-analysis/compareAnalysisTypes";

export type PolicyCompareAnalysisTask = {
  id: string;
  title: string;
  taskType: "横向对比" | "查重" | "异同对比";
  status: "已创建" | "分析中" | "已分析完成" | "已归档";
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  currentStep?: number;
  completedThrough?: number;
  snapshot?: {
    clauses: ClauseItem[];
    selectedClauseIds: string[];
    contrastType: ContrastType;
    overlapRate: string;
    results: AnalysisResultItem[];
    publishDateStart: string;
    publishDateEnd: string;
  };
};

export const COMPARE_ANALYSIS_STEP_LABELS = ["添加分析条款", "选择分析条件", "查看分析结果", "归档"] as const;
export function getCompareAnalysisTaskStep(task: PolicyCompareAnalysisTask) {
  if (task.archived || task.status === "已归档") return 4;
  if (task.currentStep && task.currentStep >= 1 && task.currentStep <= 4) return task.currentStep;
  if (task.status === "已分析完成") return 4;
  if (task.status === "分析中") return 3;
  return task.snapshot?.selectedClauseIds.length ? 2 : 1;
}

export function compareAnalysisTaskStatus(archived: boolean, analyzing: boolean, completed: boolean): PolicyCompareAnalysisTask["status"] {
  return archived ? "已归档" : analyzing ? "分析中" : completed ? "已分析完成" : "已创建";
}

const STORAGE_KEY = "policy-compare-analysis-tasks";

export const NEW_COMPARE_ANALYSIS_PATH = `/policy-analysis?mode=compare-new&taskName=${encodeURIComponent("新建对比分析")}`;

export const POLICY_COMPARE_ANALYSIS_TASKS: PolicyCompareAnalysisTask[] = [
  {
    id: "task-1",
    title: "生物制造条款分析",
    taskType: "异同对比",
    status: "已分析完成",
    createdAt: "2026-01-09 11:13:51",
    updatedAt: "2026-03-06 17:17:54",
  },
  {
    id: "task-2",
    title: "具身比对分析",
    taskType: "查重",
    status: "已分析完成",
    createdAt: "2026-02-11 10:42:13",
    updatedAt: "2026-02-11 10:42:25",
  },
  {
    id: "task-3",
    title: "章节任务测试",
    taskType: "横向对比",
    status: "已创建",
    createdAt: "2026-02-12 09:56:32",
    updatedAt: "2026-02-12 09:56:32",
  },
  {
    id: "task-4",
    title: "数据产业政策条款查重",
    taskType: "查重",
    status: "已分析完成",
    createdAt: "2026-03-09 18:27:01",
    updatedAt: "2026-03-09 18:28:02",
  },
  {
    id: "task-5",
    title: "外资政策横向对比",
    taskType: "横向对比",
    status: "已分析完成",
    createdAt: "2026-03-30 23:20:19",
    updatedAt: "2026-03-30 23:20:19",
  },
  {
    id: "task-6",
    title: "机器人产业条款异同分析",
    taskType: "异同对比",
    status: "已创建",
    createdAt: "2026-04-02 10:15:00",
    updatedAt: "2026-04-03 14:22:18",
  },
  {
    id: "task-7",
    title: "氢能政策横向对比分析",
    taskType: "横向对比",
    status: "已创建",
    createdAt: "2026-04-08 15:20:11",
    updatedAt: "2026-04-08 15:21:03",
  },
];

export function loadPolicyCompareAnalysisTasks(): PolicyCompareAnalysisTask[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as (Omit<PolicyCompareAnalysisTask, "status"> & { status: PolicyCompareAnalysisTask["status"] | "已完成" | "进行中" | "失败" })[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(task => ({ ...task, status: compareAnalysisTaskStatus(Boolean(task.archived || task.status === "已归档"), task.status === "分析中" || (task.status === "进行中" && task.currentStep === 3 && !task.snapshot?.results.length), task.status === "已完成" || task.status === "已分析完成" || Boolean(task.snapshot?.results.length)) }));
    }
  } catch {
    // ignore invalid cache
  }
  return POLICY_COMPARE_ANALYSIS_TASKS.map((task) => ({ ...task }));
}

export function savePolicyCompareAnalysisTasks(tasks: PolicyCompareAnalysisTask[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function formatPolicyCompareAnalysisUpdatedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getPolicyCompareAnalysisTaskById(taskId: string): PolicyCompareAnalysisTask | undefined {
  return loadPolicyCompareAnalysisTasks().find((task) => task.id === taskId);
}
