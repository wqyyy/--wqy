import { useEffect, useRef, useState } from "react";
import { Archive, ArrowLeft, BadgeCheck, CheckCircle2, ChevronRight, CirclePlus, ListFilter, Loader2, Plus, Trash2, X } from "lucide-react";
import { fundingTaskProgress, saveFundingTask, type FundingTask } from "@/lib/fundingTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConditionPicker } from "./ConditionPicker";
import { FundingResults } from "./FundingResults";
import { calculateFunding, ENABLED_FIELDS, FUNDING_GROUPS, getFundingField, isValidCondition, makeCondition, parseFundingConditions, validFundingSupport, type FundingCondition, type FundingResult, type FundingSupport, type Operator } from "@/lib/fundingEstimation";

const selectClass = "h-10 min-w-0 rounded-md border border-input bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const steps = [{ title: "添加测算条件", icon: ListFilter }, { title: "查看测算结果", icon: BadgeCheck }, { title: "归档", icon: Archive }];
function Heading({ children }: { children: React.ReactNode }) { return <h2 className="border-l-4 border-primary pl-2 text-base font-semibold">{children}</h2>; }

export function FundingWorkspace({ initialClauseContent = "", savedTask, persistent = false }: { initialClauseContent?: string; savedTask?: FundingTask; persistent?: boolean }) {
  const [identity] = useState(() => ({ id: savedTask?.id ?? crypto.randomUUID(), createdAt: savedTask?.createdAt ?? new Date().toISOString() }));
  const [archived, setArchived] = useState(savedTask?.archived ?? false);
  const [step, setStep] = useState(() => fundingTaskProgress(savedTask).step);
  const [maximum, setMaximum] = useState(() => fundingTaskProgress(savedTask).maximum);
  const [clause, setClause] = useState(savedTask?.clause ?? initialClauseContent.slice(0, 250));
  const [conditions, setConditions] = useState<FundingCondition[]>(savedTask?.conditions ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [support, setSupport] = useState<FundingSupport>(savedTask?.support ?? { mode: "fixed", amount: "", metric: "", ratio: "", cap: "" });
  const [result, setResult] = useState<FundingResult | null>(savedTask?.result ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const snapshot = (): FundingTask => ({ ...identity, flowVersion: 2, title: clause.trim().slice(0, 30) || "资金测算任务", updatedAt: new Date().toISOString(), clause, conditions, support, result, step, maximum, archived });
  useEffect(() => {
    if (!persistent || archived) return;
    try { saveFundingTask(snapshot()); }
    catch { setMessage("任务保存失败，请检查浏览器存储空间后重试。"); }
  }, [persistent, clause, conditions, support, result, step, maximum, archived]);
  const archiveTask = () => {
    if (!result || archived) return;
    try {
      if (persistent) saveFundingTask({ ...snapshot(), archived: true, step: 2, maximum: 3 });
      setArchived(true); setMaximum(3);
    } catch { setMessage("归档失败，请检查浏览器存储空间后重试。"); }
  };

  const updateConditions = (next: FundingCondition[]) => { setConditions(next); setResult(null); setMaximum(1); };
  const updateCondition = (id: string, patch: Partial<FundingCondition>) => updateConditions(conditions.map(condition => condition.id === id ? { ...condition, ...patch } : condition));
  const updateSupport = (patch: Partial<FundingSupport>) => { setSupport(previous => ({ ...previous, ...patch })); setResult(null); setMaximum(1); };
  const conditionsValid = conditions.length > 0 && conditions.every(isValidCondition);
  const tagGroups = FUNDING_GROUPS.map(group => ({
    ...group,
    conditions: conditions.filter(condition => group.fields.some(field => field.kind === "flag" && field.id === condition.field)),
  })).filter(group => group.conditions.length > 0);

  const parseClause = () => {
    if (!clause.trim() || parsing) return;
    setParsing(true); setMessage("");
    timer.current = setTimeout(() => {
      const parsed = parseFundingConditions(clause);
      updateConditions(parsed);
      setMessage(parsed.length ? `已解析 ${parsed.length} 条目录内条件，请核对数值和比较关系。目录外条件不会参与测算。` : "未识别到可用条件，请从添加条件中选择。仅支持目录内可用指标，数值条件需包含具体数值。");
      setParsing(false); timer.current = null;
    }, 450);
  };
  const runCalculation = () => {
    if (!conditionsValid || !validFundingSupport(support) || calculating) return;
    setCalculating(true); setMessage("");
    timer.current = setTimeout(() => {
      try { setResult(calculateFunding(conditions, support)); setMaximum(2); setStep(2); }
      catch (error) { setMessage(error instanceof Error ? error.message : "测算失败，请重试"); }
      finally { setCalculating(false); timer.current = null; }
    }, 650);
  };

  return <div className="space-y-5">
    <section className="border border-border bg-white px-5 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold">资金测算流程</h1>
        <span className="text-xs font-medium text-muted-foreground">第 {archived || (result && step === 2) ? 3 : step} / {steps.length} 步</span>
      </div>
      <div className="flex justify-between gap-2">
        {steps.map(({ title, icon: Icon }, index) => <div key={title} className="flex min-w-0 flex-1 items-center gap-3">
          <button type="button" disabled={archived || index + 1 > (result ? 3 : maximum) || calculating || parsing} onClick={() => setStep(Math.min(index + 1, 2))} className="flex flex-1 flex-col items-center gap-2 rounded-md p-1 focus-visible:ring-2 focus-visible:ring-primary" aria-current={!archived && (result && step === 2 ? 3 : step) === index + 1 ? "step" : undefined}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${!archived && (result && step === 2 ? 3 : step) === index + 1 ? "border-primary bg-primary text-white" : archived || maximum > index + 1 || (result && index < 2) ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-border text-muted-foreground"}`}>{(archived || maximum > index + 1 || (result && index < 2)) && (archived || (result && step === 2 ? 3 : step) !== index + 1) ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span><span className="text-xs font-medium sm:whitespace-nowrap">{title}</span>
          </button>
          {index < steps.length - 1 && <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />}
        </div>)}
      </div>
    </section>

    {step === 1 && <fieldset disabled={calculating || parsing} className="min-w-0 space-y-7 border border-border bg-white p-5 md:p-7">
      <div className="space-y-4"><Heading>条款内容</Heading>
        <Textarea aria-label="条款内容" placeholder="请输入条款内容" value={clause} maxLength={250} disabled={parsing} onChange={event => { setClause(event.target.value); setMessage(""); }} className="min-h-[96px] bg-white" />
        <div className="flex items-center justify-between"><Button variant={clause.trim() ? "default" : "outline"} className={clause.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted/40 text-muted-foreground"} disabled={!clause.trim() || parsing} onClick={parseClause}>{parsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{parsing ? "智能解析中…" : "智能解析"}</Button><span className="text-xs text-muted-foreground">{clause.length}/250</span></div>
        {message && <p role="status" className="text-xs leading-6 text-muted-foreground">{message}</p>}
      </div>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><Heading>测算条件</Heading><div className="flex gap-2"><Button variant="ghost" className="gap-2 text-primary" disabled={parsing} onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" />添加条件</Button><Button variant="ghost" className="gap-2 text-primary" disabled={!conditions.length || parsing} onClick={() => updateConditions([])}><Trash2 className="h-4 w-4" />清空条件</Button></div></div>
        {conditions.length === 0 ? <div className="flex flex-col items-center px-5 py-8 text-center text-sm font-medium text-[#bfc1c6]">
          <div className="relative mb-2 h-[84px] w-[160px] overflow-hidden" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}funding-empty-reference.png`} alt="" className="absolute left-[-172px] top-[-28px] w-[522px] max-w-none" />
          </div>
          <p>暂无相关测算条件</p>
          <p className="mt-1 leading-7">您可使用事项内容进行智能拆解或手动添加条件</p>
        </div> : <div className="space-y-6">
          {conditions.filter(condition => getFundingField(condition.field)?.kind === "number").map(condition => {
            const field = getFundingField(condition.field)!;
            return <div key={condition.id} className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`condition-${condition.id}`}>{field.label}</label>
              <div className="flex flex-wrap items-center gap-3">
                <select className={`${selectClass} w-full sm:w-[250px]`} aria-label={`修改条件类型：${field.label}`} value={condition.field} disabled={parsing} onChange={event => { const next = makeCondition(event.target.value); updateCondition(condition.id, { field: next.field, value: next.value, operator: next.operator }); }}>{ENABLED_FIELDS.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}</select>
                {field.kind === "number" ? <><select aria-label={`${field.label}比较关系`} className={`${selectClass} w-24`} value={condition.operator} disabled={parsing} onChange={event => updateCondition(condition.id, { operator: event.target.value as Operator })}>{[">", ">=", "=", "<=", "<"].map(operator => <option value={operator} key={operator}>{operator}</option>)}</select><Input id={`condition-${condition.id}`} aria-label={`${field.label}数值`} type="number" min={0} step="any" placeholder="请输入数值" value={condition.value} disabled={parsing} onChange={event => updateCondition(condition.id, { value: event.target.value })} className="w-44" /><span className="text-sm">{field.unit}</span></> : <select id={`condition-${condition.id}`} aria-label={`${field.label}条件值`} className={`${selectClass} w-36`} value={condition.value} disabled={parsing} onChange={event => updateCondition(condition.id, { value: event.target.value })}><option value="true">是</option><option value="false">否</option></select>}
                {field.kind === "number" && <button type="button" title="增加同指标条件" aria-label={`增加${field.label}条件`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary" disabled={parsing} onClick={() => updateConditions([...conditions, makeCondition(field.id)])}><CirclePlus className="h-4 w-4" /></button>}
                <button type="button" title="删除条件" aria-label={`删除${field.label}条件`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary" disabled={parsing} onClick={() => updateConditions(conditions.filter(item => item.id !== condition.id))}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>;
          })}
          {tagGroups.map(group => <div key={`${group.category}-${group.title}`} className="space-y-5 py-2">
            <h3 className="text-sm font-normal">{group.category}-{group.title}</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {group.conditions.map(condition => {
                  const label = `${condition.value === "false" ? "非" : ""}${getFundingField(condition.field)!.label}`;
                  return <span key={condition.id} className="inline-flex max-w-full items-center gap-1 rounded border border-[#d9d9d9] bg-[#fafafa] px-2 py-0.5 text-sm">
                    <span className="min-w-0 break-words">{label}</span>
                    <button type="button" aria-label={`删除${label}标签`} title={`删除${label}`} disabled={parsing} className="shrink-0 rounded text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => updateConditions(conditions.filter(item => item.id !== condition.id))}><X className="h-3.5 w-3.5" /></button>
                  </span>;
                })}
              </div>
              <button type="button" aria-label={`删除${group.category}-${group.title}全部条件`} title="删除该组条件" disabled={parsing} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => updateConditions(conditions.filter(condition => !group.conditions.some(item => item.id === condition.id)))}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>)}
        </div>}
      </div>
      <div className="space-y-6 border-t border-border pt-6">
      <Heading>确定扶持方式</Heading>
      <div role="radiogroup" aria-label="扶持方式" className="flex flex-wrap items-center gap-5 text-sm"><span>扶持方式：</span>{[{ id: "fixed", label: "固定金额" }, { id: "ratio", label: "固定比例" }].map(option => <label key={option.id} className="flex cursor-pointer items-center gap-2"><input className="h-5 w-5 accent-primary" type="radio" name="funding-support" value={option.id} checked={support.mode === option.id} disabled={calculating} onChange={() => updateSupport({ mode: option.id as FundingSupport["mode"] })} />{option.label}</label>)}</div>
      {support.mode === "fixed" ? <div className="flex flex-wrap items-center gap-3"><label htmlFor="funding-amount" className="text-sm"><span className="text-primary">* </span>扶持金额：</label><Input id="funding-amount" type="number" min={0} step="any" placeholder="请输入金额" className="w-44" disabled={calculating} value={support.amount} onChange={event => updateSupport({ amount: event.target.value })} /><span className="ml-3 text-sm">单位：</span><Input aria-label="扶持金额单位" value="万元/每家" readOnly className="w-44 bg-muted/40 text-muted-foreground" /></div> : <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2"><div className="flex flex-wrap items-center gap-3"><label htmlFor="funding-metric" className="text-sm"><span className="text-primary">* </span>依据指标：</label><select id="funding-metric" className={`${selectClass} flex-1`} value={support.metric} disabled={calculating} onChange={event => updateSupport({ metric: event.target.value })}><option value="">请选择依据指标</option>{ENABLED_FIELDS.filter(field => field.unit === "万元").map(field => <option key={field.id} value={field.id}>{field.label}</option>)}</select></div><div className="flex flex-wrap items-center gap-3"><label htmlFor="funding-ratio" className="text-sm"><span className="text-primary">* </span>扶持比例：</label><Input id="funding-ratio" type="number" min={0} max={100} step="any" placeholder="请输入比例" className="min-w-0 flex-1" disabled={calculating} value={support.ratio} onChange={event => updateSupport({ ratio: event.target.value })} /><span>%</span></div></div>
        <div className="flex flex-wrap items-center gap-3"><label htmlFor="funding-cap" className="text-sm">最高：</label><Input id="funding-cap" type="number" min={0} step="any" placeholder="请输入最大值" className="w-44" disabled={calculating} value={support.cap} onChange={event => updateSupport({ cap: event.target.value })} /><Input aria-label="最高扶持金额单位" value="万元/每家" readOnly className="w-44 bg-muted/40 text-muted-foreground" /></div>
      </div>}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      {calculating && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />正在筛选符合条件的企业并汇总扶持金额…</p>}
      </div>
      <div className="border-t border-border pt-5"><Button className="gov-gradient h-11 w-full text-primary-foreground" disabled={!conditionsValid || !validFundingSupport(support) || calculating || parsing} onClick={runCalculation}>{calculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{calculating ? "测算中…" : "开始测算"}</Button></div>
    </fieldset>}

    {step === 2 && result && <><FundingResults result={result} />
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <div className="flex items-center gap-3 border-t border-border px-5 py-5">
        {!archived && <Button className="h-11 shrink-0 px-5" variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-1.5 h-4 w-4" />返回上一步</Button>}
        <Button className={`h-11 flex-1 ${archived ? "border-gray-300 bg-gray-100 text-gray-700 disabled:opacity-100" : "gov-gradient text-primary-foreground hover:opacity-90"}`} variant={archived ? "outline" : "default"} disabled={archived} onClick={archiveTask}>{archived ? "已归档" : "归档"}</Button>
      </div>
    </>}
    {pickerOpen && <ConditionPicker open selected={[...new Set(conditions.map(condition => condition.field))]} onClose={() => setPickerOpen(false)} onConfirm={fields => { updateConditions([...conditions.filter(condition => fields.includes(condition.field)), ...fields.filter(field => !conditions.some(condition => condition.field === field)).map(makeCondition)]); setPickerOpen(false); }} />}
  </div>;
}
