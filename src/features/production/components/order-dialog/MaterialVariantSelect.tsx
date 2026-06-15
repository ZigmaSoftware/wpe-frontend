import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { ProductionMaterialComputedRow, ProductionOrderFormValues } from "./productionOrderForm";

const NO_ITEM_VARIANT_VALUE = "__none__";

type MaterialVariantSelectProps = {
  index: number;
  row: ProductionMaterialComputedRow;
  form: UseFormReturn<ProductionOrderFormValues>;
};

const MaterialVariantSelect = ({ index, row, form }: MaterialVariantSelectProps) => {
  const subtypeId = row.product_subtype;
  const variantsQuery = useQuery({
    queryKey: ["production-material-item-variants", subtypeId ?? "none"],
    queryFn: async () => {
      const response = await wpeMastersApi.itemVariants.list({
        page: 1,
        pageSize: 200,
        ordering: "item_name",
        is_active: true,
        sub_category_id: subtypeId ?? undefined,
      });
      return response.items;
    },
    enabled: Boolean(subtypeId),
    staleTime: 5 * 60 * 1000,
  });

  const selectedValue = useMemo(() => {
    if (!row.item) {
      return NO_ITEM_VARIANT_VALUE;
    }

    return (variantsQuery.data ?? []).some((variant) => variant.id === row.item)
      ? String(row.item)
      : NO_ITEM_VARIANT_VALUE;
  }, [row.item, variantsQuery.data]);

  if (!subtypeId) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Item Variant</div>
      <Select
        value={selectedValue}
        onValueChange={(value) => {
          const selectedVariant = (variantsQuery.data ?? []).find((variant) => String(variant.id) === value) ?? null;

          form.setValue(`materials.rows.${index}.item`, selectedVariant?.id ?? null, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
          form.setValue(`materials.rows.${index}.unit`, selectedVariant?.uom_code?.trim() || row.unit || "g", {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      >
        <SelectTrigger
          className="h-9 rounded-xl border-slate-200/90 bg-white px-3 text-left text-[13px] text-slate-950 shadow-[0_6px_14px_-12px_rgba(15,23,42,0.22)] focus:ring-[#2563eb]/20"
          aria-label={`Item variant for ${row.item_name}`}
        >
          <SelectValue placeholder={variantsQuery.isLoading ? "Loading variants..." : "-"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ITEM_VARIANT_VALUE}>-</SelectItem>
          {(variantsQuery.data ?? []).map((variant) => (
            <SelectItem key={variant.id} value={String(variant.id)}>
              {variant.item_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MaterialVariantSelect;
