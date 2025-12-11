import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const styles =
    variant === "outline"
      ? "border border-foreground/30 bg-transparent text-foreground"
      : "bg-foreground text-background";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        styles,
        className,
      )}
      {...props}
    />
  );
}
