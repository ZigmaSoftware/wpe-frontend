import { formatNumberInputValue } from "./productionOrderForm";

type MaterialsCalculationSummaryProps = {
  requiredQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  requestQuantity: number;
  amount: number;
  bomDerivedCount: number;
  manualCount: number;
};

const cardClassName = "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3";

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
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Required Qty</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{formatNumberInputValue(requiredQuantity, 3, 3)}</div>
    </div>
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Received</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{formatNumberInputValue(receivedQuantity, 3, 3)}</div>
    </div>
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Remaining</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{formatNumberInputValue(remainingQuantity, 3, 3)}</div>
    </div>
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requested</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{formatNumberInputValue(requestQuantity, 3, 3)}</div>
    </div>
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Material Amount</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{formatNumberInputValue(amount, 2, 2)}</div>
    </div>
    <div className={cardClassName}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rows</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{bomDerivedCount} BOM · {manualCount} Manual</div>
    </div>
  </div>
);

export default MaterialsCalculationSummary;
