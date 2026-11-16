import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useTaskVersionView } from "@/lib/taskVersionView";

function buttonText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(buttonText).join("");
  return React.isValidElement<{ children?: React.ReactNode }>(node) ? buttonText(node.props.children) : "";
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const version = useTaskVersionView();
    const label = props["aria-label"] || props.title || buttonText(props.children);
    const mutation = /生成|重跑|重试|开始|添加|新增|删除|清空|提交|归档|上传|保存|停止|编辑|修改|应用|替换|插入|撤销|重做|评估|审稿|校稿|资金测算/.test(label);
    const blocked = (version.readOnly && ((mutation && !/历史|查看|下载|返回/.test(label)) || (!label && size === "icon"))) || (!version.canRun && /重新生成|重跑|重试|开始.*分析|开始.*测算/.test(label));
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} disabled={props.disabled || blocked} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
