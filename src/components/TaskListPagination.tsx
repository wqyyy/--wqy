import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildVisiblePages,
  TASK_LIST_PAGE_SIZE_OPTIONS,
} from "@/hooks/useTaskListPagination";
import { cn } from "@/lib/utils";

type TaskListPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export function TaskListPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: TaskListPaginationProps) {
  if (totalItems === 0) return null;

  const visiblePages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className={cn("flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between", className)}>
      <p className="text-sm text-muted-foreground">共 {totalItems} 条</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {visiblePages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              type="button"
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className={cn("h-9 w-9", currentPage === page && "gov-gradient text-primary-foreground hover:opacity-90")}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-9 gap-1.5 px-3 text-sm">
              {pageSize} 条/页
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {TASK_LIST_PAGE_SIZE_OPTIONS.map((size) => (
              <DropdownMenuItem key={size} onClick={() => onPageSizeChange(size)}>
                {size} 条/页
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
