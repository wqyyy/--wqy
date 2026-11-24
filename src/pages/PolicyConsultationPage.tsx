import { useState } from "react";
import { CheckCircle2, ChevronDown, Lightbulb, Mic, Send, Sparkles } from "lucide-react";

// 资金结果由前端结构化数据驱动，不拼接到回答正文中。
interface FundingResult {
  maxAmountWan: number | null;
  includedItemCount: number | null;
  matchedItemCount: number | null;
}
function FundingResultPanel({ result }: { result: FundingResult }) {
  return <section aria-label="资金测算结果" className="my-4 space-y-1 text-left">
    <p className="text-sm leading-7 text-[#c21b30]">预计最高可获得资金支持 <strong className="mx-1 text-2xl font-semibold tabular-nums">{result.maxAmountWan === null ? "XXXX" : result.maxAmountWan.toLocaleString("zh-CN")}</strong>万元</p>
    <p className="text-sm leading-6 text-gray-600">已计入事项 <span className="font-medium tabular-nums">{result.includedItemCount ?? "—"}/{result.matchedItemCount ?? "—"}</span> 项</p>
  </section>;
}

const directions = [
  ["乘用车新车型上市支持", "全新车型一次性支持2000万元；改款车型一次性支持1000万元；每家企业合计不超过1亿元。", "进入《国家机动车辆生产企业及产品目录》的整车企业（不含改装车企）；车型在经开区生产，或委托外地工厂生产。", "2026年已开两期（3月18日—26日、6月8日—11日），均已结束；下一期以政策兑现通知为准。"],
  ["新能源汽车产业支持", "围绕技术创新、产业协同和示范应用给予支持，具体标准以对应政策条款为准。", "符合北京市及经开区相关政策规定的汽车产业企业和项目。", "按对应事项申报通知办理。"],
];

export default function PolicyConsultationPage() {
  const [processOpen, setProcessOpen] = useState(true);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const submit = () => { if (input.trim()) setNotice("当前为页面复刻演示，尚未连接政策问答服务。"); };
  return <div className="flex h-dvh flex-col bg-[#f1f2f3] text-[#333]">
    <header className="h-11 shrink-0 bg-[#bc1930]" aria-label="政策咨询" />
    <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-7">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 flex justify-end"><div className="rounded-md bg-[#c51b32] px-4 py-2 text-sm text-white">汽车行业有哪些奖励</div></div>
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#dc6574]"><Sparkles className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1 rounded-md bg-white p-3 sm:p-4">
            <section aria-label="政策查询过程" className="rounded border border-gray-200 p-3">
              <button onClick={() => setProcessOpen(!processOpen)} aria-expanded={processOpen} className="flex w-full items-center gap-2 border-b border-gray-100 pb-3 text-left text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-green-500" />政策查询已完成<ChevronDown className={`ml-auto h-4 w-4 text-gray-500 ${processOpen ? "rotate-180" : ""}`} /></button>
              {processOpen && <div className="mt-3 space-y-2">
                {["意图识别—政策咨询", "政策检索", "政策查阅", "资金支持测算"].map((label, index) => <div key={label} className="rounded border border-gray-200"><button onClick={() => setExpandedStep(expandedStep === label ? null : label)} aria-expanded={expandedStep === label} className="flex w-full items-center justify-between p-2.5 text-left text-sm"><span>{label}</span><span className="flex items-center gap-1 text-xs text-gray-400">已完成<ChevronDown className="h-3 w-3" /></span></button>{expandedStep === label && <p className="border-t px-3 py-2 text-sm text-gray-500">{["识别为汽车行业奖励政策咨询。", "示例范围：北京经开区及北京市汽车产业政策。", "整理支持方向、支持标准、适用条件与申报窗口。", "根据政策支持标准、适用条件及叠加规则测算资金支持上限，测算结果在下方独立展示。"][index]}</p>}</div>)}
                <div className="rounded border border-gray-200 p-2.5"><div className="mb-3 flex justify-between text-sm"><span>整理回答</span><span className="text-xs text-gray-400">已完成</span></div>
                  <button onClick={() => setThinkingOpen(!thinkingOpen)} aria-expanded={thinkingOpen} className="flex w-full items-center gap-2 rounded bg-[#fff4f6] px-3 py-3 text-left text-sm text-gray-500"><Lightbulb className="h-4 w-4 text-blue-500" />思考过程<ChevronDown className={`ml-auto h-4 w-4 ${thinkingOpen ? "rotate-180" : ""}`} /></button>
                  {thinkingOpen && <p className="px-3 py-3 text-sm leading-6 text-gray-500">查询过程摘要：按产业政策和市级资金分类整理支持事项，并分别列出支持标准、主要适用条件及申报窗口信息。</p>}
                  <p className="mt-3 text-xs text-gray-500">已完成回答。 已完成</p>
                </div>
              </div>}
            </section>
            <FundingResultPanel result={{ maxAmountWan: null, includedItemCount: 3, matchedItemCount: 6 }} />
            <article aria-label="政策回答正文" className="text-sm leading-7">
              <p>结合经开区现行政策，汽车行业的奖励主要集中在<strong>经开区两级产业政策</strong>和<strong>北京市级资金</strong>上，按可申报状态分述如下。</p>
              <h2 className="font-semibold">政策定位</h2>
              <p>当前与企业直接相关的现行政策有两套：《北京经济技术开发区关于加快打造“北京亦庄·汽车智造创新城”的若干措施》（经开区管委会2025年12月10日印发，施行至2028年12月31日），面向亦庄新城内整车、零部件及配套企业，覆盖车型上市扶持；《北京经济技术开发区关于促进智能网联汽车产业高质量发展的若干政策》（京技管发〔2024〕26号，2024年11月1日发布，施行至2027年底），面向智能网联汽车相关领域企业。市级层面另有北京市高精尖产业发展资金、氢能示范应用奖励可衔接。</p>
              <h2 className="font-semibold">经开区层面——汽车智造创新城若干措施</h2>
              <div className="overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-left text-sm leading-6"><thead className="bg-[#f7f7f7]"><tr>{["支持方向", "支持标准", "主要适用条件", "对应申报事项与窗口状态"].map(title => <th key={title} className="border border-gray-300 px-3 py-2 text-center font-semibold">{title}</th>)}</tr></thead><tbody>{directions.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index} className="border border-gray-300 px-3 py-2 align-top">{cell}</td>)}</tr>)}</tbody></table></div>
              <p className="mt-3 text-xs text-gray-400">页面复刻示例：以上内容用于展示截图布局，政策及申报时间未作实时核验。</p>
            </article>
          </div>
        </div>
      </div>
    </main>
    <footer className="mx-4 mb-2 shrink-0 bg-white p-3 sm:ml-[68px] sm:mr-7">
      <div className="mb-2 flex items-center justify-between"><span className="rounded-full border px-3 py-1 text-xs text-[#bd2336]">深度思考R1</span><button onClick={() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })} className="rounded border px-2 py-1 text-xs text-gray-500">回到最新</button></div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs"><strong>推荐提问：</strong>{["培训补贴", "创新孵化载体", "独角兽企业", "人才保租房"].map(tag => <button key={tag} onClick={() => setInput(tag)} className="rounded bg-[#fff6f7] px-2 py-1 text-[#c2293c]">{tag}</button>)}<span className="text-gray-500">当前主题：</span>{["高端汽车和新能源汽车产业", "自动驾驶产业", "智能网联", "置换新能源汽车", "奖励"].map(tag => <span key={tag} className="rounded bg-[#fff6f7] px-2 py-1 text-[#c2293c]">{tag}</span>)}</div>
      {notice && <p role="status" className="mb-2 text-xs text-[#c2293c]">{notice}</p>}
      <div className="flex items-center gap-2 border-t pt-2"><Mic className="h-4 w-4 shrink-0 text-gray-400" /><textarea aria-label="输入问题" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} rows={1} placeholder="你好，请输入问题，Shift+Enter换行，“@”唤起搜索文档内容的回答" className="min-w-0 flex-1 resize-none p-1 text-sm outline-none placeholder:text-gray-400" /><button aria-label="发送问题" disabled={!input.trim()} onClick={submit} className="rounded-full bg-[#bc1930] p-2 text-white disabled:bg-gray-200"><Send className="h-4 w-4" /></button></div>
    </footer>
  </div>;
}
