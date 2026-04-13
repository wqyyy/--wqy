import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, Printer } from "lucide-react";
import type { AssessmentPolicy } from "./AssessmentStep1";
import type { Clause } from "./AssessmentStep2";
import type { Step3Result } from "./AssessmentStep3";
import type { Step4Result } from "./AssessmentStep4";
import type { Step5Result } from "./AssessmentStep5";
import type { Step6Result } from "./AssessmentStep6";

interface Props {
  policy: AssessmentPolicy;
  clauses: Clause[];
  step3: Step3Result | null;
  step4: Step4Result | null;
  step5: Step5Result | null;
  step6: Step6Result | null;
}

export function AssessmentStep7({ policy, clauses, step3, step4, step5, step6 }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setDownloadProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 15 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setIsGenerating(false);
        setGenerated(true);
      }
      setDownloadProgress(p);
    }, 200);
  };

  const handleDownload = () => {
    // 模擬下載：生成文字報告並觸發下載
    const reportContent = generateReportText({ policy, clauses, step3, step4, step5, step6 });
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${policy.title}_前评估报告意见书_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 統計
  const totalClauses = clauses.length;
  const superiorIssues = step3?.superiorChecks.filter(c => c.consistencyLevel !== "consistent").length ?? 0;
  const crossIssues = step3?.crossClauses.filter(c => c.crossType === "conflict").length ?? 0;
  const fundTotal = step4?.fundClauses.reduce((s, f) => s + f.estBudget, 0) ?? 0;
  const complianceFail = step5?.filter(r => r.level !== "pass").length ?? 0;
  const opinionCount = step6?.length ?? 0;

  const overallScore = Math.max(
    60,
    100
      - superiorIssues * 5
      - crossIssues * 8
      - complianceFail * 6
  );

  const scoreColor = overallScore >= 85 ? "text-emerald-600" : overallScore >= 70 ? "text-amber-600" : "text-red-600";
  const scoreLabel = overallScore >= 85 ? "良好" : overallScore >= 70 ? "需改进" : "存在问题";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">生成前评估报告意见书</h2>
        <p className="text-sm text-muted-foreground">汇总所有评估结果，生成可供下载的前评估报告意见书</p>
      </div>

      {/* 報告預覽卡 */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* 報告標題 */}
        <div className="bg-primary/5 border-b border-border px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">政策前评估报告意见书</p>
              <h3 className="text-base font-semibold text-foreground leading-snug">{policy.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                评估日期：{new Date().toLocaleDateString("zh-CN")} · 共 {totalClauses} 条政策条款
              </p>
            </div>
            {/* 綜合評分 */}
            <div className="ml-auto text-center shrink-0">
              <p className={`text-3xl font-bold ${scoreColor}`}>{overallScore}</p>
              <p className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">综合评分</p>
            </div>
          </div>
        </div>

        {/* 評估摘要 */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">评估摘要</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "条款拆解", value: `${totalClauses} 条`, sub: "已完成分类", ok: true },
              { label: "上位政策一致性", value: `${superiorIssues} 处关注`, sub: step3 ? `共检索 ${step3.superiorChecks.length} 部上位政策` : "待完成", ok: superiorIssues === 0 },
              { label: "交叉条款冲突", value: `${crossIssues} 处冲突`, sub: step3 ? `共发现 ${step3.crossClauses.length} 处交叉` : "待完成", ok: crossIssues === 0 },
              { label: "资金测算", value: `${fundTotal} 万元/年`, sub: `覆盖 ${step4?.fundClauses.reduce((s, f) => s + f.estCompanies, 0) ?? 0} 家企业`, ok: true },
              { label: "合规性问题", value: `${complianceFail} 项`, sub: step5 ? `共核查 ${step5.length} 个维度` : "待完成", ok: complianceFail === 0 },
              { label: "优化建议", value: `${opinionCount} 条`, sub: "综合评估意见", ok: true },
            ].map(({ label, value, sub, ok }) => (
              <div key={label} className="rounded-lg border border-border bg-background px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {ok
                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* 主要發現 */}
          <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">主要发现与建议</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {superiorIssues > 0 && <li className="flex items-start gap-1.5"><span className="text-amber-500 shrink-0 mt-0.5">•</span>上位政策一致性方面存在 {superiorIssues} 处需关注情形，建议进一步对齐国家和市级政策标准</li>}
              {crossIssues > 0 && <li className="flex items-start gap-1.5"><span className="text-red-500 shrink-0 mt-0.5">•</span>发现 {crossIssues} 处与现行政策存在冲突的条款，建议出台前进行协调清理</li>}
              {complianceFail > 0 && <li className="flex items-start gap-1.5"><span className="text-amber-500 shrink-0 mt-0.5">•</span>合规性评估发现 {complianceFail} 个需关注维度，建议逐项整改后再行出台</li>}
              <li className="flex items-start gap-1.5"><span className="text-primary shrink-0 mt-0.5">•</span>资金类条款预计年度资金需求 {fundTotal} 万元，建议提前纳入年度财政预算安排</li>
              <li className="flex items-start gap-1.5"><span className="text-primary shrink-0 mt-0.5">•</span>建议政策出台前召开专家论证会，重点论证第四条、第九条的可操作性</li>
            </ul>
          </div>
        </div>

        {/* 操作區 */}
        <div className="px-6 pb-5 flex items-center gap-3">
          {!generated && !isGenerating && (
            <button
              onClick={handleGenerate}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              生成完整报告意见书
            </button>
          )}
          {isGenerating && (
            <div className="flex-1 py-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center gap-3">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <div className="flex-1 max-w-xs">
                <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <span className="text-xs text-primary font-medium">{Math.round(downloadProgress)}%</span>
            </div>
          )}
          {generated && (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                报告已生成
              </div>
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                下载报告意见书（TXT）
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** 生成政策前评估报告正文 */
export function generateReportText({ policy, clauses, step3, step4, step5, step6 }: Props): string {
  const now = new Date().toLocaleDateString("zh-CN");
  const totalClauses = clauses.length;
  const conditionCount = clauses.filter((c) => c.category === "condition").length;
  const competitionCount = clauses.filter((c) => c.category === "competition").length;
  const businessCount = clauses.filter((c) => c.category === "business").length;

  const lines: string[] = [];

  const push = (...args: string[]) => lines.push(...args);

  push(
    `政策前评估报告意见书`,
    ``,
    `评估对象：${policy.title}`,
    `评估日期：${now}`,
    `文件来源：${policy.source === "upload" ? "本地上传" : "政策起草库"}`,
    ``,
  );

  // ── 综合结论 ──
  const hasIssue = (step5?.filter((r) => r.level !== "pass").length ?? 0) > 0
    || (step3?.crossClauses.filter((c) => c.crossType === "conflict").length ?? 0) > 0;
  push(
    `综合评估结论`,
    ``,
    hasIssue
      ? `本政策整体方向合理，与上位法律法规总体一致，但在合规性和条款衔接方面存在需重点关注的问题，建议在出台前予以修改完善。`
      : `本政策整体方向合理，条款结构清晰，与上位法律法规保持一致，合规性评估通过，具备出台条件。`,
    ``,
  );

  // ── 一、条款拆解 ──
  push(`一、条款拆解与分类`);
  push(``);
  push(`本政策共涉及 ${totalClauses} 条核心条款。`);
  push(`其中：条件达成类 ${conditionCount} 条，竞争促进类 ${competitionCount} 条，营商环境类 ${businessCount} 条。`);
  push(``);

  // ── 二、政策一致性评估意见 ──
  push(`二、政策一致性评估意见`);
  push(``);
  push(`1.根据政策文本内容，本政策出台的上位文件依据为“深入贯彻习近平总书记对国家级经济技术开发区工作的重要指示精神”；同时，本政策为《北京经济技术开发区关于加快推进国际科技创新中心建设 打造高精尖产业主阵地的若干意见》（京技管字〔2024〕125号）的延续性政策，符合经开区产业政策体系方向。`);
  push(`2.《北京经济技术开发区关于建设具有全球影响力商业航天产业高地的若干措施》（京技管发〔2024〕5号）与本政策第（二）、（四）条存在交叉。`);
  push(`3.第（五）条（首升规）与《北京经济技术开发区关于推动经济持续回升向好的若干措施》（京技管发〔2025〕1号）第7条存在交叉；第（五）条（专精特新、国高新）与《关于进一步促进专精特新、高新技术企业高质量发展的若干措施》（京技管发〔2023〕32号）第一、二条存在交叉。`);
  push(`4.第（六）条（研发费用补贴）与《北京经济技术开发区关于建设具有全球影响力商业航天产业高地的若干措施》（京技管发〔2024〕5号）第2条、《北京经济技术开发区关于促进医药健康产业高质量发展的若干措施》（京技管发〔2023〕5号）第4条、《北京经济技术开发区关于促进氢能产业高质量发展的若干措施》（京技管发〔2024〕25号）第4条、《关于进一步促进专精特新、高新技术企业高质量发展的若干措施》（京技管发〔2023〕32号）第4条存在交叉。`);
  push(`考虑到本政策为科技创新领域核心共性要素政策，建议以上涉及存在交叉的产业政策条款，按此政策调整执行，并在本政策附则中予以说明。`);
  push(``);

  // ── 三、政策落地性意见 ──
  push(`三、政策落地性意见`);
  push(``);
  push(`1.本政策共有5条竞争促进类政策条款，均需进一步出台细则以明确择优评审的实施方式。`);
  push(`2.第（六）条“对年度研发费用增长超过年度目标值的企业”，建议明确目标值的定义或测算方式，便于企业理解，同时建议明确此政策奖励的享受主体范围（如专精特新、规上等）。`);
  push(`3.第（九）条中“经认定的公共技术服务平台和中试服务基地”，当前尚无明确认定标准，建议予以明确。`);
  push(``);

  // ── 四、政策合规性意见 ──
  push(`四、政策合规性意见`);
  push(``);
  push(`1.根据《惠企政策全生命周期管理办法（2.0版）》，请在政策提请主任办公会审议前做好合法性审查和公平竞争审查工作。`);
  push(`2.根据公平竞争审查工作要求，建议将（十一）条中“开通区外班车”的表述调整为“开通跨区域通勤班车”。`);
  push(``);

  // ── 五、流程管理意见 ──
  push(`五、流程管理意见`);
  push(``);
  push(`1.建议做好资金测算工作，如有25年度需兑现的事项，在政策上会时同步提请追加预算。`);
  push(`2.根据《惠企政策全生命周期管理办法（2.0版）》的工作要求，建议提前做好政策解读准备工作。`);
  push(``);

  // ── 六、其他意见 ──
  push(`六、其他意见`);
  push(``);
  push(`建议做好企业调研工作，并将调研情况在上会汇报材料中予以体现。`);

  // ── 附注 ──
  push(``);
  push(`附注：本报告为AI辅助生成文本，供政策制定参考，请结合实际审查流程使用。`);

  return lines.join("\n");
}
