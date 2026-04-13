import { CalendarDays, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/PageHero";
import { generatedDocuments, generatedDocStorageKey } from "@/lib/generatedDocuments";

const statusColorMap: Record<string, string> = {
  编辑中: "bg-amber-50 text-amber-600 border-amber-200",
  已完成: "bg-emerald-50 text-emerald-600 border-emerald-200",
  已归档: "bg-slate-50 text-slate-600 border-slate-200",
};

const categoryColorMap: Record<string, string> = {
  政策草稿: "bg-primary/10 text-primary border-primary/20",
  前评估报告: "bg-blue-50 text-blue-600 border-blue-200",
  政策评价报告: "bg-violet-50 text-violet-600 border-violet-200",
  兑现专报: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function MyDocuments() {
  const navigate = useNavigate();
  const getSavedContent = (id: string, fallback: string) => {
    try {
      return window.localStorage.getItem(`${generatedDocStorageKey}${id}`) || fallback;
    } catch {
      return fallback;
    }
  };

  const handleOpen = (item: (typeof generatedDocuments)[number]) => {
    if (item.category === "政策草稿") {
      navigate("/policy-writing/drafting", {
        state: {
          initialTitle: item.title,
          policyTitle: item.title,
          directContent: getSavedContent(item.id, item.content),
        },
      });
      return;
    }

    if (item.category === "前评估报告") {
      navigate("/policy-writing/pre-evaluation", {
        state: {
          directOpenFinal: true,
          policyTitle: item.title,
        },
      });
      return;
    }

    if (item.category === "政策评价报告") {
      navigate(`/policy-analysis?policy=${encodeURIComponent(item.title)}&directFinal=1`);
      return;
    }

    navigate(`/my-documents/${item.id}`);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero title="智能生成成果" description="集中查看政策草稿、分析报告、数据专报与历史AI输出成果。"/>

        <div className="grid gap-4">
          {generatedDocuments.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="cursor-pointer rounded-3xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.09)]"
                onClick={() => handleOpen(item)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                      <Badge variant="outline" className={categoryColorMap[item.category]}>
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className={statusColorMap[item.status]}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-4 w-4" />
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        最近更新：{item.updatedAt}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.summary}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
