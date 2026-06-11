import { cn } from "@/lib/utils";
import { GOV_ISSUING_AUTHORITY_DEFAULT } from "@/lib/govReportHeaderHtml";

interface GovRedHeaderBlockProps {
  /** 红头机关名称 */
  issuingAuthority?: string;
  /** 居中公文标题，如「关于《××》的前评估意见」 */
  documentTitle: string;
  className?: string;
}

/**
 * 政策前评估 / 政策评价等报告预览用的「红头」版式：红字机关名 + 双红线 + 黑体标题。
 */
export function GovRedHeaderBlock({
  issuingAuthority = GOV_ISSUING_AUTHORITY_DEFAULT,
  documentTitle,
  className,
}: GovRedHeaderBlockProps) {
  return (
    <div className={cn("bg-white px-4 pt-3 pb-5 text-center", className)}>
      <p
        className="text-[clamp(1.125rem,3.5vw,1.625rem)] font-bold tracking-[0.06em] text-[#c40018]"
        style={{ fontFamily: "SimSun, 'Noto Serif SC', 'Songti SC', serif" }}
      >
        {issuingAuthority}
      </p>
      <div className="mx-auto mt-3 flex w-full max-w-3xl flex-col gap-[3px]">
        <div className="h-[3px] w-full bg-[#c40018]" />
        <div className="h-px w-full bg-[#c40018]" />
      </div>
      <h2 className="mx-auto mt-5 max-w-4xl px-2 text-[clamp(0.95rem,2.2vw,1.125rem)] font-bold leading-snug text-foreground">
        {documentTitle}
      </h2>
    </div>
  );
}
