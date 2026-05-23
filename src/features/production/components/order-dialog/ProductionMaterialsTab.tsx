import { useEffect, useMemo, useRef } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Boxes, Loader2 } from "lucide-react";
import { FormField } from "@/components/ui/form";
import type { ProductTypeSubtypeLookupItem } from "@/features/wpe-masters/types";
import type { BOMVariant } from "@/lib/types";
import { toast } from "@/components/ui/sonner";
import BomVariantSelector from "./BomVariantSelector";
import MaterialComponentsTable from "./MaterialComponentsTable";
import MaterialItemSearch from "./MaterialItemSearch";
import MaterialsCalculationSummary from "./MaterialsCalculationSummary";
import MaterialsSummaryPanel from "./MaterialsSummaryPanel";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  createEmptyMaterialsState,
  createMaterialRowFromBomComponent,
  createMaterialRowFromSubtype,
  getMaterialRowIdentity,
  type ProductionItemOption,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import { useBomComponents } from "./useBomComponents";
import { useBomVariants } from "./useBomVariants";
import { useMaterialCalculations } from "./useMaterialCalculations";
import { productionHelperTextClassName } from "./productionOrderFormStyles";

type ProductionMaterialsTabProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const selectedBomVariantFromList = (variants: BOMVariant[], selectedBomVariantId: number | null) =>
  variants.find((variant) => variant.id === selectedBomVariantId) ?? null;

const materialRowSignature = (row: ProductionOrderFormValues["materials"]["rows"][number]) =>
  [
    row.client_id,
    row.sequence,
    row.source_type,
    row.is_bom_derived ? "1" : "0",
    row.is_manual ? "1" : "0",
    row.bom_variant ?? "",
    row.bom_component ?? "",
    row.item ?? "",
    row.product_subtype ?? "",
  ].join("|");

const haveSameMaterialRowShape = (
  left: ProductionOrderFormValues["materials"]["rows"],
  right: ProductionOrderFormValues["materials"]["rows"],
) =>
  left.length === right.length &&
  left.every((row, index) => materialRowSignature(row) === materialRowSignature(right[index]));

const ProductionMaterialsTab = ({ form }: ProductionMaterialsTabProps) => {
  const finishedGoods = useWatch({ control: form.control, name: "finished_goods" }) as ProductionItemOption | null;
  const planRows = useWatch({ control: form.control, name: "plan_rows" });
  const materialsState = useWatch({ control: form.control, name: "materials" });
  const { append, replace } = useFieldArray({
    control: form.control,
    name: "materials.rows",
  });

  const previousFinishedGoodsId = useRef<number | null>(finishedGoods?.id ?? null);
  const bomVariantId = materialsState.selected_bom_variant_id ? Number(materialsState.selected_bom_variant_id) : null;
  const bomVariantsQuery = useBomVariants(finishedGoods?.id ?? null);
  const bomComponentsQuery = useBomComponents(bomVariantId);
  const calculations = useMaterialCalculations({
    planRows,
    bomMultiplier: materialsState.bom_multiplier,
    rows: materialsState.rows,
  });

  useEffect(() => {
    const currentFinishedGoodsId = finishedGoods?.id ?? null;
    if (previousFinishedGoodsId.current !== currentFinishedGoodsId) {
      form.setValue("materials", createEmptyMaterialsState(), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      previousFinishedGoodsId.current = currentFinishedGoodsId;
    }
  }, [finishedGoods?.id, form]);

  useEffect(() => {
    const currentRows = form.getValues("materials.rows");

    if (!bomVariantId) {
      const manualRows = currentRows.filter((row) => row.is_manual).map((row, index) => ({ ...row, sequence: index + 1 }));
      if (!haveSameMaterialRowShape(currentRows, manualRows)) {
        replace(manualRows);
      }
      return;
    }

    if (!bomComponentsQuery.data) {
      return;
    }

    const selectedVariantId = bomComponentsQuery.data.id;
    const bomRows = bomComponentsQuery.data.components?.map((component, index) => createMaterialRowFromBomComponent(component, index + 1, selectedVariantId)) ?? [];
    const bomIdentities = new Set(bomRows.map((row) => getMaterialRowIdentity(row)));
    const preservedManualRows = currentRows
      .filter((row) => row.is_manual)
      .filter((row) => !bomIdentities.has(getMaterialRowIdentity(row)))
      .map((row, index) => ({
        ...row,
        sequence: bomRows.length + index + 1,
        bom_variant: selectedVariantId,
      }));

    const nextRows = [...bomRows, ...preservedManualRows];
    if (!haveSameMaterialRowShape(currentRows, nextRows)) {
      replace(nextRows);
    }
  }, [bomComponentsQuery.data, bomVariantId, form, replace]);

  const currentBomVariant = useMemo(
    () => selectedBomVariantFromList(bomVariantsQuery.data ?? [], bomVariantId),
    [bomVariantId, bomVariantsQuery.data],
  );

  const handleManualItemAdd = (item: ProductTypeSubtypeLookupItem) => {
    const materialRows = form.getValues("materials.rows");
    const candidateRow = createMaterialRowFromSubtype(item, materialRows.length + 1, bomVariantId);
    const duplicate = materialRows.some((row) => getMaterialRowIdentity(row) === getMaterialRowIdentity(candidateRow));

    if (duplicate) {
      toast.error("This material item is already present in the table.");
      return;
    }

    append(candidateRow);
  };

  const bomVariantFieldError = form.formState.errors.materials?.selected_bom_variant_id?.message;
  const bomMultiplierError = form.formState.errors.materials?.bom_multiplier?.message;

  const emptyState = useMemo(() => {
    if (bomVariantsQuery.isSuccess && (bomVariantsQuery.data?.length ?? 0) === 0) {
      return {
        title: "No BOM variants found",
        description: finishedGoods ? "No BOM variants found for this finished good." : "No BOM variants are available right now.",
      };
    }

    if (bomVariantId && bomComponentsQuery.isSuccess && (bomComponentsQuery.data?.components?.length ?? 0) === 0 && calculations.computedRows.length === 0) {
      return {
        title: "No material components found",
        description: "No material components found for the selected BOM variant.",
      };
    }

    if (calculations.computedRows.length === 0) {
      return {
        title: "No material rows yet",
        description: "Select a BOM variant or add manual material items to start planning.",
      };
    }

    return null;
  }, [bomComponentsQuery.data?.components?.length, bomComponentsQuery.isSuccess, bomVariantId, bomVariantsQuery.data, bomVariantsQuery.isSuccess, calculations.computedRows.length, finishedGoods]);

  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="materials.bom_multiplier"
        render={({ field }) => (
          <MaterialsSummaryPanel
            finishedGoods={finishedGoods}
            productionQty={calculations.productionQty}
            bomMultiplierField={field}
            bomMultiplierError={bomMultiplierError}
          />
        )}
      />

      <ProductionSectionCard
        title="Materials Planning"
        description="Select BOM variant, add manual items, and review material requirements before final order creation."
        tone="violet"
        icon={Boxes}
      >
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <MaterialItemSearch
              onSelect={handleManualItemAdd}
              existingItems={materialsState.rows.map((row) => ({ product_subtype: row.product_subtype, item_code: row.item_code }))}
            />
            <FormField
              control={form.control}
              name="materials.selected_bom_variant_id"
              render={({ field }) => (
                <BomVariantSelector
                  value={field.value}
                  onChange={field.onChange}
                  options={bomVariantsQuery.data ?? []}
                  loading={bomVariantsQuery.isLoading}
                  error={typeof bomVariantFieldError === "string" ? bomVariantFieldError : undefined}
                  relatedProductItemId={finishedGoods?.id ?? null}
                />
              )}
            />
          </div>

          {bomComponentsQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading BOM material components...
            </div>
          ) : null}

          {currentBomVariant ? (
            <div className={productionHelperTextClassName}>
              Selected BOM Variant: <span className="font-medium text-slate-900">{currentBomVariant.variant_code}</span> · {currentBomVariant.name}
            </div>
          ) : null}

          <MaterialsCalculationSummary
            requiredQuantity={calculations.totals.requiredQuantity}
            receivedQuantity={calculations.totals.receivedQuantity}
            remainingQuantity={calculations.totals.remainingQuantity}
            requestQuantity={calculations.totals.requestQuantity}
            amount={calculations.totals.amount}
            bomDerivedCount={calculations.bomDerivedCount}
            manualCount={calculations.manualCount}
          />

          <MaterialComponentsTable form={form} rows={calculations.computedRows} emptyState={emptyState} />
        </div>
      </ProductionSectionCard>
    </div>
  );
};

export default ProductionMaterialsTab;
