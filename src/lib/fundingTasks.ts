import type { FundingCondition, FundingResult, FundingSupport } from "./fundingEstimation";

export type FundingTask = {
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
