import { describe, expect, it } from "vitest";
import type { LookupOption } from "@/features/admin-master/types";
import type { ProductionMachine } from "@/lib/types";
import { buildInchargeOptions, mapProductionTypeOptions } from "./ProductionOrderFormView";
import {
  createProductionOrderDefaultValues,
  isMaterialRowConfigured,
  mapOrderDetailToFormValues,
  mergeBomDerivedMaterialRow,
  productionOrderFormSchema,
  toProductionOrderPayload,
} from "./productionOrderForm";

const machineFixture: ProductionMachine = {
  id: 7,
  machine_code: "LN-07",
  name: "Line 7",
  machine_type: "GRANULATOR",
  applicable_stages: "AD,BL",
  is_active: true,
  location: "Unit 1",
  notes: "",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const createUserFixture = (overrides: Partial<LookupOption>): LookupOption => ({
  id: 1,
  name: "User One",
  username: "user1",
  ...overrides,
});

describe("productionOrderForm create flow", () => {
  it("validates the minimum ERP payload and preserves field names", () => {
    const values = createProductionOrderDefaultValues();

    values.production_id = "PROD-001";
    values.production_for = "HSN - 500";
    values.production_type = "Brushing Production";
    values.plan_rows = [{ length_mts: "12.500", qty_mts: "20.000", packets: "4" }];
    values.resources.production_facility = "10";
    values.resources.work_center = "20";
    values.resources.line_machine_id = String(machineFixture.id);
    values.resources.shift_incharge = "30";
    values.materials.bom_multiplier = "2";
    values.details.batch_auto = "BATCH-00000042";
    values.materials.rows = [
      {
        client_id: "manual-1",
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
        is_bom_derived: false,
        is_manual: true,
        bom_variant: null,
        bom_component: null,
        item: 501,
        product_subtype: 99,
        item_code: "RM-001",
        item_name: "Recycle Resin",
        unit: "kg",
        per_unit_quantity: "1.500",
        received_quantity: "10.000",
        request_quantity: "25.000",
        rate: "3.250",
        notes: "",
      },
    ];

    const parsed = productionOrderFormSchema.parse(values);
    const payload = toProductionOrderPayload(parsed, [machineFixture]);

    expect(payload.production_id).toBe("PROD-001");
    expect(payload.production_for).toBe("HSN - 500");
    expect(payload.production_type).toBe(values.production_type);
    expect(payload.status).toBe(values.status);
    expect(payload.planned_quantity).toBe("20.000");
    expect(payload.shift).toBe("Shift 1 (6:00 am - 2:00 pm)");
    expect(payload.line_name).toBe("Line 7");
    expect(payload.line_number).toBe("LN-07");
    expect(payload.batch_number).toBe("BATCH-00000042");
    expect(payload.material_cost).toBe("195.00");
    expect(payload.total_cost).toBe("195.00");
    expect(payload.materials).toEqual([
      expect.objectContaining({
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
        item: 501,
        product_subtype: 99,
        item_code: "RM-001",
        per_unit_quantity: "1.500",
        bom_quantity: "60.000",
        required_quantity: "60.000",
        remaining_quantity: "50.000",
        request_quantity: "25.000",
        amount: "195.00",
      }),
    ]);
  });

  it("defaults stage fields to dash and keeps them optional in the form schema", () => {
    const values = createProductionOrderDefaultValues();

    expect(values.stage).toBe("-");
    expect(values.next_workflow_stage).toBe("-");

    values.production_id = "PROD-002";
    values.production_for = "HSN - 600";
    values.production_type = "WPE Additive Production";
    values.plan_rows = [{ length_mts: "10.000", qty_mts: "5.000", packets: "2" }];
    values.resources.production_facility = "10";
    values.resources.work_center = "20";
    values.resources.shift_incharge = "30";

    expect(() => productionOrderFormSchema.parse(values)).not.toThrow();
  });

  it("includes all lookup users in the shift incharge options", () => {
    const options = buildInchargeOptions([
      createUserFixture({ id: 1, staff_code: "970", name: "Raja", username: "raja" }),
      createUserFixture({ id: 2, staff_code: "971", name: "Operator", username: "operator1" }),
      createUserFixture({ id: 3, name: "", username: "fallback-user" }),
    ]);

    expect(options).toEqual([
      expect.objectContaining({ id: "1", name: "970 - Raja" }),
      expect.objectContaining({ id: "2", name: "971 - Operator" }),
      expect.objectContaining({ id: "3", name: "fallback-user" }),
    ]);
  });

  it("ignores malformed production type lookup rows instead of throwing", () => {
    const options = mapProductionTypeOptions([
      { id: 1, name: "WPE Additive Production" },
      { id: "", name: "Missing ID" },
      { id: 3, name: "" },
      { id: 4, name: "All" },
      { id: null, name: null },
    ] as unknown as LookupItem[]);

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "WPE Additive Production" }),
        expect.objectContaining({ value: "WPE Blend Production" }),
      ]),
    );
    expect(options).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "Missing ID" }),
        expect.objectContaining({ value: "" }),
        expect.objectContaining({ value: "All" }),
      ]),
    );
  });

  it("treats incomplete transient material rows as not configured", () => {
    expect(isMaterialRowConfigured(undefined)).toBe(false);
    expect(isMaterialRowConfigured({ item_code: undefined, item_name: "Wood Powder" })).toBe(false);
    expect(isMaterialRowConfigured({ item_code: "RM-001", item_name: undefined })).toBe(false);
    expect(isMaterialRowConfigured({ item_code: "RM-001", item_name: "Wood Powder" })).toBe(true);
  });

  it("restores saved work center and BOM variant selections from order detail", () => {
    const values = mapOrderDetailToFormValues(
      {
        id: 9,
        production_id: "PROD-009",
        production_for: "HSN - 05",
        production_type: "WPE Additive Production",
        status: "IN_PROGRESS",
        batch_number: "BATCH-00000009",
        production_date: "2026-06-02",
        shift: "Shift 1 (6:00 am - 2:00 pm)",
        planned_quantity: "0.007",
        line_number: "LN-07",
        line_name: "Line 7",
        material_plans: [
          {
            id: 11,
            sequence: 1,
            source_type: "ITEM",
            is_bom_derived: true,
            is_manual: false,
            bom_variant: 77,
            bom_component: 101,
            item: 501,
            item_code: "RM-501",
            item_name: "Material 501",
            unit: "kg",
            per_unit_quantity: "1.000",
            rate: "2.000",
          },
        ],
        extra_form_data: {
          production_facility: "10",
          work_center: "20",
          shift_incharge: "30",
          selected_bom_variant_id: "77",
          bom_multiplier: "3",
        },
      },
      [machineFixture],
    );

    expect(values.resources.work_center).toBe("20");
    expect(values.resources.production_facility).toBe("10");
    expect(values.materials.selected_bom_variant_id).toBe("77");
    expect(values.materials.bom_multiplier).toBe("3");
    expect(values.materials.rows).toHaveLength(1);
  });

  it("preserves a selected item variant when subtype-based BOM rows are rebuilt", () => {
    const mergedRow = mergeBomDerivedMaterialRow(
      {
        client_id: "bom-77-101",
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
        is_bom_derived: true,
        is_manual: false,
        bom_variant: 77,
        bom_component: 101,
        item: null,
        product_subtype: 99,
        item_code: "blending-wood-powder",
        item_name: "Wood Powder",
        unit: "kg",
        per_unit_quantity: "10.000",
        received_quantity: "0",
        request_quantity: "0",
        rate: "0",
        notes: "",
      },
      {
        client_id: "bom-77-101",
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
        is_bom_derived: true,
        is_manual: false,
        bom_variant: 77,
        bom_component: 101,
        item: 501,
        product_subtype: 99,
        item_code: "blending-wood-powder",
        item_name: "Wood Powder",
        unit: "g",
        per_unit_quantity: "10.000",
        received_quantity: "2.500",
        request_quantity: "1.250",
        rate: "3.000",
        notes: "Keep selected variant",
      },
    );

    expect(mergedRow.item).toBe(501);
    expect(mergedRow.unit).toBe("g");
    expect(mergedRow.received_quantity).toBe("2.500");
    expect(mergedRow.request_quantity).toBe("1.250");
    expect(mergedRow.rate).toBe("3.000");
    expect(mergedRow.notes).toBe("Keep selected variant");
  });
});
