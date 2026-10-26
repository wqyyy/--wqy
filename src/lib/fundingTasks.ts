import type { FundingCondition, FundingResult, FundingSupport } from "./fundingEstimation";

export type FundingTask = {
  flowVersion?: 2;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  clause: string;
  conditions: FundingCondition[];
  support: FundingSupport;
  result: FundingResult | null;
  step: number;
  maximum: number;
  archived: boolean;
};
export function fundingTaskProgress(task?: FundingTask) {
  if (!task) return { step: 1, maximum: 1 };
  const step = task.archived ? 2 : task.flowVersion === 2 ? task.step : task.step >= 3 ? 2 : 1;
  return { step: task.result ? Math.min(step, 2) : 1, maximum: task.archived ? 3 : task.result ? 2 : 1 };
}
const storageKey = "funding-estimation-tasks-v1";
export function readFundingTasks(): FundingTask[] {
  try {
    const tasks = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(tasks) ? tasks : [];
  } catch { return []; }
}
export function saveFundingTask(task: FundingTask) {
  const tasks = readFundingTasks();
  const previous = tasks.find(item => item.id === task.id);
  if (previous?.archived) return;
  localStorage.setItem(storageKey, JSON.stringify([task, ...tasks.filter(item => item.id !== task.id)]));
}
