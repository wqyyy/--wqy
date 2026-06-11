import { FileText } from "lucide-react";

type ReferencePolicyTagProps = {
  title: string;
  url?: string;
};

export function ReferencePolicyTag({ title, url }: ReferencePolicyTagProps) {
  const href = url && url !== "#" ? url : undefined;

  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[240px] truncate text-primary hover:underline"
        >
          {title}
        </a>
      ) : (
        <span className="max-w-[240px] truncate">{title}</span>
      )}
    </span>
  );
}
