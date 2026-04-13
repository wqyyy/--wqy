import { FileBarChart2, FileText, PenLine, ClipboardCheck } from "lucide-react";

export type GeneratedDocCategory =
  | "政策草稿"
  | "前评估报告"
  | "政策评价报告"
  | "兑现专报";

export interface GeneratedDocumentItem {
  id: string;
  title: string;
  category: GeneratedDocCategory;
  status: "编辑中" | "已完成" | "已归档";
  updatedAt: string;
  summary: string;
  content: string;
  icon: typeof PenLine;
}

export const generatedDocuments: GeneratedDocumentItem[] = [
  {
    id: "doc-draft-001",
    title: "数据产业高质量发展政策起草稿",
    category: "政策草稿",
    status: "编辑中",
    updatedAt: "2026-04-03 09:40",
    summary: "已完成总则、发展目标和支持措施起草，待补充实施保障与附则内容。",
    content:
      "第一章 总则\n为加快推进数据产业高质量发展，构建数据要素市场体系，制定本政策草稿。\n\n第二章 重点支持方向\n围绕数据基础设施、数据要素流通、行业场景应用等方向提出支持措施。\n\n第三章 实施机制\n建立部门联动机制，形成政策发布、兑现、复盘闭环。",
    icon: PenLine,
  },
  {
    id: "doc-pre-eval-001",
    title: "外资高质量发展政策前评估意见书",
    category: "前评估报告",
    status: "已完成",
    updatedAt: "2026-04-02 18:20",
    summary: "已形成政策一致性、落地性与合规性审查意见。",
    content:
      "一、综合结论\n本政策总体方向符合区域产业发展要求，建议进一步补充条款细则。\n\n二、政策一致性意见\n与上位文件总体一致，个别条款与既有政策存在交叉。\n\n三、合规性意见\n建议在上会前完成合法性审查和公平竞争审查。",
    icon: ClipboardCheck,
  },
  {
    id: "doc-eval-001",
    title: "外商投资企业高质量发展政策后评价报告",
    category: "政策评价报告",
    status: "已完成",
    updatedAt: "2026-04-02 11:15",
    summary: "完成政策目标达成度、执行效率与企业反馈的综合评价。",
    content:
      "一、整体情况分析\n政策在稳外资、促升级方面发挥了积极作用。\n\n二、实施效果分析\n重点企业覆盖率提升，兑现效率总体稳定。\n\n三、优化建议\n建议建立条款级KPI与动态复盘机制。",
    icon: FileBarChart2,
  },
  {
    id: "doc-redeem-001",
    title: "经开区兑现监测月度专报",
    category: "兑现专报",
    status: "已归档",
    updatedAt: "2026-04-01 16:32",
    summary: "汇总兑现事项、资金拨付、扶持企业和重点领域分布等核心数据。",
    content:
      "一、总体情况\n本月新增兑现事项12项，累计拨付资金4.8亿元。\n\n二、结构分析\n重点支持领域集中在先进制造、科技服务。\n\n三、风险提示\n部分事项兑现周期偏长，需持续跟踪。",
    icon: FileText,
  },
];

export const generatedDocStorageKey = "generated-doc-content:";

