import { BookOpen, ChevronLeft, ArrowUpRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PolicyDictionaryEntries } from "@/components/PolicyDictionaryEntries";
import type { DictionaryKind } from "@/lib/policyDictionary";
import { PageHero } from "@/components/PageHero";

type DictionaryItem = {
  id: DictionaryKind;
  name: string;
  description: string;
};

const dictionaryItems: DictionaryItem[] = [
  {
    id: "synonym",
    name: "同/近义词词典",
    description:
      "将政策文件中含义相同或相近的不同词语设为同义词，帮助模型更准确地理解语义，避免因表述差异而遗漏相关内容。例如：“北京”=“首都”。",
  },
  {
    id: "professional",
    name: "专业词汇释义词典",
    description:
      "为政策文件中的专业术语提供自然语言解释，使模型能够掌握精准含义进行推理，而非仅字面理解。",
  },
  {
    id: "sensitive",
    name: "敏感词/禁止词词典",
    description:
      "在政策文本生成或编辑时使用，系统识别并标注敏感词或禁止词，提醒用户修改，确保内容合规。",
  },
  {
    id: "fixed",
    name: "固定表述",
    description:
      "维护政府公文规范表述，如将过时称谓（旧称）替换为当前官方认可的表述（新称），保持信息准确与时效。",
  },
  {
    id: "abbreviation",
    name: "缩略词词典",
    description: "对缩略语进行解释与补全，帮助大模型更好地理解政策中的缩略语。",
  },
];

export default function PolicyDictionary() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selected = dictionaryItems.find(item => item.id === params.get("dictionary"));
  const covers = ["#a72f42", "#286e64", "#425e85", "#8a6237", "#62547c"];

  if (selected) return <PolicyDictionaryEntries key={selected.id} kind={selected.id} title={selected.name} onBack={() => setParams({})} />;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] space-y-4 p-5 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/policy-writing")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          返回政策制定
        </button>

        <PageHero
          title="政策词典"
          className="[&_p]:max-w-none"
          description="统一管理政策同近义词、专业词汇释义、敏感词与禁止词、固定表述及缩略词，为政策起草、语义理解和文本校验提供词汇参考。公共词典提供规范用语，个人词典支持自主新增、编辑和删除，沉淀专属政策用语。"
        />
        <header className="flex items-center justify-between border-b border-border pb-5 pt-2">
          <h2 className="text-base font-semibold">词典目录</h2>
          <span className="text-sm text-muted-foreground">共 {dictionaryItems.length} 本</span>
        </header>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dictionaryItems.map((item, index) => (
            <article key={item.id} className="min-w-0">
              <button type="button" aria-label={`查看${item.name}`} onClick={() => setParams({ dictionary: item.id })} className="group block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
                <div className="relative mx-auto w-full max-w-[240px] pb-3 pr-2 transition-transform duration-200 group-hover:-translate-y-1 group-active:translate-y-0">
                  <div aria-hidden="true" className="absolute inset-x-1 bottom-0 top-3 rounded-r border border-[#d6d5d1] bg-[#f2f2ef] shadow-[4px_7px_12px_#00000012]" />
                  <div aria-hidden="true" className="absolute bottom-1 left-3 right-1 h-1 border-y border-[#d9d8d3] bg-white" />
                  <div style={{ backgroundColor: covers[index] }} className="relative flex aspect-[4/5] flex-col overflow-hidden rounded-r-[5px] rounded-l-sm px-7 py-7 text-white shadow-[2px_3px_5px_#00000018]">
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-3 border-r border-white/15 bg-black/20" />
                    <span aria-hidden="true" className="absolute inset-y-0 left-4 border-l border-white/15" />
                    <div className="flex items-center justify-between text-white/70"><BookOpen className="h-6 w-6" /><span className="text-xs tabular-nums">0{index + 1}</span></div>
                    <div className="mt-7 flex-1 border-t border-white/30 pt-5"><h2 className="break-words text-xl font-semibold leading-relaxed">{item.name}</h2></div>
                    <div className="flex items-center justify-between border-t border-white/25 pt-3 text-xs text-white/80"><span>政策词典</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
                  </div>
                </div>
              </button>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
