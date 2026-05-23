import { describe, expect, it } from "vitest";
import type { ProductionMachine } from "@/lib/types";
import {
  createProductionOrderDefaultValues,
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

describe("productionOrderForm create flow", () => {
  it("validates the minimum ERP payload and preserves field names", () => {
    const values = createProductionOrderDefaultValues();

    values.production_id = "PROD-001";
    values.plan_rows = [{ length_mts: "12.500", qty_mts: "20.000", packets: "4" }];
    values.resources.production_facility = "10";
    values.resources.work_center = "20";
    values.resources.line_machine_id = String(machineFixture.id);
    values.resources.shift_incharge = "30";
    values.materials.bom_multiplier = "2";
    values.materials.rows = [
      {
        client_id: "manual-1",
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
        is_bom_derived: false,
        is_manual: true,
        bom_variant: null,
        bom_component: null,
        item: null,
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
    expect(payload.production_type).toBe(values.production_type);
    expect(payload.status).toBe(values.status);
    expect(payload.planned_quantity).toBe("20.000");
    expect(payload.shift).toBe("Shift 1 (6:00 am - 2:00 pm)");
    expect(payload.line_name).toBe("Line 7");
    expect(payload.line_number).toBe("LN-07");
    expect(payload.material_cost).toBe("195.00");
    expect(payload.total_cost).toBe("195.00");
    expect(payload.materials).toEqual([
      expect.objectContaining({
        sequence: 1,
        source_type: "PRODUCT_SUBTYPE",
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
});
