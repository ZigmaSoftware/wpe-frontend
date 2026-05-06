import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export const LoadingState = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  </div>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
    <div className="mx-auto max-w-md space-y-2">
      <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const ErrorState = ({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
    <div className="mx-auto max-w-md space-y-2">
      <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
