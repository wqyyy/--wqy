import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ClauseRow = {
  id: number;
  clauseText: string;
  toolCategory: string;
  targetCategories: string[];
  targetText: string;
  audienceTags: string[];
  audienceText: string;
};

const graphNodes = [
  { label: "创新", color: "bg-[#f5a623]", position: "top-[8%] left-1/2 -translate-x-1/2" },
  { label: "空间", color: "bg-[#c5d86d]", position: "top-[22%] right-[18%]" },
  { label: "企业发展", color: "bg-[#f48fb1]", position: "bottom-[22%] right-[14%]" },
  { label: "金融", color: "bg-[#b39ddb]", position: "bottom-[8%] left-1/2 -translate-x-1/2" },
  { label: "人才", color: "bg-[#f8bbd0]", position: "bottom-[22%] left-[14%]" },
  { label: "绿色发展", color: "bg-[#81d4fa]", position: "top-[22%] left-[18%]" },
] as const;

const clauseRows: ClauseRow[] = [
  {
    id: 1,
    clauseText:
      "对首次入区且实缴注册资本不低于1000万元的企业，按照实缴注册资本的2%给予一次性落户奖励，最高不超过500万元。",
    toolCategory: "企业发展—入区落地",
    targetCategories: ["金融赋能", "产业升级"],
    targetText: "吸引优质企业落户，促进产业集聚与资本导入。",
    audienceTags: ["工业企业"],
    audienceText: "首次入区、实缴注册资本达到门槛的工业企业。",
  },
  {
    id: 2,
    clauseText:
      "支持企业开展技术改造和设备更新，按照项目总投资的一定比例给予补贴，每年最高不超过300万元。",
    toolCategory: "企业发展—技术改造",
    targetCategories: ["产业升级"],
    targetText: "推动制造业数字化、智能化升级，提升生产效率。",
    audienceTags: ["企业"],
    audienceText: "在经开区注册并开展技术改造的制造业企业。",
  },
  {
    id: 3,
    clauseText:
      "对年度研发投入增长超过年度目标值的高新技术企业，按照高出部分的20%给予支持，每年最高为300万元。",
    toolCategory: "创新—研发支持",
    targetCategories: ["创新引领"],
    targetText: "激励企业加大研发投入，增强自主创新能力。",
    audienceTags: ["高新技术企业"],
    audienceText: "注册在经开区且通过高新技术企业认定的企业。",
  },
];

function DomainKnowledgeGraph() {
  return (
    <Card className="border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="h-4 w-1 rounded-full bg-primary" />
        领域维度知识图谱
      </h3>
      <div className="relative mx-auto h-[420px] max-w-[720px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 720 420">
          {graphNodes.map((node, index) => {
            const cx = 360;
            const cy = 210;
            const angle = (index / graphNodes.length) * Math.PI * 2 - Math.PI / 2;
            const rx = 250;
            const ry = 150;
            const x = cx + Math.cos(angle) * rx;
            const y = cy + Math.sin(angle) * ry;
            return (
              <line key={node.label} x1={cx} y1={cy} x2={x} y2={y} stroke="#d8dce5" strokeWidth="1.5" />
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#4f8ef7] text-center text-sm font-semibold text-white shadow-md">
          领域维度
        </div>

        {graphNodes.map((node) => (
          <div
            key={node.label}
            className={cn(
              "absolute z-10 flex h-20 w-20 items-center justify-center rounded-full text-center text-sm font-medium text-white shadow-sm",
              node.color,
              node.position,
            )}
          >
            {node.label}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ClauseQueryPanel() {
  const [clauseKeyword, setClauseKeyword] = useState("");
  const [toolCategory, setToolCategory] = useState("all");
  const [targetCategory, setTargetCategory] = useState("all");
  const [audienceTag, setAudienceTag] = useState("");

  const filteredRows = useMemo(() => {
    return clauseRows.filter((row) => {
      const matchClause =
        !clauseKeyword.trim() || row.clauseText.toLowerCase().includes(clauseKeyword.trim().toLowerCase());
      const matchTool = toolCategory === "all" || row.toolCategory.includes(toolCategory);
      const matchTarget =
        targetCategory === "all" || row.targetCategories.some((item) => item.includes(targetCategory));
      const matchAudience =
        !audienceTag.trim() ||
        row.audienceTags.some((tag) => tag.includes(audienceTag.trim())) ||
        row.audienceText.includes(audienceTag.trim());
      return matchClause && matchTool && matchTarget && matchAudience;
    });
  }, [audienceTag, clauseKeyword, targetCategory, toolCategory]);

  const resetFilters = () => {
    setClauseKeyword("");
    setToolCategory("all");
    setTargetCategory("all");
    setAudienceTag("");
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex gap-2">
            <Select defaultValue="clause">
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue placeholder="政策条款文本" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clause">政策条款文本</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={clauseKeyword}
              onChange={(event) => setClauseKeyword(event.target.value)}
              placeholder="请输入政策条款文本"
              className="flex-1"
            />
          </div>
          <Select value={toolCategory} onValueChange={setToolCategory}>
            <SelectTrigger>
              <SelectValue placeholder="工具分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部工具分类</SelectItem>
              <SelectItem value="企业发展">企业发展</SelectItem>
              <SelectItem value="创新">创新</SelectItem>
            </SelectContent>
          </Select>

          <Select value={targetCategory} onValueChange={setTargetCategory}>
            <SelectTrigger>
              <SelectValue placeholder="目标分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部目标分类</SelectItem>
              <SelectItem value="金融赋能">金融赋能</SelectItem>
              <SelectItem value="产业升级">产业升级</SelectItem>
              <SelectItem value="创新引领">创新引领</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              value={audienceTag}
              onChange={(event) => setAudienceTag(event.target.value)}
              placeholder="受众对象标签"
              className="flex-1"
            />
            <Button className="bg-primary px-6 hover:bg-primary/90">查询</Button>
            <Button variant="outline" onClick={resetFilters}>
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">信息列表</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-[#fafafa]">
                <th className="w-14 px-4 py-3 text-left font-semibold">序号</th>
                <th className="min-w-[220px] px-4 py-3 text-left font-semibold">政策条款文本</th>
                <th className="w-[140px] px-4 py-3 text-left font-semibold">政策工具分类</th>
                <th className="w-[120px] px-4 py-3 text-left font-semibold">政策目标分类</th>
                <th className="min-w-[160px] px-4 py-3 text-left font-semibold">政策目标文本</th>
                <th className="w-[120px] px-4 py-3 text-left font-semibold">受众对象标签</th>
                <th className="min-w-[160px] px-4 py-3 text-left font-semibold">受众对象文本</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="border-b border-border align-top last:border-b-0">
                  <td className="px-4 py-4 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-4 leading-6 text-foreground">{row.clauseText}</td>
                  <td className="px-4 py-4 text-foreground">{row.toolCategory}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {row.targetCategories.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 leading-6 text-muted-foreground">{row.targetText}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {row.audienceTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#eef2ff] px-2 py-0.5 text-xs text-[#4f46e5]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 leading-6 text-muted-foreground">{row.audienceText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function PolicyToolbox() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1500px] space-y-4 p-5 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/policy-writing")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          返回政策制定
        </button>

        <Tabs defaultValue="view" className="space-y-4">
          <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="view"
              className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-base font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              政策工具视图
            </TabsTrigger>
            <TabsTrigger
              value="clause"
              className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-base font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              政策条款查询
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-0 focus-visible:outline-none">
            <DomainKnowledgeGraph />
          </TabsContent>

          <TabsContent value="clause" className="mt-0 focus-visible:outline-none">
            <ClauseQueryPanel />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
