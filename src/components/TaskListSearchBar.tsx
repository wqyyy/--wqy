import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TaskListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  placeholder: string;
  extraActions?: ReactNode;
};

export function TaskListSearchBar({
  value,
  onChange,
  onSearch,
  onReset,
  placeholder,
  extraActions,
}: TaskListSearchBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[280px] max-w-full shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder={placeholder}
            className="h-9 pl-9"
          />
        </div>
        <Button variant="outline" className="h-9 px-4" onClick={onReset}>
          重置
        </Button>
        <Button className="h-9 px-4 gov-gradient text-primary-foreground hover:opacity-90" onClick={onSearch}>
          查询
        </Button>
      </div>
      {extraActions ? <div className="flex shrink-0 items-center">{extraActions}</div> : null}
    </div>
  );
}
