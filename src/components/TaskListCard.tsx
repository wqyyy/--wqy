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
      className="cursor-pointer border border-border p-5 transition-all hover:border-primary/30 hover:shadow-sm"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{title}</h3>
          {status ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className={`text-[10px] ${getTaskStatusBadgeClass(status)}`}>
                {status}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
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
