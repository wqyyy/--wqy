import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OriginalSourceButton({ url }: { url?: string }) {
  const className = "inline-flex h-6 gap-1 border-primary/40 bg-primary/5 px-2 py-0 text-xs text-primary hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary disabled:border-primary/20 disabled:bg-primary/5 disabled:text-primary/40 disabled:opacity-100";
  return <div className="mt-1 flex w-full justify-start">{url?.startsWith("https://") ? <Button asChild variant="outline" size="sm" className={className}><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />查看原文</a></Button> : <Button variant="outline" size="sm" className={className} disabled title="暂无已核验的原文地址">查看原文</Button>}</div>;
}
