export type PolicyPreAssessmentTask = {
  id: string;
  title: string;
  source: "起草库" | "上传文件";
  status: "进行中" | "已完成";
  currentStep: number;
  riskLevel: "低" | "中" | "高";
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "policy-pre-assessment-tasks";

export const POLICY_PRE_ASSESSMENT_TASKS: PolicyPreAssessmentTask[] = [
  {
    id: "pre-1",
    title: "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施",
    source: "起草库",
    status: "已完成",
    currentStep: 5,
    riskLevel: "中",
    createdAt: "2026-03-14 10:22:18",
    updatedAt: "2026-03-16 17:08:42",
  },
  {
    id: "pre-2",
    title: "外资高质量发展政策前评估意见书",
    source: "起草库",
    status: "已完成",
    currentStep: 5,
    riskLevel: "低",
    createdAt: "2026-03-08 15:40:06",
    updatedAt: "2026-03-09 11:25:33",
  },
  {
    id: "pre-3",
    title: "关于支持机器人产业创新发展的实施方案",
    source: "上传文件",
    status: "进行中",
    currentStep: 3,
    riskLevel: "中",
    createdAt: "2026-02-26 09:18:55",
    updatedAt: "2026-02-28 14:52:10",
  },
  {
    id: "pre-4",
    title: "促进生物医药产业高质量发展奖励办法",
    source: "起草库",
    status: "进行中",
    currentStep: 2,
    riskLevel: "高",
    createdAt: "2026-02-18 16:05:27",
    updatedAt: "2026-02-20 10:33:48",
  },
  {
    id: "pre-5",
    title: "氢能产业创新发展实施意见",
    source: "上传文件",
    status: "已完成",
    currentStep: 5,
    riskLevel: "低",
    createdAt: "2026-02-05 11:12:39",
    updatedAt: "2026-02-08 09:47:21",
  },
  {
    id: "pre-6",
    title: "专精特新企业培育扶持实施细则",
    source: "起草库",
    status: "已完成",
    currentStep: 5,
    riskLevel: "中",
    createdAt: "2026-01-20 08:55:14",
    updatedAt: "2026-01-24 16:20:05",
  },
];

export function loadPolicyPreAssessmentTasks(): PolicyPreAssessmentTask[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PolicyPreAssessmentTask[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return POLICY_PRE_ASSESSMENT_TASKS.map((task) => ({ ...task }));
}

export function savePolicyPreAssessmentTasks(tasks: PolicyPreAssessmentTask[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function formatPolicyPreAssessmentUpdatedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getPolicyPreAssessmentTaskById(taskId: string): PolicyPreAssessmentTask | undefined {
  return loadPolicyPreAssessmentTasks().find((task) => task.id === taskId);
}

export function downloadPolicyPreAssessmentTask(task: PolicyPreAssessmentTask) {
  const content = [
    "政策前评估报告意见书",
    "",
    `评估对象：${task.title}`,
    `评估日期：${new Date().toLocaleDateString("zh-CN")}`,
    `文件来源：${task.source}`,
    "",
    "综合评估结论",
    "",
    "本政策整体方向合理，条款结构清晰，与上位法律法规保持一致，合规性评估通过，具备出台条件。",
    "",
    `导出时间：${new Date().toLocaleString("zh-CN")}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${task.title}_前评估报告意见书_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
