import { useMemo } from "react";
import {
  computeMaterialRow,
  getProductionQuantity,
  parseNumericInput,
  type ProductionMaterialComputedRow,
  type ProductionOrderFormValues,
} from "./productionOrderForm";

type UseMaterialCalculationsArgs = {
  planRows: ProductionOrderFormValues["plan_rows"];
  bomMultiplier: string;
  rows: ProductionOrderFormValues["materials"]["rows"];
};

export const useMaterialCalculations = ({ planRows, bomMultiplier, rows }: UseMaterialCalculationsArgs) =>
  useMemo(() => {
    const productionQty = getProductionQuantity(planRows);
    const parsedBomMultiplier = parseNumericInput(bomMultiplier) || 1;
    const computedRows = rows.map((row) => computeMaterialRow(row, productionQty, parsedBomMultiplier));
    const totals = computedRows.reduce(
      (accumulator, row) => ({
        requiredQuantity: accumulator.requiredQuantity + row.required_quantity,
        receivedQuantity: accumulator.receivedQuantity + parseNumericInput(row.received_quantity),
        remainingQuantity: accumulator.remainingQuantity + row.remaining_quantity,
        requestQuantity: accumulator.requestQuantity + parseNumericInput(row.request_quantity),
        amount: accumulator.amount + row.amount,
      }),
      {
        requiredQuantity: 0,
        receivedQuantity: 0,
        remainingQuantity: 0,
        requestQuantity: 0,
        amount: 0,
      },
    );

    return {
      productionQty,
      bomMultiplier: parsedBomMultiplier,
      computedRows,
      totals,
      bomDerivedCount: computedRows.filter((row) => row.is_bom_derived).length,
      manualCount: computedRows.filter((row) => row.is_manual).length,
    };
  }, [bomMultiplier, planRows, rows]);

export type UseMaterialCalculationsResult = {
  productionQty: number;
  bomMultiplier: number;
  computedRows: ProductionMaterialComputedRow[];
  totals: {
    requiredQuantity: number;
    receivedQuantity: number;
    remainingQuantity: number;
    requestQuantity: number;
    amount: number;
  };
  bomDerivedCount: number;
  manualCount: number;
};
