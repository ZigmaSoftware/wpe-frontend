import type { ReactNode } from "react";

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-1">
      <h3 className="text-sm font-semibold tracking-[0.02em] text-foreground">{title}</h3>
      {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
    {children}
  </section>
);

export default SectionCard;
