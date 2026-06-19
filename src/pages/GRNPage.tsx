import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, MoveRight, Plus, RefreshCw } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { getPageCount, getPageSerialNumber, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LookupItem } from "@/features/wpe-masters/types";
import {
  GRN_GATE_ENTRY_STATUS,
  GRN_PENDING_STATUS,
  GRN_QCR_STATUS,
} from "@/features/grn/grnShared";
import {
  GRN_PROCESS_CREATE_ROUTE,
  getGrnProcessEditRoute,
} from "@/features/grn/utils/routes";
import { grnApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeGrnResponse, summarizeImportResponse } from "@/lib/api-helpers";
import type { GrnListResponse, GrnPendingItemLine, GrnRecord, ImportResponse, QcrItemLine, QcrRecord } from "@/lib/types";
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

type GrnPageModule = "process" | "status";
type RecordScope = "active" | "moved";
type GrnTabValue = "active" | "grn-pending" | "moved-to-qcr" | "next-grn" | "rejected";
type GrnTableFilterState = {
  fromDate: string;
  toDate: string;
  status: string;
};

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

type PendingMoveFormItem = {
  lineIndex: number;
  itemName: string;
  sentQty: string;
  receivedQty: string;
  storeInId: string;
  storeInName: string;
  unit: string;
};

type QcrCompletionFormItem = {
  lineIndex: number;
  itemId: string;
  itemName: string;
  sentQty: string;
  receivedQty: string;
  acceptedQty: string;
  rejectedQty: string;
  reason: string;
  unit: string;
  storeInName: string;
};

type CompletedGrnStatusGroup = "Approved" | "Partial Rejected" | "Rejected";

type CompletedGrnDisplayStatus = "Approved" | "Rejected";

type CompletedGrnDisplayRow = {
  rowId: string;
  record: QcrRecord;
  statusGroup: CompletedGrnStatusGroup;
  displayStatus: CompletedGrnDisplayStatus;
  quantity: string | number | null;
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

const grnTabs: GrnTabValue[] = ["active", "grn-pending", "moved-to-qcr", "next-grn", "rejected"];
const processTabs: GrnTabValue[] = ["active", "moved-to-qcr", "next-grn"];
const statusTabs: GrnTabValue[] = ["next-grn"];

const completedGrnStatusOptions = ["Approved", "Rejected"] as const;

const GRN_MODULE_META: Record<GrnPageModule, { title: string; description: string; defaultTab: GrnTabValue }> = {
  process: {
    title: "Gate Entry",
    description: "Manage Gate Entry, QCR, and Completed GRN movement from one workspace.",
    defaultTab: "active",
  },
  status: {
    title: "Completed GRN",
    description: "Review approved and rejected GRN records.",
    defaultTab: "next-grn",
  },
};

const createDefaultTabTextState = () =>
  grnTabs.reduce<Record<GrnTabValue, string>>(
    (state, tab) => ({ ...state, [tab]: "" }),
    { active: "", "grn-pending": "", "moved-to-qcr": "", "next-grn": "", rejected: "" },
  );

const createDefaultTabPageState = () =>
  grnTabs.reduce<Record<GrnTabValue, number>>(
    (state, tab) => ({ ...state, [tab]: 1 }),
    { active: 1, "grn-pending": 1, "moved-to-qcr": 1, "next-grn": 1, rejected: 1 },
  );

const createDefaultTabPageSizeState = () =>
  grnTabs.reduce<Record<GrnTabValue, StorePageSizeValue>>(
    (state, tab) => ({ ...state, [tab]: "10" }),
    { active: "10", "grn-pending": "10", "moved-to-qcr": "10", "next-grn": "10", rejected: "10" },
  );

const createDefaultTabFiltersState = () =>
  grnTabs.reduce<Record<GrnTabValue, GrnTableFilterState>>(
    (state, tab) => ({ ...state, [tab]: { fromDate: "", toDate: "", status: "" } }),
    {
      active: { fromDate: "", toDate: "", status: "" },
      "grn-pending": { fromDate: "", toDate: "", status: "" },
      "moved-to-qcr": { fromDate: "", toDate: "", status: "" },
      "next-grn": { fromDate: "", toDate: "", status: "" },
      rejected: { fromDate: "", toDate: "", status: "" },
    },
  );

const getPrimaryItemQuantity = (record: GrnRecord) =>
  record.items?.[0]?.quantity ?? record.items?.[0]?.total_quantity ?? null;

const getPendingSentQty = (item: GrnPendingItemLine | undefined, recordItem: GrnRecord["items"][number] | undefined) =>
  item?.sent_qty ?? recordItem?.quantity ?? recordItem?.total_quantity ?? null;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getRecordField = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const getRecordList = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
};

const readQcrItemValue = (...values: unknown[]) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "";
};

const parseQcrNumber = (value: string) => {
  if (!value.trim()) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const isNonNegativeDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);

const shouldBlockQuantityKey = (key: string) => key === "-";

const getReceivedQtyError = (value: string, sentQty: string) => {
  if (!value.trim()) return "Received Qty is required.";
  if (value.includes("-")) return "Received Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Received Qty must be numeric.";

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return "Received Qty must be numeric.";
  if (parsedValue < 0) return "Received Qty cannot be negative.";

  const parsedSentQty = sentQty ? Number(sentQty) : Number.NaN;
  if (Number.isFinite(parsedSentQty) && parsedValue > parsedSentQty) {
    return "Received Qty cannot exceed Sent Qty.";
  }
  return undefined;
};

const getRejectedQtyError = (value: string, receivedQty: string) => {
  if (!value.trim()) return undefined;
  if (value.includes("-")) return "Rejected Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Rejected Qty must be numeric.";

  const rejected = Number(value);
  if (!Number.isFinite(rejected)) return "Rejected Qty must be numeric.";
  if (rejected < 0) return "Rejected Qty cannot be negative.";

  const received = Number(receivedQty);
  if (Number.isFinite(received) && rejected > received) {
    return "Rejected Qty cannot exceed Accepted Qty.";
  }
  return undefined;
};

const calculateAcceptedQty = (receivedQty: string, rejectedQty: string) => {
  const received = parseQcrNumber(receivedQty);
  if (!Number.isFinite(received)) return "";
  const rejected = rejectedQty.trim() ? parseQcrNumber(rejectedQty) : 0;
  if (!Number.isFinite(rejected)) return "";
  const accepted = received - rejected;
  if (accepted < 0) return "";
  return String(accepted);
};

const buildQcrCompletionFormItems = (record: QcrRecord): QcrCompletionFormItem[] => {
  const snapshot = isRecord(record.snapshot) ? record.snapshot : undefined;
  const sourceGrn = isRecord(record.source_grn_data) ? record.source_grn_data : undefined;
  const snapshotPayload = getRecordField(snapshot, "raw_payload");
  const sourcePayload = getRecordField(sourceGrn, "raw_payload");
  const rawItems = getRecordList(snapshotPayload, "items").length
    ? getRecordList(snapshotPayload, "items")
    : getRecordList(sourcePayload, "items");
  const pendingItems = getRecordList(snapshot, "grn_pending_items").length
    ? getRecordList(snapshot, "grn_pending_items")
    : getRecordList(sourceGrn, "grn_pending_items");
  const completedItems = Array.isArray(record.qcr_items) ? (record.qcr_items as QcrItemLine[]) : [];
  const rowCount = Math.max(rawItems.length, pendingItems.length, completedItems.length, 1);

  return Array.from({ length: rowCount }, (_, index) => {
    const rawItem = rawItems[index];
    const pendingItem = pendingItems[index];
    const completedItem = completedItems[index];
    const receivedQty = readQcrItemValue(
      completedItem?.received_qty,
      pendingItem?.received_qty,
      rawItem?.received_qty,
      rawItem?.accepted_qty,
      rawItem?.quantity,
      rawItem?.total_quantity,
    );
    const rejectedQty = readQcrItemValue(completedItem?.rejected_qty, "");
    const acceptedQty = readQcrItemValue(completedItem?.accepted_qty, calculateAcceptedQty(receivedQty, rejectedQty) || receivedQty);
    return {
      lineIndex: Number(completedItem?.line_index ?? pendingItem?.line_index ?? index),
      itemId: readQcrItemValue(completedItem?.item_id, pendingItem?.item_id, rawItem?.item_id),
      itemName: readQcrItemValue(
        completedItem?.item_name,
        pendingItem?.item_name,
        rawItem?.product_description,
        rawItem?.item_name,
        rawItem?.item_id,
        `Line ${index + 1}`,
      ),
      sentQty: readQcrItemValue(
        completedItem?.sent_qty,
        pendingItem?.sent_qty,
        rawItem?.quantity,
        rawItem?.total_quantity,
      ),
      receivedQty,
      acceptedQty,
      rejectedQty,
      reason: readQcrItemValue(completedItem?.rejection_reason, ""),
      unit: readQcrItemValue(completedItem?.unit, pendingItem?.unit, rawItem?.unit),
      storeInName: readQcrItemValue(completedItem?.store_in_name, pendingItem?.store_in_name, rawItem?.store_in_name, rawItem?.store_in),
    };
  });
};

const buildPendingMoveFormItems = (record: GrnRecord): PendingMoveFormItem[] => {
  const pendingItems = Array.isArray(record.grn_pending_items) ? record.grn_pending_items : [];
  const sourceItems = record.items.length ? record.items : [defaultItem];

  return sourceItems.map((item, index) => {
    const pendingItem = pendingItems[index];
    const sentQty = getPendingSentQty(pendingItem, item);
    return {
      lineIndex: pendingItem?.line_index ?? index,
      itemName: String(pendingItem?.item_name ?? item.product_description ?? item.item_id ?? `Line ${index + 1}`),
      sentQty: sentQty === null || sentQty === undefined ? "" : String(sentQty),
      receivedQty: pendingItem?.received_qty === null || pendingItem?.received_qty === undefined ? "" : String(pendingItem.received_qty),
      storeInId: pendingItem?.store_in_id === null || pendingItem?.store_in_id === undefined ? "" : String(pendingItem.store_in_id),
      storeInName: pendingItem?.store_in_name ?? "",
      unit: item.unit ? String(item.unit) : "",
    };
  });
};

const isValidReceivedQty = (value: string, sentQty: string) => {
  return getReceivedQtyError(value, sentQty) === undefined;
};

const getQcrItemErrors = (items: QcrCompletionFormItem[]) =>
  items.reduce<Record<number, { rejectedQty?: string; reason?: string }>>((errors, item, index) => {
    const rejected = item.rejectedQty.trim() ? parseQcrNumber(item.rejectedQty) : 0;
    const itemErrors: { rejectedQty?: string; reason?: string } = {};
    const rejectedQtyError = getRejectedQtyError(item.rejectedQty, item.receivedQty);

    if (!Number.isFinite(parseQcrNumber(item.receivedQty)) || parseQcrNumber(item.receivedQty) < 0) {
      itemErrors.rejectedQty = "Received Qty is not available for this row.";
    } else if (rejectedQtyError) {
      itemErrors.rejectedQty = rejectedQtyError;
    }

    if (itemErrors.rejectedQty || itemErrors.reason) {
      errors[index] = itemErrors;
    }
    return errors;
  }, {});

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

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const readTypedMessage = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return "";
  }

  const message = (value as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
};

const toDecimalDisplayValue = (value: unknown): string | number | null => {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
};

const hasQcrValue = (value: unknown) => value !== null && value !== undefined && value !== "";

const getQcrQuantityValue = (payload: Record<string, unknown> | undefined) => {
  if (!payload) return undefined;

  for (const fieldName of ["received_qty", "accepted_qty", "quantity", "total_quantity"]) {
    const value = payload[fieldName];
    if (hasQcrValue(value)) {
      return value;
    }
  }

  const itemLines = payload.items;
  if (Array.isArray(itemLines)) {
    const firstItem = itemLines.find((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
    if (firstItem) {
      for (const fieldName of ["received_qty", "accepted_qty", "quantity", "total_quantity"]) {
        const value = firstItem[fieldName];
        if (hasQcrValue(value)) {
          return value;
        }
      }
    }
  }

  return undefined;
};

const getQcrField = (record: QcrRecord, key: string): unknown => {
  if (key === "quantity") {
    const quantityValue = getQcrQuantityValue(record.source_grn_data) ?? getQcrQuantityValue(record.snapshot);
    if (hasQcrValue(quantityValue)) return quantityValue;
  }

  const sourceValue = record.source_grn_data?.[key];
  if (hasQcrValue(sourceValue)) return sourceValue;
  return record.snapshot?.[key];
};

const getQcrOutcomeQuantity = (record: QcrRecord, key: "accepted_qty" | "rejected_qty"): string | number | null => {
  const sourceValue = toDecimalDisplayValue(record.source_grn_data?.[key]);
  if (sourceValue !== null) return sourceValue;

  const snapshotValue = toDecimalDisplayValue(record.snapshot?.[key]);
  if (snapshotValue !== null) return snapshotValue;

  const completedItems = Array.isArray(record.qcr_items) ? record.qcr_items : [];
  let total = 0;
  let foundValue = false;

  for (const item of completedItems) {
    const rawValue = item?.[key];
    if (!hasQcrValue(rawValue)) continue;
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) continue;
    total += parsedValue;
    foundValue = true;
  }

  return foundValue ? total : null;
};

const getQcrDisplayQuantity = (record: QcrRecord, tab: Exclude<GrnTabValue, "active">): string | number | null => {
  if (tab === "next-grn") {
    return getCompletedGrnOutcomeQuantities(record).acceptedQty;
  }

  if (tab === "rejected") {
    return getQcrOutcomeQuantity(record, "rejected_qty") ?? toDecimalDisplayValue(getQcrField(record, "quantity"));
  }

  return toDecimalDisplayValue(getQcrField(record, "quantity"));
};

const getQcrDisplayStatus = (record: QcrRecord, tab: Exclude<GrnTabValue, "active">) => {
  if (tab === "next-grn") {
    const rawStatus = typeof record.status === "string" ? record.status : "";
    const sourceStatus = typeof record.source_grn_data?.process_status === "string" ? record.source_grn_data.process_status : "";
    return normalizeCompletedGrnStatus(rawStatus || sourceStatus);
  }

  if (tab === "rejected") {
    return record.status === "Rejected" ? "Rejected" : "Partial Reject";
  }

  return readText(record.status);
};

const normalizeCompletedGrnStatus = (status: string): CompletedGrnStatusGroup => {
  const normalized = status.trim().toLowerCase();

  if (!normalized) {
    return "Approved";
  }

  if (normalized.includes("moved to grn")) {
    return "Approved";
  }

  if (normalized.includes("partial")) {
    return "Partial Rejected";
  }

  if (normalized.includes("reject")) {
    return normalized === "rejected" ? "Rejected" : "Partial Rejected";
  }

  if (normalized.includes("complete") || normalized.includes("approve")) {
    return "Approved";
  }

  return "Approved";
};

const getCompletedGrnOutcomeQuantities = (record: QcrRecord) => {
  const rawStatus = typeof record.status === "string" ? record.status : "";
  const sourceStatus = typeof record.source_grn_data?.process_status === "string" ? record.source_grn_data.process_status : "";
  const statusGroup = normalizeCompletedGrnStatus(rawStatus || sourceStatus);
  const acceptedQty = getQcrOutcomeQuantity(record, "accepted_qty") ?? toDecimalDisplayValue(getQcrField(record, "quantity"));
  const rejectedQty = getQcrOutcomeQuantity(record, "rejected_qty") ?? null;
  return { statusGroup, acceptedQty, rejectedQty };
};

const getCompletedGrnDisplayRows = (record: QcrRecord): CompletedGrnDisplayRow[] => {
  const { statusGroup, acceptedQty, rejectedQty } = getCompletedGrnOutcomeQuantities(record);
  const hasAccepted = Number.isFinite(Number(acceptedQty)) && Number(acceptedQty) > 0;
  const hasRejected = rejectedQty !== null && Number.isFinite(Number(rejectedQty)) && Number(rejectedQty) > 0;

  if (hasAccepted && hasRejected) {
    return [
      {
        rowId: `${record.id}-approved`,
        record,
        statusGroup,
        displayStatus: "Approved",
        quantity: acceptedQty,
      },
      {
        rowId: `${record.id}-rejected`,
        record,
        statusGroup,
        displayStatus: "Rejected",
        quantity: rejectedQty,
      },
    ];
  }

  if (statusGroup === "Rejected" || (!hasAccepted && hasRejected)) {
    return [
      {
        rowId: `${record.id}-rejected`,
        record,
        statusGroup: statusGroup === "Approved" ? "Rejected" : statusGroup,
        displayStatus: "Rejected",
        quantity: rejectedQty ?? acceptedQty,
      },
    ];
  }

  return [
    {
      rowId: `${record.id}-approved`,
      record,
      statusGroup: "Approved",
      displayStatus: "Approved",
      quantity: acceptedQty,
    },
  ];
};


const getActiveItemSummary = (record: GrnRecord) => {
  const items = record.items ?? [];
  if (!items.length) {
    return { title: record.product_description || "-", subtitle: record.item_id || null, extra: null as string | null };
  }

  const [firstItem, ...restItems] = items;
  return {
    title: firstItem.product_description || firstItem.item_id || "-",
    subtitle: firstItem.item_id || null,
    extra: restItems.length ? `+${restItems.length} more` : null,
  };
};

const toDateKey = (value: string | null | undefined) => {
  if (!value) return "";
  const source = String(value);
  const match = source.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];

  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const isWithinDateRange = (dateValue: string | null | undefined, fromDate: string, toDate: string) => {
  const dateKey = toDateKey(dateValue);
  if (!dateKey) {
    return !fromDate && !toDate;
  }
  if (fromDate && dateKey < fromDate) return false;
  if (toDate && dateKey > toDate) return false;
  return true;
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

type GRNPageProps = {
  module?: GrnPageModule;
};

const GRNPage = ({ module = "process" }: GRNPageProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payloadRecord, setPayloadRecord] = useState<GrnRecord | null>(null);
  const [moveTarget, setMoveTarget] = useState<GrnRecord | null>(null);
  const [pendingMoveTarget, setPendingMoveTarget] = useState<GrnRecord | null>(null);
  const [pendingMoveItems, setPendingMoveItems] = useState<PendingMoveFormItem[]>([]);
  const [pendingMoveErrors, setPendingMoveErrors] = useState<Record<number, { receivedQty?: string; storeIn?: string }>>({});
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayDateInputValue = today.toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<GrnTabValue>(GRN_MODULE_META[module].defaultTab);
  const [searchByTab, setSearchByTab] = useState<Record<GrnTabValue, string>>(createDefaultTabTextState);
  const [pageByTab, setPageByTab] = useState<Record<GrnTabValue, number>>(createDefaultTabPageState);
  const [pageSizeByTab, setPageSizeByTab] = useState<Record<GrnTabValue, StorePageSizeValue>>(createDefaultTabPageSizeState);
  const [draftFiltersByTab, setDraftFiltersByTab] = useState<Record<GrnTabValue, GrnTableFilterState>>(createDefaultTabFiltersState);
  const [appliedFiltersByTab, setAppliedFiltersByTab] = useState<Record<GrnTabValue, GrnTableFilterState>>(createDefaultTabFiltersState);
  const [isFilterPending, startFilterTransition] = useTransition();
  const [detailState, setDetailState] = useState<{ scope: RecordScope; recordId: number } | null>(null);
  const [updateState, setUpdateState] = useState<{ scope: RecordScope; recordId: number } | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [itemListPreviewRecord, setItemListPreviewRecord] = useState<GrnRecord | null>(null);
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

  const pendingQuery = useQuery({
    queryKey: ["grn-pending"],
    queryFn: async () => {
      const response = await grnApi.get<GrnListResponse>("/api/grn/pending/");
      return normalizeGrnResponse(response.data);
    },
  });

  const qcrActiveQuery = useQuery({
    queryKey: ["qcr", "active"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/");
      return response.data;
    },
  });

  const qcrMovedQuery = useQuery({
    queryKey: ["qcr", "grn"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/grn/");
      return response.data;
    },
  });

  const qcrRejectedQuery = useQuery({
    queryKey: ["qcr", "cancelled"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/cancelled/");
      return response.data;
    },
  });

  const locationLookupQuery = useQuery({
    queryKey: ["wpe-masters", "locations", "lookup", "GRN_CENTER"],
    queryFn: () => wpeMastersApi.locations.lookup({ center_type: "GRN_CENTER" }),
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
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
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
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
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
      toast.success("Gate Entry moved to QCR.");
      setMoveTarget(null);
      setDetailState((current) => (current?.scope === "active" && current.recordId === grnId ? null : current));
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move Gate Entry to QCR.")),
  });

  const pendingToQcrMutation = useMutation({
    mutationFn: async ({ grnId, items }: { grnId: number; items: PendingMoveFormItem[] }) => {
      const response = await grnApi.post(`/api/grn/${grnId}/move-pending-to-qcr/`, {
        items: items.map((item) => ({
          line_index: item.lineIndex,
          received_qty: item.receivedQty,
          store_in_id: item.storeInId,
          store_in_name: item.storeInName,
        })),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("GRN moved to QCR.");
      setPendingMoveTarget(null);
      setPendingMoveItems([]);
      setPendingMoveErrors({});
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move GRN Pending to QCR.")),
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
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to import GRN file.")),
  });

  const [qcrEntryTarget, setQcrEntryTarget] = useState<QcrRecord | null>(null);
  const [qcrEntryItems, setQcrEntryItems] = useState<QcrCompletionFormItem[]>([]);
  const [qcrEntryErrors, setQcrEntryErrors] = useState<Record<number, { rejectedQty?: string; reason?: string }>>({});
  const deferredActiveSearch = useDeferredValue(searchByTab.active.trim());
  const deferredPendingSearch = useDeferredValue(searchByTab["grn-pending"].trim());
  const deferredMovedToQcrSearch = useDeferredValue(searchByTab["moved-to-qcr"].trim());
  const deferredCompletedSearch = useDeferredValue(searchByTab["next-grn"].trim());

  const qcrCompletionMutation = useMutation<{ message?: string }, unknown, { id: number; items: QcrCompletionFormItem[] }>({
    mutationFn: async ({ id, items }: { id: number; items: QcrCompletionFormItem[] }) => {
      const response = await grnApi.post(`/api/qcr/${id}/status/`, {
        action: "complete",
        items: items.map((item) => ({
          line_index: item.lineIndex,
          rejected_qty: item.rejectedQty.trim() || "0",
          reason: item.reason.trim(),
        })),
      });
      return response.data;
    },
    onSuccess: (payload) => {
      const successMessage = readTypedMessage(payload);
      toast.success(successMessage.trim() ? successMessage : "QCR completed successfully.");
      setQcrEntryTarget(null);
      setQcrEntryItems([]);
      setQcrEntryErrors({});
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to complete QCR."));
    },
  });

  const openQcrEntryDialog = (record: QcrRecord) => {
    setQcrEntryTarget(record);
    setQcrEntryItems(buildQcrCompletionFormItems(record));
    setQcrEntryErrors({});
  };

  const closeQcrEntryDialog = () => {
    if (qcrCompletionMutation.isPending) return;
    setQcrEntryTarget(null);
    setQcrEntryItems([]);
    setQcrEntryErrors({});
  };

  const submitQcrEntry = () => {
    if (!qcrEntryTarget) return;
    const errors = getQcrItemErrors(qcrEntryItems);
    if (Object.keys(errors).length) {
      setQcrEntryErrors(errors);
      return;
    }
    qcrCompletionMutation.mutate({ id: qcrEntryTarget.id, items: qcrEntryItems });
  };

  useEffect(() => {
    setActiveTab(GRN_MODULE_META[module].defaultTab);
  }, [module]);
  const activeRecords = useMemo(() => activeQuery.data?.data ?? [], [activeQuery.data?.data]);
  const pendingRecords = useMemo(() => pendingQuery.data?.data ?? [], [pendingQuery.data?.data]);
  const movedRecords = useMemo(() => movedQuery.data?.data ?? [], [movedQuery.data?.data]);
  const locationOptions = useMemo(() => locationLookupQuery.data ?? [], [locationLookupQuery.data]);
  const qcrActiveRecords = useMemo(() => qcrActiveQuery.data ?? [], [qcrActiveQuery.data]);
  const qcrMovedRecords = useMemo(() => qcrMovedQuery.data ?? [], [qcrMovedQuery.data]);
  const qcrRejectedRecords = useMemo(() => qcrRejectedQuery.data ?? [], [qcrRejectedQuery.data]);

  const activeAppliedFilters = appliedFiltersByTab.active;
  const pendingAppliedFilters = appliedFiltersByTab["grn-pending"];
  const movedToQcrAppliedFilters = appliedFiltersByTab["moved-to-qcr"];
  const completedAppliedFilters = appliedFiltersByTab["next-grn"];

  const filteredActiveRecords = useMemo(() => {
    const search = deferredActiveSearch.toLowerCase();
    const { fromDate, toDate } = activeAppliedFilters;
    return activeRecords.filter((record) => {
      if (!isWithinDateRange(record.grn_date, fromDate, toDate)) return false;
      if (!search) return true;
      const searchable = [
        record.grn_no,
        record.item_id,
        record.product_description,
        record.supplier_details.trade_name,
        record.trade_name,
        record.document_details.po_no,
        ...record.items.flatMap((item) => [item.item_id, item.product_description]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [activeAppliedFilters, activeRecords, deferredActiveSearch]);

  const filteredPendingRecords = useMemo(() => {
    const search = deferredPendingSearch.toLowerCase();
    const { fromDate, toDate } = pendingAppliedFilters;
    return pendingRecords.filter((record) => {
      if (!isWithinDateRange(record.grn_date, fromDate, toDate)) return false;
      if (!search) return true;
      const searchable = [
        record.grn_no,
        record.item_id,
        record.product_description,
        record.supplier_details.trade_name,
        record.trade_name,
        record.document_details.po_no,
        ...record.items.flatMap((item) => [item.item_id, item.product_description]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [deferredPendingSearch, pendingAppliedFilters, pendingRecords]);

  const filteredQcrActiveRecords = useMemo(() => {
    const search = deferredMovedToQcrSearch.toLowerCase();
    const { fromDate, toDate } = movedToQcrAppliedFilters;
    return qcrActiveRecords.filter((record) => {
      if (!isWithinDateRange(record.moved_to_qcr_at, fromDate, toDate)) return false;
      if (!search) return true;
      const searchable = [
        record.grn_reference_no,
        getQcrField(record, "product_description"),
        getQcrField(record, "trade_name"),
        getQcrField(record, "item_id"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [deferredMovedToQcrSearch, movedToQcrAppliedFilters, qcrActiveRecords]);

  const completedGrnRecords = useMemo(() => [...qcrMovedRecords, ...qcrRejectedRecords], [qcrMovedRecords, qcrRejectedRecords]);

  const filteredCompletedGrnRows = useMemo(() => {
    const search = deferredCompletedSearch.toLowerCase();
    const { fromDate, toDate, status } = completedAppliedFilters;
    return completedGrnRecords.flatMap((record) => {
      if (!isWithinDateRange(record.moved_to_qcr_at, fromDate, toDate)) return [];
      const searchable = [
        record.grn_reference_no,
        getQcrField(record, "product_description"),
        getQcrField(record, "trade_name"),
        getQcrField(record, "item_id"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (search && !searchable.includes(search)) {
        return [];
      }

      return getCompletedGrnDisplayRows(record).filter((row) => {
        if (status && status !== "Partial Rejected" && row.displayStatus !== status) {
          return false;
        }
        if (status === "Partial Rejected" && row.statusGroup !== "Partial Rejected") {
          return false;
        }
        return true;
      });
    });
  }, [completedAppliedFilters, completedGrnRecords, deferredCompletedSearch]);

  const rowsByTab: Record<GrnTabValue, GrnRecord[] | QcrRecord[] | CompletedGrnDisplayRow[]> = {
    active: filteredActiveRecords,
    "grn-pending": filteredPendingRecords,
    "moved-to-qcr": filteredQcrActiveRecords,
    "next-grn": filteredCompletedGrnRows,
    rejected: qcrRejectedRecords,
  };

  const paginatedRowsByTab: Record<GrnTabValue, GrnRecord[] | QcrRecord[] | CompletedGrnDisplayRow[]> = {
    active: paginateRows(filteredActiveRecords, pageByTab.active, pageSizeByTab.active),
    "grn-pending": paginateRows(filteredPendingRecords, pageByTab["grn-pending"], pageSizeByTab["grn-pending"]),
    "moved-to-qcr": paginateRows(filteredQcrActiveRecords, pageByTab["moved-to-qcr"], pageSizeByTab["moved-to-qcr"]),
    "next-grn": paginateRows(filteredCompletedGrnRows, pageByTab["next-grn"], pageSizeByTab["next-grn"]),
    rejected: paginateRows(qcrRejectedRecords, pageByTab.rejected, pageSizeByTab.rejected),
  };

  useEffect(() => {
    const totalsByTab: Record<GrnTabValue, number> = {
      active: filteredActiveRecords.length,
      "grn-pending": filteredPendingRecords.length,
      "moved-to-qcr": filteredQcrActiveRecords.length,
      "next-grn": filteredCompletedGrnRows.length,
      rejected: qcrRejectedRecords.length,
    };
    grnTabs.forEach((tab) => {
      const totalPages = getPageCount(pageSizeByTab[tab], totalsByTab[tab]);
      if (pageByTab[tab] > totalPages) {
        setPageByTab((current) => ({ ...current, [tab]: totalPages }));
      }
    });
  }, [
    filteredActiveRecords.length,
    filteredPendingRecords.length,
    filteredQcrActiveRecords.length,
    filteredCompletedGrnRows.length,
    qcrRejectedRecords.length,
    pageByTab,
    pageSizeByTab,
  ]);

  const detailRecord = useMemo(() => {
    if (!detailState) {
      return null;
    }
    const records = detailState.scope === "active" ? activeRecords : movedRecords;
    return records.find((record) => record.id === detailState.recordId) ?? null;
  }, [activeRecords, detailState, movedRecords]);

  const updateRecord = useMemo(() => {
    if (!updateState) {
      return null;
    }
    const records = updateState.scope === "active" ? activeRecords : movedRecords;
    return records.find((record) => record.id === updateState.recordId) ?? null;
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

  const openPendingMoveDialog = (record: GrnRecord) => {
    setPendingMoveTarget(record);
    setPendingMoveItems(buildPendingMoveFormItems(record));
    setPendingMoveErrors({});
  };

  const closePendingMoveDialog = () => {
    if (pendingToQcrMutation.isPending) return;
    setPendingMoveTarget(null);
    setPendingMoveItems([]);
    setPendingMoveErrors({});
  };

  const submitPendingMove = () => {
    if (!pendingMoveTarget) return;

    const nextErrors: Record<number, { receivedQty?: string; storeIn?: string }> = {};
    pendingMoveItems.forEach((item, index) => {
      const receivedQtyError = getReceivedQtyError(item.receivedQty, item.sentQty);
      if (receivedQtyError) {
        nextErrors[index] = { ...(nextErrors[index] ?? {}), receivedQty: receivedQtyError };
      }

      if (!item.storeInId.trim()) {
        nextErrors[index] = { ...(nextErrors[index] ?? {}), storeIn: "Store In is required." };
      }
    });

    setPendingMoveErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    pendingToQcrMutation.mutate({ grnId: pendingMoveTarget.id, items: pendingMoveItems });
  };

  const currentSearch = searchByTab[activeTab];
  const currentPageSize = pageSizeByTab[activeTab];
  const currentDraftFilters = draftFiltersByTab[activeTab];
  const currentRows = rowsByTab[activeTab];
  const visibleTabs = module === "process" ? processTabs : statusTabs;
  const showCompletedStatusFilter = activeTab === "next-grn";
  const isPendingMoveReady =
    pendingMoveItems.length > 0 &&
    pendingMoveItems.every((item) => item.receivedQty.trim() && item.storeInId.trim() && isValidReceivedQty(item.receivedQty, item.sentQty));

  const handleToolbarExport = (format: StoreExportFormat) => {
    if (activeTab === "active" || activeTab === "grn-pending") {
      const isPendingTab = activeTab === "grn-pending";
      const rows = isPendingTab ? filteredPendingRecords : filteredActiveRecords;
      const columns: StoreExportColumn<GrnRecord>[] = [
        { label: "S.No", value: (_row, index) => index + 1 },
        { label: "GRN Reference", value: (row) => row.grn_no },
        { label: "Supplier", value: (row) => row.supplier_details.trade_name || row.trade_name || "-" },
        {
          label: "Item",
          value: (row) => {
            const summary = getActiveItemSummary(row);
            return summary.extra ? `${summary.title} ${summary.extra}` : summary.title;
          },
        },
        { label: "Quantity", value: (row) => formatDecimal(getPrimaryItemQuantity(row)) },
        { label: "Status", value: (row) => row.process_status },
        { label: "GRN Date", value: (row) => formatDate(row.grn_date) },
      ];
      exportTableData({
        title: isPendingTab ? "GRN Pending Records" : "Gate Entry Records",
        filename: isPendingTab ? "grn-pending-records" : "gate-entry-records",
        rows,
        columns,
        format,
      });
      return;
    }

    const qcrTab: Exclude<GrnTabValue, "active"> = activeTab === "moved-to-qcr" ? "moved-to-qcr" : "next-grn";
    const rows =
      activeTab === "moved-to-qcr"
        ? filteredQcrActiveRecords
        : activeTab === "next-grn"
          ? filteredCompletedGrnRows
          : qcrRejectedRecords;
    const columns: StoreExportColumn<QcrRecord | CompletedGrnDisplayRow>[] = [
      { label: "S.No", value: (_row, index) => index + 1 },
      {
        label: "Ref .No",
        value: (row) => ("record" in row ? row.record.grn_reference_no : row.grn_reference_no),
      },
      {
        label: "GRN No",
        value: (row: QcrRecord | CompletedGrnDisplayRow) =>
          "record" in row ? row.record.generated_grn_no || "-" : row.generated_grn_no || "-",
      },
      {
        label: "Item",
        value: (row) => ("record" in row ? readText(getQcrField(row.record, "product_description")) : readText(getQcrField(row, "product_description"))),
      },
      {
        label: "Quantity",
        value: (row) => ("record" in row ? formatDecimal(row.quantity) : formatDecimal(getQcrDisplayQuantity(row, qcrTab))),
      },
      {
        label: "Status",
        value: (row) => ("record" in row ? row.displayStatus : getQcrDisplayStatus(row, qcrTab)),
      },
      {
        label: "Moved To QCR",
        value: (row) => ("record" in row ? formatDateTime(row.record.moved_to_qcr_at) : formatDateTime(row.moved_to_qcr_at)),
      },
      {
        label: "Moved By",
        value: (row) => ("record" in row ? row.record.moved_to_qcr_by || "-" : row.moved_to_qcr_by || "-"),
      },
    ];
    exportTableData({
      title: activeTab === "next-grn" ? "GRN Completed Records" : "GRN QCR Records",
      filename: activeTab === "next-grn" ? "grn-completed-records" : `grn-${activeTab}-records`,
      rows,
      columns,
      format,
    });
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
                      Move to GRN Pending
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

  const renderQcrTable = (tab: Exclude<GrnTabValue, "active">, records: QcrRecord[]) => {
    if (!records.length) {
      return <EmptyState title="No records found" description="This stage currently has no records." />;
    }
    const paginatedRows = paginatedRowsByTab[tab] as QcrRecord[];
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Ref .No</TableHead>
                <TableHead>GRN No</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moved To QCR</TableHead>
                <TableHead>Moved By</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((record, index) => {
                const displayStatus = getQcrDisplayStatus(record, tab);
                const badgeClassName =
                  tab === "moved-to-qcr"
                    ? "border-warning/20 bg-warning/10 text-warning"
                    : displayStatus === "Partial Rejected"
                      ? "border-warning/20 bg-warning/10 text-warning"
                      : displayStatus === "Rejected"
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : "border-success/20 bg-success/10 text-success";

                return (
                  <TableRow
                    key={record.id}
                    className={cn("transition-colors hover:bg-muted/50", record.status === "Active" ? "cursor-pointer" : "")}
                    onClick={() => {
                      if (record.status === "Active") {
                        openQcrEntryDialog(record);
                      }
                    }}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {getPageSerialNumber(pageByTab[tab], pageSizeByTab[tab], records.length, index)}
                    </TableCell>
                    <TableCell className="font-medium">{record.grn_reference_no}</TableCell>
                    <TableCell className="font-medium">{record.generated_grn_no || "-"}</TableCell>
                    <TableCell>{readText(getQcrField(record, "product_description"))}</TableCell>
                    <TableCell>{formatDecimal(getQcrDisplayQuantity(record, tab))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeClassName}>
                        {displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(record.moved_to_qcr_at)}</TableCell>
                    <TableCell>{record.moved_to_qcr_by || "-"}</TableCell>
                    <TableCell className="text-right">
                      {record.status === "Active" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            openQcrEntryDialog(record);
                          }}
                          disabled={qcrCompletionMutation.isPending}
                        >
                          Open
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <StoreTablePagination
          page={pageByTab[tab]}
          pageSize={getPageSizeNumber(pageSizeByTab[tab], records.length)}
          total={records.length}
          onPageChange={(value) => setPageByTab((current) => ({ ...current, [tab]: value }))}
        />
      </Card>
    );
  };

  const renderCompletedGrnTable = (rows: CompletedGrnDisplayRow[]) => {
    if (!rows.length) {
      return <EmptyState title="No records found" description="This stage currently has no records." />;
    }

    const paginatedRows = paginatedRowsByTab["next-grn"] as CompletedGrnDisplayRow[];

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>GRN No</TableHead>
                <TableHead>Ref .No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moved To QCR</TableHead>
                <TableHead>Moved By</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, index) => {
                const badgeClassName =
                  row.statusGroup === "Partial Rejected"
                    ? "border-warning/20 bg-warning/10 text-warning"
                    : row.displayStatus === "Rejected"
                      ? "border-destructive/20 bg-destructive/10 text-destructive"
                      : "border-success/20 bg-success/10 text-success";

                return (
                  <TableRow key={row.rowId} className="transition-colors hover:bg-muted/50">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {getPageSerialNumber(pageByTab["next-grn"], pageSizeByTab["next-grn"], rows.length, index)}
                    </TableCell>
                    <TableCell className="font-medium">{row.statusGroup === "Approved" ? row.record.generated_grn_no || "-" : "-"}</TableCell>
                    <TableCell className="font-medium">{row.record.grn_reference_no}</TableCell>
                    <TableCell>{readText(getQcrField(row.record, "trade_name"))}</TableCell>
                    <TableCell>{readText(getQcrField(row.record, "product_description"))}</TableCell>
                    <TableCell>{formatDecimal(row.quantity)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeClassName}>
                        {row.displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(row.record.moved_to_qcr_at)}</TableCell>
                    <TableCell>{row.record.moved_to_qcr_by || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">—</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <StoreTablePagination
          page={pageByTab["next-grn"]}
          pageSize={getPageSizeNumber(pageSizeByTab["next-grn"], rows.length)}
          total={rows.length}
          onPageChange={(value) => setPageByTab((current) => ({ ...current, "next-grn": value }))}
        />
      </Card>
    );
  };

  const renderActiveTable = (records: GrnRecord[]) => {
    if (!records.length) {
      return <EmptyState title="No Gate Entry records" description="Create a GRN or import an Excel workbook to populate the Gate Entry queue." />;
    }

    const paginatedRows = paginatedRowsByTab.active as GrnRecord[];

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Ref .No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO No</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total After Tax</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((record, index) => {
                const itemSummary = getActiveItemSummary(record);
                return (
                  <TableRow key={record.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {getPageSerialNumber(pageByTab.active, pageSizeByTab.active, records.length, index)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.grn_no}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(record.grn_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.supplier_details.trade_name || record.trade_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{record.document_details.supplier_invoice_no || "No invoice"}</div>
                    </TableCell>
                    <TableCell>{record.document_details.po_no || "-"}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="space-y-0.5 text-left transition-colors hover:text-primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setItemListPreviewRecord(record);
                        }}
                      >
                        <div className="font-medium text-card-foreground">{itemSummary.title}</div>
                        {itemSummary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{itemSummary.subtitle}</div> : null}
                        {itemSummary.extra ? <div className="text-xs text-primary">{itemSummary.extra}</div> : null}
                      </button>
                    </TableCell>
                    <TableCell>{formatDecimal(getPrimaryItemQuantity(record))}</TableCell>
                    <TableCell>{formatDecimal(record.value_details.total_after_tax ?? record.total_after_tax, 2)}</TableCell>
                    <TableCell>{record.document_requirement_details.req_department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                        {record.process_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => navigate(getGrnProcessEditRoute(record.id))}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <StoreTablePagination
          page={pageByTab.active}
          pageSize={getPageSizeNumber(pageSizeByTab.active, records.length)}
          total={records.length}
          onPageChange={(value) => setPageByTab((current) => ({ ...current, active: value }))}
        />
      </Card>
    );
  };

  const renderPendingTable = (records: GrnRecord[]) => {
    if (!records.length) {
      return <EmptyState title="No GRN Pending records" description="Records moved from Gate Entry will appear here for QCR handoff." />;
    }

    const paginatedRows = paginatedRowsByTab["grn-pending"] as GrnRecord[];

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Ref .No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO No</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Sent Qty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((record, index) => {
                const itemSummary = getActiveItemSummary(record);
                return (
                  <TableRow key={record.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {getPageSerialNumber(pageByTab["grn-pending"], pageSizeByTab["grn-pending"], records.length, index)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.grn_no}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(record.grn_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{record.supplier_details.trade_name || record.trade_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{record.document_details.supplier_invoice_no || "No invoice"}</div>
                    </TableCell>
                    <TableCell>{record.document_details.po_no || "-"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-card-foreground">{itemSummary.title}</div>
                      {itemSummary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{itemSummary.subtitle}</div> : null}
                      {itemSummary.extra ? <div className="text-xs text-primary">{itemSummary.extra}</div> : null}
                    </TableCell>
                    <TableCell>{formatDecimal(getPrimaryItemQuantity(record))}</TableCell>
                    <TableCell>{record.document_requirement_details.req_department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
                        {record.process_status || GRN_PENDING_STATUS}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openPendingMoveDialog(record)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <StoreTablePagination
          page={pageByTab["grn-pending"]}
          pageSize={getPageSizeNumber(pageSizeByTab["grn-pending"], records.length)}
          total={records.length}
          onPageChange={(value) => setPageByTab((current) => ({ ...current, "grn-pending": value }))}
        />
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {module === "status" ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            className="h-auto rounded-none px-0 text-sm font-semibold text-slate-600 hover:bg-transparent hover:text-slate-950"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      ) : null}
      <PageHeader
        title={GRN_MODULE_META[module].title}
        description={GRN_MODULE_META[module].description}
        actions={
          <>
            {module === "process" ? (
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
              </>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                activeQuery.refetch();
                pendingQuery.refetch();
                movedQuery.refetch();
                qcrActiveQuery.refetch();
                qcrMovedQuery.refetch();
                qcrRejectedQuery.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {module === "process" ? (
              <Button onClick={() => navigate(GRN_PROCESS_CREATE_ROUTE)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Gate Entry
              </Button>
            ) : null}
          </>
        }
      />

      {activeQuery.isLoading || pendingQuery.isLoading || qcrActiveQuery.isLoading || qcrMovedQuery.isLoading || qcrRejectedQuery.isLoading || locationLookupQuery.isLoading ? (
        <LoadingState label="Loading GRN records..." />
      ) : null}
      {activeQuery.isError || pendingQuery.isError || qcrActiveQuery.isError || qcrMovedQuery.isError || qcrRejectedQuery.isError || locationLookupQuery.isError ? (
        <ErrorState description="GRN records could not be loaded from the GRN service." />
      ) : null}

      {!activeQuery.isLoading && !pendingQuery.isLoading && !qcrActiveQuery.isLoading && !qcrMovedQuery.isLoading && !qcrRejectedQuery.isLoading &&
       !activeQuery.isError && !pendingQuery.isError && !qcrActiveQuery.isError && !qcrMovedQuery.isError && !qcrRejectedQuery.isError && !locationLookupQuery.isError ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GrnTabValue)} className="space-y-4">
          <TabsList>
            {visibleTabs.includes("active") ? <TabsTrigger value="active">Gate Entry</TabsTrigger> : null}
            {visibleTabs.includes("grn-pending") ? <TabsTrigger value="grn-pending">GRN Pending</TabsTrigger> : null}
            {visibleTabs.includes("moved-to-qcr") ? <TabsTrigger value="moved-to-qcr">QCR</TabsTrigger> : null}
            {visibleTabs.includes("next-grn") ? <TabsTrigger value="next-grn">Completed GRN</TabsTrigger> : null}
          </TabsList>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <StoreTableToolbar
              searchValue={currentSearch}
              onSearchChange={(value) => {
                setSearchByTab((current) => ({ ...current, [activeTab]: value }));
                setPageByTab((current) => ({ ...current, [activeTab]: 1 }));
              }}
              filterContent={
                <div className={cn("grid gap-3 md:grid-cols-2", showCompletedStatusFilter ? "xl:grid-cols-[1fr_1fr_1fr_auto]" : "xl:grid-cols-[1fr_1fr_auto]")}>
                  <div className="space-y-1">
                    <label htmlFor={`grn-filter-from-${activeTab}`} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      From Date
                    </label>
                    <Input
                      id={`grn-filter-from-${activeTab}`}
                      type="date"
                      value={currentDraftFilters.fromDate}
                      onChange={(event) =>
                        setDraftFiltersByTab((current) => ({
                          ...current,
                          [activeTab]: { ...current[activeTab], fromDate: event.target.value },
                        }))
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`grn-filter-to-${activeTab}`} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      To Date
                    </label>
                    <Input
                      id={`grn-filter-to-${activeTab}`}
                      type="date"
                      value={currentDraftFilters.toDate}
                      onChange={(event) =>
                        setDraftFiltersByTab((current) => ({
                          ...current,
                          [activeTab]: { ...current[activeTab], toDate: event.target.value },
                        }))
                      }
                      className="h-9"
                    />
                  </div>
                  {showCompletedStatusFilter ? (
                    <div className="space-y-1">
                      <label htmlFor={`grn-filter-status-${activeTab}`} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Status
                      </label>
                      <Select
                        value={currentDraftFilters.status || "__all__"}
                        onValueChange={(value) =>
                          setDraftFiltersByTab((current) => ({
                            ...current,
                            [activeTab]: { ...current[activeTab], status: value === "__all__" ? "" : value },
                          }))
                        }
                      >
                        <SelectTrigger id={`grn-filter-status-${activeTab}`} className="h-9">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All statuses</SelectItem>
                          {completedGrnStatusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="h-9 w-full"
                      disabled={isFilterPending}
                      onClick={() =>
                        startFilterTransition(() => {
                          setAppliedFiltersByTab((current) => ({ ...current, [activeTab]: draftFiltersByTab[activeTab] }));
                          setPageByTab((current) => ({ ...current, [activeTab]: 1 }));
                        })
                      }
                    >
                      Go
                    </Button>
                  </div>
                </div>
              }
              pageSize={currentPageSize}
              onPageSizeChange={(value) => {
                setPageSizeByTab((current) => ({ ...current, [activeTab]: value }));
                setPageByTab((current) => ({ ...current, [activeTab]: 1 }));
              }}
              onExport={handleToolbarExport}
              summaryText={`${currentRows.length} records in the current result set`}
              isFetching={
                activeQuery.isFetching ||
                pendingQuery.isFetching ||
                movedQuery.isFetching ||
                qcrActiveQuery.isFetching ||
                qcrMovedQuery.isFetching ||
                qcrRejectedQuery.isFetching
              }
            />

            {visibleTabs.includes("active") ? (
              <TabsContent value="active">{renderActiveTable(filteredActiveRecords)}</TabsContent>
            ) : null}
            {visibleTabs.includes("grn-pending") ? (
              <TabsContent value="grn-pending">{renderPendingTable(filteredPendingRecords)}</TabsContent>
            ) : null}
            {visibleTabs.includes("moved-to-qcr") ? (
              <TabsContent value="moved-to-qcr">{renderQcrTable("moved-to-qcr", filteredQcrActiveRecords)}</TabsContent>
            ) : null}
            {visibleTabs.includes("next-grn") ? (
              <TabsContent value="next-grn">{renderCompletedGrnTable(filteredCompletedGrnRows)}</TabsContent>
            ) : null}
          </div>
        </Tabs>
      ) : null}

      {renderDetailSheet()}

      <Dialog open={Boolean(itemListPreviewRecord)} onOpenChange={(open) => !open && setItemListPreviewRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{itemListPreviewRecord?.grn_no || "GRN Items"}</DialogTitle>
            <DialogDescription>All products for the selected GRN record.</DialogDescription>
          </DialogHeader>
          {itemListPreviewRecord ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Accepted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(itemListPreviewRecord.items.length ? itemListPreviewRecord.items : [defaultItem]).map((item, index) => (
                    <TableRow key={`${itemListPreviewRecord.id}-${item.item_id || "line"}-${index}`}>
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>{item.product_description || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.item_id || "-"}</TableCell>
                      <TableCell className="text-right">{formatDecimal(item.quantity ?? item.total_quantity)}</TableCell>
                      <TableCell className="text-right">{formatDecimal(item.accepted_qty)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
                                                  max={
                                                    sectionField.formPath === "document_details.gateentry_bookdate" &&
                                                    sectionField.type === "date"
                                                      ? todayDateInputValue
                                                      : undefined
                                                  }
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

      <Dialog open={Boolean(pendingMoveTarget)} onOpenChange={(open) => !open && closePendingMoveDialog()}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Move to QCR</DialogTitle>
            <DialogDescription>
              Complete received quantity and store allocation for every item in <span className="font-semibold">{pendingMoveTarget?.grn_no}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">GRN Reference</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{pendingMoveTarget?.grn_no ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Supplier</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{pendingMoveTarget?.supplier_details.trade_name || pendingMoveTarget?.trade_name || "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{pendingMoveTarget?.process_status ?? GRN_PENDING_STATUS}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.no</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="w-40">Sent Qty</TableHead>
                    <TableHead className="w-64">
                      Received Qty <span className="text-destructive">*</span>
                    </TableHead>
                    <TableHead className="w-72">
                      Store In <span className="text-destructive">*</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMoveItems.map((item, index) => (
                    <TableRow key={`${item.lineIndex}-${index}`} className="align-top">
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.itemName}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {item.sentQty || "-"}{item.unit ? ` ${item.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Label htmlFor={`pending-received-${index}`} className="sr-only">
                            Received Qty
                          </Label>
                          <Input
                            id={`pending-received-${index}`}
                            inputMode="decimal"
                            value={item.receivedQty}
                            onKeyDown={(event) => {
                              if (shouldBlockQuantityKey(event.key)) {
                                event.preventDefault();
                              }
                            }}
                            onPaste={(event) => {
                              const pastedValue = event.clipboardData.getData("text");
                              const pastedError = getReceivedQtyError(pastedValue, item.sentQty);
                              if (pastedError) {
                                event.preventDefault();
                                setPendingMoveErrors((current) => ({ ...current, [index]: { ...current[index], receivedQty: pastedError } }));
                              }
                            }}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              const nextError = nextValue.trim() ? getReceivedQtyError(nextValue, item.sentQty) : undefined;
                              if (nextError) {
                                setPendingMoveErrors((current) => ({ ...current, [index]: { ...current[index], receivedQty: nextError } }));
                                return;
                              }
                              setPendingMoveItems((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, receivedQty: nextValue } : entry)));
                              setPendingMoveErrors((current) => ({ ...current, [index]: { ...current[index], receivedQty: undefined } }));
                            }}
                            placeholder="Enter received quantity"
                            className={pendingMoveErrors[index]?.receivedQty ? "border-destructive" : ""}
                          />
                          {pendingMoveErrors[index]?.receivedQty ? <p className="text-xs text-destructive">{pendingMoveErrors[index]?.receivedQty}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Label htmlFor={`pending-store-${index}`} className="sr-only">
                            Store In
                          </Label>
                          <Select
                            value={item.storeInId}
                            onValueChange={(value) => {
                              const selectedOption = locationOptions.find((option) => String(option.id) === value);
                              setPendingMoveItems((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        storeInId: value,
                                        storeInName: selectedOption?.name ?? "",
                                      }
                                    : entry,
                                ),
                              );
                              setPendingMoveErrors((current) => ({ ...current, [index]: { ...current[index], storeIn: undefined } }));
                            }}
                          >
                            <SelectTrigger id={`pending-store-${index}`} className={pendingMoveErrors[index]?.storeIn ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locationOptions.map((option) => (
                                <SelectItem key={option.id} value={String(option.id)}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {pendingMoveErrors[index]?.storeIn ? <p className="text-xs text-destructive">{pendingMoveErrors[index]?.storeIn}</p> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePendingMoveDialog} disabled={pendingToQcrMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitPendingMove} disabled={pendingToQcrMutation.isPending || !isPendingMoveReady}>
              {pendingToQcrMutation.isPending ? "Moving..." : "Move to QCR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(moveTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMoveTarget(null);
          }
        }}
        title="Move Gate Entry to GRN Pending"
        description={`Move ${moveTarget?.grn_no ?? "this GRN"} to GRN Pending? This completes Gate Entry and sends the record to the pending handoff queue.`}
        confirmLabel="Move to GRN Pending"
        onConfirm={() => {
          if (moveTarget) {
            moveMutation.mutate(moveTarget.id);
          }
        }}
      />

      <Dialog open={Boolean(qcrEntryTarget)} onOpenChange={(open) => !open && closeQcrEntryDialog()}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>QCR Entry</DialogTitle>
            <DialogDescription>
              Review every received line for <span className="font-semibold">{qcrEntryTarget?.grn_reference_no}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ref. No</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{qcrEntryTarget?.grn_reference_no ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Supplier</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {qcrEntryTarget ? readText(getQcrField(qcrEntryTarget, "trade_name")) : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                <div className="mt-1 text-sm font-semibold text-foreground">QCR</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.no</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="w-40">Sent Qty</TableHead>
                    <TableHead className="w-48">Accepted Qty</TableHead>
                    <TableHead className="w-56">Rejected Qty</TableHead>
                    <TableHead className="w-80">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcrEntryItems.map((item, index) => (
                    <TableRow key={`${item.lineIndex}-${index}`} className="align-top">
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.itemName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.itemId || "-"}{item.unit ? ` | ${item.unit}` : ""}{item.storeInName ? ` | Store In: ${item.storeInName}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {item.sentQty || "-"}{item.unit ? ` ${item.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={`qcr-accepted-${index}`} className="sr-only">
                          Accepted Qty
                        </Label>
                        <Input
                          id={`qcr-accepted-${index}`}
                          value={item.acceptedQty}
                          readOnly
                          tabIndex={-1}
                          className="bg-muted/40 text-foreground"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Label htmlFor={`qcr-rejected-${index}`} className="sr-only">
                            Rejected Qty
                          </Label>
                          <Input
                            id={`qcr-rejected-${index}`}
                            inputMode="decimal"
                            value={item.rejectedQty}
                            onKeyDown={(event) => {
                              if (shouldBlockQuantityKey(event.key)) {
                                event.preventDefault();
                              }
                            }}
                            onPaste={(event) => {
                              const pastedValue = event.clipboardData.getData("text");
                              const pastedError = getRejectedQtyError(pastedValue, item.receivedQty);
                              if (pastedError) {
                                event.preventDefault();
                                setQcrEntryErrors((current) => ({ ...current, [index]: { ...current[index], rejectedQty: pastedError } }));
                              }
                            }}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              const nextError = getRejectedQtyError(nextValue, item.receivedQty);
                              if (nextError) {
                                setQcrEntryErrors((current) => ({ ...current, [index]: { ...current[index], rejectedQty: nextError } }));
                                return;
                              }
                              setQcrEntryItems((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        rejectedQty: nextValue,
                                        acceptedQty: calculateAcceptedQty(entry.receivedQty, nextValue) || "",
                                      }
                                    : entry,
                                ),
                              );
                              setQcrEntryErrors((current) => ({ ...current, [index]: { ...current[index], rejectedQty: undefined } }));
                            }}
                            placeholder="Enter rejected quantity"
                            className={qcrEntryErrors[index]?.rejectedQty ? "border-destructive" : ""}
                          />
                          {qcrEntryErrors[index]?.rejectedQty ? <p className="text-xs text-destructive">{qcrEntryErrors[index]?.rejectedQty}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Label htmlFor={`qcr-reason-${index}`} className="sr-only">
                            Reason{item.rejectedQty.trim() && Number(item.rejectedQty) > 0 ? " required" : ""}
                          </Label>
                          <Textarea
                            id={`qcr-reason-${index}`}
                            rows={2}
                            value={item.reason}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setQcrEntryItems((current) =>
                                current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, reason: nextValue } : entry)),
                              );
                              setQcrEntryErrors((current) => ({ ...current, [index]: { ...current[index], reason: undefined } }));
                            }}
                            placeholder="Enter rejection reason"
                            className={qcrEntryErrors[index]?.reason ? "border-destructive" : ""}
                          />
                          {qcrEntryErrors[index]?.reason ? <p className="text-xs text-destructive">{qcrEntryErrors[index]?.reason}</p> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQcrEntryDialog} disabled={qcrCompletionMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitQcrEntry} disabled={qcrCompletionMutation.isPending || !qcrEntryItems.length}>
              {qcrCompletionMutation.isPending ? "Submitting..." : "Submit QCR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GRNPage;
