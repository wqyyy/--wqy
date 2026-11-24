import { describe, expect, it } from "vitest";
import { isAllowedGovPolicyUrl } from "./govPolicyPortals";

describe("government search domain restrictions", () => {
  it("accepts only HTTPS government domains", () => {
    expect(isAllowedGovPolicyUrl("https://www.gov.cn/zhengce/")).toBe(true);
    expect(isAllowedGovPolicyUrl("https://kfqgw.beijing.gov.cn/policy")).toBe(true);
    for (const url of ["https://gov.cn.example.com/policy", "https://fakegov.cn/", "http://www.gov.cn/", "javascript:alert(1)", "https://www.gov.cn@evil.com/", "https://user@www.gov.cn/"]) {
      expect(isAllowedGovPolicyUrl(url)).toBe(false);
    }
  });
  it("restricts results to the selected official site and its subdomains", () => {
    expect(isAllowedGovPolicyUrl("https://kfqgw.beijing.gov.cn/", ["beijing.gov.cn"])).toBe(true);
    expect(isAllowedGovPolicyUrl("https://www.gov.cn/", ["beijing.gov.cn"])).toBe(false);
    expect(isAllowedGovPolicyUrl("https://www.beijing.gov.cn/", ["kfqgw.beijing.gov.cn"])).toBe(false);
    expect(isAllowedGovPolicyUrl("https://www.gov.cn/", [])).toBe(false);
  });
});
