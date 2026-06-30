export type PolicyDraftingTask = {
  id: string;
  title: string;
  policyType: string;
  policyScope: string;
  draftMode: "快速起草" | "分步起草";
  status: "进行中" | "已完成";
  currentStep: number;
  createdAt: string;
  updatedAt: string;
};

export const POLICY_DRAFTING_TASKS: PolicyDraftingTask[] = [
  {
    id: "draft-1",
    title: "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施",
    policyType: "若干措施",
    policyScope: "微观政策",
    draftMode: "分步起草",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-03-12 09:18:42",
    updatedAt: "2026-03-18 16:05:11",
  },
  {
    id: "draft-2",
    title: "关于支持机器人产业创新发展的实施方案",
    policyType: "实施方案",
    policyScope: "宏观政策",
    draftMode: "快速起草",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-03-05 14:22:08",
    updatedAt: "2026-03-06 11:40:33",
  },
  {
    id: "draft-3",
    title: "促进生物医药产业高质量发展奖励办法",
    policyType: "奖励办法",
    policyScope: "微观政策",
    draftMode: "分步起草",
    status: "进行中",
    currentStep: 4,
    createdAt: "2026-02-28 10:15:26",
    updatedAt: "2026-03-01 18:22:57",
  },
  {
    id: "draft-4",
    title: "智能网联汽车场景创新应用工作方案",
    policyType: "工作方案",
    policyScope: "中观政策",
    draftMode: "分步起草",
    status: "进行中",
    currentStep: 3,
    createdAt: "2026-02-20 16:48:03",
    updatedAt: "2026-02-25 09:12:18",
  },
  {
    id: "draft-5",
    title: "专精特新企业培育扶持实施细则",
    policyType: "实施细则",
    policyScope: "微观政策",
    draftMode: "快速起草",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-02-10 11:30:55",
    updatedAt: "2026-02-14 15:08:44",
  },
  {
    id: "draft-6",
    title: "氢能产业创新发展实施意见",
    policyType: "实施意见",
    policyScope: "宏观政策",
    draftMode: "分步起草",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-01-22 08:55:17",
    updatedAt: "2026-01-30 13:27:06",
  },
];

export function getPolicyDraftingTaskById(taskId: string): PolicyDraftingTask | undefined {
  return POLICY_DRAFTING_TASKS.find((task) => task.id === taskId);
}

/** 已完成任务进入正文详情页，进行中任务恢复到对应步骤 */
export function resolveDraftingEntryFromTask(task: PolicyDraftingTask): {
  step: number;
  openOutputPage: boolean;
} {
  if (task.status === "已完成" || task.currentStep >= 5) {
    return { step: 5, openOutputPage: true };
  }
  return { step: task.currentStep, openOutputPage: false };
}
