import { z } from "zod";
import type { GrnRecord } from "@/lib/types";

export const grnItemSchema = z.object({
  item_id: z.string().default(""),
  item_serial_number: z.string().default(""),
  product_description: z.string().default(""),
  hsn_code: z.string().default(""),
  total_quantity: z.string().default(""),
  quantity: z.string().default(""),
  free_quantity: z.string().default(""),
  accepted_qty: z.string().default(""),
  rejected_qty: z.string().default(""),
  unit: z.string().default(""),
  unit_price: z.string().default(""),
  total_amount: z.string().default(""),
  discount: z.string().default(""),
  assessable_value: z.string().default(""),
  gst_rate: z.string().default(""),
  igst_amount: z.string().default(""),
  cgst_amount: z.string().default(""),
  sgst_amount: z.string().default(""),
  total_item_value: z.string().default(""),
});

export const grnSchema = z.object({
  document_details: z.object({
    po_no: z.string().default(""),
    po_date: z.string().default(""),
    grn_no: z.string().min(1, "GRN number is required."),
    grn_date: z.string().default(""),
    supplier_invoice_no: z.string().default(""),
    supplier_invoice_date: z.string().default(""),
    gateentry_bookno: z.string().default(""),
    gateentry_bookdate: z.string().default(""),
    tolerance: z.string().default(""),
  }),
  document_requirement_details: z.object({
    req_date: z.string().default(""),
    req_person_name: z.string().default(""),
    req_person_id: z.string().default(""),
    req_department: z.string().default(""),
    req_reason: z.string().default(""),
  }),
  supplier_details: z.object({
    supplier_id: z.string().default(""),
    gstin: z.string().default(""),
    contact_name: z.string().default(""),
    trade_name: z.string().default(""),
    contact_type: z.string().default(""),
    address1: z.string().default(""),
    address2: z.string().default(""),
    location: z.string().default(""),
    pincode: z.string().default(""),
    state_name: z.string().default(""),
    state_code: z.string().default(""),
    country: z.string().default(""),
    person_name: z.string().default(""),
    phone_number: z.string().default(""),
    email: z.string().default(""),
    category: z.string().default(""),
    segment: z.string().default(""),
    sub_segment: z.string().default(""),
    sales_contact_id: z.string().default(""),
    currency: z.string().default(""),
  }),
  items: z.array(grnItemSchema).min(1),
  value_details: z.object({
    freight_charge: z.string().default(""),
    loading_unloading_charge: z.string().default(""),
    total_before_tax: z.string().default(""),
    total_tax_amount: z.string().default(""),
    total_after_tax: z.string().default(""),
  }),
});

export type GrnFormValues = z.infer<typeof grnSchema>;

export type GrnUpdateResponse = {
  status: string;
  message: string;
  data: GrnRecord;
};

export type GrnFieldKind = "text" | "date" | "textarea";

export type GrnFieldConfig<TName extends string> = {
  name: TName;
  label: string;
  kind?: GrnFieldKind;
  fullWidth?: boolean;
  helperText?: string;
};

export const defaultItem: GrnFormValues["items"][number] = {
  item_id: "",
  item_serial_number: "",
  product_description: "",
  hsn_code: "",
  total_quantity: "",
  quantity: "",
  free_quantity: "",
  accepted_qty: "",
  rejected_qty: "",
  unit: "",
  unit_price: "",
  total_amount: "",
  discount: "",
  assessable_value: "",
  gst_rate: "",
  igst_amount: "",
  cgst_amount: "",
  sgst_amount: "",
  total_item_value: "",
};

export const defaultGrnValues: GrnFormValues = {
  document_details: {
    po_no: "",
    po_date: "",
    grn_no: "",
    grn_date: "",
    supplier_invoice_no: "",
    supplier_invoice_date: "",
    gateentry_bookno: "",
    gateentry_bookdate: "",
    tolerance: "",
  },
  document_requirement_details: {
    req_date: "",
    req_person_name: "",
    req_person_id: "",
    req_department: "",
    req_reason: "",
  },
  supplier_details: {
    supplier_id: "",
    gstin: "",
    contact_name: "",
    trade_name: "",
    contact_type: "",
    address1: "",
    address2: "",
    location: "",
    pincode: "",
    state_name: "",
    state_code: "",
    country: "",
    person_name: "",
    phone_number: "",
    email: "",
    category: "",
    segment: "",
    sub_segment: "",
    sales_contact_id: "",
    currency: "",
  },
  items: [defaultItem],
  value_details: {
    freight_charge: "",
    loading_unloading_charge: "",
    total_before_tax: "",
    total_tax_amount: "",
    total_after_tax: "",
  },
};

export const documentFieldConfigs: Array<
  GrnFieldConfig<keyof GrnFormValues["document_details"]>
> = [
  { name: "po_no", label: "PO No" },
  { name: "po_date", label: "PO Date", kind: "date" },
  { name: "grn_no", label: "GRN No" },
  { name: "grn_date", label: "GRN Date", kind: "date" },
  { name: "supplier_invoice_no", label: "Supplier Invoice No" },
  { name: "supplier_invoice_date", label: "Supplier Invoice Date", kind: "date" },
  { name: "gateentry_bookno", label: "Gate Entry Book No" },
  { name: "gateentry_bookdate", label: "Gate Entry Book Date", kind: "date" },
  { name: "tolerance", label: "Tolerance" },
];

export const requirementFieldConfigs: Array<
  GrnFieldConfig<keyof GrnFormValues["document_requirement_details"]>
> = [
  { name: "req_date", label: "Request Date", kind: "date" },
  { name: "req_person_name", label: "Request Person Name" },
  { name: "req_person_id", label: "Request Person ID" },
  { name: "req_department", label: "Request Department" },
  { name: "req_reason", label: "Request Reason", kind: "textarea", fullWidth: true },
];

export const supplierFieldConfigs: Array<
  GrnFieldConfig<keyof GrnFormValues["supplier_details"]>
> = [
  { name: "supplier_id", label: "Supplier ID" },
  { name: "gstin", label: "GSTIN" },
  { name: "contact_name", label: "Contact Name" },
  { name: "trade_name", label: "Trade Name" },
  { name: "contact_type", label: "Contact Type" },
  { name: "address1", label: "Address Line 1", kind: "textarea", fullWidth: true },
  { name: "address2", label: "Address Line 2", kind: "textarea", fullWidth: true },
  { name: "location", label: "Location" },
  { name: "pincode", label: "Pincode" },
  { name: "state_name", label: "State Name" },
  { name: "state_code", label: "State Code" },
  { name: "country", label: "Country" },
  { name: "person_name", label: "Person Name" },
  { name: "phone_number", label: "Phone Number" },
  { name: "email", label: "Email" },
  { name: "category", label: "Category" },
  { name: "segment", label: "Segment" },
  { name: "sub_segment", label: "Sub Segment" },
  { name: "sales_contact_id", label: "Sales Contact ID" },
  { name: "currency", label: "Currency" },
];

export const itemFieldConfigs: Array<GrnFieldConfig<keyof GrnFormValues["items"][number]>> = [
  { name: "item_id", label: "Item ID" },
  { name: "item_serial_number", label: "Serial Number" },
  { name: "product_description", label: "Product Description", kind: "textarea", fullWidth: true },
  { name: "hsn_code", label: "HSN Code" },
  { name: "total_quantity", label: "Total Quantity" },
  { name: "quantity", label: "Quantity" },
  { name: "free_quantity", label: "Free Quantity" },
  { name: "accepted_qty", label: "Accepted Quantity" },
  { name: "rejected_qty", label: "Rejected Quantity" },
  { name: "unit", label: "Unit" },
  { name: "unit_price", label: "Unit Price" },
  { name: "total_amount", label: "Total Amount" },
  { name: "discount", label: "Discount" },
  { name: "assessable_value", label: "Assessable Value" },
  { name: "gst_rate", label: "GST Rate" },
  { name: "igst_amount", label: "IGST Amount" },
  { name: "cgst_amount", label: "CGST Amount" },
  { name: "sgst_amount", label: "SGST Amount" },
  { name: "total_item_value", label: "Total Item Value" },
];

export const valueFieldConfigs: Array<
  GrnFieldConfig<keyof GrnFormValues["value_details"]>
> = [
  { name: "freight_charge", label: "Freight Charge" },
  { name: "loading_unloading_charge", label: "Loading / Unloading Charge" },
  { name: "total_before_tax", label: "Total Before Tax" },
  { name: "total_tax_amount", label: "Total Tax Amount" },
  { name: "total_after_tax", label: "Total After Tax" },
];

export const grnFormTabs = [
  { value: "document", label: "Document" },
  { value: "requirement", label: "Requirement" },
  { value: "supplier", label: "Supplier" },
  { value: "items", label: "Items" },
  { value: "totals", label: "Totals" },
] as const;

export type GrnFormTab = (typeof grnFormTabs)[number]["value"];

export const toFormString = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

export const readValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

export const getPrimaryItemQuantity = (record: GrnRecord) =>
  record.items?.[0]?.quantity ?? record.items?.[0]?.total_quantity ?? null;

export const getGrnDepartment = (record: GrnRecord) =>
  record.document_requirement_details.req_department?.trim() || "Unassigned";

export const formatSupplierName = (record: GrnRecord) =>
  record.supplier_details.trade_name || record.trade_name || "-";

export const buildSupplierAddress = (record: GrnRecord) =>
  [
    record.supplier_details.address1,
    record.supplier_details.address2,
    record.supplier_details.location,
    record.supplier_details.state_name,
    record.supplier_details.pincode,
    record.supplier_details.country,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

export const mapRecordToFormValues = (record: GrnRecord): GrnFormValues => ({
  document_details: {
    po_no: toFormString(record.document_details.po_no),
    po_date: toFormString(record.document_details.po_date),
    grn_no: toFormString(record.document_details.grn_no || record.grn_no),
    grn_date: toFormString(record.document_details.grn_date || record.grn_date),
    supplier_invoice_no: toFormString(record.document_details.supplier_invoice_no),
    supplier_invoice_date: toFormString(record.document_details.supplier_invoice_date),
    gateentry_bookno: toFormString(record.document_details.gateentry_bookno),
    gateentry_bookdate: toFormString(record.document_details.gateentry_bookdate),
    tolerance: toFormString(record.document_details.tolerance),
  },
  document_requirement_details: {
    req_date: toFormString(record.document_requirement_details.req_date),
    req_person_name: toFormString(record.document_requirement_details.req_person_name),
    req_person_id: toFormString(record.document_requirement_details.req_person_id),
    req_department: toFormString(record.document_requirement_details.req_department),
    req_reason: toFormString(record.document_requirement_details.req_reason),
  },
  supplier_details: {
    supplier_id: toFormString(record.supplier_details.supplier_id || record.supplier_id),
    gstin: toFormString(record.supplier_details.gstin),
    contact_name: toFormString(record.supplier_details.contact_name),
    trade_name: toFormString(record.supplier_details.trade_name || record.trade_name),
    contact_type: toFormString(record.supplier_details.contact_type),
    address1: toFormString(record.supplier_details.address1),
    address2: toFormString(record.supplier_details.address2),
    location: toFormString(record.supplier_details.location),
    pincode: toFormString(record.supplier_details.pincode),
    state_name: toFormString(record.supplier_details.state_name),
    state_code: toFormString(record.supplier_details.state_code),
    country: toFormString(record.supplier_details.country),
    person_name: toFormString(record.supplier_details.person_name),
    phone_number: toFormString(record.supplier_details.phone_number),
    email: toFormString(record.supplier_details.email),
    category: toFormString(record.supplier_details.category),
    segment: toFormString(record.supplier_details.segment),
    sub_segment: toFormString(record.supplier_details.sub_segment),
    sales_contact_id: toFormString(record.supplier_details.sales_contact_id),
    currency: toFormString(record.supplier_details.currency),
  },
  items: (record.items.length ? record.items : [defaultItem]).map((item) => ({
    item_id: toFormString(item.item_id),
    item_serial_number: toFormString(item.item_serial_number),
    product_description: toFormString(item.product_description),
    hsn_code: toFormString(item.hsn_code),
    total_quantity: toFormString(item.total_quantity),
    quantity: toFormString(item.quantity),
    free_quantity: toFormString(item.free_quantity),
    accepted_qty: toFormString(item.accepted_qty),
    rejected_qty: toFormString(item.rejected_qty),
    unit: toFormString(item.unit),
    unit_price: toFormString(item.unit_price),
    total_amount: toFormString(item.total_amount),
    discount: toFormString(item.discount),
    assessable_value: toFormString(item.assessable_value),
    gst_rate: toFormString(item.gst_rate),
    igst_amount: toFormString(item.igst_amount),
    cgst_amount: toFormString(item.cgst_amount),
    sgst_amount: toFormString(item.sgst_amount),
    total_item_value: toFormString(item.total_item_value),
  })),
  value_details: {
    freight_charge: toFormString(record.value_details.freight_charge),
    loading_unloading_charge: toFormString(record.value_details.loading_unloading_charge),
    total_before_tax: toFormString(record.value_details.total_before_tax),
    total_tax_amount: toFormString(record.value_details.total_tax_amount),
    total_after_tax: toFormString(record.value_details.total_after_tax ?? record.total_after_tax),
  },
});
