export type PolicyReportTask = {
  id: string;
  title: string;
  status: "已完成" | "生成中";
  chartType: "bar" | "pie" | "line";
  createdAt: string;
  updatedAt: string;
};

const CHART_TYPE_LABELS: Record<PolicyReportTask["chartType"], string> = {
  bar: "柱状图",
  pie: "饼图",
  line: "折线图",
};

export function getReportChartTypeLabel(chartType: PolicyReportTask["chartType"]) {
  return CHART_TYPE_LABELS[chartType];
}

export const POLICY_REPORT_TASKS: PolicyReportTask[] = [
  {
    id: "1",
    title: "2024年第四季度政策兑现专报",
    status: "已完成",
    chartType: "bar",
    createdAt: "2024-12-10 09:30:00",
    updatedAt: "2024-12-15 16:20:00",
  },
  {
    id: "2",
    title: "2024年第三季度政策兑现专报",
    status: "已完成",
    chartType: "pie",
    createdAt: "2024-09-15 10:12:00",
    updatedAt: "2024-09-20 14:45:00",
  },
  {
    id: "3",
    title: "2024年上半年度政策兑现专报",
    status: "已完成",
    chartType: "line",
    createdAt: "2024-07-05 11:08:00",
    updatedAt: "2024-07-10 17:32:00",
  },
  {
    id: "4",
    title: "2024年科技创新政策专项报告",
    status: "已完成",
    chartType: "bar",
    createdAt: "2024-06-01 08:55:00",
    updatedAt: "2024-06-05 15:18:00",
  },
  {
    id: "5",
    title: "2024年中小企业扶持政策专报",
    status: "生成中",
    chartType: "pie",
    createdAt: "2024-05-16 13:40:00",
    updatedAt: "2024-05-18 10:22:00",
  },
  {
    id: "6",
    title: "2024年产业升级政策兑现报告",
    status: "已完成",
    chartType: "line",
    createdAt: "2024-04-18 09:15:00",
    updatedAt: "2024-04-22 18:06:00",
  },
  {
    id: "7",
    title: "2025年一季度兑现监测专报",
    status: "已完成",
    chartType: "bar",
    createdAt: "2025-04-02 10:00:00",
    updatedAt: "2025-04-08 11:30:00",
  },
  {
    id: "8",
    title: "外资政策兑现成效分析专报",
    status: "生成中",
    chartType: "line",
    createdAt: "2025-05-12 14:20:00",
    updatedAt: "2025-05-14 09:45:00",
  },
];
