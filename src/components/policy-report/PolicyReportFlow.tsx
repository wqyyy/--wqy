import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  List,
  ListChecks,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { reportDetail } from "@/data/mockData";
import {
  ENTERPRISE_ANALYSIS_OPTIONS,
  FUND_ANALYSIS_OPTIONS,
  ITEM_ANALYSIS_OPTIONS,
  mockReportItems,
} from "@/components/policy-report/policyReportMockData";
import { ReportItemSelectionStep } from "@/components/policy-report/ReportItemSelectionStep";
import {
  ReportDimensionStep,
  getAutoReportTitle,
  getTotalSelectedDimensions,
} from "@/components/policy-report/ReportDimensionStep";
import { ReportGenerationProgress } from "@/components/policy-report/ReportGenerationProgress";

const COLORS = ["hsl(350,85%,42%)", "hsl(210,70%,45%)", "hsl(38,90%,55%)", "hsl(145,60%,42%)", "hsl(25,90%,55%)", "hsl(270,50%,50%)"];

const flowSteps = [
  { id: 1, label: "选择事项", icon: ListChecks },
  { id: 2, label: "选择专报维度", icon: SlidersHorizontal },
  { id: 3, label: "生成报告", icon: FileText },
];

type PolicyReportFlowProps = {
  onBack: () => void;
};

function ReadOnlyReportPreview({ title, itemCount }: { title: string; itemCount: number }) {
  const data = reportDetail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            覆盖事项 {itemCount} 项 · 生成时间 {new Date().toLocaleString("zh-CN")}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          只读版本
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">整体情况评估</CardTitle>
            <Badge className="gap-1">
              <TrendingUp className="h-3 w-3" />
              兑现率 {data.dimensions.situation.score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground select-none">
          <p>{data.overallAssessment}</p>
          <p>{data.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">已兑现事项分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dimensions.items}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(350,85%,42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">已兑现资金分布（亿元）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.dimensions.funds}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="amount"
                  nameKey="category"
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {data.dimensions.funds.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">已扶持企业分布</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>企业类型</TableHead>
                <TableHead className="text-right">企业数量</TableHead>
                <TableHead className="text-right">占比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dimensions.enterprises.map((e) => (
                <TableRow key={e.type}>
                  <TableCell className="font-medium">{e.type}</TableCell>
                  <TableCell className="text-right">{e.count}</TableCell>
                  <TableCell className="text-right">{e.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">本报告为系统自动生成，不支持在线编辑。如需调整请重新配置维度后生成。</p>
    </div>
  );
}

export function PolicyReportFlow({ onBack }: PolicyReportFlowProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  const [selectedItems, setSelectedItems] = useState<string[]>(mockReportItems.map((i) => i.id));

  const [itemAnalysis, setItemAnalysis] = useState<string[]>([...ITEM_ANALYSIS_OPTIONS]);
  const [fundAnalysis, setFundAnalysis] = useState<string[]>([...FUND_ANALYSIS_OPTIONS]);
  const [enterpriseAnalysis, setEnterpriseAnalysis] = useState<string[]>([...ENTERPRISE_ANALYSIS_OPTIONS]);

  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const goNext = () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxReachedStep((prev) => Math.max(prev, next));
      if (next === 3) {
        startGeneration();
      }
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep && stepId <= maxReachedStep) {
      setCurrentStep(stepId);
      if (stepId < 3) {
        setGenerating(false);
        setReportReady(false);
      }
    }
  };

  const startGeneration = () => {
    setGenerating(true);
    setReportReady(false);
  };

  const canProceedStep1 = selectedItems.length > 0;
  const canProceedStep2 =
    getTotalSelectedDimensions(itemAnalysis, fundAnalysis, enterpriseAnalysis) > 0;
  const reportTitle = getAutoReportTitle(selectedItems.length);

  const renderBottomActions = (nextLabel: string, nextDisabled = false) => (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      {currentStep > 1 && currentStep < 3 && (
        <Button variant="outline" onClick={goBack} className="h-11 gap-1.5 px-5 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          返回上一步
        </Button>
      )}
      {currentStep < 3 && (
        <Button
          onClick={goNext}
          disabled={nextDisabled}
          className="h-11 flex-1 text-sm font-medium gov-gradient text-primary-foreground hover:opacity-90"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col space-y-5">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回政策兑现
        </button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/policy-report/tasks")}>
          <List className="h-4 w-4" />
          历史任务列表
        </Button>
      </div>

      <div className="shrink-0 rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">兑现专报生成流程</h3>
          <span className="text-xs font-medium text-muted-foreground">{`第 ${currentStep} / 3 步`}</span>
        </div>
        <div className="flex items-center justify-center gap-0">
          {flowSteps.map((step, i) => {
            const isCurrent = currentStep === step.id;
            const isClickable = step.id < currentStep && step.id <= maxReachedStep;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => handleStepClick(step.id)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(230,0,50,0.24)]"
                        : "border-[#e7ced8] bg-white text-[#d8b9c6]"
                    } ${isClickable ? "cursor-pointer hover:border-primary/50 hover:text-primary" : "cursor-default"}`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span
                    onClick={() => handleStepClick(step.id)}
                    className={`whitespace-nowrap text-xs font-medium transition-colors ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    } ${isClickable ? "cursor-pointer hover:text-primary" : "cursor-default"}`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className="-mt-5 select-none px-6 text-base leading-none text-[#d8b9c6] md:px-8">{">> "}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {currentStep === 1 && (
          <ReportItemSelectionStep
            selectedItems={selectedItems}
            onSelectedItemsChange={setSelectedItems}
            footer={renderBottomActions("下一步：选择专报维度", !canProceedStep1)}
          />
        )}

        {currentStep === 2 && (
          <ReportDimensionStep
            selectedItemCount={selectedItems.length}
            itemAnalysis={itemAnalysis}
            fundAnalysis={fundAnalysis}
            enterpriseAnalysis={enterpriseAnalysis}
            onItemAnalysisChange={setItemAnalysis}
            onFundAnalysisChange={setFundAnalysis}
            onEnterpriseAnalysisChange={setEnterpriseAnalysis}
            footer={renderBottomActions("生成专报", !canProceedStep2)}
          />
        )}

        {currentStep === 3 && (
          <div className="rounded-xl border border-border bg-card p-6">
            {generating && (
              <ReportGenerationProgress
                reportTitle={reportTitle}
                itemCount={selectedItems.length}
                onComplete={() => {
                  setGenerating(false);
                  setReportReady(true);
                }}
              />
            )}

            {reportReady && (
              <ReadOnlyReportPreview title={reportTitle} itemCount={selectedItems.length} />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
