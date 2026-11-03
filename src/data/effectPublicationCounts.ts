export const EFFECT_DEPARTMENTS = [
  ["高端汽车和新能源产业局", 40, 2], ["财政国资局", 0, 4], ["营商环境建设局", 0, 1],
  ["经济发展局", 40, 13], ["组织人事部", 39, 5], ["科技和产业促进局", 91, 11],
  ["社会事业局", 9, 2], ["生物技术和大健康产业局", 39, 2], ["生态环境建设局", 61, 4],
  ["机器人和智能制造产业局", 17, 2], ["开发建设局", 11, 2], ["市双智办", 16, 0],
  ["宣传文化部", 54, 10], ["城市运行局", 4, 0], ["商务金融局", 99, 12],
  ["北京经济技术开发区管理委员会", 0, 31], ["北京市集成电路产业局", 4, 1],
  ["信息技术产业局", 44, 5], ["人力资源和社会保障局", 38, 8],
].map(([name, items, published]) => ({ name: String(name), items: Number(items), published: Number(published) }));

export const EFFECT_PUBLICATION_TOTALS = { policy: 375, interpretation: 209, item: 606 };
export const EFFECT_POLICY_LEVELS = [{ name: "国家", count: 94, x: 498 }, { name: "北京市", count: 166, x: 746 }, { name: "经开区", count: 115, x: 990 }];
