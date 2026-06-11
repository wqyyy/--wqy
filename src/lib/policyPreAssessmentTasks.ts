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
