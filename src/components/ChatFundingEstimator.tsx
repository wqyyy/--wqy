import { useState } from "react";
import mammoth from "mammoth";
import { Upload, Calculator, X } from "lucide-react";
import { parseSupportRules, estimateSupport, type SupportRule } from "@/lib/chatFunding";
import { Button } from "./ui/button";

export function ChatFundingEstimator({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [rows, setRows] = useState<Array<{ rule: SupportRule; base: string; eligible: boolean; name: string }>>([]);
  const [stackable, setStackable] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const values = rows.map(row => row.eligible ? estimateSupport(row.rule, row.base) : null);
  const complete = rows.length > 0 && values.every(value => value !== null) && (rows.length === 1 || stackable);
  return <section className="my-3 space-y-3 rounded-md border border-primary/20 bg-white p-3 text-sm">
    <header className="flex items-center justify-between font-semibold"><span>企业事项支持金额预估</span><button title="关闭测算" onClick={onClose}><X className="h-4 w-4" /></button></header>
    <label className="flex cursor-pointer items-center gap-2 text-primary"><Upload className="h-4 w-4" />上传政策文件（.docx / .txt）<input aria-label="上传测算政策文件" type="file" accept=".docx,.txt" disabled={busy} className="sr-only" onChange={async event => {
      const file = event.target.files?.[0]; if (!file) return;
      setError(""); setRows([]); setText(""); setSource(""); setStackable(false); setBusy(true);
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error("文件不能超过10MB");
        const suffix = file.name.split(".").at(-1)?.toLowerCase();
        if (suffix !== "docx" && suffix !== "txt") throw new Error("请上传docx或txt文件，PDF请先提取正文");
        const value = suffix === "docx" ? (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value : await file.text();
        if (!value.trim()) throw new Error("未读取到正文，请检查文件");
        setText(value); setSource(file.name);
      } catch (e) { setError((e as Error).message); } finally { setBusy(false); event.target.value = ""; }
    }} /></label>
    {source && <p className="break-all text-xs text-muted-foreground">来源：{source}</p>}
    <textarea aria-label="政策资金条款" placeholder="粘贴政策资金支持条款" value={text} disabled={busy} onChange={e => { setText(e.target.value); setRows([]); setStackable(false); }} className="min-h-24 w-full rounded border p-2" />
    <Button size="sm" disabled={busy || !text.trim()} onClick={() => { const rules = parseSupportRules(text); setRows(rules.map((rule, i) => ({ rule, base: "", eligible: false, name: `事项${i + 1}` }))); setStackable(false); setError(rules.length ? "" : "未识别到可测算的资金条款，请补充政策原文"); }}><Calculator className="mr-1 h-4 w-4" />{busy ? "读取中…" : "解析资金条款"}</Button>
    {error && <p role="alert" className="text-primary">{error}</p>}
    {rows.map((row, index) => <div key={index} className="space-y-2 border-t pt-3">
      <input aria-label={`事项${index + 1}名称`} value={row.name} className="w-full rounded border p-2 font-medium" onChange={e => setRows(prev => prev.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
      <p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">原文：{row.rule.clause}</p>
      <p>计算规则：{row.rule.rate !== undefined ? `实际金额 × ${row.rule.rate * 100}%` : row.rule.fixed !== undefined ? `定额 ${row.rule.fixed.toLocaleString()} 元` : "待人工确认，暂不计算"}{row.rule.cap !== undefined ? `，最高 ${row.rule.cap.toLocaleString()} 元` : ""}</p>
      {row.rule.rate !== undefined && <label className="flex items-center gap-2">实际费用／投入（元）<input aria-label={`事项${index + 1}实际金额`} type="number" min="0" step="0.01" value={row.base} className="min-w-0 flex-1 rounded border p-2" onChange={e => setRows(prev => prev.map((item, i) => i === index ? { ...item, base: e.target.value } : item))} /></label>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={row.eligible} onChange={e => setRows(prev => prev.map((item, i) => i === index ? { ...item, eligible: e.target.checked } : item))} />已核对该事项符合政策适用条件及计算口径</label>
      <p className="font-semibold text-primary">预计支持金额：{values[index] === null ? "待补充／确认" : `${values[index]!.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} 元`}</p>
    </div>)}
    {rows.length > 1 && <label className="flex items-center gap-2"><input type="checkbox" checked={stackable} onChange={e => setStackable(e.target.checked)} />已确认各事项可叠加享受，不存在重复申报或总额限制</label>}
    {rows.length > 0 && <p className="border-t pt-3 font-semibold">预计总支持金额：{complete ? `${values.reduce<number>((sum, amount) => sum + Math.round((amount ?? 0) * 100), 0) / 100} 元` : "待全部事项计算依据及叠加规则确认"}</p>}
    <p className="text-xs leading-5 text-muted-foreground">仅为规则预估，不代表最终核定金额。分档、跨年度、重复支持及整体预算等复杂条款需人工复核。</p>
  </section>;
}
