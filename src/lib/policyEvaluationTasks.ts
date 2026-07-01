export type PolicyEvaluationTask = {
  id: string;
  title: string;
  department: string;
  domain: string;
  status: "进行中" | "已完成";
  currentStep: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "policy-evaluation-tasks";

export const POLICY_EVALUATION_TASKS: PolicyEvaluationTask[] = [
  {
    id: "eval-1",
    title: "北京经开区产业发展促进办法",
    department: "北京经济技术开发区经济发展局",
    domain: "产业扶持",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-03-10 09:12:33",
    updatedAt: "2026-03-12 16:45:08",
  },
  {
    id: "eval-2",
    title: "科技创新企业扶持专项实施细则",
    department: "北京经济技术开发区科技创新局",
    domain: "科技创新",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-03-02 14:28:17",
    updatedAt: "2026-03-04 11:06:52",
  },
  {
    id: "eval-3",
    title: "中小企业融资支持政策（试行）",
    department: "北京经济技术开发区财政金融局",
    domain: "金融服务",
    status: "进行中",
    currentStep: 3,
    createdAt: "2026-02-22 10:40:05",
    updatedAt: "2026-02-25 15:18:41",
  },
  {
    id: "eval-4",
    title: "关于支持外商投资企业高质量发展的若干政策",
    department: "北京经济技术开发区商务金融局",
    domain: "对外开放",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-02-14 08:55:22",
    updatedAt: "2026-02-16 17:32:09",
  },
  {
    id: "eval-5",
    title: "人才引进与高层次人才服务办法",
    department: "北京经济技术开发区工委组织人事部",
    domain: "人才服务",
    status: "进行中",
    currentStep: 2,
    createdAt: "2026-01-28 13:20:48",
    updatedAt: "2026-01-30 09:44:16",
  },
  {
    id: "eval-6",
    title: "绿色低碳高质量发展若干措施",
    department: "北京经济技术开发区经济发展局",
    domain: "绿色低碳",
    status: "已完成",
    currentStep: 5,
    createdAt: "2026-01-15 11:08:36",
    updatedAt: "2026-01-18 14:27:55",
  },
];

export function loadPolicyEvaluationTasks(): PolicyEvaluationTask[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PolicyEvaluationTask[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return POLICY_EVALUATION_TASKS.map((task) => ({ ...task }));
}

export function savePolicyEvaluationTasks(tasks: PolicyEvaluationTask[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function formatPolicyEvaluationUpdatedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getPolicyEvaluationTaskById(taskId: string): PolicyEvaluationTask | undefined {
  return loadPolicyEvaluationTasks().find((task) => task.id === taskId);
}

export function downloadPolicyEvaluationTask(task: PolicyEvaluationTask) {
  const content = [
    `关于《${task.title}》的政策评价报告`,
    "",
    `评价对象：${task.title}`,
    `主管部门：${task.department}`,
    `政策领域：${task.domain}`,
    `评价日期：${new Date().toLocaleDateString("zh-CN")}`,
    "",
    "一、政策实施总体情况",
    "",
    "该政策目标导向清晰，实施路径较为明确，在支持对象识别、兑现流程和部门协同方面形成了较为完整的执行链条。",
    "",
    "二、政策效果评估",
    "",
    "政策在促进相关产业发展、优化营商环境和提升企业获得感方面取得了阶段性成效，政策知晓度和兑现效率总体处于较好水平。",
    "",
    "三、存在问题与改进建议",
    "",
    "建议进一步细化政策条款解释口径，优化申报审核流程，并加强政策兑现后的跟踪评估与动态调整。",
    "",
    `导出时间：${new Date().toLocaleString("zh-CN")}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${task.title}_政策评价报告_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** 已完成任务进入报告详情页，进行中任务恢复到评价流程 */
export function resolveEvaluationEntryFromTask(task: PolicyEvaluationTask): {
  directFinal: boolean;
} {
  return { directFinal: task.status === "已完成" || task.currentStep >= 5 };
}
