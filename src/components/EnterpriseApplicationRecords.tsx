import { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetTitle } from "@/components/ui/sheet";
import { OriginalSourceButton } from "@/components/OriginalSourceButton";
import { DEMO_APPLICATIONS, DEMO_RECORDS } from "@/lib/effectDrilldown";
import { EXTERNAL_ENTERPRISE_DETAIL } from "@/lib/fundingEstimation";

export function EnterpriseApplicationRecords({ creditCode, onBack, onOpenItem, onOpenPolicy, embedded = false }: { creditCode?: string; onBack: () => void; onOpenItem: (name: string) => void; onOpenPolicy: (name: string) => void; embedded?: boolean }) {
  const Title = embedded ? SheetTitle : "h1";
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const applications = useMemo(() => DEMO_APPLICATIONS.filter(r => r.creditCode === creditCode).sort((a, b) => b.date.localeCompare(a.date)), [creditCode]);
  const items = useMemo(() => new Map(DEMO_RECORDS.filter(r => r.kind === "item").map(r => [r.id, r])), []);
  const policies = useMemo(() => new Map(DEMO_RECORDS.filter(r => r.kind === "policy").map(r => [r.id, r])), []);
  const payments = useMemo(() => {
    const totals = new Map<string, { amount: number; dates: string[] }>();
    for (const r of DEMO_RECORDS) if (r.kind === "fund" && r.status === "已拨付" && r.creditCode === creditCode && r.itemId) {
      const previous = totals.get(r.itemId) ?? { amount: 0, dates: [] };
      totals.set(r.itemId, { amount: previous.amount + (r.amount ?? 0), dates: [...new Set([...previous.dates, ...(r.date ? [r.date] : [])])].sort() });
    }
    return totals;
  }, [creditCode]);
  const pages = Math.max(1, Math.ceil(applications.length / pageSize));
  const current = Math.min(page, pages);
  return <section className={embedded ? "min-h-0 flex-1 overflow-y-auto bg-background p-4 text-sm leading-6 sm:p-5" : "min-h-screen bg-background p-4 text-sm leading-6 sm:p-5"}>
    <div className={embedded ? "space-y-4" : "mx-auto max-w-7xl space-y-4"}>
      <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground"><button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 hover:text-primary"><ArrowLeft className="h-4 w-4" />返回上一页</button>{!embedded && <a href="#/effect-dashboard?focus=publish" className="hover:text-primary">兑现效果看板</a>}</nav>
      <header className="space-y-3 border-b pb-5 pr-7"><Title className="text-lg font-semibold leading-7">企业申报明细</Title>{applications.length ? <><div role="status" aria-live="polite" aria-label="企业申报数量统计" className="mt-3 border-l-4 border-primary bg-red-50 px-4 py-3"><p className="text-sm font-medium">企业申报数量</p><p className="mt-1 flex items-baseline gap-2"><strong className="text-4xl font-bold tabular-nums leading-tight text-primary">{applications.length.toLocaleString("zh-CN")}</strong><span className="text-sm text-muted-foreground">条</span></p></div><div className="flex flex-wrap items-center gap-3"><h2 className="min-w-0 break-words text-base font-semibold leading-6">{applications[0].enterpriseName}</h2><Button asChild variant="outline" size="sm" className="shrink-0 border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"><a href={EXTERNAL_ENTERPRISE_DETAIL} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" />查看企业详情</a></Button></div><p className="break-all text-sm text-muted-foreground">统一社会信用代码：{creditCode}</p></> : <p className="text-sm text-muted-foreground">未找到该企业的申报记录</p>}</header>
      {!!applications.length && <>
        <div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:bg-red-50 [&_th]:p-3 [&_th]:font-semibold [&_th]:leading-6 [&_td]:p-3 [&_td]:align-top [&_td]:leading-6 [&_tr]:border-b"><thead><tr>{["事项名称", "关联政策", "主管部门", "申报时间", "申报状态", "兑现状态", "累计兑现（元）", "资金拨付时间", "兑现时间"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{applications.slice((current - 1) * pageSize, current * pageSize).map(r => {
          const item = items.get(r.itemId);
          const payment = payments.get(r.itemId);
          const amount = payment?.amount;
          return <tr key={r.id}><td className="min-w-48">{item ? <><button className="text-left text-primary hover:underline" onClick={() => onOpenItem(item.name)}>{item.name}</button><OriginalSourceButton url={item.sourceUrl} /></> : "—"}</td><td className="min-w-64">{item?.policyId ? <><button className="text-left text-primary hover:underline" onClick={() => onOpenPolicy(item.policyName ?? "")}>{item.policyName}</button><OriginalSourceButton url={policies.get(item.policyId)?.sourceUrl} /></> : "—"}</td><td>{item?.department ?? "—"}</td><td className="whitespace-nowrap">{r.date}</td><td>{r.status}</td><td className="whitespace-nowrap">{amount !== undefined ? (amount > 0 ? "已拨付" : "零拨付") : "未兑现"}</td><td className="tabular-nums text-primary">{(amount ?? 0).toFixed(2)}</td><td className="min-w-32">{payment?.dates.length ? payment.dates.map(date => <p key={date} className="whitespace-nowrap">{date}</p>) : "—"}</td><td className="min-w-32">{payment?.dates.length ? payment.dates.map(date => <p key={date} className="whitespace-nowrap">{date}</p>) : "—"}</td></tr>;
        })}</tbody></table></div>
        <footer className="flex items-center justify-end gap-3 text-sm"><Button variant="outline" size="icon" aria-label="上一页" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="h-4 w-4" /></Button><span>{current} / {pages}</span><Button variant="outline" size="icon" aria-label="下一页" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="h-4 w-4" /></Button></footer>
      </>}
    </div>
  </section>;
}
