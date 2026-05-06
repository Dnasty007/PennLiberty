import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  lightMode?: boolean;
  softenChrome?: boolean;
};

export function GlassCard({
  children,
  className,
  lightMode = false,
  softenChrome = false,
}: GlassCardProps) {
  const baseClasses = lightMode
    ? "border-black/10 bg-white/34 shadow-[0_20px_70px_rgba(12,18,28,0.08)] backdrop-blur-[14px]"
    : softenChrome
      ? "border-white/10 bg-[linear-gradient(180deg,rgba(8,15,26,0.84),rgba(8,15,26,0.74))] shadow-[0_28px_84px_rgba(0,0,0,0.38)] backdrop-blur-[14px]"
      : "border-white/14 bg-[linear-gradient(180deg,rgba(10,18,30,0.62),rgba(10,18,30,0.44))] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[16px] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04)_35%,rgba(255,255,255,0.015)_70%)] before:opacity-70 after:absolute after:inset-px after:rounded-[calc(theme(borderRadius.3xl)-1px)] after:border after:border-white/8 after:opacity-70";

  return (
    <div className={cn("relative overflow-hidden rounded-[30px] border", baseClasses, className)}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
