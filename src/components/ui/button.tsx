import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pl-gold/80 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-pl-gold text-pl-navy shadow-cta hover:bg-pl-gold-hover",
        outline:
          "rounded-full border border-current/20 bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        secondary:
          "rounded-full border border-pl-gold/40 bg-pl-gold/10 text-pl-navy hover:bg-pl-gold/18",
        ghost: "rounded-full bg-transparent hover:bg-black/[0.05]",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        cta: "min-h-12 px-8 py-6 text-[15px] md:text-base",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
