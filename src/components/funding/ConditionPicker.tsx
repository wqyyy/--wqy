import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FUNDING_GROUPS } from "@/lib/fundingEstimation";

export function ConditionPicker({ open, onClose, selected, onConfirm }: { open: boolean; onClose: () => void; selected: string[]; onConfirm: (fields: string[]) => void }) {
  const [draft, setDraft] = useState(selected);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const categories = [...new Set(FUNDING_GROUPS.map(group => group.category))];
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 bg-white p-0">
      <div className="border-b border-border px-7 py-5"><DialogTitle>添加条件</DialogTitle><DialogDescription className="sr-only">选择测算所需条件，灰色条件暂不可用。</DialogDescription></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-4">
        <div className="mb-3 flex justify-end"><Button variant="outline" size="sm" className="gap-2 text-primary" onClick={() => setCollapsed(collapsed.length ? [] : FUNDING_GROUPS.map(group => group.title))}>{collapsed.length ? "展开全部" : "收起全部"}<ChevronDown className={collapsed.length ? "h-4 w-4" : "h-4 w-4 rotate-180"} /></Button></div>
        {categories.map(category => <section key={category} className="mb-6">
          <h3 className="mb-4 border-l-2 border-primary pl-2 text-sm font-semibold">{category}</h3>
          {FUNDING_GROUPS.filter(group => group.category === category).map(group => <div key={group.title} className="mb-6 pl-2">
            <button type="button" className="mb-4 flex w-full items-center justify-between text-left text-sm font-semibold" aria-expanded={!collapsed.includes(group.title)} onClick={() => setCollapsed(previous => previous.includes(group.title) ? previous.filter(title => title !== group.title) : [...previous, group.title])}>{group.title}：<ChevronDown className={`h-4 w-4 text-primary ${collapsed.includes(group.title) ? "" : "rotate-180"}`} /></button>
            {!collapsed.includes(group.title) && <div className="flex flex-wrap gap-x-5 gap-y-4 pl-5">
              {group.fields.map(field => <label key={field.id} className={`flex items-start gap-2 text-sm leading-6 ${field.disabled ? "text-gray-300" : "cursor-pointer text-foreground"}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary" disabled={field.disabled} checked={draft.includes(field.id)} onChange={event => setDraft(previous => event.target.checked ? [...previous, field.id] : previous.filter(id => id !== field.id))} />{field.label}
              </label>)}
            </div>}
          </div>)}
        </section>)}
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-7 py-4"><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={() => onConfirm(draft)}>确定</Button></div>
    </DialogContent>
  </Dialog>;
}
