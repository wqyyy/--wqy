import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { generatedDocuments, generatedDocStorageKey } from "@/lib/generatedDocuments";

const categoryColorMap: Record<string, string> = {
  政策草稿: "bg-primary/10 text-primary border-primary/20",
  前评估报告: "bg-blue-50 text-blue-600 border-blue-200",
  政策评价报告: "bg-violet-50 text-violet-600 border-violet-200",
  兑现专报: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function MyDocumentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const doc = useMemo(() => generatedDocuments.find((item) => item.id === id), [id]);

  const [content, setContent] = useState(() => {
    if (!doc) return "";
    try {
      return window.localStorage.getItem(`${generatedDocStorageKey}${doc.id}`) || doc.content;
    } catch {
      return doc.content;
    }
  });

  if (!doc) {
    return (
      <div className="h-full p-6">
        <Card className="mx-auto max-w-5xl p-8 text-center text-muted-foreground">
          文档不存在或已删除。
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/my-documents")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回智能生成成果
          </button>
          <Button
            className="gap-1.5"
            onClick={() => {
              window.localStorage.setItem(`${generatedDocStorageKey}${doc.id}`, content);
            }}
          >
            <Save className="h-4 w-4" />
            保存编辑
          </Button>
        </div>

        <Card className="space-y-4 rounded-3xl border border-border bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{doc.title}</h1>
            <Badge variant="outline" className={categoryColorMap[doc.category]}>
              {doc.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">最近更新：{doc.updatedAt}</p>
          <p className="text-sm leading-7 text-muted-foreground">{doc.summary}</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[520px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-7 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </Card>
      </div>
    </div>
  );
}

