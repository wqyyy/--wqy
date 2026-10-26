import { describe, expect, it } from "vitest";
import { getClauseMaterialItems, CLAUSE_MATERIAL_LIBRARIES, matchesClauseMaterial } from "./clauseMaterialLibrary";

describe("comparison clause material libraries", () => {
  it("separates personal favorites and public policy excerpts", () => {
    const personal = getClauseMaterialItems("personal");
    const shared = getClauseMaterialItems("public");
    expect(personal.every(item => item.source === "收藏入库")).toBe(true);
    expect(shared.length).toBeGreaterThan(0);
    expect(shared.every(item => item.source === "系统解析" && item.policyTitle && item.region === "北京市经济技术开发区")).toBe(true);
    expect(shared.some(item => personal.some(favorite => favorite.content === item.content))).toBe(false);
  });
  it("provides distinct titles and the requested explanations", () => {
    expect(CLAUSE_MATERIAL_LIBRARIES.personal.title).toBe("我的条款素材库");
    expect(CLAUSE_MATERIAL_LIBRARIES.public.title).toBe("经开区条款素材");
    expect(CLAUSE_MATERIAL_LIBRARIES.personal.description).toContain("主动收藏");
    expect(CLAUSE_MATERIAL_LIBRARIES.public.description).toContain("大模型智能解析");
  });
  it("combines content, department and inclusive date boundaries", () => {
    const item = { ...getClauseMaterialItems("public")[0], publishDate: "2025-10-29" };
    const filters = { content: "监管机构", department: "北京市人民政府", startDate: "2025-10-29", endDate: "2025-10-29" };
    expect(matchesClauseMaterial(item, filters)).toBe(true);
    expect(matchesClauseMaterial(item, { ...filters, department: "其他单位" })).toBe(false);
    expect(matchesClauseMaterial(item, { ...filters, content: "未匹配内容" })).toBe(false);
    expect(matchesClauseMaterial(item, { ...filters, startDate: "2025-10-30" })).toBe(false);
    expect(matchesClauseMaterial(item, { ...filters, endDate: "2025-10-28" })).toBe(false);
  });
  it("does not match undated records to a specified publication period", () => {
    const item = { ...getClauseMaterialItems("public")[0], publishDate: "" };
    expect(matchesClauseMaterial(item, { content: "", department: "", startDate: "2025-01-01", endDate: "" })).toBe(false);
    expect(matchesClauseMaterial(item, { content: "", department: "", startDate: "", endDate: "" })).toBe(true);
  });
  it("uses the supplied seven original clauses and does not mistake responsibilities or content dates for publication metadata", () => {
    const entries = getClauseMaterialItems("public");
    expect(entries).toHaveLength(7);
    expect(entries[0].content).toContain("3.与国家有关监管机构紧密合作。");
    expect(entries[0].department).toBe("北京市人民政府");
    expect(entries[5].content).toContain("2023年6月21日");
    expect(entries.map(item => item.publishDate)).toEqual(["2025-04-01", "2025-04-01", "2025-04-01", "2025-04-01", "2020-12-01", "2024-09-30", "2022-04-22"]);
    expect(entries.every(item => item.sourceUrl?.startsWith("https://"))).toBe(true);
    expect(entries[4].department).toBe("北京经济技术开发区管理委员会");
    expect(entries[4].policyTitle).toContain("（失效）");
  });
});
