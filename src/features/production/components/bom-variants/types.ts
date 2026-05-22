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
  target_weight_grams: "",
  min_weight_grams: "195",
  max_weight_grams: "9205",
  sequence: index,
  is_regrind: false,
  unit: "g",
});

export const isDraftComponentValid = (component: DraftBOMComponent) => {
  const quantity = Number(component.target_weight_grams);
  return Number.isFinite(quantity) && quantity > 0 && component.unit.trim().length > 0;
};
