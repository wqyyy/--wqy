export const ASSISTANT_HOME_GREETING =
  "您好，我是智能助手，可以帮您完成政策制定、查询分析与报告生成，也可以继续您未完成的任务";

export const ASSISTANT_TASK_REMINDER_TITLE = "任务提醒";

export const ASSISTANT_TASK_CONTINUE_LABEL = "继续完善";
export const ASSISTANT_TASK_VIEW_LABEL = "查看";
export const ASSISTANT_TASK_DISMISS_LABEL = "忽略";
export const ASSISTANT_TASK_DISMISS_ALL_LABEL = "全部忽略";

/** 已完成任务提醒文案 */
export function buildCompletedTaskMessage(taskType: string, taskName: string): string {
  return `您的${taskType}任务「${taskName}」已生成完成，是否查看结果？`;
}
