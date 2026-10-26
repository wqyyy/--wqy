import { useRef, useState } from "react";
import { Building2, Wallet, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { EXTERNAL_ENTERPRISE_DETAIL, type FundingCompany, type FundingResult } from "@/lib/fundingEstimation";

const colors = ["#ce1438", "#e95770", "#f596a6", "#8f2940", "#87919e", "#c8cdd4"];
const format = (value: number) => value.toLocaleString("zh-CN", { maximumFractionDigits: 6 });
function groupCompanies(companies: FundingCompany[], field: "industry" | "category" | "area") {
  const counts = new Map<string, number>();
  for (const company of companies) counts.set(company[field], (counts.get(company[field]) ?? 0) + 1);
  return [...counts].map(([name, value]) => ({ name, value }));
}
function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-w-0 border border-border bg-white">
    <h3 className="border-b border-border px-4 py-3 text-sm font-semibold"><span className="mr-2 inline-block h-4 w-1 rounded bg-primary align-middle" />{title}</h3>
    <div className="p-3">{children}</div>
  </section>;
}
export function FundingResults({ result }: { result: FundingResult }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const companiesRef = useRef<HTMLElement>(null);
  const companies = result.companies;
  const pageCount = Math.max(1, Math.ceil(companies.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(value => value === 1 || value === pageCount || Math.abs(value - currentPage) <= 1);
  const industry = groupCompanies(companies, "industry");
  const capital = [
    { name: "5000万以上", value: companies.filter(company => company.capital > 5000).length },
    { name: "1000–5000万", value: companies.filter(company => company.capital > 1000 && company.capital <= 5000).length },
    { name: "200–1000万", value: companies.filter(company => company.capital > 200 && company.capital <= 1000).length },
    { name: "200万及以下", value: companies.filter(company => company.capital <= 200).length },
  ];
  return <div className="space-y-4">
    <div className="space-y-5">
      <div className="grid gap-5 border border-border bg-white p-5 md:grid-cols-2">
        <div className="flex flex-wrap items-center gap-5 rounded-lg border border-primary/10 bg-primary/5 px-6 py-7"><Building2 className="h-12 w-12 text-primary" /><span className="text-sm font-semibold">获扶持企业</span><strong className="text-4xl tabular-nums text-primary">{companies.length}</strong><span>家</span><button className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline" onClick={() => companiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>查看企业<ChevronsRight className="h-4 w-4" /></button></div>
        <div className="flex flex-wrap items-center gap-5 rounded-lg border border-primary/10 bg-primary/5 px-6 py-7"><Wallet className="h-12 w-12 text-primary" /><span className="text-sm font-semibold">总扶持金额</span><strong className="break-all text-4xl tabular-nums text-primary">{format(result.total)}</strong><span>万元</span></div>
      </div>
      {companies.length === 0 ? <div className="border border-dashed border-border bg-white px-5 py-16 text-center text-muted-foreground">暂无符合全部条件的企业，可返回调整测算条件。</div> : <div className="grid gap-4 xl:grid-cols-2">
        <ChartSection title="测算企业行业分布"><div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr]"><div className="h-[220px] min-w-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={industry} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="85%">{industry.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><ul className="space-y-2 text-xs">{industry.map((item, index) => <li key={item.name} className="flex gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0" style={{ backgroundColor: colors[index % colors.length] }} /><span>{item.name} {(item.value / companies.length * 100).toFixed(2)}%（{item.value}）</span></li>)}</ul></div></ChartSection>
        <ChartSection title="测算企业性质分布"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCompanies(companies, "category")} margin={{ top: 15, right: 10, left: 0, bottom: 30 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={85} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="企业数量" fill="hsl(var(--primary) / 0.7)" /></BarChart></ResponsiveContainer></div></ChartSection>
        <ChartSection title="测算企业空间分布"><div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCompanies(companies, "area")} margin={{ top: 15, right: 10, left: 0, bottom: 15 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="企业数量" fill="hsl(var(--primary) / 0.7)" /></BarChart></ResponsiveContainer></div></ChartSection>
        <ChartSection title="测算企业注册资本分布"><div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={capital} outerRadius="70%"><PolarGrid /><PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} /><Radar dataKey="value" name="企业数量" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.18} /><Tooltip /></RadarChart></ResponsiveContainer></div></ChartSection>
      </div>}
    </div>
    <section ref={companiesRef} className="scroll-mt-4 border border-border bg-white p-5" aria-label="企业名单">
      <h2 className="mb-4 text-base font-semibold">企业名单</h2>
      <h3 className="mb-6 border-l-4 border-primary pl-2 text-base">已为您找到 <strong className="text-primary">{companies.length}</strong> 家符合条件的企业</h3>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-muted/30"><tr>{["序号", "企业名称", "统一社会信用代码", "注册资本(万元)", "地址", "成立日期", "所属行业"].map(label => <th className="px-3 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody>
        {companies.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((company, index) => <tr key={company.id} className="border-b border-border"><td className="px-3 py-5">{(currentPage - 1) * pageSize + index + 1}</td><td className="max-w-[260px] px-3 py-5"><a className="text-primary hover:underline" href={EXTERNAL_ENTERPRISE_DETAIL} target="_blank" rel="noopener noreferrer">{company.name}</a></td><td className="px-3 py-5">{company.creditCode}</td><td className="px-3 py-5">{format(company.capital)}</td><td className="max-w-[280px] px-3 py-5 leading-7">{company.address}</td><td className="whitespace-nowrap px-3 py-5">{company.establishedAt}</td><td className="px-3 py-5">{company.industry}</td></tr>)}
        {!companies.length && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">暂无符合条件的企业</td></tr>}
      </tbody></table></div>
      <nav aria-label="企业名单分页" className="mt-5 flex flex-wrap items-center justify-end gap-2 text-sm">
        <span className="mr-2 text-muted-foreground">共 {companies.length} 条</span>
        <select aria-label="每页条数" className="mr-2 h-9 rounded-md border border-input bg-white px-2" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[5, 10, 20, 50].map(size => <option key={size} value={size}>{size} 条/页</option>)}</select>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="上一页" title="上一页" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {visiblePages.map((value, index) => <span key={value} className="inline-flex items-center gap-2">
          {index > 0 && value - visiblePages[index - 1] > 1 && <span className="px-1">...</span>}
          <Button variant={value === currentPage ? "default" : "outline"} size="icon" className="h-9 w-9" aria-label={`第${value}页`} aria-current={value === currentPage ? "page" : undefined} onClick={() => setPage(value)}>{value}</Button>
        </span>)}
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="下一页" title="下一页" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </nav>
    </section>
  </div>;
}
