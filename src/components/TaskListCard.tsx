import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTaskStatusBadgeClass } from "@/lib/taskStatusBadgeClass";
import { cn } from "@/lib/utils";

type TaskListCardProps = {
  title: string;
  status?: string;
  icon: LucideIcon;
  createdAt: string;
  updatedAt: string;
  onOpen: () => void;
  actions?: ReactNode;
};

export function TaskListCard({
  title,
  status,
  icon: Icon,
  createdAt,
  updatedAt,
  onOpen,
  actions,
}: TaskListCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="cursor-pointer border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{title}</h3>
            {status ? (
              <Badge variant="outline" className={`shrink-0 text-[10px] ${getTaskStatusBadgeClass(status)}`}>
                {status}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-0.5 text-xs text-muted-foreground">
          <p>创建时间：{createdAt}</p>
          <p>修改时间：{updatedAt}</p>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">{actions}</div>
        ) : null}
      </div>
    </Card>
  );
}

type TaskListIconButtonProps = {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  destructive?: boolean;
  children: ReactNode;
};

export function TaskListIconButton({
  label,
  onClick,
  disabled = false,
  destructive = false,
  children,
}: TaskListIconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md p-1.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : destructive
            ? "hover:bg-muted hover:text-destructive"
            : "hover:bg-muted hover:text-foreground",
      )}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
