import { Archive, CheckCircle2, ClipboardList, Search, Sparkles, ListOrdered, ScrollText } from "lucide-react";

export function DraftFlowSteps({ current, maximum, bodyReady, archived, completedSteps = [], onSelect }: {
  current: number; maximum: number; bodyReady: boolean; archived: boolean; completedSteps?: number[]; onSelect: (step: number) => void;
}) {
  const steps = [
    { label: "确定政策方向", icon: ClipboardList }, { label: "检索相似政策", icon: Search },
    { label: "生成核心要素", icon: Sparkles }, { label: "生成政策大纲", icon: ListOrdered },
    { label: "生成政策正文", icon: ScrollText }, { label: "归档", icon: Archive },
  ];
  return <section className="mb-3 shrink-0 rounded-lg border border-border bg-card px-4 py-2.5">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold">起草流程</h3>
      <span className="text-xs font-medium text-muted-foreground">第 {archived ? steps.length : Math.min(Math.max(current, 1), steps.length)} / {steps.length} 步</span>
    </div>
    <div className="flex justify-between gap-3 overflow-x-auto">
      {steps.map(({ label, icon: Icon }, index) => {
        const step = index + 1;
        const active = !archived && current === step;
        const done = !active && (archived || step < maximum || completedSteps.includes(step) || (step === 5 && bodyReady));
        return <button key={label} type="button" disabled={archived || step > maximum || step === 6} onClick={() => onSelect(step)} aria-current={active ? "step" : undefined} className="flex min-w-[94px] flex-1 flex-col items-center gap-1 rounded-md p-1 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-white" : done ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-border text-muted-foreground"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
          <span className="whitespace-nowrap text-xs">{label}</span>
        </button>;
      })}
    </div>
  </section>;
}
