import { useState } from "react";
import { ChevronLeft, Search, Plus, CirclePlus, CircleMinus, Copy, Trash2, Inbox, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { TaskListPagination } from "@/components/TaskListPagination";
import { TaskListIconButton } from "@/components/TaskListCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDictionaryEntries, loadPersonalDictionaryEntries, savePersonalDictionaryEntries, SENSITIVE_TYPES, type DictionaryKind, type DictionaryEntry } from "@/lib/policyDictionary";

const labels: Record<DictionaryKind, [string, string]> = {
  synonym: ["同/近义词", ""], professional: ["词名称", "释义"], sensitive: ["敏感词名称", "敏感类型"], fixed: ["固定表述", "错误示例"], abbreviation: ["缩略词名称", "全称"],
};
const selectClass = "h-11 w-full min-w-0 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
function CountedField({ label, value, onChange, limit, multiline = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; limit: number; multiline?: boolean; placeholder?: string }) {
  const common = { "aria-label": label, value, maxLength: limit, placeholder: placeholder ?? "请输入", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) };
  return <div className="min-w-0">
    <div className="relative">
      {multiline ? <textarea {...common} className="min-h-[130px] w-full resize-y rounded-md border border-input bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" /> : <input {...common} className="h-11 w-full rounded-md border border-input bg-white pl-3 pr-16 text-sm outline-none focus:ring-2 focus:ring-primary/20" />}
      {!multiline && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{value.length}/{limit}</span>}
    </div>
    {multiline && <div className="text-right text-xs text-muted-foreground">{value.length}/{limit}</div>}
  </div>;
}
const blankRow = (kind: DictionaryKind): DictionaryEntry => ({ id: crypto.randomUUID(), words: kind === "synonym" ? ["", ""] : [""], detail: kind === "sensitive" ? SENSITIVE_TYPES[0] : "" });

export function PolicyDictionaryEntries({ kind, title, onBack }: { kind: DictionaryKind; title: string; onBack: () => void }) {
  const [personalEntries, setPersonalEntries] = useState(() => loadPersonalDictionaryEntries(kind));
  const [scope, setScope] = useState("public");
  const isPersonal = scope === "personal";
  const entries = isPersonal ? personalEntries : createDictionaryEntries(kind);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<string | null>(null);
  const [rows, setRows] = useState<DictionaryEntry[]>([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<DictionaryEntry | null>(null);
  const filtered = entries.filter(entry => entry.words.some(word => word.toLowerCase().includes(query.toLowerCase())) && (kind !== "sensitive" || filter === "全部" || entry.detail === filter));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const bulk = kind === "sensitive" || kind === "fixed" || kind === "abbreviation";
  const persist = (next: DictionaryEntry[]) => {
    if (!isPersonal) return false;
    try { savePersonalDictionaryEntries(kind, next); setPersonalEntries(next); return true; }
    catch { toast.error("保存失败，请检查浏览器存储空间"); return false; }
  };
  const openEditor = (entry?: DictionaryEntry) => { if (!isPersonal) return; setEditing(entry?.id ?? "new"); setRows(entry ? [{ ...entry, words: [...entry.words] }] : [blankRow(kind)]); setError(""); };
  const updateRow = (index: number, patch: Partial<DictionaryEntry>) => { setRows(previous => previous.map((row, i) => i === index ? { ...row, ...patch } : row)); setError(""); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isPersonal) return;
    const nextRows = rows.map(row => ({ ...row, words: row.words.map(word => word.trim()), detail: row.detail.trim() }));
    if (nextRows.some(row => row.words.some(word => !word) || (kind !== "synonym" && kind !== "fixed" && !row.detail))) { setError("请完整填写必填内容。"); return; }
    if (kind === "synonym" && nextRows.some(row => new Set(row.words).size < row.words.length)) { setError("同一组内的词语不能重复。"); return; }
    const remaining = entries.filter(entry => entry.id !== editing);
    const all = [...remaining, ...nextRows];
    const keys = all.map(entry => kind === "synonym" ? [...entry.words].sort().join("\u0000") : entry.words[0]);
    if (new Set(keys).size !== keys.length) { setError("存在重复词条，请修改后再提交。"); return; }
    const next = editing === "new" ? [...nextRows, ...entries] : entries.flatMap(entry => entry.id === editing ? nextRows : [entry]);
    if (persist(next)) { setEditing(null); setPage(1); toast.success("词条已保存"); }
  };

  return <div className="h-full overflow-y-auto bg-background p-5 md:p-6"><div className="mx-auto max-w-[1400px] space-y-6">
    <div className="flex flex-wrap items-center gap-5"><button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" />返回</button><h1 className="text-lg font-semibold">{title}</h1></div>
    <section className="space-y-5 bg-white p-4 md:p-6">
      <Tabs value={scope} onValueChange={value => { setScope(value); setPage(1); setKeyword(""); setQuery(""); setFilter("全部"); setEditing(null); setDeleting(null); }}>
        <TabsList><TabsTrigger value="public">公共词典</TabsTrigger><TabsTrigger value="personal">个人词典</TabsTrigger></TabsList>
      </Tabs>
      <p className="text-sm leading-7 text-muted-foreground">
        {isPersonal ? "个人词典：由用户自行维护，补充专业术语和常用词汇，满足个性化使用需求。" : "公共词典：由系统统一维护，提供政策领域标准词汇，供政策起草和内容审核参考。"}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={event => { event.preventDefault(); setQuery(keyword.trim()); setPage(1); }} className="flex w-full max-w-[480px] items-center">
          <div className="min-w-0 flex-1"><CountedField label="搜索词名称" value={keyword} limit={50} placeholder="搜索词名称" onChange={value => { setKeyword(value); if (!value) { setQuery(""); setPage(1); } }} /></div>
          <Button type="submit" variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="搜索" title="搜索"><Search className="h-4 w-4" /></Button>
        </form>
        {kind === "sensitive" && <label className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm">词类型：<select aria-label="筛选词类型" className={`${selectClass} !w-40`} value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}>{["全部", ...SENSITIVE_TYPES].map(type => <option key={type}>{type}</option>)}</select></label>}
        {isPersonal && <Button className="ml-auto h-11 gap-2 px-5" onClick={() => openEditor()}><Plus className="h-4 w-4" />新增词</Button>}
      </div>
      <div className="overflow-x-auto rounded-t-lg"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#fafafa]"><tr><th className="w-20 px-5 py-5">序号</th><th className="px-5 py-5">{labels[kind][0]}</th>{kind !== "synonym" && <th className="px-5 py-5">{labels[kind][1]}</th>}{isPersonal && <th className="w-40 px-5 py-5">操作</th>}</tr></thead><tbody>
        {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((entry, index) => <tr key={entry.id} className="border-b border-border hover:bg-muted/20"><td className="px-5 py-5">{(currentPage - 1) * pageSize + index + 1}</td><td className="max-w-[320px] break-words px-5 py-5 leading-7">{entry.words.join("、")}</td>{kind !== "synonym" && <td className="max-w-[580px] whitespace-pre-wrap break-words px-5 py-5 leading-7">{entry.detail || "—"}</td>}{isPersonal && <td className="px-5 py-5"><div className="flex items-center gap-1 text-muted-foreground"><span title="编辑"><TaskListIconButton label={`编辑 ${entry.words.join("、")}`} onClick={() => openEditor(entry)}><Pencil className="h-4 w-4" /></TaskListIconButton></span><span title="删除"><TaskListIconButton label={`删除 ${entry.words.join("、")}`} destructive onClick={() => setDeleting(entry)}><Trash2 className="h-4 w-4" /></TaskListIconButton></span></div></td>}</tr>)}
        {!filtered.length && <tr><td colSpan={(kind === "synonym" ? 2 : 3) + (isPersonal ? 1 : 0)} className="py-20 text-center text-muted-foreground"><Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />暂无数据</td></tr>}
      </tbody></table></div>
      <TaskListPagination currentPage={currentPage} totalPages={pageCount} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
    </section>
    <Dialog open={editing !== null} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto bg-white sm:max-w-[860px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{editing === "new" ? "新增" : "编辑"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-6 pt-3">
        {rows.map((row, index) => <div key={row.id} className="space-y-4">
          {kind === "synonym" ? <div className="mx-auto max-w-xl space-y-4"><p className="text-sm font-medium">同/近义词</p>{row.words.map((word, wordIndex) => <div key={wordIndex} className="flex items-center gap-2"><div className="min-w-0 flex-1"><CountedField label={`同近义词${wordIndex + 1}`} value={word} limit={50} onChange={value => updateRow(index, { words: row.words.map((item, i) => i === wordIndex ? value : item) })} /></div><Button type="button" variant="ghost" size="icon" disabled={row.words.length <= 2} aria-label={`删除第${wordIndex + 1}个词`} title="删除词" onClick={() => updateRow(index, { words: row.words.filter((_, i) => i !== wordIndex) })}><CircleMinus className="h-4 w-4" /></Button>{wordIndex === row.words.length - 1 ? <Button type="button" variant="ghost" size="icon" aria-label="增加同近义词" title="增加词" onClick={() => updateRow(index, { words: [...row.words, ""] })}><CirclePlus className="h-4 w-4" /></Button> : <span className="w-10" />}</div>)}</div> : <div className={`grid items-start gap-4 ${kind === "professional" ? "grid-cols-1" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
            <div className="min-w-0 space-y-2"><label className="block text-sm"><span className="text-primary">* </span>{labels[kind][0]}：</label><CountedField label={`${labels[kind][0]}${index + 1}`} value={row.words[0]} limit={kind === "fixed" ? 100 : 50} placeholder={kind === "abbreviation" ? "请填写缩略词" : "请输入词名称"} onChange={value => updateRow(index, { words: [value] })} /></div>
            <div className="min-w-0 space-y-2"><label className="block text-sm">{kind !== "fixed" && <span className="text-primary">* </span>}{labels[kind][1]}：</label>{kind === "sensitive" ? <select aria-label={`敏感类型${index + 1}`} className={selectClass} value={row.detail} onChange={event => updateRow(index, { detail: event.target.value })}>{SENSITIVE_TYPES.map(type => <option key={type}>{type}</option>)}</select> : <CountedField label={`${labels[kind][1]}${index + 1}`} value={row.detail} limit={kind === "professional" ? 500 : kind === "fixed" ? 200 : 100} multiline={kind === "professional"} placeholder={`请输入${labels[kind][1]}`} onChange={value => updateRow(index, { detail: value })} />}</div>
            {bulk && <div className="flex items-center gap-1 sm:pt-7"><Button type="button" variant="ghost" size="icon" title="复制行" aria-label={`复制第${index + 1}行`} onClick={() => setRows(previous => [...previous.slice(0, index + 1), { ...row, words: [...row.words], id: crypto.randomUUID() }, ...previous.slice(index + 1)])}><Copy className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" title="删除行" aria-label={`删除第${index + 1}行`} disabled={rows.length === 1} onClick={() => setRows(previous => previous.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>}
          </div>}
        </div>)}
        {bulk && <Button type="button" variant="outline" className="h-11 w-full gap-2 border-dashed" onClick={() => setRows(previous => [...previous, blankRow(kind)])}><Plus className="h-4 w-4" />添加一行数据</Button>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className={`flex gap-3 ${kind === "sensitive" || kind === "fixed" ? "justify-start" : "justify-end"}`}>
          {(kind === "sensitive" || kind === "fixed") ? <Button type="button" variant="outline" onClick={() => { setRows([editing !== "new" ? { ...entries.find(entry => entry.id === editing)!, words: [...entries.find(entry => entry.id === editing)!.words] } : blankRow(kind)]); setError(""); }}>重置</Button> : <Button type="button" variant="outline" onClick={() => setEditing(null)}>取消</Button>}
          <Button type="submit" className="px-7">{kind === "sensitive" || kind === "fixed" ? "提交" : "确定"}</Button>
        </div>
      </form>
    </DialogContent></Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={open => { if (!open) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>删除词条？</AlertDialogTitle><AlertDialogDescription>确认删除“{deleting?.words.join("、")}”？删除后不可恢复。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleting && persist(entries.filter(entry => entry.id !== deleting.id))) { setDeleting(null); toast.success("词条已删除"); } }}>删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></div>;
}
