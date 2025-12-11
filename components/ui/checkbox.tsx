import * as React from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-foreground/60 bg-white text-black transition focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0",
          "accent-black",
          className,
        )}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";
