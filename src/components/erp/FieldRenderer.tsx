import type { ReactNode } from "react";
import type { FormFieldConfig } from "@/components/erp/types";

const FieldRenderer = ({
  config,
  children,
}: {
  config: FormFieldConfig;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <div className="space-y-1">
      <div className="text-sm font-medium text-foreground">
        {config.label}
        {config.required ? <span className="ml-1 text-destructive">*</span> : null}
      </div>
      {config.description ? <p className="text-xs text-muted-foreground">{config.description}</p> : null}
    </div>
    {children}
  </div>
);

export default FieldRenderer;
