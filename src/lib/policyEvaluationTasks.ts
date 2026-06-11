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
