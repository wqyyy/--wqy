import { useState } from "react";

const MOCK_ROWS = [
  {
    id: 1,
    subject: "北京张三企业有限公司",
    matter: "2025年一季度研发费用增长奖励",
    project: "2025年一季度研发费用增长奖励",
    warning: "-",
  },
  {
    id: 2,
    subject: "北京正果建设有限公司",
    matter: "2025年一季度研发费用增长奖励",
    project: "2025年一季度研发费用增长奖励",
    warning: "-",
  },
];

export default function PolicyProjectReview() {
  const [tab, setTab] = useState<"pending" | "processed">("pending");

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 pt-4">
          <div className="mx-auto flex w-fit items-center gap-10">
            <button
              type="button"
              onClick={() => setTab("pending")}
              className={`pb-3 text-sm font-semibold ${
                tab === "pending" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              待处理
            </button>
            <button
              type="button"
              onClick={() => setTab("processed")}
              className={`pb-3 text-sm font-semibold ${
                tab === "processed" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              已处理
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {["同意", "审核不通过", "退回修改", "申请协助审核", "导入审批"].map((action, idx) => (
              <button
                key={action}
                type="button"
                className={`rounded-sm border px-4 py-1.5 text-xs font-medium ${
                  idx === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/40 text-primary hover:bg-primary/5"
                }`}
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">申报主体：</span>
              <input className="h-9 w-56 rounded-sm border px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="请输入" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">项目名称：</span>
              <input className="h-9 w-56 rounded-sm border px-3 text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="请输入" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                查询
              </button>
              <button type="button" className="rounded-sm border px-4 py-2 text-sm text-foreground">
                重置
              </button>
              <button type="button" className="rounded-sm border px-4 py-2 text-sm text-foreground">
                高级
              </button>
            </div>
          </div>
        </div>

        <div className="border-t px-6 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">数据列表</p>
            <div className="flex items-center gap-4 text-sm text-primary">
              <button type="button">导出结果</button>
              <button type="button">表单数据导出</button>
              <button type="button">自定义表头</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr className="bg-muted/35 text-left text-sm text-foreground">
                  <th className="w-12 border px-3 py-2">序号</th>
                  <th className="border px-3 py-2">申报主体</th>
                  <th className="border px-3 py-2">申报事项</th>
                  <th className="border px-3 py-2">申报项目</th>
                  <th className="border px-3 py-2">事中预警</th>
                  <th className="w-24 border px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROWS.map((row) => (
                  <tr key={row.id} className="text-sm">
                    <td className="border px-3 py-2">{row.id}</td>
                    <td className="border px-3 py-2">{row.subject}</td>
                    <td className="border px-3 py-2">{row.matter}</td>
                    <td className="border px-3 py-2">{row.project}</td>
                    <td className="border px-3 py-2">{row.warning}</td>
                    <td className="border px-3 py-2 text-primary">审核</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 py-4 text-sm text-muted-foreground">
            <span>共 2 条</span>
            <span>10条/页</span>
            <span>1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
