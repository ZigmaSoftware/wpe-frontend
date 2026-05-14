import type { ReactNode } from "react";

const PageSection = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-1">
      <h3 className="text-sm font-semibold tracking-wide text-foreground">{title}</h3>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
    {children}
  </section>
);

export default PageSection;
