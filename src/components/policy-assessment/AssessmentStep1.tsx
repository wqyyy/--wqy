import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle, X, Search, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 已選政策文件 */
export interface AssessmentPolicy {
  id: string;
  title: string;
  source: "upload" | "library";
  content?: string;
}

const LIBRARY_POLICIES = [
  {
    id: "lp-kechuang-main",
    title: "北京经济技术开发区关于进一步激发创新活力 打造高精尖产业主阵地的若干意见",
    updatedAt: "2026-06-12 15:28:36",
  },
  {
    id: "lp-data-industry",
    title: "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施",
    updatedAt: "2026-03-18 16:05:11",
  },
  { id: "lp1", title: "关于促进新一代信息技术产业高质量发展的若干政策措施", updatedAt: "2026-05-22 10:14:08" },
  { id: "lp2", title: "关于支持人工智能产业创新发展的若干措施", updatedAt: "2026-04-16 09:32:41" },
  { id: "lp3", title: "北京经济技术开发区促进高精尖产业发展若干政策", updatedAt: "2026-03-28 17:45:19" },
  { id: "lp4", title: "关于加快推进绿色低碳产业发展的实施意见", updatedAt: "2026-02-14 14:08:55" },
  { id: "lp5", title: "关于进一步优化营商环境的若干措施", updatedAt: "2026-01-30 11:22:33" },
  { id: "lp6", title: "关于招商引资优惠政策的通知", updatedAt: "2025-12-18 16:40:12" },
  { id: "lp7", title: "高层次人才引进与培育专项政策", updatedAt: "2025-11-05 08:55:27" },
  { id: "lp8", title: "中小微企业孵化扶持政策办法", updatedAt: "2025-10-21 13:18:44" },
];

interface Props {
  selected: AssessmentPolicy | null;
  onSelect: (policy: AssessmentPolicy | null) => void;
  onStartAssessment?: () => void;
}

export function AssessmentStep1({ selected, onSelect, onStartAssessment }: Props) {
  const [librarySearch, setLibrarySearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const uploadSelected = selected?.source === "upload";

  const filtered = LIBRARY_POLICIES.filter(
    (policy) => policy.title.includes(librarySearch),
  );

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onSelect({ id: `upload-${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), source: "upload" });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (uploadSelected) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && dropZoneRef.current?.contains(nextTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (uploadSelected) return;
    handleFileChange(event.dataTransfer.files);
  };

  const handleClearSelected = () => {
    if (uploadSelected && fileInputRef.current) fileInputRef.current.value = "";
    onSelect(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">选择待评估政策</h2>
        {onStartAssessment && (
          <Button
            type="button"
            size="sm"
            className="gov-gradient px-5 text-primary-foreground hover:opacity-90"
            disabled={!selected}
            onClick={onStartAssessment}
          >
            开始评估
          </Button>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3"
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{selected.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selected.source === "upload" ? "已上传，可删除后重新上传" : "来自政策起草库"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelected}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className={`space-y-3 transition-opacity ${uploadSelected ? "opacity-45" : ""}`}>
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-xl border bg-background transition-all",
              isDragging
                ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20"
                : "border-border hover:border-primary/25",
              uploadSelected && "pointer-events-none",
            )}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadSelected}
                className="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Paperclip className="h-3.5 w-3.5" />
                本地上传文件
              </button>
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="搜索起草库中的政策，或将文件拖拽到此处上传，上传格式为docx文件"
                disabled={uploadSelected}
                className="h-11 w-full rounded-xl bg-transparent pl-[7.5rem] pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/30"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </div>

            {isDragging && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-primary/[0.06]">
                <p className="text-sm font-medium text-primary">松开鼠标即可上传文件</p>
              </div>
            )}
          </div>
          <div className="max-h-[320px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无匹配政策</p>
            ) : (
              filtered.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => {
                    if (!uploadSelected) onSelect({ id: policy.id, title: policy.title, source: "library" });
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    uploadSelected ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"
                  } ${
                    selected?.id === policy.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selected?.id === policy.id ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {selected?.id === policy.id && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5L4.5 7.5L8 3"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{policy.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {policy.updatedAt}
                  </span>
                </div>
              ))
            )}
          </div>
      </section>
    </div>
  );
}
