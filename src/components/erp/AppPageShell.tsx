import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const AppPageShell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "space-y-6 rounded-[28px] border border-border/70 bg-gradient-to-b from-white via-white to-slate-50/80 p-5 shadow-sm sm:p-6",
      className,
    )}
  >
    {children}
  </div>
);

export default AppPageShell;
