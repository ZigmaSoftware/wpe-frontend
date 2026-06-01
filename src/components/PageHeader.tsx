import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <div className="wpe-pagehead">
    <div className="wpe-pagehead-copy">
      {eyebrow ? <div className="wpe-eyebrow">{eyebrow}</div> : null}
      <h1>{title}</h1>
      {description ? <p className="wpe-pagehead-sub">{description}</p> : null}
    </div>
    {actions ? <div className="wpe-pagehead-actions">{actions}</div> : null}
  </div>
);

export default PageHeader;
