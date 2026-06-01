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
};

const MaterialsCalculationSummary = ({
  requiredQuantity,
  receivedQuantity,
  remainingQuantity,
  requestQuantity,
  amount,
  bomDerivedCount,
  manualCount,
}: MaterialsCalculationSummaryProps) => (
  <div className="grid gap-3 xl:grid-cols-6">
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Required Qty</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{formatNumberInputValue(requiredQuantity, 3, 3)}</div>
    </div>
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Received</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{formatNumberInputValue(receivedQuantity, 3, 3)}</div>
    </div>
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Running</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{formatNumberInputValue(remainingQuantity, 3, 3)}</div>
    </div>
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Requested</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{formatNumberInputValue(requestQuantity, 3, 3)}</div>
    </div>
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Material Amount</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{formatNumberInputValue(amount, 2, 2)}</div>
    </div>
    <div className={productionMetricCardClassName}>
      <div className={productionFieldLabelClassName}>Done</div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{bomDerivedCount} BOM-S · {manualCount} Manual</div>
    </div>
  </div>
);

export default MaterialsCalculationSummary;
