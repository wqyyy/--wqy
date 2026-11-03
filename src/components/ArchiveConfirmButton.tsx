import { Button, type ButtonProps } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type ArchiveConfirmButtonProps = Omit<ButtonProps, "onClick"> & { onConfirm: () => void };

export function ArchiveConfirmButton({ onConfirm, children, ...props }: ArchiveConfirmButtonProps) {
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button type="button" {...props}>{children}</Button></AlertDialogTrigger>
    <AlertDialogContent className="w-[calc(100%-32px)] rounded-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>确认归档</AlertDialogTitle>
        <AlertDialogDescription className="leading-7">归档后，任务中间过程将不可修改，且无法取消归档。请确认是否归档？</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="gov-gradient text-primary-foreground hover:opacity-90">确认归档</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
