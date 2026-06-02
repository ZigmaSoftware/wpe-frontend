import { BarChart3, CheckCircle2, IndianRupee, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { formatNumberInputValue } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionMetricCardClassName,
} from "./productionOrderFormStyles";

type MaterialsCalculationSummaryProps = {
  requiredQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  requestQuantity: number;
  amount: number;
  bomDerivedCount: number;
  manualCount: number;
  completionPercent: number;
};

const MaterialsCalculationSummary = ({
  requiredQuantity,
  receivedQuantity,
  remainingQuantity,
  requestQuantity,
  amount,
  bomDerivedCount,
  manualCount,
  completionPercent,
}: MaterialsCalculationSummaryProps) => {
  const cards = [
    {
      key: "required",
      label: "Required Qty",
      icon: PackageCheck,
      value: formatNumberInputValue(requiredQuantity, 3, 3),
      suffix: "kg",
      detail: null,
      tone: "bg-[#f5f0ff] text-[#8b5cf6]",
    },
    {
      key: "received",
      label: "Received",
      icon: Truck,
      value: formatNumberInputValue(receivedQuantity, 3, 3),
      suffix: "kg",
      detail: null,
      tone: "bg-[#ecfdf5] text-[#16a34a]",
    },
    {
      key: "running",
      label: "Running",
      icon: BarChart3,
      value: formatNumberInputValue(remainingQuantity, 3, 3),
      suffix: "kg",
      detail: null,
      tone: "bg-[#eef4ff] text-[#2563eb]",
    },
    {
      key: "requested",
      label: "Requested",
      icon: ShoppingCart,
      value: formatNumberInputValue(requestQuantity, 3, 3),
      suffix: "kg",
      detail: null,
      tone: "bg-[#fff4eb] text-[#ff6b00]",
    },
    {
      key: "amount",
      label: "Material Amount",
      icon: IndianRupee,
      value: `Rs ${formatNumberInputValue(amount, 2, 2)}`,
      suffix: null,
      detail: null,
      tone: "bg-[#ecfdf5] text-[#16a34a]",
    },
    {
      key: "done",
      label: "Done",
      icon: CheckCircle2,
      value: `${completionPercent.toFixed(2)}%`,
      suffix: null,
      detail: `${bomDerivedCount} BOM · ${manualCount} manual`,
      tone: "bg-[#eef4ff] text-[#2563eb]",
    },
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.key} className={`${productionMetricCardClassName} h-full`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={productionFieldLabelClassName}>{card.label}</div>
                <div className="mt-2 text-[15px] font-semibold text-slate-950">{card.value}</div>
                {card.suffix ? <div className="mt-1 text-[12px] text-slate-400">{card.suffix}</div> : null}
                {card.detail ? <div className="mt-1 text-[12px] text-slate-400">{card.detail}</div> : null}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaterialsCalculationSummary;
