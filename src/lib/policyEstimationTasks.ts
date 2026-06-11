export type PolicyEstimationTask = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  budgetRange: string;
  scene: string;
};

export const POLICY_ESTIMATION_TASKS: PolicyEstimationTask[] = [
  {
    id: "task-1",
    title: "高精尖产业研发奖励测算",
    createdAt: "2026-03-10 10:08:21",
    updatedAt: "2026-03-18 14:22:10",
    budgetRange: "4,680–6,240 万元",
    scene: "历史相似条款",
  },
  {
    id: "task-2",
    title: "制造业数字化升级专项测算",
    createdAt: "2026-02-20 15:32:05",
    updatedAt: "2026-03-06 09:15:42",
    budgetRange: "3,120–5,800 万元",
    scene: "部分企业信息支撑",
  },
  {
    id: "task-3",
    title: "人工智能语料库建设补贴测算",
    createdAt: "2026-02-15 11:20:18",
    updatedAt: "2026-02-28 16:40:03",
    budgetRange: "1,890–3,450 万元",
    scene: "公开数据估算",
  },
  {
    id: "task-4",
    title: "具身智能产业扶持条款测算",
    createdAt: "2026-01-28 09:45:33",
    updatedAt: "2026-02-12 18:11:27",
    budgetRange: "2,560–4,100 万元",
    scene: "模型知识推理",
  },
  {
    id: "task-5",
    title: "生物医药创新平台奖励测算",
    createdAt: "2026-01-12 14:02:56",
    updatedAt: "2026-01-25 11:33:44",
    budgetRange: "5,200–7,800 万元",
    scene: "历史相似条款",
  },
  {
    id: "task-6",
    title: "绿色工厂认定奖励测算",
    createdAt: "2025-12-08 16:18:09",
    updatedAt: "2026-01-09 08:55:12",
    budgetRange: "980–1,650 万元",
    scene: "部分企业信息支撑",
  },
];
