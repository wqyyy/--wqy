import type { BusinessRecord } from "@/lib/effectDrilldown";

export const EFFECT_FUND_DEPARTMENTS = [
  { name: "市双智办", amount: 13452.05 },
  { name: "宣传文化部", amount: 18880.9015 },
  { name: "城市运行局", amount: 1754.55 },
  { name: "商务金融局", amount: 759940.471731 },
  { name: "北京市集成电路产业局", amount: 5847.87 },
  { name: "信息技术产业局", amount: 45039.48 },
  { name: "人力资源和社会保障局", amount: 9111.228973 },
  { name: "None", amount: 2392933.603485 },
];
export const EFFECT_FUND_METHODS = [
  { name: "未知", value: 50 }, { name: "免申即享", value: 14 },
  { name: "即申即享", value: 3 }, { name: "标准兑现", value: 27 }, { name: "预兑现", value: 6 },
];

// Integer hundredths of a ten-thousand yuan keep displayed totals exact.
export function alignEffectFundingAmounts(records: BusinessRecord[]): BusinessRecord[] {
  const targets = EFFECT_FUND_DEPARTMENTS.map(d => Math.round(d.amount * 100));
  const total = targets.reduce((a, b) => a + b, 0);
  const methodTargets = EFFECT_FUND_METHODS.map(d => Math.round(total * d.value / 100));
  methodTargets[0] += total - methodTargets.reduce((a, b) => a + b, 0);
  const known = new Set(EFFECT_FUND_DEPARTMENTS.map(d => d.name));
  const groups = EFFECT_FUND_DEPARTMENTS.map(d => records.filter(r => r.kind === "fund" && r.status === "已拨付" && (known.has(r.department ?? "") ? r.department : "None") === d.name));
  // Some departments only have unpaid fixtures; reuse a fictional payment slot, never an official item.
  for (let i = 0; i < groups.length; i++) {
    while (groups[i].length < EFFECT_FUND_METHODS.length) {
      const donor = groups.find((g, index) => index !== i && g.length > EFFECT_FUND_METHODS.length);
      if (!donor) throw new Error("Not enough fictional payments to align the dashboard");
      groups[i].push(donor.pop()!);
    }
  }
  const replacements = new Map<string, BusinessRecord>();
  const allocated = methodTargets.map(() => 0);
  groups.forEach((group, departmentIndex) => {
    const rowTarget = targets[departmentIndex];
    const cells = EFFECT_FUND_METHODS.map((method, index) => ({
      method: method.name,
      records: group.filter((_, i) => i % EFFECT_FUND_METHODS.length === index),
      amount: departmentIndex === groups.length - 1 ? methodTargets[index] - allocated[index] : Math.floor(rowTarget * method.value / 100),
    }));
    cells[0].amount += rowTarget - cells.reduce((sum, c) => sum + c.amount, 0);
    cells.forEach((cell, index) => {
      allocated[index] += cell.amount;
      cell.records.forEach((record, i) => {
        const cents = Math.floor(cell.amount / cell.records.length) + (i < cell.amount % cell.records.length ? 1 : 0);
        const amount = cents / 100;
        replacements.set(record.id, { ...record, department: EFFECT_FUND_DEPARTMENTS[departmentIndex].name, publisher: EFFECT_FUND_DEPARTMENTS[departmentIndex].name, method: cell.method, amount, approvedAmount: Math.max(record.approvedAmount ?? 0, amount) });
      });
    });
  });
  return records.map(r => replacements.get(r.id) ?? r);
}
