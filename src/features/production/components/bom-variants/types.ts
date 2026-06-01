import type { BOMVariantComponent } from "@/lib/types";
import type { ProductTypeSubtypeLookupItem } from "@/features/wpe-masters/types";

export type ComponentSearchOption = ProductTypeSubtypeLookupItem;

export type DraftBOMComponent = BOMVariantComponent & {
  client_id: string;
};

export const toDraftBOMComponent = (
  component: BOMVariantComponent,
  index: number,
): DraftBOMComponent => ({
  ...component,
  client_id: `component-${component.id}-${component.product_subtype ?? component.item ?? index}`,
});

export const createDraftComponentFromSubtype = (
  subtype: ComponentSearchOption,
  index: number,
): DraftBOMComponent => ({
  client_id: `component-subtype-${subtype.id}-${index}`,
  id: 0,
  item: null,
  product_subtype: subtype.id,
  source_type: "PRODUCT_SUBTYPE",
  item_code: subtype.code,
  item_name: subtype.name,
  category: subtype.category_name,
  is_active: true,
  source_active: true,
  target_weight_grams: "",
  min_weight_grams: "",
  max_weight_grams: "",
  sequence: index,
  is_regrind: false,
  unit: "g",
});

export const isDraftComponentValid = (component: DraftBOMComponent) => {
  const standardWeight = Number(component.target_weight_grams);
  const minimumWeight = Number(component.min_weight_grams);
  const maximumWeight = Number(component.max_weight_grams);

  return (
    Number.isFinite(standardWeight) &&
    standardWeight > 0 &&
    Number.isFinite(minimumWeight) &&
    minimumWeight >= 0 &&
    Number.isFinite(maximumWeight) &&
    maximumWeight >= 0 &&
    minimumWeight <= standardWeight &&
    maximumWeight >= standardWeight &&
    minimumWeight <= maximumWeight &&
    component.unit.trim().length > 0
  );
};
