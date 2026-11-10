import { createContext, useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, HandCoins, ListFilter } from "lucide-react";
import { EffectDetailDrawer } from "@/components/EffectDetailDrawer";
import { DEMO_RECORDS, ENTERPRISE_CAPITAL_RANGES, filterRecords, resolveDrill, type DrillDetail as Detail } from "@/lib/effectDrilldown";
import { EFFECT_DEPARTMENTS as departments, EFFECT_POLICY_LEVELS } from "@/data/effectPublicationCounts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, LabelList } from "recharts";
import { dashboardData } from "@/data/mockData";
import { EFFECT_FUND_DEPARTMENTS as funds, EFFECT_FUND_METHODS } from "@/data/effectFundingAmounts";
import "./EffectDashboard.css";

const COLORS = ["#5672c8", "#91ca70", "#ffcb53", "#ef6267", "#65bfd1", "#42a78f"];
const DrillContext = createContext<(detail: Detail) => void>(() => {});
const PeriodContext = createContext("");
function drillTarget(open: () => void, label: string) {
  return { role: "button", tabIndex: 0, title: `查看${label}明细`, "aria-label": `查看${label}明细`, onClick: open, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } } };
}
function DetailButton({ detail }: { detail: Detail }) {
  const open = useContext(DrillContext);
  return <button className="effect-detail-trigger" title={`查看${detail.title}明细`} aria-label={`查看${detail.title}明细`} onClick={() => open(detail)}><ListFilter size={14} /></button>;
}

const status = [{ name: "未知", value: 50 }, { name: "免申即享", value: 14 }, { name: "即申即享", value: 3 }, { name: "标准兑现", value: 27 }, { name: "预兑现", value: 6 }];

// Display original artwork through a clipped viewport; all dashboard data stays live DOM/charts.
function Artwork({ x, y, width, height, className = "" }: { x: number; y: number; width: number; height: number; className?: string }) {
  return <div aria-hidden="true" className={`effect-art ${className}`} style={{ aspectRatio: `${width}/${height}` }}><img alt="" src="/effect-publish-reference.png" style={{ width: `${1654 / width * 100}%`, maxWidth: "none", left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} /></div>;
}
function PanelTitle({ children }: { children: React.ReactNode }) { return <h2 className="effect-panel-title">{children}</h2>; }

export default function EffectDashboard() {
  const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [month, setMonth] = useState("");
  const active = params.get("focus") === "publish" ? "publish" : "redeem";
  return <PeriodContext.Provider value={month}><DrillContext.Provider value={request => { const scope = resolveDrill(request); setDetail({ ...request, kind: scope.kind, filters: { ...(month ? { month } : {}), ...scope.filters } }); }}><main className="effect-board">
    <header className="effect-header">
      <Artwork x={490} y={0} width={700} height={100} className="effect-heading-art" />
      <h1 className="sr-only">北京市经开区政策兑现效果看板</h1>
      <label className="effect-date">日期<input aria-label="选择月份" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
    </header>
    {active === "publish" ? <PublishView /> : <RedeemView />}
    <nav className="effect-main-tabs" aria-label="看板视图">
      <button aria-pressed={active === "publish"} onClick={() => setParams({ focus: "publish" })}><Boxes />政策发布情况</button>
      <span className="effect-tab-divider" />
      <button aria-pressed={active === "redeem"} onClick={() => setParams({ focus: "items" })}><HandCoins />政策兑现情况</button>
    </nav>
    <footer className="effect-footer">Hi~我是亦智政务大模型平台服务助手小亦</footer>
  </main><EffectDetailDrawer key={detail ? JSON.stringify([detail.title, detail.selected, detail.filters]) : "closed"} detail={detail} onClose={() => setDetail(null)} /></DrillContext.Provider></PeriodContext.Provider>;
}

function PublishView() {
  const open = useContext(DrillContext);
  const departmentDetail: Detail = { title: "部门发布情况", dimension: "发文单位", rows: departments.flatMap(d => [{ name: d.name, value: d.items, unit: "项", metric: "事项发布数量" }, { name: d.name, value: d.published, unit: "条", metric: "政策发布数量" }]) };
  const departmentClick = (metric: "items" | "published") => (d: { name: string }) => open({ ...departmentDetail, title: `${d.name}${metric === "items" ? "事项" : "政策"}发布情况`, selected: d.name, rows: departmentDetail.rows.filter(r => r.name === d.name && r.unit === (metric === "items" ? "项" : "条")) });
  return <div className="effect-content effect-publish">
    <section className="effect-panel effect-departments">
      <PanelTitle>部门发布情况</PanelTitle>
      <DetailButton detail={departmentDetail} />
      <div className="effect-legend"><span>各部门事项发布数量</span><span>各部门政策发布数量</span></div>
      <div className="effect-department-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={departments} layout="vertical" margin={{ top: 8, right: 21, bottom: 8, left: 0 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke="#dce3f0" /><XAxis type="number" hide domain={[0, 100]} /><YAxis type="category" dataKey="name" width={96} axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 10, fill: "#686877" }} tickFormatter={v => v.length > 8 ? `${v.slice(0, 7)}...` : v} />
        <Tooltip /><Bar dataKey="items" name="各部门事项发布数量" fill="#eb3f59" barSize={9} isAnimationActive={false} onClick={departmentClick("items")}><LabelList dataKey="items" content={({ x, y, width, height, value, index }) => <text x={Number(x) + Number(width) + 4} y={Number(y) + Number(height) / 2} dominantBaseline="central" fontSize={9} {...drillTarget(() => departmentClick("items")(departments[index]), `${departments[index].name}事项发布数量`)}>{value}</text>} /></Bar><Bar dataKey="published" name="各部门政策发布数量" fill="#ffa47d" barSize={9} isAnimationActive={false} onClick={departmentClick("published")}><LabelList dataKey="published" content={({ x, y, width, height, value, index }) => <text x={Number(x) + Number(width) + 4} y={Number(y) + Number(height) / 2} dominantBaseline="central" fontSize={9} {...drillTarget(() => departmentClick("published")(departments[index]), `${departments[index].name}政策发布数量`)}>{value}</text>} /></Bar>
      </BarChart></ResponsiveContainer></div>
    </section>
    <div className="effect-publish-middle">
      <div className="effect-stats">{[{ title: "政策发布", value: 375, unit: "条", x: 484 }, { title: "政策解读", value: 209, unit: "条", x: 740 }, { title: "事项发布", value: 606, unit: "项", x: 995 }].map(s => <div className="effect-stat" key={s.title} {...drillTarget(() => open({ title: s.title, dimension: "统计范围", rows: [{ name: "全部", value: s.value, unit: s.unit, metric: s.title }] }), s.title)}><Artwork x={s.x} y={145} width={65} height={72} /><div><h3>{s.title}</h3><strong>{s.value}</strong><small>{s.unit}</small></div></div>)}</div>
      <section className="effect-panel effect-level-panel"><PanelTitle>兑现相关政策发布数量</PanelTitle><div className="effect-levels">{EFFECT_POLICY_LEVELS.map(s => <div key={s.name} className="effect-level" {...drillTarget(() => open({ title: `${s.name}政策发布数量`, dimension: "政策层级", rows: [{ name: s.name, value: s.count, unit: "条", metric: "兑现相关政策发布数量" }] }), `${s.name}政策发布数量`)}><p><i /><strong>{s.count}</strong><small>条</small></p><Artwork x={s.x} y={478} width={190} height={165} /><div className="effect-level-label">{s.name}</div></div>)}</div></section>
    </div>
    <section className="effect-panel effect-flow"><PanelTitle>事项流转情况</PanelTitle><div className="effect-flow-items">{[{ title: "申报中", value: 16, color: "#5295ff" }, { title: "申报已截止", value: 590, color: "#ff783d" }, { title: "已确认扶持结果", value: 16, color: "#f33f61" }, { title: "已兑现", value: 424, color: "#2eb89f" }].map(s => <div key={s.title} {...drillTarget(() => open({ title: `${s.title}事项`, dimension: "事项状态", rows: [{ name: s.title, value: s.value, unit: "项", metric: "事项数量" }] }), `${s.title}事项`)}><h3>{s.title}</h3><p><strong style={{ color: s.color }}>{s.value}</strong><small>项</small></p></div>)}</div></section>
  </div>;
}

function Donut({ data, title, dimension = "分类" }: { data: { name: string; value: number }[]; title: string; dimension?: string }) {
  const open = useContext(DrillContext);
  const detail: Detail = { title, dimension, rows: data.map(d => ({ name: d.name.trim() || "未标注分类", value: d.value, unit: "%", metric: "占比" })) };
  const select = (d: { name: string }) => { const name = d.name.trim() || "未标注分类"; open({ ...detail, selected: name, rows: detail.rows.filter(r => r.name === name) }); };
  return <div className="effect-donut"><DetailButton detail={detail} /><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" onClick={select} startAngle={90} endAngle={-270} innerRadius="28%" outerRadius="50%" stroke="none" isAnimationActive={false} labelLine={false} label={({ cx, cy, midAngle, outerRadius, name, fill }) => {
    if (!name.trim() || name === "大型企业") return null;
    const angle = -Number(midAngle) * Math.PI / 180;
    const radius = Number(outerRadius);
    const centerX = Number(cx), centerY = Number(cy);
    const right = Math.cos(angle) >= 0;
    const x = Math.max(30, Math.min(centerX * 2 - 30, centerX + (radius + 23) * Math.cos(angle)));
    const y = centerY + (radius + 28) * Math.sin(angle);
    const lines = name.length > 3 ? (name.replace(/ /g, "").match(/.{1,2}/g) ?? [name]) : [name];
    return <g {...drillTarget(() => select({ name }), `${title}${name}`)}><path d={`M${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)} L${x},${y}`} fill="none" stroke={fill} strokeWidth={0.7} /><text x={x + (right ? 2 : -2)} y={y - (lines.length - 1) * 5} textAnchor={right ? "start" : "end"} dominantBaseline="central" fill="#333" fontSize={10}>{lines.map((line, i) => <tspan key={i} x={x + (right ? 2 : -2)} dy={i ? 11 : 0}>{line}</tspan>)}</text></g>;
  }}>
    {data.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}
  </Pie><Tooltip /></PieChart></ResponsiveContainer></div>;
}

function AnalysisPanel({ title, index, children, tabs, values, label, max, distribution }: { title: string; index: number; children: React.ReactNode; tabs: string[]; values: number[]; label: string; max: number; distribution: { name: string; value: number }[] }) {
  const [tab, setTab] = useState(0);
  const open = useContext(DrillContext);
  const month = useContext(PeriodContext);
  const data = values.map((value, i) => ({ year: String(2021 + i), value }));
  const selectedYear = month.slice(0, 4) || "2026";
  const monthlyValues = [
    [0, 3, 0, 12, 8, 12, 29, 12, 30, 15, 19, 0],
    [0, 0, 0, 65000, 3000, 195000, 165000, 35000, 12000, 0, 0, 0],
    [0, 300, 0, 280, 70, 480, 850, 760, 30, 0, 0, 0],
  ][index];
  const monthlyData = monthlyValues.map((value, i) => ({ name: `${selectedYear}-${String(i + 1).padStart(2, "0")}`, value }));
  const distributionData = index === 2 ? ENTERPRISE_CAPITAL_RANGES.map(range => ({
    name: range.label, value: filterRecords(DEMO_RECORDS, "enterprise", { capitalBand: range.label }).length,
  })) : [...new Set([...distribution.map(d => d.name), ...DEMO_RECORDS.filter(r => r.kind === (index === 0 ? "item" : "fund")).map(r => r.field ?? "None")])].map(name => {
    const records = filterRecords(DEMO_RECORDS, index === 0 ? "item" : "fund", index === 0 ? { fulfillment: "已兑现" } : {}).filter(r => (r.field ?? "None") === name);
    return { name, value: index === 0 ? records.length : records.filter(r => r.status === "已拨付").reduce((sum, r) => sum + (r.amount ?? 0), 0) };
  });
  const chartData = tab === 0 ? data.map(d => ({ name: d.year, value: d.value })) : tab === 1 ? monthlyData : distributionData;
  const chartLabel = tab === 2 ? ["扶持领域数量", "兑现资金金额", "注册资本分布"][index] : tab === 1 && index === 2 ? "每月扶持企业数量" : label;
  const openChartPoint = (point: { name: string; value: number }) => {
    if (tab === 0) { selectYear({ year: point.name }); return; }
    const kind = (["item", "fund", "enterprise"] as const)[index];
    open({
      title: tab === 1 ? `${title}月度统计` : tabs[2], kind,
      dimension: tab === 1 ? "月份" : index === 2 ? "注册资本" : "扶持领域",
      selected: point.name,
      filters: { ...(tab === 1 ? { month: point.name } : index === 2 ? { capitalBand: point.name } : { field: point.name }), ...(index === 0 ? { fulfillment: "已兑现" } : {}) },
      rows: [{ name: point.name, value: point.value, unit: ["项", "元", "家"][index], metric: chartLabel }],
    });
  };
  const trendDetail: Detail = { title: `${title}年度统计`, dimension: "年度", rows: data.map(d => ({ name: d.year, value: d.value, unit: ["项", "万元", "家"][index], metric: label })) };
  const selectYear = (d: { year: string }) => { if (d?.year) open({ ...trendDetail, selected: d.year, rows: trendDetail.rows.filter(r => r.name === d.year) }); };
  const totalDetail: Detail = index === 1 ? { title: "已拨付资金", dimension: "拨付单位", rows: funds.map(d => ({ name: d.name, value: d.amount, unit: "万元", metric: "已拨付资金" })) } : { title: "扶持企业数", dimension: "统计范围", rows: [{ name: "全部", value: 8020, unit: "家", metric: "扶持企业数" }] };
  return <section className="effect-panel effect-analysis-panel"><div className="effect-analysis-heading">{index === 2 ? <button type="button" aria-label="查看扶持企业情况明细" onClick={() => open(totalDetail)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><PanelTitle>{title}</PanelTitle></button> : <PanelTitle>{title}</PanelTitle>}{index > 0 && <div className={`effect-total effect-total-${index}`} {...drillTarget(() => open(totalDetail), totalDetail.title)}><HandCoins /><div>{index === 1 ? "已拨付资金" : "扶持企业数"}<p>{index === 2 && <strong>8020</strong>}<small>{index === 1 ? "万元" : "家"}</small></p></div></div>}</div>
    <div className="effect-top-charts">{children}</div>
    <p className="effect-chart-caption">{["已兑现事项数量统计", "已兑现资金情况统计", "已扶持企业情况统计"][index]}</p>
    <div className="effect-subtabs" role="tablist">{tabs.map((t, i) => <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>{t}</button>)}</div>
    <div className="effect-bottom-chart">
      {tab === 0 && <DetailButton detail={trendDetail} />}
      <div className={`effect-line-legend ${tab === 2 ? "effect-bar-legend" : ""}`}>{chartLabel}</div>
      <ResponsiveContainer width="100%" height="90%">
        {tab === 2 ? <BarChart data={chartData} onClick={state => { const point = state?.activePayload?.[0]?.payload; if (point) openChartPoint(point); }} margin={{ top: 10, right: 20, bottom: 5, left: index === 1 ? 24 : 0 }}>
          <CartesianGrid vertical={false} stroke="#dce3f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#7b7b86" }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} width={index === 1 ? 68 : 46} tickLine={false} tickFormatter={v => v.toLocaleString()} /><Tooltip formatter={value => Number(value).toLocaleString("zh-CN")} /><Bar dataKey="value" name={chartLabel} fill="#ed3d59" maxBarSize={38} isAnimationActive={false} cursor="pointer" />
        </BarChart> : <LineChart data={chartData} onClick={state => { const point = state?.activePayload?.[0]?.payload; if (point) openChartPoint(point); }} margin={{ top: 10, right: 20, bottom: 5, left: index === 1 ? 14 : 0 }}>
          <CartesianGrid vertical={false} stroke="#dce3f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "#7b7b86" }} tickLine={false} interval={tab === 1 ? 2 : "preserveStartEnd"} /><YAxis domain={tab === 0 ? [0, max] : [0, [30, 210000, 1000][index]]} tickCount={tab === 1 ? [7, 8, 6][index] : undefined} tick={{ fontSize: 11 }} width={index === 1 ? 62 : 46} axisLine={{ stroke: "#7b7b86" }} tickLine={false} tickFormatter={v => v.toLocaleString()} /><Tooltip formatter={value => Number(value).toLocaleString("zh-CN")} /><Line type="linear" dataKey="value" name={chartLabel} stroke="#ff3555" strokeWidth={1.6} dot={{ r: 2, fill: "white", strokeWidth: 1.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>}
      </ResponsiveContainer>
    </div>
  </section>;
}

function RedeemView() {
  const open = useContext(DrillContext);
  return <div className="effect-content effect-redeem">
    <AnalysisPanel title="已兑现事项分析" index={0} tabs={["近六年兑现事项数量", "所选年度兑现事项数量", "兑现事项扶持领域分布"]} values={[98, 131, 130, 144, 216, 111]} label="兑现数量" max={250} distribution={dashboardData.redeemedItems.byField}>
      <Donut title="已兑现事项类型分布" data={[{ name: "资金类", value: 49 }, { name: "非资金类", value: 2 }, { name: "未知", value: 49 }]} /><Donut title="已兑现事项兑现方式分布" data={status} />
    </AnalysisPanel>
    <AnalysisPanel title="已兑现资金分析" index={1} tabs={["近六年兑现资金统计", "所选年度兑现资金统计", "兑现资金扶持领域分布"]} values={[380000, 650000, 850000, 735000, 925000, 475000]} label="兑现资金金额" max={1000000} distribution={dashboardData.redeemedFunds.byField}>
      <div className="effect-fund-bars">{funds.map(d => <div key={d.name} {...drillTarget(() => open({ title: `${d.name}已拨付资金`, dimension: "拨付单位", rows: [{ name: d.name, value: d.amount, unit: "万元", metric: "已拨付资金" }] }), `${d.name}已拨付资金`)}><span title={d.name}>{d.name === "None" ? "未提供部门" : d.name}</span><b>{d.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b><i style={{ width: `${d.amount / 2392933.603485 * 100}%` }} /></div>)}</div><Donut title="已兑现资金兑现方式分布" data={EFFECT_FUND_METHODS} />
    </AnalysisPanel>
    <AnalysisPanel title="扶持企业情况" index={2} tabs={["近六年扶持企业数量", "所选年度扶持企业数量", "扶持企业注册资本分布"]} values={[1500, 3000, 3380, 3210, 3950, 1640]} label="年度扶持企业数量" max={4000} distribution={dashboardData.supportedEnterprises.capitalDistribution}>
      <Donut title="扶持企业规模分布" data={[{ name: "其他", value: 5 }, { name: "1 个体工商户", value: 2 }, { name: "2 微型企业", value: 32 }, { name: "3 小型企业", value: 44 }, { name: "4 中型企业", value: 14 }, { name: "大型企业", value: 3 }]} /><Donut title="扶持企业行业分布" data={[{ name: "其他", value: 51 }, { name: "新一代信息技术领域", value: 14 }, { name: "", value: 5 }, { name: "生物医药和大健康领域", value: 13 }, { name: " ", value: 13 }, { name: "  ", value: 4 }]} />
    </AnalysisPanel>
  </div>;
}
