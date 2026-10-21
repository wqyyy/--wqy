import { afterEach, describe, expect, it } from "vitest";
import { createDictionaryEntries, loadDictionaryEntries, saveDictionaryEntries, loadPersonalDictionaryEntries, savePersonalDictionaryEntries, SENSITIVE_TYPES, type DictionaryKind } from "./policyDictionary";

const kinds: DictionaryKind[] = ["synonym", "professional", "sensitive", "fixed", "abbreviation"];
afterEach(() => localStorage.clear());
describe("policy dictionary vocabulary", () => {
  it.each(kinds)("provides 15 complete entries for %s", kind => {
    const entries = createDictionaryEntries(kind);
    expect(entries).toHaveLength(15);
    expect(new Set(entries.map(entry => entry.id)).size).toBe(15);
    for (const entry of entries) {
      expect(entry.words.every(word => word.trim().length > 0)).toBe(true);
      if (kind === "synonym") expect(entry.words.length).toBeGreaterThanOrEqual(2);
      else expect(entry.detail.trim().length).toBeGreaterThan(0);
      if (kind === "sensitive") expect(SENSITIVE_TYPES).toContain(entry.detail);
    }
  });
  it("persists changes without affecting other dictionaries", () => {
    const updated = [{ id: "custom", words: ["政策术语"], detail: "自定义解释" }];
    saveDictionaryEntries("professional", updated);
    expect(loadDictionaryEntries("professional")).toEqual(updated);
    expect(loadDictionaryEntries("fixed")).toHaveLength(15);
  });
  it("keeps a deliberately emptied dictionary empty", () => {
    saveDictionaryEntries("sensitive", []);
    expect(loadDictionaryEntries("sensitive")).toEqual([]);
  });
  it("falls back to initial vocabulary for invalid data", () => {
    localStorage.setItem("policy-dictionary-v1:fixed", "[{}]");
    expect(loadDictionaryEntries("fixed")).toHaveLength(15);
  });
  it.each(kinds)("keeps initial %s entries public and personal vocabulary empty", kind => {
    expect(createDictionaryEntries(kind)).toHaveLength(15);
    expect(loadPersonalDictionaryEntries(kind)).toEqual([]);
  });
  it("migrates custom and modified legacy entries without changing public vocabulary", () => {
    const initial = createDictionaryEntries("professional");
    saveDictionaryEntries("professional", [{ ...initial[0], detail: "修改后的释义" }, ...initial.slice(1), { id: "custom", words: ["自定义词"], detail: "自定义释义" }]);
    const personal = loadPersonalDictionaryEntries("professional");
    expect(personal).toHaveLength(2);
    expect(personal[0].id).toBe("personal-professional-1");
    expect(createDictionaryEntries("professional")[0].detail).not.toBe("修改后的释义");
    savePersonalDictionaryEntries("professional", []);
    expect(loadPersonalDictionaryEntries("professional")).toEqual([]);
  });
});
