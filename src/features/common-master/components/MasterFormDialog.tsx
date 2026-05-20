import type { ReactNode } from "react";
import FormPanel from "@/components/erp/FormPanel";
import type { PanelSize } from "@/components/erp/types";

type MasterFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  size?: PanelSize;
};

const MasterFormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: MasterFormDialogProps) => (
  <FormPanel
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description}
    size={size}
    bodyClassName="px-6 py-5"
  >
    {children}
  </FormPanel>
);

export default MasterFormDialog;
