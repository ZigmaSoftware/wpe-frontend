import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import ProductionFormSection from "./ProductionFormSection";

type ProductionSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "amber" | "blue" | "violet" | "slate" | "gold" | "emerald";
  icon?: LucideIcon;
};

const ProductionSectionCard = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  tone: _tone = "slate",
  icon: Icon,
}: ProductionSectionCardProps) => (
  <ProductionFormSection
    title={title}
    description={description}
    action={action}
    icon={Icon}
    className={className}
    contentClassName={contentClassName}
  >
    {children}
  </ProductionFormSection>
);

export default ProductionSectionCard;
