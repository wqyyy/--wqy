import { useMemo, useState, type ReactNode } from "react";
import { Search, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockReportItems, reportDepartments } from "@/components/policy-report/policyReportMockData";

const TIME_PRESETS = ["本 月", "上 月", "近一月", "本 年", "去 年"];

const DATE_ROWS = [
  { label: "开始申报日期：" },
  { label: "申报截止日期：" },
  { label: "确定扶持结算日期：" },
  { label: "兑现日期：" },
];

type ReportItemSelectionStepProps = {
  selectedItems: string[];
  onSelectedItemsChange: (ids: string[]) => void;
  footer: ReactNode;
};

/** 单选组（以圆形复选框样式呈现，与图片一致） */
function SingleSelectGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="whitespace-nowrap text-sm text-muted-foreground">{label}：</span>
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox
            checked={value === opt}
            onCheckedChange={() => onChange(opt)}
            className="h-4 w-4 rounded-full"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function ReportItemSelectionStep({
  selectedItems,
  onSelectedItemsChange,
  footer,
}: ReportItemSelectionStepProps) {
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timePreset, setTimePreset] = useState("");
  const [applyStatus, setApplyStatus] = useState("不限");
  const [redeemStatus, setRedeemStatus] = useState("不限");
  const [itemType, setItemType] = useState("不限");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isUniversal, setIsUniversal] = useState("不限");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
    setCurrentPage(1);
  };

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return mockReportItems.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.policy.toLowerCase().includes(keyword) ||
        item.department.toLowerCase().includes(keyword);
      const matchDept = selectedDepts.length === 0 || selectedDepts.includes(item.department);
      const matchType = itemType === "不限" || item.type === itemType;
      const matchRedeem =
        redeemStatus === "不限" ||
        (redeemStatus === "已拨付" && item.status.includes("已拨付")) ||
        (redeemStatus === "已确定扶持结果" && item.status.includes("已确定"));
      const matchApply =
        applyStatus === "不限" ||
        (applyStatus === "申报已截止" && item.status.includes("申报已截止")) ||
        (applyStatus === "申报中" && item.status.includes("申报中"));
      return matchKeyword && matchDept && matchType && matchRedeem && matchApply;
    });
  }, [applyStatus, itemType, redeemStatus, search, selectedDepts]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedItems.includes(item.id));

  const toggleItem = (id: string) => {
    onSelectedItemsChange(
      selectedItems.includes(id) ? selectedItems.filter((x) => x !== id) : [...selectedItems, id],
    );
  };

  const togglePageSelectAll = () => {
    if (allPageSelected) {
      onSelectedItemsChange(selectedItems.filter((id) => !pageItems.some((item) => item.id === id)));
    } else {
      const merged = new Set([...selectedItems, ...pageItems.map((item) => item.id)]);
      onSelectedItemsChange([...merged]);
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">选择事项</h2>
        <p className="mt-1 text-sm text-muted-foreground">先按条件缩小范围，再勾选纳入专报的事项。</p>
      </div>

      {/* 时间 + 快速生成 + 高级筛选 */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">时间：</span>
            {TIME_PRESETS.map((q) => (
              <Button
                key={q}
                variant={timePreset === q ? "default" : "outline"}
                size="sm"
                className="h-8 px-4 text-sm"
                onClick={() => setTimePreset((prev) => (prev === q ? "" : q))}
              >
                {q}
              </Button>
            ))}
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1 px-4 text-sm"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            高级筛选
          </Button>
        </div>
      </div>

      {/* 高级筛选展开内容 */}
      {showAdvanced && (
        <div className="space-y-3 border-t pt-4">
          {/* 日期范围（OR 关系） */}
          {DATE_ROWS.map((row, i) => (
            <div key={row.label} className="flex flex-wrap items-center gap-3 pl-16">
              {i > 0 && (
                <div className="flex items-center rounded border px-2 py-1 text-sm text-muted-foreground">
                  OR <ChevronDown className="ml-1 h-3 w-3" />
                </div>
              )}
              <span className="whitespace-nowrap text-sm text-muted-foreground">{row.label}</span>
              <div className="relative">
                <Input placeholder="开始时间" className="h-8 w-36 pr-8 text-sm" />
                <Calendar className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="relative">
                <Input placeholder="结束时间" className="h-8 w-36 pr-8 text-sm" />
                <Calendar className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              {i > 0 && (
                <button className="text-lg leading-none text-muted-foreground hover:text-foreground">—</button>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4">
            <span className="whitespace-nowrap text-sm font-medium text-foreground">事项状态：</span>
            <SingleSelectGroup
              label="申报状态"
              options={["不限", "申报中", "申报已截止", "未开始"]}
              value={applyStatus}
              onChange={(v) => {
                setApplyStatus(v);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="pl-[5.5rem]">
            <SingleSelectGroup
              label="兑现状态"
              options={["不限", "已确定扶持结果", "已拨付", "兑现流程中", "未开始", "零拨付"]}
              value={redeemStatus}
              onChange={(v) => {
                setRedeemStatus(v);
                setCurrentPage(1);
              }}
            />
          </div>
          <SingleSelectGroup
            label="事项类型"
            options={["不限", "标准兑现", "即申即享", "免申即享", "预兑现"]}
            value={itemType}
            onChange={(v) => {
              setItemType(v);
              setCurrentPage(1);
            }}
          />
          <div className="flex items-start gap-4">
            <span className="mt-0.5 whitespace-nowrap text-sm text-muted-foreground">主管部门：</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                <Checkbox
                  checked={selectedDepts.length === 0}
                  onCheckedChange={() => {
                    setSelectedDepts([]);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 rounded-full"
                />
                <span className={selectedDepts.length === 0 ? "font-medium text-primary" : ""}>不限</span>
              </label>
              {reportDepartments.map((d) => (
                <label key={d} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <Checkbox checked={selectedDepts.includes(d)} onCheckedChange={() => toggleDept(d)} className="h-4 w-4" />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>
          <SingleSelectGroup
            label="是否普惠"
            options={["不限", "普惠", "非普惠"]}
            value={isUniversal}
            onChange={setIsUniversal}
          />
        </div>
      )}

      {/* 事项表格 */}
      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="text-sm text-foreground">
            已选 <span className="font-bold text-primary">{selectedItems.length}</span> 项
          </div>
          <button type="button" onClick={togglePageSelectAll} className="text-sm text-primary hover:underline">
            {allPageSelected ? "取消全选本页" : "全选本页"}
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="请输入事项名/政策名称搜索"
              className="h-9 pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={togglePageSelectAll}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                  </TableHead>
                  <TableHead>事项名称</TableHead>
                  <TableHead>事项状态</TableHead>
                  <TableHead>事项类型</TableHead>
                  <TableHead>关联政策</TableHead>
                  <TableHead>主管部门</TableHead>
                  <TableHead>开始申报日期</TableHead>
                  <TableHead>申报截止日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                      暂无匹配事项，请调整搜索或筛选条件
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((item) => (
                    <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-primary/5" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="border-primary data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.status}</TableCell>
                      <TableCell className="text-sm">{item.type}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">{item.policy}</TableCell>
                      <TableCell className="text-sm">{item.department}</TableCell>
                      <TableCell className="text-sm">{item.startDate}</TableCell>
                      <TableCell className="text-sm">{item.endDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length > 0 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      </div>

      {footer}
    </div>
  );
}
