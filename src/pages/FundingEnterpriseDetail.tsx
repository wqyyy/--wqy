import { useParams } from "react-router-dom";
import { FUNDING_COMPANIES, EXTERNAL_ENTERPRISE_DETAIL } from "@/lib/fundingEstimation";

export default function FundingEnterpriseDetail() {
  const { id } = useParams();
  const company = FUNDING_COMPANIES.find(item => item.id === id);
  if (!company) return <div className="p-8">未找到企业信息</div>;
  return <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
    <h1 className="text-2xl font-semibold">{company.name}</h1>
    <p className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">演示企业详情：经营指标与资质为演示数据。</p>
    <dl className="grid grid-cols-1 gap-6 border-y border-border py-6 md:grid-cols-2">{[{ label: "统一社会信用代码", value: company.creditCode }, { label: "注册资本", value: `${company.capital} 万元` }, { label: "地址", value: company.address }, { label: "成立日期", value: company.establishedAt }, { label: "所属行业", value: company.industry }, { label: "企业性质（演示）", value: company.category }].map(item => <div key={item.label}><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="mt-2 text-base leading-7">{item.value}</dd></div>)}</dl>
    <h2 className="text-lg font-semibold">演示经营指标</h2>
    <div className="grid gap-4 sm:grid-cols-3"><p>上年度营业收入：{company.metrics.revenue} 万元</p><p>上年度产值：{company.metrics.output} 万元</p><p>专利：{company.metrics.patents} 项</p></div>
    <a href={EXTERNAL_ENTERPRISE_DETAIL} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">打开政务平台企业详情示例</a>
  </main>;
}
