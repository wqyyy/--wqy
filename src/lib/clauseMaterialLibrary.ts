export type ClauseMaterialItem = {
  content: string;
  source: string;
  region: string;
  department: string;
  publishDate: string;
  createdDate: string;
  tags: string[];
};

/** 条款素材库（与「我的素材库」页「条款素材」Tab 同源） */
export const CLAUSE_MATERIAL_ITEMS: ClauseMaterialItem[] = [
  {
    content:
      "第六条 推动机器人高水平制造，提升规模化生产能力。率先布局人形机器人中试产线，提升规模化生产能力，探索“机器人生产机器人”柔性制造模式，对于产线建设，按照项目总投资一定比例给予支持。自主生产销售的人形机器人，按照实际销售额的10%给予补助，最多支持1000台，每年每家最高支持1000万元。",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区管理委员会",
    publishDate: "2025-08-12",
    createdDate: "2026-02-11",
    tags: ["具身智能"],
  },
  {
    content:
      "第四条 支持机器人产品推广应用，深化全域场景创新赋能。支持机器人应用场景拓展，鼓励制造企业、产业园区、医院学校、商业场所等开放应用场景，经评审，对示范作用显著的机器人场景，按照采购投入，分别给予场景方、机器人企业30%、20%的补贴，单个项目共计支持不超过500万元。",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区管理委员会",
    publishDate: "2025-08-12",
    createdDate: "2026-02-11",
    tags: ["具身智能"],
  },
];

export const CLAUSE_MATERIAL_TAG_OPTIONS = ["具身智能"] as const;
