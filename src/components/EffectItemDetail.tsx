import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OriginalSourceButton } from "@/components/OriginalSourceButton";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DEMO_APPLICATIONS, effectRecordHref, filterRecords, summarizeRecords, type BusinessRecord } from "@/lib/effectDrilldown";

export function EffectItemDetail({ item, records, onBack, onApplications, onOpenPolicy }: { item: BusinessRecord; records: BusinessRecord[]; onBack: () => void; onApplications: (creditCode: string) => void; onOpenPolicy: (policyId: string) => void }) {
  const applications = DEMO_APPLICATIONS.filter(r => r.itemId === item.id);
  const payments = filterRecords(records, "fund", { itemId: item.id });
  const successful = payments.filter(r => r.status === "已拨付");
  const totals = summarizeRecords(payments);
  const applicants = new Set(applications.map(r => r.creditCode)).size;
  const hasBusinessData = !item.sourceUrl || applications.length > 0 || payments.length > 0;
  const paidByCompany = new Map<string, number>();
  for (const record of successful) paidByCompany.set(record.creditCode!, (paidByCompany.get(record.creditCode!) ?? 0) + (record.amount ?? 0));
  const tableClass = "w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:bg-red-50 [&_th]:p-3 [&_th]:font-semibold [&_th]:leading-6 [&_td]:p-3 [&_td]:align-top [&_td]:leading-6 [&_tr]:border-b";
  return <>
    <SheetHeader className="border-b space-y-3 p-4 pr-12 text-left sm:p-5 sm:pr-12">
      <Button variant="ghost" size="sm" className="w-fit gap-1.5 px-0 text-muted-foreground" onClick={onBack}><ArrowLeft className="h-4 w-4" />返回上一页</Button>
      <SheetTitle className="break-words text-lg font-semibold leading-7">{item.sourceUrl ? <a href={effectRecordHref("item", item.id)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.name}<ExternalLink className="ml-1 inline h-4 w-4" /></a> : item.name}</SheetTitle>
      <SheetDescription>事项详情</SheetDescription>
      <div className="grid grid-cols-1 gap-4 border-y border-red-100 bg-red-50 px-4 py-3 sm:grid-cols-3" aria-label="事项核心数据">
        {[["申报企业数", hasBusinessData ? applicants.toLocaleString("zh-CN") : "—", "家"], ["兑现企业数", hasBusinessData ? totals.enterprises.toLocaleString("zh-CN") : "—", "家"], ["累计兑现金额", hasBusinessData ? totals.paidAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", "万元"]].map(([label, value, unit]) => <div key={label} className="min-w-0" role="status" aria-label={label}><p className="text-sm font-medium text-foreground">{label}</p><p className="mt-1 flex flex-wrap items-baseline gap-x-2"><strong className="break-all text-4xl font-bold tabular-nums leading-tight text-primary">{value}</strong><span className="text-sm text-muted-foreground">{unit}</span></p></div>)}
      </div>
    </SheetHeader>
    <div className="flex-1 space-y-4 text-sm leading-6 overflow-y-auto p-4 sm:p-5">
      <dl className="grid grid-cols-1 gap-4 border-b pb-5 text-sm sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">主管部门</dt><dd className="mt-1">{item.department === "None" ? "未提供部门" : item.department}</dd></div><div><dt className="text-sm text-muted-foreground">申报时间</dt><dd className="mt-1">{item.startDate} 至 {item.endDate}</dd></div><div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">关联政策</dt><dd className="mt-1 break-words">{item.policyId ? <><button className="text-left text-primary hover:underline" onClick={() => onOpenPolicy(item.policyId!)}>{item.policyName}</button><OriginalSourceButton url={records.find(r => r.kind === "policy" && r.id === item.policyId)?.sourceUrl} /></> : item.policyName || "—"}</dd></div></dl>
      <section aria-label="申报企业明细"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-base font-semibold">申报企业明细<span className="ml-2 text-xs font-normal text-muted-foreground">共 {applicants} 家</span></h3></div><div className="overflow-x-auto rounded-md border"><table className={tableClass}><thead><tr>{["企业名称", "统一社会信用代码", "申报时间", "申报状态", "兑现状态", "累计兑现（万元）"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{applications.map(r => <tr key={r.id}><td className="min-w-48"><button className="text-left text-primary hover:underline" onClick={() => onApplications(r.creditCode)}>{r.enterpriseName}</button></td><td>{r.creditCode}</td><td className="whitespace-nowrap">{r.date}</td><td>{r.status}</td><td>{paidByCompany.has(r.creditCode) ? "已拨付" : "未兑现"}</td><td className="tabular-nums text-primary">{(paidByCompany.get(r.creditCode) ?? 0).toFixed(2)}</td></tr>)}{!applications.length && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">暂无申报企业</td></tr>}</tbody></table></div></section>
    </div>
  </>;
}
