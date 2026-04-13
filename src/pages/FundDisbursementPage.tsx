import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TabKey = "pending" | "applied" | "paid" | "rejected";

export default function FundDisbursementPage() {
  const [tab, setTab] = useState<TabKey>("paid");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "pending", label: "待申请" },
    { key: "applied", label: "已申请未拨付" },
    { key: "paid", label: "已拨付" },
    { key: "rejected", label: "已拒绝" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 pt-4">
            <div className="mx-auto flex w-fit items-center gap-12">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    tab === item.key
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">专项名称:</label>
                <button className="flex h-10 w-full items-center justify-between rounded-sm border border-border bg-background px-3 text-sm text-muted-foreground">
                  请选择
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">申报事项:</label>
                <button className="flex h-10 w-full items-center justify-between rounded-sm border border-border bg-background px-3 text-sm text-muted-foreground">
                  请选择
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-end gap-2">
                <Button className="h-8 rounded-sm px-4 text-sm">查询</Button>
                <Button variant="outline" className="h-8 rounded-sm px-4 text-sm">重置</Button>
                <Button variant="outline" className="h-8 rounded-sm px-4 text-sm">导出</Button>
                <button type="button" className="inline-flex h-8 items-center gap-1 px-2 text-sm text-primary">
                  展开 <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-[420px] flex-col items-center justify-center text-muted-foreground">
              <div className="mb-3 h-16 w-16 rounded-full bg-muted" />
              <p className="text-sm">暂无数据</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

