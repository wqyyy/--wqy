import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditPolicyCompareAnalysisTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle: string;
  onConfirm: (title: string) => void;
};

export function EditPolicyCompareAnalysisTaskDialog({
  open,
  onOpenChange,
  initialTitle,
  onConfirm,
}: EditPolicyCompareAnalysisTaskDialogProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) setTitle(initialTitle);
  }, [open, initialTitle]);

  const trimmedTitle = title.trim();
  const isValid = trimmedTitle.length >= 2 && trimmedTitle.length <= 80;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(trimmedTitle);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="policy-compare-analysis-task-title">
            任务名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="policy-compare-analysis-task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="请输入任务名称"
            maxLength={80}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={!isValid}
            className="gov-gradient text-primary-foreground hover:opacity-90"
            onClick={handleConfirm}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
