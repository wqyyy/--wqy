import type { PolicyDraftingTask } from "./policyDraftingTasks";

export function taskProgressStep(task: { currentStep: number; status: string }, total: number) {
  if (task.status === "已归档") return total;
  return Number.isFinite(task.currentStep) ? Math.max(1, Math.min(total, Math.trunc(task.currentStep))) : 1;
}

export function draftingTaskProgress(task: PolicyDraftingTask) {
  try {
    const session = JSON.parse(localStorage.getItem(`policy-draft-session:${task.id}`) || "null");
    if (session && typeof session.currentStep === "number") {
      if (session.archived || task.status === "已归档") return 6;
      // The drafting workflow highlights archive once generated text is ready.
      if (session.currentStep === 5 && session.body) return 6;
      return taskProgressStep({ currentStep: session.currentStep, status: task.status }, 6);
    }
  } catch { /* Fall back to the saved task when its session is unavailable. */ }
  return taskProgressStep(task, 6);
}
