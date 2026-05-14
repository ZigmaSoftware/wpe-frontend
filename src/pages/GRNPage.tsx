import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, MoveRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { grnApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeGrnResponse, summarizeImportResponse } from "@/lib/api-helpers";
import type { GrnListResponse, GrnRecord, ImportResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const grnItemSchema = z.object({
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

const grnSchema = z.object({
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

type GrnFormValues = z.infer<typeof grnSchema>;

type GrnUpdateResponse = {
  status: string;
  message: string;
  data: GrnRecord;
};

type DetailFieldProps = {
  label: string;
  value: string;
  emphasized?: boolean;
};

type RecordScope = "active" | "moved";

type EnterpriseFieldTone = "editable" | "synced" | "protected" | "system";

type EnterpriseFieldType = "text" | "textarea" | "date" | "datetime";

type EnterpriseFieldDefinition = {
  id: string;
  label: string;
  tone: EnterpriseFieldTone;
  type?: EnterpriseFieldType;
  helperText?: string;
  paths?: string[];
  formPath?: string;
  getValue?: (record: GrnRecord) => string;
};

type EnterpriseFieldGroup = {
  id: string;
  title?: string;
  description?: string;
  fields: EnterpriseFieldDefinition[];
};

type EnterpriseSectionDefinition = {
  id: string;
  title: string;
  description: string;
  groups: EnterpriseFieldGroup[];
};

const documentFieldNames = [
  "po_no",
  "po_date",
  "grn_no",
  "grn_date",
  "supplier_invoice_no",
  "supplier_invoice_date",
  "gateentry_bookno",
  "gateentry_bookdate",
  "tolerance",
] as const;

const requirementFieldNames = [
  "req_date",
  "req_person_name",
  "req_person_id",
  "req_department",
  "req_reason",
] as const;

const supplierFieldNames = [
  "supplier_id",
  "gstin",
  "contact_name",
  "trade_name",
  "contact_type",
  "address1",
  "address2",
  "location",
  "pincode",
  "state_name",
  "state_code",
  "country",
  "person_name",
  "phone_number",
  "email",
  "category",
  "segment",
  "sub_segment",
  "sales_contact_id",
  "currency",
] as const;

const itemFieldNames = [
  "item_id",
  "item_serial_number",
  "product_description",
  "hsn_code",
  "total_quantity",
  "quantity",
  "free_quantity",
  "accepted_qty",
  "rejected_qty",
  "unit",
  "unit_price",
  "total_amount",
  "discount",
  "assessable_value",
  "gst_rate",
  "igst_amount",
  "cgst_amount",
  "sgst_amount",
  "total_item_value",
] as const;

const valueFieldNames = [
  "freight_charge",
  "loading_unloading_charge",
  "total_before_tax",
  "total_tax_amount",
  "total_after_tax",
] as const;

const editableItemFields = new Set(["item_serial_number", "free_quantity", "accepted_qty", "rejected_qty"]);

const defaultItem: GrnFormValues["items"][number] = {
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

const defaultValues: GrnFormValues = {
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

const getPrimaryItemQuantity = (record: GrnRecord) =>
  record.items?.[0]?.quantity ?? record.items?.[0]?.total_quantity ?? null;

const getGrnDepartment = (record: GrnRecord) => record.document_requirement_details.req_department?.trim() || "Unassigned";

const toFormString = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const readValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const toFieldLabel = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildAddress = (record: GrnRecord) =>
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

const mapRecordToFormValues = (record: GrnRecord): GrnFormValues => ({
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

const DetailField = ({ label, value, emphasized = false }: DetailFieldProps) => (
  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    <div className={cn("mt-1 text-sm text-foreground", emphasized ? "font-semibold" : "")}>{value}</div>
  </div>
);

const updateEditableFieldPaths = new Set([
  "document_details.gateentry_bookno",
  "document_details.gateentry_bookdate",
  "document_details.tolerance",
  "document_requirement_details.req_date",
  "document_requirement_details.req_person_name",
  "document_requirement_details.req_person_id",
  "document_requirement_details.req_department",
  "document_requirement_details.req_reason",
]);

const recordPayloadBadgeClassName: Record<EnterpriseFieldTone, string> = {
  editable: "border-primary/30 bg-primary/10 text-primary",
  synced: "border-info/20 bg-info/10 text-info",
  protected: "border-warning/30 bg-warning/10 text-warning",
  system: "border-border bg-muted text-muted-foreground",
};

const recordPayloadBadgeLabel: Record<EnterpriseFieldTone, string> = {
  editable: "Editable",
  synced: "Synced",
  protected: "Protected",
  system: "System",
};

const isPopulatedValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

const getValueAtPath = (value: unknown, path: string): unknown => {
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  return normalizedPath.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isNaN(index) ? undefined : current[index];
    }

    if (typeof current === "object" && segment in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, value);
};

const stringifyMappedValue = (value: unknown) => {
  if (!isPopulatedValue(value)) {
    return "-";
  }

  if (Array.isArray(value)) {
    const parts = value.map((entry) => stringifyMappedValue(entry)).filter((entry) => entry !== "-");
    return parts.length ? parts.join(", ") : "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const getFirstMappedValue = (record: GrnRecord, paths: string[] = []) => {
  for (const path of paths) {
    const value = getValueAtPath(record, path);
    if (isPopulatedValue(value)) {
      return value;
    }
  }

  return undefined;
};

const formatMappedValue = (value: unknown, type: EnterpriseFieldType = "text") => {
  const text = stringifyMappedValue(value);
  if (text === "-") {
    return text;
  }

  if (type === "date") {
    return formatDate(text);
  }

  if (type === "datetime") {
    return formatDateTime(text);
  }

  return text;
};

const getMappedFieldValue = (record: GrnRecord, field: EnterpriseFieldDefinition) => {
  if (field.getValue) {
    return field.getValue(record);
  }

  return formatMappedValue(getFirstMappedValue(record, field.paths), field.type);
};

const getUpdateFieldTone = (field: EnterpriseFieldDefinition, scope: RecordScope) => {
  if (scope !== "active") {
    return field.tone === "editable" ? "protected" : field.tone;
  }

  if (field.formPath && updateEditableFieldPaths.has(field.formPath)) {
    return "editable";
  }

  return field.tone;
};

const formatTimeRange = (record: GrnRecord) => {
  const combined = stringifyMappedValue(
    getFirstMappedValue(record, ["raw_payload.required_time", "raw_payload.document_requirement_details.required_time"]),
  );
  if (combined !== "-") {
    return combined;
  }

  const start = stringifyMappedValue(
    getFirstMappedValue(record, ["raw_payload.required_time_start", "raw_payload.document_requirement_details.required_time_start"]),
  );
  const end = stringifyMappedValue(
    getFirstMappedValue(record, ["raw_payload.required_time_end", "raw_payload.document_requirement_details.required_time_end"]),
  );

  if (start === "-" && end === "-") {
    return "-";
  }

  if (start !== "-" && end !== "-") {
    return `${start} - ${end}`;
  }

  return start !== "-" ? start : end;
};

const formatPurchaseContact = (record: GrnRecord) =>
  stringifyMappedValue(
    getFirstMappedValue(record, [
      "raw_payload.purchase_contact",
      "raw_payload.supplier_details.purchase_contact",
      "supplier_details.person_name",
      "supplier_details.contact_name",
      "supplier_details.sales_contact_id",
    ]),
  );

const formatIndentNumberAndDate = (record: GrnRecord) => {
  const combinedValue = stringifyMappedValue(getFirstMappedValue(record, ["raw_payload.indent_number_date"]));
  if (combinedValue !== "-") {
    return combinedValue;
  }

  const indentNumber = stringifyMappedValue(getFirstMappedValue(record, ["raw_payload.indent_number"]));
  const indentDate = formatMappedValue(getFirstMappedValue(record, ["raw_payload.indent_date"]), "date");

  if (indentNumber === "-" && indentDate === "-") {
    return "-";
  }

  if (indentNumber !== "-" && indentDate !== "-") {
    return `${indentNumber} | ${indentDate}`;
  }

  return indentNumber !== "-" ? indentNumber : indentDate;
};

const formatDestinationAddress = (record: GrnRecord) =>
  buildAddress(record) ||
  stringifyMappedValue(
    getFirstMappedValue(record, [
      "raw_payload.address",
      "raw_payload.supplier_details.address",
      "raw_payload.supplier_address",
    ]),
  );

const enterpriseSections: EnterpriseSectionDefinition[] = [
  {
    id: "bill-information",
    title: "Bill Information",
    description: "Commercial classification and priority context carried with the GRN payload.",
    groups: [
      {
        id: "bill-core",
        fields: [
          {
            id: "stage",
            label: "Stage *",
            tone: "synced",
            paths: ["raw_payload.saledoc_type", "raw_payload.stage", "raw_payload.document_details.stage", "process_status"],
          },
          {
            id: "purchase-type",
            label: "Purchase Type *",
            tone: "synced",
            paths: ["raw_payload.sale_type", "raw_payload.purchase_type", "raw_payload.document_details.purchase_type"],
          },
          {
            id: "purchase-category",
            label: "Purchase Category",
            tone: "synced",
            paths: ["raw_payload.sale_category", "raw_payload.purchase_category", "raw_payload.document_details.purchase_category"],
          },
          {
            id: "project-name",
            label: "Project Name",
            tone: "synced",
            paths: ["raw_payload.project_name", "raw_payload.document_details.project_name"],
          },
          {
            id: "version-number",
            label: "Version No.",
            tone: "synced",
            paths: ["raw_payload.version_no", "raw_payload.version_number", "raw_payload.document_details.version_no"],
          },
        ],
      },
      {
        id: "bill-priority",
        title: "Priority Details",
        description: "Requirement urgency carried from the originating purchase workflow.",
        fields: [
          {
            id: "need",
            label: "Need",
            tone: "synced",
            paths: ["raw_payload.need", "raw_payload.document_requirement_details.need"],
          },
          {
            id: "priority",
            label: "Priority",
            tone: "synced",
            paths: ["raw_payload.opportunity_priority", "raw_payload.priority_label", "raw_payload.priority_name"],
          },
          {
            id: "priority-level",
            label: "Priority Level",
            tone: "synced",
            paths: ["raw_payload.priority", "raw_payload.priority_level"],
          },
        ],
      },
    ],
  },
  {
    id: "invoice-order-details",
    title: "Invoice / Order Details",
    description: "Inbound billing, gate entry, and warehouse allocation information.",
    groups: [
      {
        id: "invoice-order-fields",
        fields: [
          {
            id: "purchase-bill-no",
            label: "Purchase Bill No",
            tone: "synced",
            paths: ["raw_payload.commercial_invoice_no", "raw_payload.sdid", "raw_payload.purchase_bill_no"],
          },
          {
            id: "purchase-bill-date",
            label: "Purchase Bill Date",
            tone: "synced",
            type: "date",
            paths: ["raw_payload.commercial_invoice_date_mod", "raw_payload.purchase_bill_date"],
          },
          {
            id: "dc-numbers",
            label: "DC Numbers",
            tone: "synced",
            helperText: "Type '..' or '.*' to see all or search to find a DC number",
            paths: ["raw_payload.merged_ids", "raw_payload.dc_numbers"],
          },
          {
            id: "delivery-days-gap",
            label: "Delivery Days Gap",
            tone: "synced",
            paths: ["raw_payload.delivery_days_gap"],
          },
          {
            id: "supplier-invoice-no",
            label: "Supplier Invoice No",
            tone: "synced",
            paths: ["document_details.supplier_invoice_no", "raw_payload.supplier_invoice_no", "raw_payload.document_details.supplier_invoice_no"],
          },
          {
            id: "supplier-invoice-date",
            label: "Supplier Invoice Date",
            tone: "synced",
            type: "date",
            paths: ["document_details.supplier_invoice_date", "raw_payload.supplier_invoice_date", "raw_payload.document_details.supplier_invoice_date"],
          },
          {
            id: "order-rating",
            label: "Order Rating",
            tone: "synced",
            paths: ["raw_payload.order_delivery_rating", "raw_payload.order_rating"],
          },
          {
            id: "gate-entry-no",
            label: "Gate Entry No *",
            tone: "editable",
            formPath: "document_details.gateentry_bookno",
            paths: ["raw_payload.gateentry_no", "document_details.gateentry_bookno", "raw_payload.document_details.gateentry_bookno"],
          },
          {
            id: "gate-entry-datetime",
            label: "Gate Entry Datetime *",
            tone: "editable",
            type: "date",
            formPath: "document_details.gateentry_bookdate",
            paths: ["raw_payload.gateentry_datetime", "document_details.gateentry_bookdate", "raw_payload.document_details.gateentry_bookdate"],
          },
          {
            id: "warehouse",
            label: "Warehouse",
            tone: "synced",
            paths: ["raw_payload.warehouse"],
          },
          {
            id: "source-warehouse",
            label: "Source Warehouse",
            tone: "synced",
            paths: ["raw_payload.source_warehouse"],
          },
          {
            id: "accepted-warehouse",
            label: "Accepted Warehouse",
            tone: "synced",
            paths: ["raw_payload.accepted_warehouse"],
          },
          {
            id: "rejected-warehouse",
            label: "Rejected Warehouse",
            tone: "synced",
            paths: ["raw_payload.rejected_warehouse"],
          },
          {
            id: "delivery-note-no",
            label: "Delivery Note No",
            tone: "synced",
            paths: ["raw_payload.delivery_note_no"],
          },
          {
            id: "delivery-note-date",
            label: "Delivery Note Date",
            tone: "synced",
            type: "date",
            paths: ["raw_payload.delivery_note_date"],
          },
        ],
      },
    ],
  },
  {
    id: "requirement-details",
    title: "Requirement Details",
    description: "Request ownership and operational inward context.",
    groups: [
      {
        id: "requirement-fields",
        fields: [
          {
            id: "required-date",
            label: "Required Date",
            tone: "editable",
            type: "date",
            formPath: "document_requirement_details.req_date",
            paths: ["document_requirement_details.req_date", "raw_payload.required_date", "raw_payload.document_requirement_details.req_date"],
          },
          {
            id: "request-person",
            label: "Request Person",
            tone: "editable",
            formPath: "document_requirement_details.req_person_name",
            paths: [
              "document_requirement_details.req_person_name",
              "raw_payload.request_person",
              "raw_payload.request_person_name",
              "raw_payload.document_requirement_details.req_person_name",
              "raw_payload.req_person_name",
              "raw_payload.req_person_id",
            ],
          },
          {
            id: "request-department",
            label: "Request Department",
            tone: "editable",
            formPath: "document_requirement_details.req_department",
            paths: [
              "document_requirement_details.req_department",
              "raw_payload.request_department",
              "raw_payload.document_requirement_details.req_department",
            ],
          },
          {
            id: "required-time",
            label: "Required Time",
            tone: "synced",
            getValue: formatTimeRange,
          },
          {
            id: "required-reason",
            label: "Required Reason",
            tone: "editable",
            type: "textarea",
            formPath: "document_requirement_details.req_reason",
            paths: [
              "document_requirement_details.req_reason",
              "raw_payload.required_reason",
              "raw_payload.document_requirement_details.req_reason",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "supplier-information",
    title: "Supplier Information",
    description: "Supplier master data and procurement-facing contact information.",
    groups: [
      {
        id: "supplier-fields",
        fields: [
          {
            id: "supplier-name",
            label: "Supplier Name",
            tone: "synced",
            paths: ["supplier_details.trade_name", "trade_name", "raw_payload.supplier_details.trade_name", "raw_payload.trade_name"],
          },
          {
            id: "gstin",
            label: "GSTIN",
            tone: "synced",
            paths: ["supplier_details.gstin", "raw_payload.supplier_details.gstin"],
          },
          {
            id: "contact-number",
            label: "Contact Number",
            tone: "synced",
            paths: ["supplier_details.phone_number", "raw_payload.supplier_details.phone_number"],
          },
          {
            id: "address",
            label: "Address",
            tone: "synced",
            type: "textarea",
            getValue: formatDestinationAddress,
          },
          {
            id: "location",
            label: "Location",
            tone: "synced",
            paths: ["supplier_details.location", "raw_payload.supplier_details.location"],
          },
          {
            id: "pincode",
            label: "Pincode",
            tone: "synced",
            paths: ["supplier_details.pincode", "raw_payload.supplier_details.pincode"],
          },
          {
            id: "state-name",
            label: "State Name",
            tone: "synced",
            paths: ["supplier_details.state_name", "raw_payload.supplier_details.state_name"],
          },
          {
            id: "purchase-contact",
            label: "Purchase Contact *",
            tone: "synced",
            getValue: formatPurchaseContact,
          },
        ],
      },
    ],
  },
  {
    id: "additional-details",
    title: "Additional Details",
    description: "Extended references, operational notes, and linked source identifiers.",
    groups: [
      {
        id: "additional-fields",
        fields: [
          {
            id: "internal-ref-id",
            label: "Internal Ref ID",
            tone: "synced",
            paths: ["raw_payload.internal_ref_id"],
          },
          {
            id: "invoice-ref-id",
            label: "Invoice Ref ID",
            tone: "synced",
            paths: ["raw_payload.invoice_ref_id", "raw_payload.invoice_saledoc_id"],
          },
          {
            id: "tolerance",
            label: "Tolerance",
            tone: "editable",
            formPath: "document_details.tolerance",
            paths: ["document_details.tolerance", "raw_payload.tolerance", "raw_payload.document_details.tolerance"],
          },
          {
            id: "capex",
            label: "Capex",
            tone: "synced",
            paths: ["raw_payload.capex"],
          },
          {
            id: "tl-code",
            label: "TL Code",
            tone: "synced",
            paths: ["raw_payload.tl_code", "raw_payload.capex_tally_code"],
          },
          {
            id: "delivery-challan-type",
            label: "Delivery Challan Type",
            tone: "synced",
            paths: ["raw_payload.delivery_challan_type"],
          },
          {
            id: "indent-number-date",
            label: "Indent Number & Date",
            tone: "synced",
            type: "textarea",
            getValue: formatIndentNumberAndDate,
          },
          {
            id: "indent-receiving-datetime",
            label: "Indent Receiving Date & Time",
            tone: "synced",
            type: "datetime",
            paths: ["raw_payload.indent_receiving_datetime"],
          },
          {
            id: "material-received-datetime",
            label: "Material Received Date & Time",
            tone: "synced",
            type: "datetime",
            paths: ["raw_payload.material_received_datetime"],
          },
          {
            id: "requisitioner-name",
            label: "Requisitioner Name",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.requisitioner_name_department", "raw_payload.requisitioner_name"],
          },
          {
            id: "gate-entry-book-no",
            label: "Gate Entry Book No.",
            tone: "synced",
            paths: ["document_details.gateentry_bookno", "raw_payload.document_details.gateentry_bookno"],
          },
          {
            id: "gate-entry-book-date",
            label: "Gate Entry Book Date",
            tone: "synced",
            type: "date",
            paths: ["document_details.gateentry_bookdate", "raw_payload.document_details.gateentry_bookdate"],
          },
          {
            id: "declaration",
            label: "Declaration",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.declaration"],
          },
          {
            id: "total-in-words",
            label: "Total In Words",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.total_in_words", "raw_payload.totalinwords_custinv"],
          },
          {
            id: "zigma-grn-no",
            label: "Zigma GRN No",
            tone: "system",
            paths: ["raw_payload.zigma_grn_no", "grn_no"],
          },
          {
            id: "zigma-grn-date",
            label: "Zigma GRN Date",
            tone: "system",
            type: "date",
            paths: ["raw_payload.zigma_grn_date", "grn_date"],
          },
          {
            id: "presales-ref",
            label: "Presales Ref #",
            tone: "synced",
            helperText: "Type '..' or '.*' to see all or search to find a presales number",
            paths: ["raw_payload.presales_ref", "raw_payload.term"],
          },
          {
            id: "po-ref",
            label: "PO Ref #",
            tone: "synced",
            paths: ["raw_payload.po_ref", "raw_payload.opportunity_id", "document_details.po_no"],
          },
          {
            id: "sales-order-title",
            label: "Sales Order / Invoice Title",
            tone: "synced",
            paths: ["raw_payload.so_invoice_title", "raw_payload.sales_order_invoice_title"],
          },
          {
            id: "default-discount",
            label: "Default Discount %",
            tone: "synced",
            paths: ["raw_payload.default_discount", "raw_payload.default_discount_percent"],
          },
          {
            id: "movement-description",
            label: "Movement Description",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.movement_description", "raw_payload.gdn_description"],
          },
          {
            id: "destination",
            label: "Destination",
            tone: "synced",
            paths: ["raw_payload.destination"],
          },
          {
            id: "scan-qty",
            label: "Scan Qty",
            tone: "synced",
            paths: ["raw_payload.scan_qty"],
          },
          {
            id: "supplier-reference-no",
            label: "Supplier Reference No",
            tone: "synced",
            paths: ["raw_payload.supplier_reference_no", "raw_payload.reference"],
          },
          {
            id: "supplier-doc-date",
            label: "Supplier Doc Date",
            tone: "synced",
            type: "date",
            paths: ["raw_payload.supplier_doc_date", "raw_payload.reference_date_display"],
          },
          {
            id: "document-contact",
            label: "Document Contact",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.document_contact", "raw_payload.invoice_contact"],
          },
          {
            id: "previous-document-contact",
            label: "Previous Document Contact",
            tone: "synced",
            type: "textarea",
            paths: ["raw_payload.previous_document_contact"],
          },
          {
            id: "base-order-id",
            label: "Base Order ID",
            tone: "synced",
            paths: ["raw_payload.base_order_id"],
          },
          {
            id: "base-customer-id",
            label: "Base Customer ID",
            tone: "synced",
            paths: ["raw_payload.base_customer_id"],
          },
          {
            id: "base-customer-name",
            label: "Base Customer Name",
            tone: "synced",
            paths: ["raw_payload.base_customer_name"],
          },
          {
            id: "base-order-date",
            label: "Base Order Date",
            tone: "synced",
            type: "date",
            paths: ["raw_payload.base_order_date"],
          },
          {
            id: "activity-id",
            label: "Activity ID",
            tone: "synced",
            paths: ["raw_payload.activity_id"],
          },
        ],
      },
    ],
  },
];

const accordionDefaultValue = enterpriseSections.slice(0, 2).map((section) => section.id);

const EnterpriseFieldBadge = ({ tone }: { tone: EnterpriseFieldTone }) => (
  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-[0.14em]", recordPayloadBadgeClassName[tone])}>
    {recordPayloadBadgeLabel[tone]}
  </Badge>
);

const EnterpriseReadField = ({
  label,
  value,
  tone,
  helperText,
  type = "text",
}: {
  label: string;
  value: string;
  tone: EnterpriseFieldTone;
  helperText?: string;
  type?: EnterpriseFieldType;
}) => (
  <div className="space-y-2 rounded-2xl border border-border/70 bg-slate-50/80 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <EnterpriseFieldBadge tone={tone} />
    </div>
    {type === "textarea" ? (
      <Textarea value={value} disabled rows={3} className="resize-none bg-background" />
    ) : (
      <Input value={value} disabled className="bg-background" />
    )}
    {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
  </div>
);

const GRNPage = () => {
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payloadRecord, setPayloadRecord] = useState<GrnRecord | null>(null);
  const [moveTarget, setMoveTarget] = useState<GrnRecord | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [detailState, setDetailState] = useState<{ scope: RecordScope; recordId: number } | null>(null);
  const [updateState, setUpdateState] = useState<{ scope: RecordScope; recordId: number } | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues,
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });
  const updateForm = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues,
  });
  const updateItemsFieldArray = useFieldArray({
    control: updateForm.control,
    name: "items",
  });

  const activeQuery = useQuery({
    queryKey: ["grn-active"],
    queryFn: async () => {
      const response = await grnApi.get<GrnListResponse>("/api/grn/");
      return normalizeGrnResponse(response.data);
    },
  });

  const movedQuery = useQuery({
    queryKey: ["grn-moved"],
    queryFn: async () => {
      const response = await grnApi.get<GrnListResponse>("/api/grn/moved/");
      return normalizeGrnResponse(response.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: GrnFormValues) => {
      const response = await grnApi.post("/api/grn/", values);
      return response.data;
    },
    onSuccess: () => {
      toast.success("GRN stored successfully.");
      setDialogOpen(false);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to create GRN record.")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: GrnFormValues }) => {
      const response = await grnApi.patch<GrnUpdateResponse>(`/api/grn/${id}/`, values);
      return response.data;
    },
    onSuccess: (payload) => {
      toast.success(payload.message || "GRN updated successfully.");
      setUpdateState(null);
      updateForm.reset(defaultValues);
      setDetailState({ scope: "active", recordId: payload.data.id });
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update GRN details.")),
  });

  const moveMutation = useMutation({
    mutationFn: async (grnId: number) => {
      const response = await grnApi.post(`/api/grn/${grnId}/move-to-qcr/`);
      return response.data;
    },
    onSuccess: (_payload, grnId) => {
      toast.success("GRN moved to QCR.");
      setMoveTarget(null);
      setDetailState((current) => (current?.scope === "active" && current.recordId === grnId ? null : current));
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move GRN to QCR.")),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await grnApi.post<ImportResponse>("/api/grn/import/", formData);
      return response.data;
    },
    onSuccess: (payload) => {
      toast.success(summarizeImportResponse(payload));
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to import GRN file.")),
  });

  const departmentOptions = useMemo(() => {
    const records = [...(activeQuery.data?.data ?? []), ...(movedQuery.data?.data ?? [])];
    return Array.from(new Set(records.map((record) => getGrnDepartment(record)))).sort((left, right) => left.localeCompare(right));
  }, [activeQuery.data?.data, movedQuery.data?.data]);

  const activeRecords = useMemo(() => {
    const records = activeQuery.data?.data ?? [];
    return departmentFilter === "all" ? records : records.filter((record) => getGrnDepartment(record) === departmentFilter);
  }, [activeQuery.data?.data, departmentFilter]);

  const movedRecords = useMemo(() => {
    const records = movedQuery.data?.data ?? [];
    return departmentFilter === "all" ? records : records.filter((record) => getGrnDepartment(record) === departmentFilter);
  }, [movedQuery.data?.data, departmentFilter]);

  const resolveScopedRecord = (scope: RecordScope, recordId: number) => {
    const records = scope === "active" ? activeRecords : movedRecords;
    return records.find((record) => record.id === recordId) ?? null;
  };

  const detailRecord = useMemo(() => {
    if (!detailState) {
      return null;
    }

    return resolveScopedRecord(detailState.scope, detailState.recordId);
  }, [activeRecords, detailState, movedRecords]);

  const updateRecord = useMemo(() => {
    if (!updateState) {
      return null;
    }

    return resolveScopedRecord(updateState.scope, updateState.recordId);
  }, [activeRecords, movedRecords, updateState]);

  useEffect(() => {
    if (detailState && !detailRecord) {
      setDetailState(null);
    }
  }, [detailRecord, detailState]);

  useEffect(() => {
    if (updateState && !updateRecord) {
      setUpdateState(null);
    }
  }, [updateRecord, updateState]);

  useEffect(() => {
    if (!detailRecord) {
      setSelectedItemIndex(0);
      return;
    }

    const itemCount = Math.max(detailRecord.items.length, 1);
    setSelectedItemIndex((current) => (current < itemCount ? current : 0));
  }, [detailRecord]);

  useEffect(() => {
    if (!updateState || updateState.scope !== "active" || !updateForm.formState.isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [updateForm.formState.isDirty, updateState]);

  const selectedActiveItem = detailRecord?.items[selectedItemIndex] ?? detailRecord?.items[0] ?? null;

  const openDetailSheet = (scope: RecordScope, record: GrnRecord) => {
    setSelectedItemIndex(0);
    setDetailState({ scope, recordId: record.id });
  };

  const openUpdateDialog = (scope: RecordScope, record: GrnRecord) => {
    updateForm.reset(mapRecordToFormValues(record));
    setUpdateState({ scope, recordId: record.id });
  };

  const closeUpdateDialog = () => {
    if (updateMutation.isPending) {
      return;
    }

    if (updateState?.scope === "active" && updateForm.formState.isDirty) {
      const shouldDiscard = window.confirm("Discard unsaved GRN changes?");
      if (!shouldDiscard) {
        return;
      }
    }

    setUpdateState(null);
    updateForm.reset(defaultValues);
  };

  const renderDetailSheet = () => {
    if (!detailRecord || !detailState) {
      return null;
    }

    const isActiveRecord = detailState.scope === "active";
    const actionLabel = isActiveRecord ? "Edit" : "Update";

    return (
      <Sheet open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailState(null)}>
        <SheetContent side="right" className="w-full overflow-hidden border-l border-border/70 p-0 sm:max-w-4xl">
          <div className="flex h-full flex-col bg-background">
            <SheetHeader className="border-b border-border/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="text-2xl font-semibold">{detailRecord.grn_no}</SheetTitle>
                    <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                      {detailRecord.process_status}
                    </Badge>
                    <Badge variant="outline" className="border-border bg-white text-muted-foreground">
                      {detailRecord.items.length || 1} line{detailRecord.items.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <SheetDescription className="max-w-2xl text-sm">
                    {isActiveRecord
                      ? "Contextual GRN review with enterprise field grouping. Inward-controlled fields are editable from the Edit workflow while synced source values remain protected."
                      : "This GRN has already moved beyond the active process queue. Update opens the same review form in protected mode to preserve processed workflow integrity."}
                  </SheetDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant={isActiveRecord ? "default" : "outline"} onClick={() => openUpdateDialog(detailState.scope, detailRecord)}>
                    {actionLabel}
                  </Button>
                  <Button variant="outline" onClick={() => setPayloadRecord(detailRecord)}>
                    View Payload
                  </Button>
                  {isActiveRecord ? (
                    <Button variant="outline" onClick={() => setMoveTarget(detailRecord)}>
                      <MoveRight className="mr-2 h-4 w-4" />
                      Move to QCR
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailField label="Supplier" value={readValue(detailRecord.supplier_details.trade_name || detailRecord.trade_name)} emphasized />
                <DetailField label="Department" value={readValue(detailRecord.document_requirement_details.req_department)} />
                <DetailField label="GRN Date" value={formatDate(detailRecord.grn_date)} />
                <DetailField label="Total After Tax" value={formatDecimal(detailRecord.value_details.total_after_tax ?? detailRecord.total_after_tax, 2)} emphasized />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground">Imported Line Selection</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Choose a product line to inspect inward, quantity, and valuation details.</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14 text-center">#</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Accepted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(detailRecord.items.length ? detailRecord.items : [defaultItem]).map((item, index) => (
                          <TableRow
                            key={`${detailRecord.id}-${item.item_id || "item"}-${index}`}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-muted/50",
                              index === selectedItemIndex ? "bg-primary/5" : "",
                            )}
                            onClick={() => setSelectedItemIndex(index)}
                          >
                            <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{item.item_id || "Unmapped item"}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">{item.product_description || "-"}</div>
                            </TableCell>
                            <TableCell className="text-right">{formatDecimal(item.quantity ?? item.total_quantity)}</TableCell>
                            <TableCell className="text-right">{formatDecimal(item.accepted_qty)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Selected Product Line</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Product identity, inward outcome, and tax valuation for the selected import line.</p>
                    </div>
                    <EnterpriseFieldBadge tone={isActiveRecord ? "editable" : "protected"} />
                  </div>
                  {selectedActiveItem ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField label="Item ID" value={readValue(selectedActiveItem.item_id)} />
                      <DetailField label="Serial Number" value={readValue(selectedActiveItem.item_serial_number)} />
                      <DetailField label="Description" value={readValue(selectedActiveItem.product_description)} />
                      <DetailField label="HSN Code" value={readValue(selectedActiveItem.hsn_code)} />
                      <DetailField label="Ordered Qty" value={formatDecimal(selectedActiveItem.quantity ?? selectedActiveItem.total_quantity)} />
                      <DetailField label="Free Qty" value={formatDecimal(selectedActiveItem.free_quantity)} />
                      <DetailField label="Accepted Qty" value={formatDecimal(selectedActiveItem.accepted_qty)} emphasized />
                      <DetailField label="Rejected Qty" value={formatDecimal(selectedActiveItem.rejected_qty)} />
                      <DetailField label="Unit" value={readValue(selectedActiveItem.unit)} />
                      <DetailField label="Unit Price" value={formatDecimal(selectedActiveItem.unit_price, 2)} />
                      <DetailField label="Tax Rate" value={formatDecimal(selectedActiveItem.gst_rate, 2)} />
                      <DetailField label="Total Item Value" value={formatDecimal(selectedActiveItem.total_item_value, 2)} emphasized />
                    </div>
                  ) : (
                    <EmptyState title="No item selected" description="Choose an imported line to inspect its details." />
                  )}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground">Commercial Totals</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Protected commercial amounts preserved from the external GRN feed.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Freight Charge" value={formatDecimal(detailRecord.value_details.freight_charge, 2)} />
                    <DetailField label="Loading / Unloading" value={readValue(detailRecord.value_details.loading_unloading_charge)} />
                    <DetailField label="Total Before Tax" value={formatDecimal(detailRecord.value_details.total_before_tax, 2)} />
                    <DetailField label="Total Tax Amount" value={formatDecimal(detailRecord.value_details.total_tax_amount, 2)} />
                    <DetailField label="Total After Tax" value={formatDecimal(detailRecord.value_details.total_after_tax ?? detailRecord.total_after_tax, 2)} emphasized />
                    <DetailField label="Unique ID" value={readValue(detailRecord.unique_id)} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground">Workflow Status</h3>
                    <p className="mt-1 text-sm text-muted-foreground">System-generated workflow metadata and movement lifecycle.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Process Status" value={readValue(detailRecord.process_status)} emphasized />
                    <DetailField label="Record Status" value={detailRecord.status ? "Active" : "Inactive"} />
                    <DetailField label="Moved To QCR At" value={formatDateTime(detailRecord.moved_to_qcr_at)} />
                    <DetailField label="Moved To QCR By" value={readValue(detailRecord.moved_to_qcr_by)} />
                    <DetailField label="Created At" value={formatDateTime(detailRecord.created_at)} />
                    <DetailField label="Updated At" value={formatDateTime(detailRecord.updated_at)} />
                  </div>
                </div>
              </div>

              {enterpriseSections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4 space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="space-y-5">
                    {section.groups.map((group) => (
                      <div key={group.id} className="space-y-3">
                        {group.title ? (
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                            {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
                          </div>
                        ) : null}
                        <div className="grid gap-4 xl:grid-cols-2">
                          {group.fields.map((field) => (
                            <EnterpriseReadField
                              key={field.id}
                              label={field.label}
                              value={getMappedFieldValue(detailRecord, field)}
                              tone={getUpdateFieldTone(field, detailState.scope)}
                              helperText={field.helperText}
                              type={field.type}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  const renderMovedTable = () => {
    if (!movedRecords.length) {
      return <EmptyState title="No moved GRN records" description="Records moved out of active GRN appear here." />;
    }

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>GRN No</TableHead>
                <TableHead>GRN Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO No</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total After Tax</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moved To QCR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movedRecords.map((record, index) => {
                const isSelected = detailState?.scope === "moved" && detailState.recordId === record.id;
                return (
                  <TableRow
                    key={record.id}
                    className={cn("cursor-pointer transition-colors hover:bg-muted/50", isSelected ? "bg-primary/5" : "")}
                    onClick={() => openDetailSheet("moved", record)}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.grn_no}</div>
                      <div className="text-xs text-muted-foreground">{record.document_details.po_no || "-"}</div>
                    </TableCell>
                    <TableCell>{formatDate(record.grn_date)}</TableCell>
                    <TableCell>{record.supplier_details.trade_name || record.trade_name || "-"}</TableCell>
                    <TableCell>{record.document_details.po_no || "-"}</TableCell>
                    <TableCell>{formatDecimal(getPrimaryItemQuantity(record))}</TableCell>
                    <TableCell>{formatDecimal(record.value_details.total_after_tax ?? record.total_after_tax, 2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
                        {record.process_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(record.moved_to_qcr_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openUpdateDialog("moved", record);
                        }}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderActiveTable = () => {
    if (!activeRecords.length) {
      return <EmptyState title="No active GRN records" description="Create a GRN or import an Excel workbook to populate the active queue." />;
    }

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>GRN No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO No</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total After Tax</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRecords.map((record, index) => {
                const isSelected = detailState?.scope === "active" && detailState.recordId === record.id;
                return (
                  <TableRow
                    key={record.id}
                    className={cn("cursor-pointer transition-colors hover:bg-muted/50", isSelected ? "bg-primary/5" : "")}
                    onClick={() => openDetailSheet("active", record)}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.grn_no}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(record.grn_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.supplier_details.trade_name || record.trade_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{record.document_details.supplier_invoice_no || "No invoice"}</div>
                    </TableCell>
                    <TableCell>{record.document_details.po_no || "-"}</TableCell>
                    <TableCell>{record.items.length || 1}</TableCell>
                    <TableCell>{formatDecimal(getPrimaryItemQuantity(record))}</TableCell>
                    <TableCell>{formatDecimal(record.value_details.total_after_tax ?? record.total_after_tax, 2)}</TableCell>
                    <TableCell>{record.document_requirement_details.req_department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                        {record.process_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetailSheet("active", record);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GRN Management"
        description="Active GRN with inline detail selection, guarded update controls, moved-to-QCR records, and Excel import against the GRN service."
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xlsm,.xltx,.xltm"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  importMutation.mutate(file);
                }
              }}
            />
            <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                activeQuery.refetch();
                movedQuery.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create GRN
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active GRN" value={activeQuery.data?.count ?? 0} />
        <StatCard label="Moved to QCR" value={movedQuery.data?.count ?? 0} />
        <StatCard label="Import" value={importMutation.isPending ? "Running" : "Ready"} />
        <StatCard label="Editable Inward Fields" value="Guarded" hint="External feed values remain locked in update mode." />
      </div>

      <div className="flex justify-end">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeQuery.isLoading || movedQuery.isLoading ? <LoadingState label="Loading GRN records..." /> : null}
      {activeQuery.isError || movedQuery.isError ? <ErrorState description="GRN records could not be loaded from the GRN service." /> : null}

      {!activeQuery.isLoading && !movedQuery.isLoading && !activeQuery.isError && !movedQuery.isError ? (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active GRN</TabsTrigger>
            <TabsTrigger value="moved">Moved to QCR</TabsTrigger>
          </TabsList>
          <TabsContent value="active">{renderActiveTable()}</TabsContent>
          <TabsContent value="moved">{renderMovedTable()}</TabsContent>
        </Tabs>
      ) : null}

      {renderDetailSheet()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Create GRN</DialogTitle>
            <DialogDescription>
              The form preserves the exact nested payload keys: `document_details`, `document_requirement_details`, `supplier_details`, `items`, and `value_details`.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {documentFieldNames.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={`document_details.${fieldName}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{toFieldLabel(fieldName)}</FormLabel>
                        <FormControl><Input {...field} type={fieldName.includes("date") ? "date" : "text"} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {requirementFieldNames.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={`document_requirement_details.${fieldName}`}
                    render={({ field }) => (
                      <FormItem className={fieldName === "req_reason" ? "xl:col-span-3" : undefined}>
                        <FormLabel>{toFieldLabel(fieldName)}</FormLabel>
                        <FormControl>
                          {fieldName === "req_reason" ? <Textarea {...field} rows={2} /> : <Input {...field} type={fieldName === "req_date" ? "date" : "text"} />}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {supplierFieldNames.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={`supplier_details.${fieldName}`}
                    render={({ field }) => (
                      <FormItem className={fieldName === "address1" || fieldName === "address2" ? "xl:col-span-3" : undefined}>
                        <FormLabel>{toFieldLabel(fieldName)}</FormLabel>
                        <FormControl>
                          {fieldName === "address1" || fieldName === "address2" ? <Textarea {...field} rows={2} /> : <Input {...field} />}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Items</h3>
                  <Button type="button" variant="outline" onClick={() => itemsFieldArray.append(defaultItem)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {itemsFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm font-medium">Item #{index + 1}</div>
                      {itemsFieldArray.fields.length > 1 ? (
                        <Button type="button" variant="outline" onClick={() => itemsFieldArray.remove(index)}>Remove</Button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {itemFieldNames.map((fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={`items.${index}.${fieldName}`}
                          render={({ field }) => (
                            <FormItem className={fieldName === "product_description" ? "xl:col-span-3" : undefined}>
                              <FormLabel>{toFieldLabel(fieldName)}</FormLabel>
                              <FormControl>{fieldName === "product_description" ? <Textarea {...field} rows={2} /> : <Input {...field} />}</FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {valueFieldNames.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={`value_details.${fieldName}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{toFieldLabel(fieldName)}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create GRN</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(updateState)} onOpenChange={(open) => !open && closeUpdateDialog()}>
        <DialogContent className="max-w-7xl gap-0 overflow-hidden p-0">
          {updateRecord && updateState ? (
            <>
              <DialogHeader className="border-b border-border/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-6 py-5 text-left">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="text-2xl">
                        {updateState.scope === "active" ? "Edit GRN" : "Update GRN"}
                      </DialogTitle>
                      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-[0.14em]", updateState.scope === "active" ? "border-primary/30 bg-primary/10 text-primary" : "border-warning/30 bg-warning/10 text-warning")}>
                        {updateState.scope === "active" ? "Inward Editable" : "Read Only"}
                      </Badge>
                    </div>
                    <DialogDescription className="max-w-3xl">
                      {updateState.scope === "active"
                        ? "Enterprise edit mode for active GRN records. Safe inward-managed fields stay editable, while synced external values remain protected and continue to preserve raw payload integrity."
                        : "Enterprise update review for processed GRN records. The workflow label stays Update, but every field is protected because the record has already progressed beyond active GRN processing."}
                    </DialogDescription>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Selected Record</div>
                    <div className="mt-2 text-base font-semibold text-foreground">{updateRecord.grn_no}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{updateRecord.supplier_details.trade_name || updateRecord.trade_name || "-"}</div>
                  </div>
                </div>
              </DialogHeader>
              <Form {...updateForm}>
                <form
                  onSubmit={updateForm.handleSubmit((values) => {
                    if (updateState.scope === "active" && updateRecord) {
                      updateMutation.mutate({ id: updateRecord.id, values });
                    }
                  })}
                  className="flex max-h-[88vh] flex-col"
                >
                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="GRN No" value={readValue(updateRecord.grn_no)} emphasized />
                      <DetailField label="Process Status" value={readValue(updateRecord.process_status)} />
                      <DetailField label="GRN Date" value={formatDate(updateRecord.grn_date)} />
                      <DetailField label="Total After Tax" value={formatDecimal(updateRecord.value_details.total_after_tax ?? updateRecord.total_after_tax, 2)} emphasized />
                    </div>

                    <Accordion type="multiple" defaultValue={accordionDefaultValue} className="space-y-4">
                      {enterpriseSections.map((section) => (
                        <AccordionItem key={section.id} value={section.id} className="overflow-hidden rounded-2xl border border-border/70 bg-card px-5 shadow-sm">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="space-y-1 text-left">
                              <div className="text-base font-semibold text-foreground">{section.title}</div>
                              <div className="text-sm font-normal text-muted-foreground">{section.description}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-5 pb-5">
                            {section.groups.map((group) => (
                              <div key={group.id} className="space-y-3">
                                {group.title ? (
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                                    {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
                                  </div>
                                ) : null}
                                <div className="grid gap-4 xl:grid-cols-2">
                                  {group.fields.map((sectionField) => {
                                    const fieldTone = getUpdateFieldTone(sectionField, updateState.scope);
                                    const isEditableField =
                                      updateState.scope === "active" &&
                                      Boolean(sectionField.formPath) &&
                                      updateEditableFieldPaths.has(sectionField.formPath);

                                    if (!isEditableField) {
                                      return (
                                        <EnterpriseReadField
                                          key={sectionField.id}
                                          label={sectionField.label}
                                          value={getMappedFieldValue(updateRecord, sectionField)}
                                          tone={fieldTone}
                                          helperText={sectionField.helperText}
                                          type={sectionField.type}
                                        />
                                      );
                                    }

                                    return (
                                      <FormField
                                        key={sectionField.id}
                                        control={updateForm.control}
                                        name={sectionField.formPath as never}
                                        render={({ field }) => (
                                          <FormItem className="space-y-2 rounded-2xl border border-border/70 bg-slate-50/80 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <FormLabel className="text-sm font-medium text-foreground">{sectionField.label}</FormLabel>
                                              <EnterpriseFieldBadge tone={fieldTone} />
                                            </div>
                                            <FormControl>
                                              {sectionField.type === "textarea" ? (
                                                <Textarea {...field} rows={3} className="resize-none bg-background" />
                                              ) : (
                                                <Input
                                                  {...field}
                                                  type={sectionField.type === "date" ? "date" : "text"}
                                                  className="bg-background"
                                                />
                                              )}
                                            </FormControl>
                                            {sectionField.helperText ? <FormDescription className="text-xs">{sectionField.helperText}</FormDescription> : null}
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}

                      <AccordionItem value="items" className="overflow-hidden rounded-2xl border border-border/70 bg-card px-5 shadow-sm">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="space-y-1 text-left">
                            <div className="text-base font-semibold text-foreground">Items</div>
                            <div className="text-sm font-normal text-muted-foreground">Imported product lines with guarded inward edit controls for serial and quantity adjustments.</div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-5">
                          {updateItemsFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="rounded-2xl border border-border/70 bg-slate-50/80 p-4">
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Line {index + 1}: {readValue(updateForm.getValues(`items.${index}.item_id`))}
                                  </h4>
                                  <p className="mt-1 text-xs text-muted-foreground">{readValue(updateForm.getValues(`items.${index}.product_description`))}</p>
                                </div>
                                <EnterpriseFieldBadge tone={updateState.scope === "active" ? "editable" : "protected"} />
                              </div>
                              <div className="grid gap-4 xl:grid-cols-3">
                                {itemFieldNames.map((fieldName) => {
                                  const isEditableItemField = updateState.scope === "active" && editableItemFields.has(fieldName);
                                  const currentValue = updateForm.getValues(`items.${index}.${fieldName}`);

                                  if (!isEditableItemField) {
                                    return (
                                      <EnterpriseReadField
                                        key={`${field.id}-${fieldName}`}
                                        label={toFieldLabel(fieldName)}
                                        value={readValue(currentValue)}
                                        tone={updateState.scope === "active" ? "synced" : "protected"}
                                        type={fieldName === "product_description" ? "textarea" : "text"}
                                      />
                                    );
                                  }

                                  return (
                                    <FormField
                                      key={`${field.id}-${fieldName}`}
                                      control={updateForm.control}
                                      name={`items.${index}.${fieldName}`}
                                      render={({ field }) => (
                                        <FormItem className={cn("space-y-2 rounded-2xl border border-border/70 bg-white p-4", fieldName === "product_description" ? "xl:col-span-3" : undefined)}>
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <FormLabel className="text-sm font-medium text-foreground">{toFieldLabel(fieldName)}</FormLabel>
                                            <EnterpriseFieldBadge tone={updateState.scope === "active" ? "editable" : "protected"} />
                                          </div>
                                          <FormControl>
                                            {fieldName === "product_description" ? (
                                              <Textarea {...field} rows={3} className="resize-none" />
                                            ) : (
                                              <Input {...field} />
                                            )}
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="commercial-totals" className="overflow-hidden rounded-2xl border border-border/70 bg-card px-5 shadow-sm">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="space-y-1 text-left">
                            <div className="text-base font-semibold text-foreground">Commercial Totals</div>
                            <div className="text-sm font-normal text-muted-foreground">Readonly financial fields preserved exactly from the external GRN source.</div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                          <div className="grid gap-4 xl:grid-cols-2">
                            {valueFieldNames.map((fieldName) => (
                              <EnterpriseReadField
                                key={fieldName}
                                label={toFieldLabel(fieldName)}
                                value={readValue(updateForm.getValues(`value_details.${fieldName}`))}
                                tone="protected"
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <div className="sticky bottom-0 border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {updateState.scope === "active"
                            ? updateForm.formState.isDirty
                              ? "Unsaved changes are pending."
                              : "No pending edits."
                            : "Processed workflow records are locked for audit-safe review."}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {updateState.scope === "active"
                            ? "Only inward-managed fields are submitted back to the guarded patch merge flow."
                            : "The Update label is preserved for workflow consistency, but saving remains disabled after QCR progression."}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeUpdateDialog}>
                          {updateState.scope === "active" ? "Cancel" : "Close"}
                        </Button>
                        {updateState.scope === "active" ? (
                          <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payloadRecord)} onOpenChange={(open) => !open && setPayloadRecord(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{payloadRecord?.grn_no} Payload</DialogTitle>
            <DialogDescription>Preserved external GRN payload stored in `raw_payload`.</DialogDescription>
          </DialogHeader>
          {payloadRecord ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="GRN Date" value={formatDate(payloadRecord.grn_date)} />
                <StatCard label="Supplier" value={payloadRecord.supplier_details.trade_name || payloadRecord.trade_name || "-"} />
                <StatCard label="Status" value={payloadRecord.process_status} />
                <StatCard label="Moved At" value={formatDateTime(payloadRecord.moved_to_qcr_at)} />
              </div>
              <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                {JSON.stringify(payloadRecord.raw_payload ?? payloadRecord, null, 2)}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(moveTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMoveTarget(null);
          }
        }}
        title="Move GRN to QCR"
        description={`Move ${moveTarget?.grn_no ?? "this GRN"} to QCR? This will inactivate the GRN and create an active QCR record.`}
        confirmLabel="Move to QCR"
        onConfirm={() => {
          if (moveTarget) {
            moveMutation.mutate(moveTarget.id);
          }
        }}
      />
    </div>
  );
};

export default GRNPage;
