import { ArrowLeft, ExternalLink, FileText, ListChecks } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DEMO_RECORDS, DETAIL_CONFIG, effectRecordHref, filterRecords } from "@/lib/effectDrilldown";

export default function EffectBusinessDetail() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    window.close();
    if (!window.closed) navigate("/effect-dashboard?focus=publish", { replace: true });
  };
  const record = (kind === "policy" || kind === "item") ? DEMO_RECORDS.find(r => r.kind === kind && r.id === id) : undefined;
  const backLink = <nav className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground"><button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 hover:text-primary"><ArrowLeft className="h-4 w-4" />返回上一页</button><a href="#/effect-dashboard?focus=publish" className="hover:text-primary">兑现效果看板</a></nav>;
  if (!record) return <main className="mx-auto max-w-5xl space-y-4 p-4 sm:p-5">{backLink}<h1 className="text-xl font-semibold">未找到{kind === "item" ? "事项" : "政策"}详情</h1><p className="text-sm text-muted-foreground">该记录不存在或已失效。</p></main>;
  const policy = record.kind === "item" ? DEMO_RECORDS.find(r => r.kind === "policy" && r.id === record.policyId) : undefined;
  const items = record.kind === "policy" ? filterRecords(DEMO_RECORDS, "item", { policyId: record.id }) : [];
  const columns = DETAIL_CONFIG[record.kind].columns.filter(c => c.key !== "name");
  const Icon = record.kind === "item" ? ListChecks : FileText;
  return <main className="min-h-screen bg-background">
    <article className="mx-auto max-w-5xl space-y-4 p-4 text-sm leading-6 sm:p-5">
      {backLink}
      <header className="border-b border-border pb-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"><Icon className="h-5 w-5" />{record.kind === "item" ? "事项详情" : "政策详情"}</p>
        <h1 className="break-words text-lg font-semibold leading-7 text-foreground">{record.sourceUrl ? <a href={effectRecordHref(record.kind as "policy" | "item", record.id)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{record.name}<ExternalLink className="ml-1 inline h-4 w-4" /></a> : record.name}</h1>
      </header>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-border pb-5 sm:grid-cols-2">
        {columns.map(c => <div key={c.key} className="min-w-0"><dt className="text-sm text-muted-foreground">{c.label}</dt><dd className="mt-1.5 break-words text-sm leading-6">{c.key === "policyName" && policy ? <a href={effectRecordHref("policy", policy.id)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{policy.name}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a> : String(record[c.key] ?? "—")}</dd></div>)}
      </dl>
      {record.kind === "item" && <section className="space-y-5 border-b border-border pb-5">
        {[{ title: "支持对象", value: record.target }, { title: "扶持标准", value: record.standard }].map(s => <div key={s.title}><h2 className="mb-2 text-base font-semibold">{s.title}</h2><p className="text-sm leading-7 text-muted-foreground">{s.value || "—"}</p></div>)}
      </section>}
      <section><h2 className="mb-4 text-base font-semibold">{record.kind === "item" ? "事项内容" : "政策正文"}</h2><div className="whitespace-pre-wrap break-words text-sm leading-8">{record.content || "暂无正文内容"}</div></section>
      {record.kind === "policy" && <section className="border-t border-border pt-6"><h2 className="mb-4 text-base font-semibold">关联事项</h2>{items.length ? <ul className="divide-y divide-border">{items.map(item => <li key={item.id} className="py-4"><a href={effectRecordHref("item", item.id)} target="_blank" rel="noopener noreferrer" className="text-sm leading-7 text-primary hover:underline">{item.name}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a><p className="mt-1 text-sm text-muted-foreground">{item.department} · {item.applicationStatus}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">暂无关联事项</p>}</section>}
    </article>
  </main>;
}
