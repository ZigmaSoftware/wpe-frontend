import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Edit3,
  EllipsisVertical,
  FileSpreadsheet,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type InwardStatus =
  | "goods_in_transit"
  | "gate_entry"
  | "grn_process"
  | "qcr"
  | "grn_scan"
  | "grn"
  | "grn_manual"
  | "material_in"
  | "purchase_inward"
  | "purchase_return"
  | "iut_in_transit"
  | "iut_received"
  | "iut_scanned"
  | "cancelled";

interface LegacyInwardRecord {
  id: string;
  poRef: string;
  supplier: string;
  items: number;
  amount: number;
  status: InwardStatus;
  date: string;
  grnNo: string;
  gateEntryNo: string;
  vehicle: string;
  warehouse: string;
}

interface GRNRecord {
  id: number;
  po_no: string | null;
  po_date: string | null;
  grn_no: string;
  grn_date: string | null;
  supplier_invoice_no: string | null;
  supplier_invoice_date: string | null;
  gateentry_bookno: string | null;
  gateentry_bookdate: string | null;
  tolerance: string | null;
  req_date: string | null;
  req_person_name: string | null;
  req_person_id: string | null;
  req_department: string | null;
  req_reason: string | null;
  supplier_id: string | null;
  gstin: string | null;
  contact_name: string | null;
  trade_name: string | null;
  contact_type: string | null;
  address1: string | null;
  address2: string | null;
  location: string | null;
  pincode: string | null;
  state_name: string | null;
  state_code: string | null;
  country: string | null;
  person_name: string | null;
  phone_number: string | null;
  email: string | null;
  category: string | null;
  segment: string | null;
  sub_segment: string | null;
  sales_contact_id: string | null;
  currency: string | null;
  item_id: string | null;
  item_serial_number: number | null;
  product_description: string | null;
  hsn_code: string | null;
  total_quantity: string | number | null;
  quantity: string | number | null;
  free_quantity: string | number | null;
  accepted_qty: string | number | null;
  rejected_qty: string | number | null;
  unit: string | null;
  unit_price: string | number | null;
  total_amount: string | number | null;
  discount: string | null;
  assessable_value: string | number | null;
  gst_rate: string | number | null;
  igst_amount: string | number | null;
  cgst_amount: string | number | null;
  sgst_amount: string | number | null;
  total_item_value: string | number | null;
  freight_charge: string | number | null;
  loading_unloading_charge: string | null;
  total_before_tax: string | number | null;
  total_tax_amount: string | number | null;
  total_after_tax: string | number | null;
  created_at: string;
  updated_at: string;
  status: boolean;
  process_status: string;
  moved_to_qcr_at: string | null;
  moved_to_qcr_by: string | null;
  // New GRN fields
  qc_status: string | null;
  purchase_bill_no: string | null;
  purchase_bill_date: string | null;
  dc_numbers: string | null;
  delivery_days_gap: string | number | null;
  delivery_note_no: string | null;
  delivery_note_date: string | null;
  order_rating: string | number | null;
  grn_warehouse: string | null;
  source_warehouse: string | null;
  accepted_warehouse: string | null;
  rejected_warehouse: string | null;
  invoice_details: {
    purchase_bill_no: string | null;
    purchase_bill_date: string | null;
    dc_numbers: string | null;
    delivery_days_gap: number | null;
    delivery_note_no: string | null;
    delivery_note_date: string | null;
    order_rating: number | null;
    grn_warehouse: string | null;
    source_warehouse: string | null;
    accepted_warehouse: string | null;
    rejected_warehouse: string | null;
  } | null;
}

interface NestedGrnRecord extends Partial<GRNRecord> {
  document_details?: Partial<GRNRecord>;
  document_requirement_details?: Partial<GRNRecord>;
  supplier_details?: Partial<GRNRecord>;
  items?: Array<Partial<GRNRecord>>;
  value_details?: Partial<GRNRecord>;
}

interface QCRRecord {
  id: number;
  source_grn: number;
  source_grn_data: GRNRecord;
  grn_reference_no: string;
  snapshot: GRNRecord;
  status: string;
  moved_to_qcr_at: string;
  moved_to_qcr_by: string | null;
  created_at: string;
  updated_at: string;
}

type QcrAction = "move_to_grn" | "reject";

interface ImportError {
  row: number;
  message: string;
  details?: Record<string, unknown>;
}

interface ImportResponse {
  created_count: number;
  failed_count: number;
  processed_count: number;
  errors: ImportError[];
  detail?: string;
}

interface SummaryStat {
  label: string;
  value: string;
}

// GRN Edit Sheet form state
interface GrnEditFormState {
  // Invoice/Order Details (editable)
  dc_numbers: string;
  delivery_days_gap: string;
  supplier_invoice_no: string;
  supplier_invoice_date: string;
  order_rating: string;
  gateentry_bookno: string;
  gateentry_bookdate: string;
  grn_warehouse: string;
  source_warehouse: string;
  accepted_warehouse: string;
  rejected_warehouse: string;
  delivery_note_no: string;
  delivery_note_date: string;
  // Requirement (editable)
  req_date: string;
  req_person_name: string;
  req_department: string;
  req_reason: string;
}

const GRN_API_URL = import.meta.env.VITE_GRN_API_URL ?? "/api/grn/";
const GRN_MOVED_API_URL = import.meta.env.VITE_GRN_MOVED_API_URL ?? "/api/grn/moved/";
const GRN_IMPORT_API_URL = import.meta.env.VITE_GRN_IMPORT_API_URL ?? "/api/grn/import/";
const QCR_API_URL = import.meta.env.VITE_QCR_API_URL ?? "/api/qcr/";
const GRN_MOVE_TO_QCR_API_URL = import.meta.env.VITE_GRN_MOVE_TO_QCR_API_URL ?? "/api/grn";
const QCR_STATUS_API_URL = import.meta.env.VITE_QCR_STATUS_API_URL ?? "/api/qcr";
const QCR_CANCELLED_API_URL = import.meta.env.VITE_QCR_CANCELLED_API_URL ?? "/api/qcr/cancelled/";
const GRN_DETAIL_API_URL = import.meta.env.VITE_GRN_DETAIL_API_URL ?? "/api/grn";

const MOVE_TO_QCR_MANDATORY_FIELDS: Array<keyof GRNRecord> = [
  "supplier_id",
  "supplier_invoice_no",
  "supplier_invoice_date",
  "delivery_note_no",
  "delivery_note_date",
  "gateentry_bookno",
  "grn_warehouse",
  "accepted_warehouse",
  "rejected_warehouse",
];

const MOVE_TO_QCR_FIELD_LABELS: Record<string, string> = {
  supplier_id: "Supplier ID",
  supplier_invoice_no: "Supplier Invoice No",
  supplier_invoice_date: "Supplier Invoice Date",
  delivery_note_no: "Delivery Note No",
  delivery_note_date: "Delivery Note Date",
  gateentry_bookno: "Gate Entry Book No",
  grn_warehouse: "GRN Warehouse",
  accepted_warehouse: "Accepted Warehouse",
  rejected_warehouse: "Rejected Warehouse",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const formatLabel = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDisplayDate = (value: string | null | undefined) => value ?? "-";

const getGrnStatusBadgeClass = (processStatus: string): string => {
  if (processStatus === "GRN Process") {
    return "border-blue-200 bg-blue-500/10 text-blue-700";
  }
  if (processStatus === "Moved to QCR") {
    return "border-amber-200 bg-amber-500/10 text-amber-700";
  }
  if (processStatus === "GRN Approved" || processStatus === "Moved to GRN") {
    return "border-emerald-200 bg-emerald-500/10 text-emerald-700";
  }
  if (processStatus === "Rejected") {
    return "border-rose-200 bg-rose-500/10 text-rose-700";
  }
  return "bg-success/10 text-success";
};

const getGrnStatusDisplayLabel = (processStatus: string): string => {
  if (processStatus === "Moved to QCR") return "QCR Pending";
  if (processStatus === "GRN Approved" || processStatus === "Moved to GRN") return "Accepted";
  return processStatus;
};

const getGrnStatusIcon = (processStatus: string) => {
  if (processStatus === "GRN Process") return <Clock className="h-3 w-3" />;
  if (processStatus === "Moved to QCR") return <ArrowRight className="h-3 w-3" />;
  if (processStatus === "GRN Approved" || processStatus === "Moved to GRN") return <CheckCircle className="h-3 w-3" />;
  if (processStatus === "Rejected") return <XCircle className="h-3 w-3" />;
  return null;
};

const normalizeGrnRecord = (record: NestedGrnRecord): GRNRecord => {
  const documentDetails = record.document_details ?? {};
  const requirementDetails = record.document_requirement_details ?? {};
  const supplierDetails = record.supplier_details ?? {};
  const firstItem = record.items?.[0] ?? {};
  const valueDetails = record.value_details ?? {};
  const invoiceDetails = (record as Record<string, unknown>).invoice_details as Record<string, unknown> | null ?? {};

  return {
    id: record.id ?? 0,
    po_no: record.po_no ?? documentDetails.po_no ?? null,
    po_date: record.po_date ?? documentDetails.po_date ?? null,
    grn_no: record.grn_no ?? documentDetails.grn_no ?? "",
    grn_date: record.grn_date ?? documentDetails.grn_date ?? null,
    supplier_invoice_no: record.supplier_invoice_no ?? documentDetails.supplier_invoice_no ?? null,
    supplier_invoice_date: record.supplier_invoice_date ?? documentDetails.supplier_invoice_date ?? null,
    gateentry_bookno: record.gateentry_bookno ?? documentDetails.gateentry_bookno ?? null,
    gateentry_bookdate: record.gateentry_bookdate ?? documentDetails.gateentry_bookdate ?? null,
    tolerance: record.tolerance ?? documentDetails.tolerance ?? null,
    req_date: record.req_date ?? requirementDetails.req_date ?? null,
    req_person_name: record.req_person_name ?? requirementDetails.req_person_name ?? null,
    req_person_id: record.req_person_id ?? requirementDetails.req_person_id ?? null,
    req_department: record.req_department ?? requirementDetails.req_department ?? null,
    req_reason: record.req_reason ?? requirementDetails.req_reason ?? null,
    supplier_id: record.supplier_id ?? supplierDetails.supplier_id ?? null,
    gstin: record.gstin ?? supplierDetails.gstin ?? null,
    contact_name: record.contact_name ?? supplierDetails.contact_name ?? null,
    trade_name: record.trade_name ?? supplierDetails.trade_name ?? null,
    contact_type: record.contact_type ?? supplierDetails.contact_type ?? null,
    address1: record.address1 ?? supplierDetails.address1 ?? null,
    address2: record.address2 ?? supplierDetails.address2 ?? null,
    location: record.location ?? supplierDetails.location ?? null,
    pincode: record.pincode ?? supplierDetails.pincode ?? null,
    state_name: record.state_name ?? supplierDetails.state_name ?? null,
    state_code: record.state_code ?? supplierDetails.state_code ?? null,
    country: record.country ?? supplierDetails.country ?? null,
    person_name: record.person_name ?? supplierDetails.person_name ?? null,
    phone_number: record.phone_number ?? supplierDetails.phone_number ?? null,
    email: record.email ?? supplierDetails.email ?? null,
    category: record.category ?? supplierDetails.category ?? null,
    segment: record.segment ?? supplierDetails.segment ?? null,
    sub_segment: record.sub_segment ?? supplierDetails.sub_segment ?? null,
    sales_contact_id: record.sales_contact_id ?? supplierDetails.sales_contact_id ?? null,
    currency: record.currency ?? supplierDetails.currency ?? null,
    item_id: record.item_id ?? firstItem.item_id ?? null,
    item_serial_number: record.item_serial_number ?? firstItem.item_serial_number ?? null,
    product_description: record.product_description ?? firstItem.product_description ?? null,
    hsn_code: record.hsn_code ?? firstItem.hsn_code ?? null,
    total_quantity: record.total_quantity ?? firstItem.total_quantity ?? null,
    quantity: record.quantity ?? firstItem.quantity ?? null,
    free_quantity: record.free_quantity ?? firstItem.free_quantity ?? null,
    accepted_qty: record.accepted_qty ?? firstItem.accepted_qty ?? null,
    rejected_qty: record.rejected_qty ?? firstItem.rejected_qty ?? null,
    unit: record.unit ?? firstItem.unit ?? null,
    unit_price: record.unit_price ?? firstItem.unit_price ?? null,
    total_amount: record.total_amount ?? firstItem.total_amount ?? null,
    discount: record.discount ?? firstItem.discount ?? null,
    assessable_value: record.assessable_value ?? firstItem.assessable_value ?? null,
    gst_rate: record.gst_rate ?? firstItem.gst_rate ?? null,
    igst_amount: record.igst_amount ?? firstItem.igst_amount ?? null,
    cgst_amount: record.cgst_amount ?? firstItem.cgst_amount ?? null,
    sgst_amount: record.sgst_amount ?? firstItem.sgst_amount ?? null,
    total_item_value: record.total_item_value ?? firstItem.total_item_value ?? null,
    freight_charge: record.freight_charge ?? valueDetails.freight_charge ?? null,
    loading_unloading_charge: record.loading_unloading_charge ?? valueDetails.loading_unloading_charge ?? null,
    total_before_tax: record.total_before_tax ?? valueDetails.total_before_tax ?? null,
    total_tax_amount: record.total_tax_amount ?? valueDetails.total_tax_amount ?? null,
    total_after_tax: record.total_after_tax ?? valueDetails.total_after_tax ?? null,
    created_at: record.created_at ?? "",
    updated_at: record.updated_at ?? "",
    status: record.status ?? true,
    process_status: record.process_status ?? (record.status === false ? "Moved to QCR" : "GRN Process"),
    moved_to_qcr_at: record.moved_to_qcr_at ?? null,
    moved_to_qcr_by: record.moved_to_qcr_by ?? null,
    // New GRN fields
    qc_status: record.qc_status ?? null,
    purchase_bill_no: (record.purchase_bill_no ?? invoiceDetails.purchase_bill_no ?? null) as string | null,
    purchase_bill_date: (record.purchase_bill_date ?? invoiceDetails.purchase_bill_date ?? null) as string | null,
    dc_numbers: (record.dc_numbers ?? invoiceDetails.dc_numbers ?? null) as string | null,
    delivery_days_gap: (record.delivery_days_gap ?? invoiceDetails.delivery_days_gap ?? null) as number | null,
    delivery_note_no: (record.delivery_note_no ?? invoiceDetails.delivery_note_no ?? null) as string | null,
    delivery_note_date: (record.delivery_note_date ?? invoiceDetails.delivery_note_date ?? null) as string | null,
    order_rating: (record.order_rating ?? invoiceDetails.order_rating ?? null) as number | null,
    grn_warehouse: (record.grn_warehouse ?? invoiceDetails.grn_warehouse ?? null) as string | null,
    source_warehouse: (record.source_warehouse ?? invoiceDetails.source_warehouse ?? null) as string | null,
    accepted_warehouse: (record.accepted_warehouse ?? invoiceDetails.accepted_warehouse ?? null) as string | null,
    rejected_warehouse: (record.rejected_warehouse ?? invoiceDetails.rejected_warehouse ?? null) as string | null,
    invoice_details: null,
  };
};

const buildEditFormFromRecord = (record: GRNRecord): GrnEditFormState => ({
  dc_numbers: record.dc_numbers ?? "",
  delivery_days_gap: record.delivery_days_gap !== null ? String(record.delivery_days_gap) : "",
  supplier_invoice_no: record.supplier_invoice_no ?? "",
  supplier_invoice_date: record.supplier_invoice_date ?? "",
  order_rating: record.order_rating !== null ? String(record.order_rating) : "",
  gateentry_bookno: record.gateentry_bookno ?? "",
  gateentry_bookdate: record.gateentry_bookdate ?? "",
  grn_warehouse: record.grn_warehouse ?? "",
  source_warehouse: record.source_warehouse ?? "",
  accepted_warehouse: record.accepted_warehouse ?? "",
  rejected_warehouse: record.rejected_warehouse ?? "",
  delivery_note_no: record.delivery_note_no ?? "",
  delivery_note_date: record.delivery_note_date ?? "",
  req_date: record.req_date ?? "",
  req_person_name: record.req_person_name ?? "",
  req_department: record.req_department ?? "",
  req_reason: record.req_reason ?? "",
});

const fetchGrnRecords = async (scope: "process" | "moved" = "process"): Promise<GRNRecord[]> => {
  const url = scope === "moved" ? GRN_MOVED_API_URL : GRN_API_URL;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`GRN request failed with ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data.map((record) => normalizeGrnRecord(record as NestedGrnRecord));
  }

  if (Array.isArray(data.results)) {
    return data.results.map((record: NestedGrnRecord) => normalizeGrnRecord(record));
  }

  if (Array.isArray(data.data)) {
    return data.data.map((record: NestedGrnRecord) => normalizeGrnRecord(record));
  }

  throw new Error("Unexpected GRN response received from the backend.");
};

const fetchQcrRecords = async (scope: "active" | "cancelled" = "active"): Promise<QCRRecord[]> => {
  const url = scope === "cancelled" ? QCR_CANCELLED_API_URL : QCR_API_URL;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`QCR request failed with ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data as QCRRecord[];
  }

  if (Array.isArray(data.results)) {
    return data.results as QCRRecord[];
  }

  throw new Error("Unexpected QCR response received from the backend.");
};

const LEGACY_INWARDS: LegacyInwardRecord[] = [
  {
    id: "PW-1201",
    poRef: "ZG/PO/26-27/1201",
    supplier: "Raw Material Suppliers Co",
    items: 4,
    amount: 385000,
    status: "gate_entry",
    date: "2026-04-09",
    grnNo: "-",
    gateEntryNo: "GE-4501",
    vehicle: "MH-12-XY-4567",
    warehouse: "Raw Store",
  },
  {
    id: "PW-1200",
    poRef: "ZG/PO/26-27/1200",
    supplier: "Chemical Traders",
    items: 6,
    amount: 192000,
    status: "grn_process",
    date: "2026-04-08",
    grnNo: "GRN-8901",
    gateEntryNo: "GE-4500",
    vehicle: "TN-33-AB-1234",
    warehouse: "GRN Bay",
  },
  {
    id: "PW-1199",
    poRef: "ZG/PO/26-27/1199",
    supplier: "Polymer World Pvt Ltd",
    items: 3,
    amount: 540000,
    status: "goods_in_transit",
    date: "2026-04-08",
    grnNo: "-",
    gateEntryNo: "-",
    vehicle: "GJ-05-CD-7890",
    warehouse: "Transit Yard",
  },
  {
    id: "PW-1198",
    poRef: "ZG/PO/26-27/1198",
    supplier: "National Chemical Corp",
    items: 8,
    amount: 128000,
    status: "grn_scan",
    date: "2026-04-07",
    grnNo: "GRN-8900",
    gateEntryNo: "GE-4499",
    vehicle: "RJ-14-EF-3456",
    warehouse: "Scan Bay",
  },
  {
    id: "PW-1197",
    poRef: "ZG/PO/26-27/1197",
    supplier: "Raw Material Suppliers Co",
    items: 10,
    amount: 720000,
    status: "grn",
    date: "2026-04-06",
    grnNo: "GRN-8899",
    gateEntryNo: "GE-4498",
    vehicle: "MH-04-GH-9012",
    warehouse: "Main Warehouse",
  },
  {
    id: "PW-1196",
    poRef: "ZG/PO/26-27/1196",
    supplier: "Additive Solutions",
    items: 2,
    amount: 85000,
    status: "material_in",
    date: "2026-04-05",
    grnNo: "GRN-8898",
    gateEntryNo: "GE-4497",
    vehicle: "KA-01-IJ-5678",
    warehouse: "Material Inward",
  },
  {
    id: "PW-1195",
    poRef: "ZG/PO/26-27/1195",
    supplier: "Chemical Traders",
    items: 5,
    amount: 210000,
    status: "purchase_return",
    date: "2026-04-04",
    grnNo: "GRN-8897",
    gateEntryNo: "GE-4496",
    vehicle: "-",
    warehouse: "Returns Bay",
  },
  {
    id: "IUT-301",
    poRef: "ZG/IUT/26-27/301",
    supplier: "Zigma Unit - Nashik",
    items: 3,
    amount: 156000,
    status: "iut_in_transit",
    date: "2026-04-08",
    grnNo: "-",
    gateEntryNo: "-",
    vehicle: "MH-15-KL-2345",
    warehouse: "Transit Yard",
  },
  {
    id: "IUT-300",
    poRef: "ZG/IUT/26-27/300",
    supplier: "Zigma Unit - Pune",
    items: 7,
    amount: 280000,
    status: "iut_received",
    date: "2026-04-07",
    grnNo: "GRN-IUT-450",
    gateEntryNo: "GE-4495",
    vehicle: "MH-12-MN-6789",
    warehouse: "Receiving Bay",
  },
  {
    id: "IUT-299",
    poRef: "ZG/IUT/26-27/299",
    supplier: "Zigma Unit - Mumbai",
    items: 5,
    amount: 195000,
    status: "iut_scanned",
    date: "2026-04-06",
    grnNo: "GRN-IUT-449",
    gateEntryNo: "GE-4494",
    vehicle: "MH-04-OP-1234",
    warehouse: "Scanning Bay",
  },
];

const processTabs = [
  { id: "all", label: "All" },
  { id: "goods_in_transit", label: "Goods in Transit" },
  { id: "gate_entry", label: "Gate Entry" },
  { id: "grn_process", label: "GRN Process" },
  { id: "qcr", label: "QCR" },
  { id: "grn_scan", label: "GRN Scan" },
  { id: "grn", label: "GRN" },
  { id: "grn_manual", label: "GRN (Manual)" },
  { id: "material_in", label: "Material In" },
  { id: "purchase_inward", label: "Purchase Inward" },
  { id: "purchase_return", label: "Purchase Returns" },
  { id: "iut_in_transit", label: "IUT In Transit" },
  { id: "iut_received", label: "IUT Received" },
  { id: "iut_scanned", label: "IUT Scanned" },
  { id: "cancelled", label: "Cancelled" },
];

const statusFilterMap: Record<string, InwardStatus[]> = {
  all: [
    "goods_in_transit",
    "gate_entry",
    "grn_process",
    "qcr",
    "grn_scan",
    "grn",
    "grn_manual",
    "material_in",
    "purchase_inward",
    "purchase_return",
    "iut_in_transit",
    "iut_received",
    "iut_scanned",
    "cancelled",
  ],
  goods_in_transit: ["goods_in_transit"],
  gate_entry: ["gate_entry"],
  grn_process: ["grn_process"],
  qcr: ["qcr", "grn_scan"],
  grn_scan: ["grn_scan"],
  grn: ["grn"],
  grn_manual: ["grn_manual"],
  material_in: ["material_in"],
  purchase_inward: ["material_in", "purchase_inward"],
  purchase_return: ["purchase_return"],
  iut_in_transit: ["iut_in_transit"],
  iut_received: ["iut_received"],
  iut_scanned: ["iut_scanned"],
  cancelled: ["cancelled"],
};

const LEGACY_STATUS_LABELS: Record<InwardStatus, string> = {
  goods_in_transit: "Goods in Transit",
  gate_entry: "Gate Entry",
  grn_process: "GRN Process",
  qcr: "QCR",
  grn_scan: "GRN Scan",
  grn: "GRN",
  grn_manual: "GRN (Manual)",
  material_in: "Material In",
  purchase_inward: "Purchase Inward",
  purchase_return: "Purchase Return",
  iut_in_transit: "IUT In Transit",
  iut_received: "IUT Received",
  iut_scanned: "IUT Scanned",
  cancelled: "Cancelled",
};

const LEGACY_STATUS_TONES: Record<InwardStatus, string> = {
  goods_in_transit: "border-amber-200 bg-amber-500/10 text-amber-700",
  gate_entry: "border-slate-200 bg-slate-500/10 text-slate-700",
  grn_process: "border-blue-200 bg-blue-500/10 text-blue-700",
  qcr: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  grn_scan: "border-indigo-200 bg-indigo-500/10 text-indigo-700",
  grn: "border-cyan-200 bg-cyan-500/10 text-cyan-700",
  grn_manual: "border-violet-200 bg-violet-500/10 text-violet-700",
  material_in: "border-teal-200 bg-teal-500/10 text-teal-700",
  purchase_inward: "border-sky-200 bg-sky-500/10 text-sky-700",
  purchase_return: "border-rose-200 bg-rose-500/10 text-rose-700",
  iut_in_transit: "border-amber-200 bg-amber-500/10 text-amber-700",
  iut_received: "border-orange-200 bg-orange-500/10 text-orange-700",
  iut_scanned: "border-green-200 bg-green-500/10 text-green-700",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
};

const PurchasesInwardsPage = () => {
  const [search, setSearch] = useState("");
  const [activeProcess, setActiveProcess] = useState("grn");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [grnStatusFilter, setGrnStatusFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedMoveRecord, setSelectedMoveRecord] = useState<GRNRecord | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isMovingToQcr, setIsMovingToQcr] = useState(false);
  const [selectedQcrRecord, setSelectedQcrRecord] = useState<QCRRecord | null>(null);
  const [selectedQcrAction, setSelectedQcrAction] = useState<QcrAction | null>(null);
  const [isQcrDialogOpen, setIsQcrDialogOpen] = useState(false);
  const [isUpdatingQcrStatus, setIsUpdatingQcrStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GRN Edit Sheet state
  const [isGrnEditSheetOpen, setIsGrnEditSheetOpen] = useState(false);
  const [editingGrnRecord, setEditingGrnRecord] = useState<GRNRecord | null>(null);
  const [grnEditForm, setGrnEditForm] = useState<GrnEditFormState | null>(null);
  const [isSavingGrn, setIsSavingGrn] = useState(false);
  const [isMovingToQcrFromSheet, setIsMovingToQcrFromSheet] = useState(false);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const selectedTab = activeProcess in statusFilterMap ? activeProcess : "all";
  const isBackendTab = selectedTab === "grn" || selectedTab === "grn_process" || selectedTab === "qcr" || selectedTab === "cancelled";
  const isGrnListTab = selectedTab === "grn" || selectedTab === "grn_process";
  const isMovedGrnTab = selectedTab === "grn";
  const isQcrTab = selectedTab === "qcr";
  const isCancelledTab = selectedTab === "cancelled";
  const isQcrDataTab = isQcrTab || isCancelledTab;

  const { data: grnRecords = [], error: grnError, isError: isGrnError, isFetching: isGrnFetching, refetch: refetchGrn } = useQuery({
    queryKey: ["grn-records", isMovedGrnTab ? "moved" : "process"],
    queryFn: () => fetchGrnRecords(isMovedGrnTab ? "moved" : "process"),
    enabled: isGrnListTab,
    staleTime: 30_000,
  });

  const { data: qcrRecords = [], error: qcrError, isError: isQcrError, isFetching: isQcrFetching, refetch: refetchQcr } = useQuery({
    queryKey: ["qcr-records", isCancelledTab ? "cancelled" : "active"],
    queryFn: () => fetchQcrRecords(isCancelledTab ? "cancelled" : "active"),
    enabled: isQcrDataTab,
    staleTime: 30_000,
  });

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const handleGrnImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please upload a .xlsx Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const response = await fetch(GRN_IMPORT_API_URL, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let payload: Partial<ImportResponse> = {};

      if (responseText.length > 0) {
        try {
          payload = JSON.parse(responseText) as ImportResponse;
        } catch {
          payload = { detail: responseText };
        }
      }

      if (!response.ok) {
        const firstError = Array.isArray(payload.errors) ? payload.errors[0] : undefined;
        const errorMessage = payload.detail
          ?? (firstError ? `Row ${firstError.row}: ${firstError.message}` : undefined)
          ?? "The Excel file could not be imported.";
        throw new Error(errorMessage);
      }

      await refetchGrn();

      const createdCount = payload.created_count ?? 0;
      const failedCount = payload.failed_count ?? 0;
      const firstError = Array.isArray(payload.errors) ? payload.errors[0] : undefined;

      if (failedCount > 0) {
        toast(`Imported ${createdCount} GRN row${createdCount === 1 ? "" : "s"} with ${failedCount} skipped row${failedCount === 1 ? "" : "s"}.`, {
          description: firstError ? `Row ${firstError.row}: ${firstError.message}` : "Review the backend response for row-level details.",
        });
      } else {
        toast.success(`Imported ${createdCount} GRN row${createdCount === 1 ? "" : "s"} successfully.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The GRN import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  const openMoveDialog = (record: GRNRecord) => {
    setSelectedMoveRecord(record);
    setIsMoveDialogOpen(true);
  };

  const handleMoveToQcr = async () => {
    if (!selectedMoveRecord) {
      return;
    }

    setIsMovingToQcr(true);
    try {
      const response = await fetch(`${GRN_MOVE_TO_QCR_API_URL}/${selectedMoveRecord.id}/move-to-qcr/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const responseText = await response.text();
      let payload: { message?: string } = {};

      if (responseText.length > 0) {
        try {
          payload = JSON.parse(responseText) as { message?: string };
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "The GRN record could not be moved to QCR.");
      }

      await Promise.all([refetchGrn(), refetchQcr()]);
      toast.success(payload.message ?? "GRN record moved to QCR successfully.");
      setIsMoveDialogOpen(false);
      setSelectedMoveRecord(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The GRN record could not be moved to QCR.");
    } finally {
      setIsMovingToQcr(false);
    }
  };

  const openQcrActionDialog = (record: QCRRecord, action: QcrAction) => {
    setSelectedQcrRecord(record);
    setSelectedQcrAction(action);
    setIsQcrDialogOpen(true);
  };

  const handleQcrStatusUpdate = async () => {
    if (!selectedQcrRecord || !selectedQcrAction) {
      return;
    }

    setIsUpdatingQcrStatus(true);
    try {
      const response = await fetch(`${QCR_STATUS_API_URL}/${selectedQcrRecord.id}/status/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: selectedQcrAction }),
      });

      const responseText = await response.text();
      let payload: { message?: string } = {};

      if (responseText.length > 0) {
        try {
          payload = JSON.parse(responseText) as { message?: string };
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "The QCR record could not be updated.");
      }

      await Promise.all([refetchGrn(), refetchQcr()]);
      toast.success(payload.message ?? "QCR record updated successfully.");
      setIsQcrDialogOpen(false);
      setSelectedQcrRecord(null);
      setSelectedQcrAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The QCR record could not be updated.");
    } finally {
      setIsUpdatingQcrStatus(false);
    }
  };

  // GRN Edit Sheet handlers
  const openGrnEditSheet = (record: GRNRecord) => {
    setEditingGrnRecord(record);
    setGrnEditForm(buildEditFormFromRecord(record));
    setIsGrnEditSheetOpen(true);
  };

  const closeGrnEditSheet = () => {
    if (isSavingGrn || isMovingToQcrFromSheet) return;
    setIsGrnEditSheetOpen(false);
    setEditingGrnRecord(null);
    setGrnEditForm(null);
  };

  const updateGrnEditField = (field: keyof GrnEditFormState, value: string) => {
    setGrnEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const buildGrnPatchPayload = (form: GrnEditFormState) => ({
    document_details: {
      gateentry_bookno: form.gateentry_bookno || null,
      gateentry_bookdate: form.gateentry_bookdate || null,
      supplier_invoice_no: form.supplier_invoice_no || null,
      supplier_invoice_date: form.supplier_invoice_date || null,
    },
    invoice_details: {
      dc_numbers: form.dc_numbers || null,
      delivery_days_gap: form.delivery_days_gap !== "" ? Number(form.delivery_days_gap) : null,
      delivery_note_no: form.delivery_note_no || null,
      delivery_note_date: form.delivery_note_date || null,
      order_rating: form.order_rating !== "" ? Number(form.order_rating) : null,
      grn_warehouse: form.grn_warehouse || null,
      source_warehouse: form.source_warehouse || null,
      accepted_warehouse: form.accepted_warehouse || null,
      rejected_warehouse: form.rejected_warehouse || null,
    },
    document_requirement_details: {
      req_date: form.req_date || null,
      req_person_name: form.req_person_name || null,
      req_department: form.req_department || null,
      req_reason: form.req_reason || null,
    },
  });

  const validateMoveToQcrFields = (record: GRNRecord, form: GrnEditFormState): string[] => {
    const merged: Record<string, string | null> = {
      supplier_id: record.supplier_id,
      supplier_invoice_no: form.supplier_invoice_no || null,
      supplier_invoice_date: form.supplier_invoice_date || null,
      delivery_note_no: form.delivery_note_no || null,
      delivery_note_date: form.delivery_note_date || null,
      gateentry_bookno: form.gateentry_bookno || null,
      grn_warehouse: form.grn_warehouse || null,
      accepted_warehouse: form.accepted_warehouse || null,
      rejected_warehouse: form.rejected_warehouse || null,
    };

    return MOVE_TO_QCR_MANDATORY_FIELDS
      .filter((field) => !merged[field as string])
      .map((field) => MOVE_TO_QCR_FIELD_LABELS[field] ?? field);
  };

  const handleSaveGrnDetails = async (): Promise<boolean> => {
    if (!editingGrnRecord || !grnEditForm) return false;

    setIsSavingGrn(true);
    try {
      const response = await fetch(`${GRN_DETAIL_API_URL}/${editingGrnRecord.id}/`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildGrnPatchPayload(grnEditForm)),
      });

      const responseText = await response.text();
      let payload: { message?: string } = {};

      if (responseText.length > 0) {
        try {
          payload = JSON.parse(responseText) as { message?: string };
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "The GRN details could not be saved.");
      }

      await refetchGrn();
      toast.success(payload.message ?? "GRN details saved successfully.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The GRN details could not be saved.");
      return false;
    } finally {
      setIsSavingGrn(false);
    }
  };

  const handleMoveToQcrFromSheet = async () => {
    if (!editingGrnRecord || !grnEditForm) return;

    // Validate mandatory fields
    const missingFields = validateMoveToQcrFields(editingGrnRecord, grnEditForm);
    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields before moving to QCR: ${missingFields.join(", ")}.`);
      return;
    }

    setIsMovingToQcrFromSheet(true);
    try {
      // First save the details
      const saveResponse = await fetch(`${GRN_DETAIL_API_URL}/${editingGrnRecord.id}/`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildGrnPatchPayload(grnEditForm)),
      });

      if (!saveResponse.ok) {
        const saveText = await saveResponse.text();
        let savePayload: { message?: string } = {};
        try { savePayload = JSON.parse(saveText) as { message?: string }; } catch { /* empty */ }
        throw new Error(savePayload.message ?? "The GRN details could not be saved before moving to QCR.");
      }

      // Then move to QCR
      const moveResponse = await fetch(`${GRN_MOVE_TO_QCR_API_URL}/${editingGrnRecord.id}/move-to-qcr/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const moveText = await moveResponse.text();
      let movePayload: { message?: string } = {};
      if (moveText.length > 0) {
        try { movePayload = JSON.parse(moveText) as { message?: string }; } catch { movePayload = { message: moveText }; }
      }

      if (!moveResponse.ok) {
        throw new Error(movePayload.message ?? "The GRN record could not be moved to QCR.");
      }

      await Promise.all([refetchGrn(), refetchQcr()]);
      toast.success(movePayload.message ?? "GRN record moved to QCR successfully.");
      setIsGrnEditSheetOpen(false);
      setEditingGrnRecord(null);
      setGrnEditForm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The operation could not be completed.");
    } finally {
      setIsMovingToQcrFromSheet(false);
    }
  };

  const legacyFilteredRows = useMemo(() => {
    const statuses = statusFilterMap[selectedTab] ?? statusFilterMap.all;
    const normalized = deferredSearch;

    return LEGACY_INWARDS.filter((entry) => {
      const haystack = [entry.id, entry.poRef, entry.supplier, entry.grnNo, entry.gateEntryNo, entry.vehicle, entry.warehouse, LEGACY_STATUS_LABELS[entry.status]]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalized.length === 0 || haystack.includes(normalized);
      const matchesTab = statuses.includes(entry.status);
      const matchesWarehouse = selectedWarehouse === "all" || entry.warehouse === selectedWarehouse;

      return matchesSearch && matchesTab && matchesWarehouse;
    });
  }, [deferredSearch, selectedTab, selectedWarehouse]);

  const grnFilteredRows = useMemo(() => {
    const normalized = deferredSearch;

    return grnRecords.filter((entry) => {
      const haystack = [
        entry.grn_no,
        entry.po_no ?? "",
        entry.contact_name ?? "",
        entry.trade_name ?? "",
        entry.supplier_id ?? "",
        entry.gateentry_bookno ?? "",
        entry.supplier_invoice_no ?? "",
        entry.product_description ?? "",
        entry.hsn_code ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalized.length === 0 || haystack.includes(normalized);
      const matchesStatus =
        grnStatusFilter === "all"
          ? true
          : grnStatusFilter === "active"
            ? entry.status || entry.process_status === "GRN Process"
            : !entry.status || entry.process_status !== "GRN Process";

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearch, grnRecords, grnStatusFilter]);

  const qcrFilteredRows = useMemo(() => {
    const normalized = deferredSearch;

    return qcrRecords.filter((entry) => {
      const snapshot = entry.snapshot ?? entry.source_grn_data;
      const haystack = [
        entry.grn_reference_no,
        snapshot?.po_no ?? "",
        snapshot?.contact_name ?? "",
        snapshot?.trade_name ?? "",
        snapshot?.supplier_id ?? "",
        snapshot?.supplier_invoice_no ?? "",
        snapshot?.product_description ?? "",
        entry.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalized.length === 0 || haystack.includes(normalized);
      const matchesStatus = grnStatusFilter === "all" ? true : grnStatusFilter === "active" ? entry.status === "Active" : entry.status !== "Active";

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearch, grnStatusFilter, qcrRecords]);

  const legacyStats = useMemo<SummaryStat[]>(() => {
    const openCount = LEGACY_INWARDS.filter((entry) => ["goods_in_transit", "gate_entry", "grn_process", "qcr", "grn_scan"].includes(entry.status)).length;
    const grnCount = LEGACY_INWARDS.filter((entry) => ["grn", "grn_manual", "material_in", "purchase_inward"].includes(entry.status)).length;
    const iutCount = LEGACY_INWARDS.filter((entry) => ["iut_in_transit", "iut_received", "iut_scanned"].includes(entry.status)).length;
    const returnCount = LEGACY_INWARDS.filter((entry) => entry.status === "purchase_return").length;
    const totalValue = LEGACY_INWARDS.reduce((sum, entry) => sum + entry.amount, 0);

    return [
      { label: "Total Records", value: String(LEGACY_INWARDS.length) },
      { label: "Open Entries", value: String(openCount) },
      { label: "GRN / Inward", value: String(grnCount) },
      { label: "IUT / Transfer", value: String(iutCount) },
      { label: "Returns", value: String(returnCount) },
      { label: "Total Value", value: formatCurrency(totalValue) },
    ];
  }, []);

  const grnStats = useMemo<SummaryStat[]>(() => {
    const totalAccepted = grnRecords.reduce((sum, record) => sum + toNumber(record.accepted_qty), 0);
    const totalRejected = grnRecords.reduce((sum, record) => sum + toNumber(record.rejected_qty), 0);
    const totalQuantity = grnRecords.reduce((sum, record) => sum + toNumber(record.total_quantity || record.quantity), 0);
    const totalValue = grnRecords.reduce((sum, record) => sum + toNumber(record.total_after_tax || record.total_item_value || record.total_amount), 0);
    const activeCount = grnRecords.filter((record) => record.status).length;

    return [
      { label: "GRN Records", value: String(grnRecords.length) },
      { label: "Active", value: String(activeCount) },
      { label: "Total Qty", value: totalQuantity.toFixed(2) },
      { label: "Accepted Qty", value: totalAccepted.toFixed(2) },
      { label: "Rejected Qty", value: totalRejected.toFixed(2) },
      { label: "Total Value", value: formatCurrency(totalValue) },
    ];
  }, [grnRecords]);

  const qcrStats = useMemo<SummaryStat[]>(() => {
    const totalAccepted = qcrRecords.reduce((sum, record) => sum + toNumber(record.snapshot?.accepted_qty), 0);
    const totalRejected = qcrRecords.reduce((sum, record) => sum + toNumber(record.snapshot?.rejected_qty), 0);
    const totalQuantity = qcrRecords.reduce((sum, record) => sum + toNumber(record.snapshot?.total_quantity || record.snapshot?.quantity), 0);
    const activeCount = qcrRecords.filter((record) => record.status === "Active").length;

    return [
      { label: "QCR Records", value: String(qcrRecords.length) },
      { label: "Active", value: String(activeCount) },
      { label: "Total Qty", value: totalQuantity.toFixed(2) },
      { label: "Accepted Qty", value: totalAccepted.toFixed(2) },
      { label: "Rejected Qty", value: totalRejected.toFixed(2) },
      { label: "Moved from GRN", value: String(qcrRecords.length) },
    ];
  }, [qcrRecords]);

  const totalStats = isQcrDataTab ? qcrStats : isGrnListTab ? grnStats : legacyStats;
  const backendError = isQcrDataTab ? qcrError : grnError;
  const hasBackendError = isQcrDataTab ? isQcrError : isGrnError;

  const warehouseOptions = Array.from(new Set(LEGACY_INWARDS.map((record) => record.warehouse))).sort((left, right) => left.localeCompare(right));

  const isGrnFieldsLocked = editingGrnRecord?.process_status !== "GRN Process";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Purchases & Inwards</h1>
            <p className="text-sm text-muted-foreground">
              {isBackendTab
                ? isQcrDataTab
                  ? isCancelledTab
                    ? "Cancelled QCR list with rejected record tracking and backend sync"
                    : "QCR list with GRN transfer tracking and backend sync"
                  : "GRN list, Excel import, and backend model sync"
                : "Gate entry, GRN, material inward, purchase returns, and IUT workflow"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleGrnImport} />

            {isBackendTab ? (
              <>
                {isGrnListTab ? (
                  <Button variant="outline" className="gap-2" onClick={openImportDialog} disabled={isImporting}>
                    {isImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                    {isImporting ? "Importing..." : "Import GRN"}
                  </Button>
                ) : null}
                <Button variant="outline" className="gap-2" onClick={() => void Promise.all([refetchGrn(), refetchQcr()])}>
                  <RefreshCw className={`h-4 w-4 ${isGrnFetching || isQcrFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="gap-2">
                  <PackageOpen className="h-4 w-4" />
                  Add Inward
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Gate Entry
                </Button>
              </>
            )}
          </div>
          <p className="max-w-md text-xs text-muted-foreground sm:text-right">
            {isBackendTab
              ? isQcrDataTab
                ? isCancelledTab
                  ? "Rejected QCR records appear here in the cancelled view."
                  : "Records moved from GRN Process appear here as active QCR entries with full source tracking."
                : "Upload an Excel file to populate the GRN list from the Django GRN model."
              : "Use the process tabs to move between in-transit, GRN, inward, return, and inter-unit transfer records."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {totalStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <div className={cn("text-2xl font-bold", stat.label === "Total Value" ? "text-primary" : "text-foreground")}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:ml-auto lg:flex-row lg:items-center lg:justify-end">
        {isBackendTab ? (
          <Select value={grnStatusFilter} onValueChange={setGrnStatusFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouseOptions.map((warehouse) => (
                <SelectItem key={warehouse} value={warehouse}>
                  {formatLabel(warehouse)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative w-full sm:w-[22rem]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isBackendTab ? "Search GRN no, PO no, supplier or invoice..." : "Search entries by ref, supplier, PO, GRN, vehicle or warehouse..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => {
            setSearch("");
            setSelectedWarehouse("all");
            setGrnStatusFilter("all");
            setActiveProcess(isBackendTab ? "grn" : "all");
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {hasBackendError && isBackendTab ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load backend records</AlertTitle>
          <AlertDescription>
            {backendError instanceof Error ? backendError.message : "The frontend could not reach the backend API."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={selectedTab} onValueChange={setActiveProcess}>
        <TabsList className="h-auto flex-wrap">
          {processTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                {isGrnListTab ? (
                  <>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>GRN No</TableHead>
                        <TableHead>PO No / Supplier</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Accepted</TableHead>
                        <TableHead>Rejected</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grnFilteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                            No GRN records match the current search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        grnFilteredRows.map((record, index) => (
                          <TableRow
                            key={record.id}
                            className={cn("hover:bg-muted/50", selectedTab === "grn_process" ? "cursor-pointer" : "")}
                            onClick={selectedTab === "grn_process" ? () => openGrnEditSheet(record) : undefined}
                          >
                            <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs font-medium">{record.grn_no}</TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{record.trade_name || record.contact_name || record.supplier_id || "-"}</div>
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <div className="truncate">PO: {record.po_no ?? "-"}</div>
                                <div className="truncate">Supplier Inv: {record.supplier_invoice_no ?? "-"} | Gate Entry: {record.gateentry_bookno ?? "-"}</div>
                                <div className="truncate">Item: {record.item_id ?? "-"} | HSN: {record.hsn_code ?? "-"}</div>
                              </div>
                            </TableCell>
                            <TableCell>{toNumber(record.total_quantity || record.quantity).toFixed(2)}</TableCell>
                            <TableCell>{toNumber(record.accepted_qty).toFixed(2)}</TableCell>
                            <TableCell>{toNumber(record.rejected_qty).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(toNumber(record.total_after_tax || record.total_item_value || record.total_amount))}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{toDisplayDate(record.grn_date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("gap-1", getGrnStatusBadgeClass(record.process_status))}
                              >
                                {getGrnStatusIcon(record.process_status)}
                                {getGrnStatusDisplayLabel(record.process_status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <EllipsisVertical className="h-4 w-4" />
                                    <span className="sr-only">Open row actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {selectedTab === "grn_process" ? (
                                    <>
                                      <DropdownMenuItem onClick={() => openGrnEditSheet(record)}>
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit GRN Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openMoveDialog(record)}
                                        disabled={record.process_status !== "GRN Process"}
                                      >
                                        Move to QCR
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      No actions available
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </>
                ) : isQcrDataTab ? (
                  <>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>GRN No</TableHead>
                        <TableHead>PO No / Supplier</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Accepted</TableHead>
                        <TableHead>Rejected</TableHead>
                        <TableHead>Moved Date</TableHead>
                        <TableHead>Status</TableHead>
                        {isCancelledTab ? null : <TableHead className="w-20 text-right">Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qcrFilteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isCancelledTab ? 8 : 9} className="h-24 text-center text-muted-foreground">
                            {isCancelledTab
                              ? "No rejected QCR records match the current search or filter."
                              : "No QCR records match the current search or filter."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        qcrFilteredRows.map((record, index) => {
                          const snapshot = record.snapshot ?? record.source_grn_data;

                          return (
                            <TableRow key={record.id} className="hover:bg-muted/50">
                              <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="font-mono text-xs font-medium">{record.grn_reference_no}</TableCell>
                              <TableCell>
                                <div className="font-medium text-foreground">{snapshot?.trade_name || snapshot?.contact_name || snapshot?.supplier_id || "-"}</div>
                                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                  <div className="truncate">PO: {snapshot?.po_no ?? "-"}</div>
                                  <div className="truncate">Supplier Inv: {snapshot?.supplier_invoice_no ?? "-"} | Gate Entry: {snapshot?.gateentry_bookno ?? "-"}</div>
                                  <div className="truncate">Item: {snapshot?.item_id ?? "-"} | HSN: {snapshot?.hsn_code ?? "-"}</div>
                                </div>
                              </TableCell>
                              <TableCell>{toNumber(snapshot?.total_quantity || snapshot?.quantity).toFixed(2)}</TableCell>
                              <TableCell>{toNumber(snapshot?.accepted_qty).toFixed(2)}</TableCell>
                              <TableCell>{toNumber(snapshot?.rejected_qty).toFixed(2)}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{toDisplayDate(record.moved_to_qcr_at)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    record.status === "Rejected"
                                      ? "border-rose-200 bg-rose-500/10 text-rose-700"
                                      : record.status === "Moved to GRN" || record.status === "GRN Approved"
                                        ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                                        : "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                                  }
                                >
                                  {record.status === "Moved to GRN" || record.status === "GRN Approved" ? "Accepted" : record.status}
                                </Badge>
                              </TableCell>
                              {isCancelledTab ? null : (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <EllipsisVertical className="h-4 w-4" />
                                        <span className="sr-only">Open QCR row actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => openQcrActionDialog(record, "move_to_grn")}
                                        disabled={record.status !== "Active"}
                                      >
                                        Accept
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openQcrActionDialog(record, "reject")}
                                        disabled={record.status !== "Active"}
                                      >
                                        Reject
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </>
                ) : (
                  <>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>Ref#</TableHead>
                        <TableHead>Supplier / PO</TableHead>
                        <TableHead className="w-20 text-center">Items</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {legacyFilteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            No purchase / inward records match the current search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        legacyFilteredRows.map((entry, index) => (
                          <TableRow key={entry.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs font-medium">{entry.id}</TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{entry.supplier}</div>
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <div className="truncate">PO Ref: {entry.poRef}</div>
                                <div className="truncate">GRN: {entry.grnNo} | Gate Entry: {entry.gateEntryNo}</div>
                                <div className="truncate">Vehicle: {entry.vehicle}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{entry.items}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {entry.warehouse}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", LEGACY_STATUS_TONES[entry.status])}>
                                {LEGACY_STATUS_LABELS[entry.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{entry.date}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </>
                )}
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* GRN Process Edit Sheet */}
      <Sheet open={isGrnEditSheetOpen} onOpenChange={(open) => { if (!open) closeGrnEditSheet(); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl" side="right">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              GRN Details
              {editingGrnRecord ? (
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  {editingGrnRecord.grn_no}
                </span>
              ) : null}
            </SheetTitle>
            <SheetDescription>
              {isGrnFieldsLocked
                ? "This record has already been moved. All fields are locked."
                : "Edit the GRN process details and save or move to QCR."}
            </SheetDescription>
            {editingGrnRecord ? (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn("gap-1", getGrnStatusBadgeClass(editingGrnRecord.process_status))}
                >
                  {getGrnStatusIcon(editingGrnRecord.process_status)}
                  {getGrnStatusDisplayLabel(editingGrnRecord.process_status)}
                </Badge>
              </div>
            ) : null}
          </SheetHeader>

          <Separator className="my-3" />

          {editingGrnRecord && grnEditForm ? (
            <Accordion type="multiple" defaultValue={["supplier", "bills", "invoice", "requirement"]} className="space-y-1">

              {/* Section 1: Supplier Details (read-only) */}
              <AccordionItem value="supplier" className="rounded-lg border px-3">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  Supplier Details
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Supplier ID</p>
                      <p className="font-medium">{editingGrnRecord.supplier_id ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trade Name</p>
                      <p className="font-medium">{editingGrnRecord.trade_name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{editingGrnRecord.contact_name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GSTIN</p>
                      <p className="font-medium font-mono text-xs">{editingGrnRecord.gstin ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{editingGrnRecord.phone_number ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-xs break-all">{editingGrnRecord.email ?? "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[editingGrnRecord.address1, editingGrnRecord.address2, editingGrnRecord.location, editingGrnRecord.state_name, editingGrnRecord.pincode]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{editingGrnRecord.category ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currency</p>
                      <p className="font-medium">{editingGrnRecord.currency ?? "-"}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Bills (read-only) */}
              <AccordionItem value="bills" className="rounded-lg border px-3">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  Bills
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">GRN No</p>
                      <p className="font-medium font-mono text-xs">{editingGrnRecord.grn_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GRN Date</p>
                      <p className="font-medium">{toDisplayDate(editingGrnRecord.grn_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PO No</p>
                      <p className="font-medium font-mono text-xs">{editingGrnRecord.po_no ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PO Date</p>
                      <p className="font-medium">{toDisplayDate(editingGrnRecord.po_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purchase Bill No</p>
                      <p className="font-medium">{editingGrnRecord.purchase_bill_no ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purchase Bill Date</p>
                      <p className="font-medium">{toDisplayDate(editingGrnRecord.purchase_bill_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Before Tax</p>
                      <p className="font-medium">{formatCurrency(toNumber(editingGrnRecord.total_before_tax))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Tax</p>
                      <p className="font-medium">{formatCurrency(toNumber(editingGrnRecord.total_tax_amount))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total After Tax</p>
                      <p className="font-medium text-primary">{formatCurrency(toNumber(editingGrnRecord.total_after_tax))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tolerance</p>
                      <p className="font-medium">{editingGrnRecord.tolerance ?? "-"}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Invoice / Order Details (editable) */}
              <AccordionItem value="invoice" className="rounded-lg border px-3">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  Invoice / Order Details
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="supplier_invoice_no" className="text-xs">
                        Supplier Invoice No <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="supplier_invoice_no"
                        value={grnEditForm.supplier_invoice_no}
                        onChange={(e) => updateGrnEditField("supplier_invoice_no", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. INV-2024-001"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="supplier_invoice_date" className="text-xs">
                        Supplier Invoice Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="supplier_invoice_date"
                        type="date"
                        value={grnEditForm.supplier_invoice_date}
                        onChange={(e) => updateGrnEditField("supplier_invoice_date", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="delivery_note_no" className="text-xs">
                        Delivery Note No <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="delivery_note_no"
                        value={grnEditForm.delivery_note_no}
                        onChange={(e) => updateGrnEditField("delivery_note_no", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. DN-0001"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="delivery_note_date" className="text-xs">
                        Delivery Note Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="delivery_note_date"
                        type="date"
                        value={grnEditForm.delivery_note_date}
                        onChange={(e) => updateGrnEditField("delivery_note_date", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gateentry_bookno" className="text-xs">
                        Gate Entry Book No <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="gateentry_bookno"
                        value={grnEditForm.gateentry_bookno}
                        onChange={(e) => updateGrnEditField("gateentry_bookno", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. GE-4501"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gateentry_bookdate" className="text-xs">
                        Gate Entry Book Date
                      </Label>
                      <Input
                        id="gateentry_bookdate"
                        type="date"
                        value={grnEditForm.gateentry_bookdate}
                        onChange={(e) => updateGrnEditField("gateentry_bookdate", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="grn_warehouse" className="text-xs">
                        GRN Warehouse <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="grn_warehouse"
                        value={grnEditForm.grn_warehouse}
                        onChange={(e) => updateGrnEditField("grn_warehouse", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. Main Store"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="source_warehouse" className="text-xs">
                        Source Warehouse
                      </Label>
                      <Input
                        id="source_warehouse"
                        value={grnEditForm.source_warehouse}
                        onChange={(e) => updateGrnEditField("source_warehouse", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. Dispatch Bay"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="accepted_warehouse" className="text-xs">
                        Accepted Warehouse <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="accepted_warehouse"
                        value={grnEditForm.accepted_warehouse}
                        onChange={(e) => updateGrnEditField("accepted_warehouse", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. Quality Store"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rejected_warehouse" className="text-xs">
                        Rejected Warehouse <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="rejected_warehouse"
                        value={grnEditForm.rejected_warehouse}
                        onChange={(e) => updateGrnEditField("rejected_warehouse", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. Rejection Bay"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dc_numbers" className="text-xs">DC Numbers</Label>
                      <Input
                        id="dc_numbers"
                        value={grnEditForm.dc_numbers}
                        onChange={(e) => updateGrnEditField("dc_numbers", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. DC-001, DC-002"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="delivery_days_gap" className="text-xs">Delivery Days Gap</Label>
                      <Input
                        id="delivery_days_gap"
                        type="number"
                        value={grnEditForm.delivery_days_gap}
                        onChange={(e) => updateGrnEditField("delivery_days_gap", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. 3"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="order_rating" className="text-xs">Order Rating</Label>
                      <Input
                        id="order_rating"
                        type="number"
                        min={1}
                        max={10}
                        value={grnEditForm.order_rating}
                        onChange={(e) => updateGrnEditField("order_rating", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="1–10"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Requirement (editable) */}
              <AccordionItem value="requirement" className="rounded-lg border px-3">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  Requirement
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="req_date" className="text-xs">Requirement Date</Label>
                      <Input
                        id="req_date"
                        type="date"
                        value={grnEditForm.req_date}
                        onChange={(e) => updateGrnEditField("req_date", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="req_person_name" className="text-xs">Requested By</Label>
                      <Input
                        id="req_person_name"
                        value={grnEditForm.req_person_name}
                        onChange={(e) => updateGrnEditField("req_person_name", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="Person name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="req_department" className="text-xs">Department</Label>
                      <Input
                        id="req_department"
                        value={grnEditForm.req_department}
                        onChange={(e) => updateGrnEditField("req_department", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="e.g. Production"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="req_reason" className="text-xs">Reason / Notes</Label>
                      <Textarea
                        id="req_reason"
                        value={grnEditForm.req_reason}
                        onChange={(e) => updateGrnEditField("req_reason", e.target.value)}
                        disabled={isGrnFieldsLocked}
                        placeholder="Reason for requirement..."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          ) : null}

          <SheetFooter className="mt-4 flex-col gap-2 sm:flex-col">
            {isGrnFieldsLocked ? (
              <p className="text-center text-xs text-muted-foreground">
                Fields are locked because this record is no longer in GRN Process status.
              </p>
            ) : (
              <>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => void handleSaveGrnDetails()}
                  disabled={isSavingGrn || isMovingToQcrFromSheet}
                >
                  {isSavingGrn ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  {isSavingGrn ? "Saving..." : "Save Details"}
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={() => void handleMoveToQcrFromSheet()}
                  disabled={isSavingGrn || isMovingToQcrFromSheet}
                >
                  {isMovingToQcrFromSheet ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isMovingToQcrFromSheet ? "Processing..." : "Move to QCR"}
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isMoveDialogOpen}
        onOpenChange={(open) => {
          setIsMoveDialogOpen(open);
          if (!open && !isMovingToQcr) {
            setSelectedMoveRecord(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>GRN Process Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to move this GRN record to QCR?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedMoveRecord ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium text-foreground">{selectedMoveRecord.grn_no}</div>
              <div className="text-muted-foreground">
                {selectedMoveRecord.trade_name || selectedMoveRecord.contact_name || selectedMoveRecord.supplier_id || "-"}
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMovingToQcr}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => {
              event.preventDefault();
              void handleMoveToQcr();
            }} disabled={isMovingToQcr}>
              {isMovingToQcr ? "Moving..." : "Move to QCR"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isQcrDialogOpen}
        onOpenChange={(open) => {
          setIsQcrDialogOpen(open);
          if (!open && !isUpdatingQcrStatus) {
            setSelectedQcrRecord(null);
            setSelectedQcrAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QCR Process Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedQcrAction === "move_to_grn"
                ? "Do you want to accept this QCR record and move it to GRN?"
                : "Do you want to reject this QCR record?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedQcrRecord ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium text-foreground">{selectedQcrRecord.grn_reference_no}</div>
              <div className="text-muted-foreground">
                {selectedQcrRecord.snapshot?.trade_name
                  || selectedQcrRecord.snapshot?.contact_name
                  || selectedQcrRecord.snapshot?.supplier_id
                  || selectedQcrRecord.source_grn_data?.trade_name
                  || selectedQcrRecord.source_grn_data?.contact_name
                  || selectedQcrRecord.source_grn_data?.supplier_id
                  || "-"}
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingQcrStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleQcrStatusUpdate();
              }}
              disabled={isUpdatingQcrStatus}
            >
              {isUpdatingQcrStatus
                ? "Updating..."
                : selectedQcrAction === "move_to_grn"
                  ? "Accept"
                  : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModuleFormFieldsReference moduleId="purchasesaledoc" />
    </div>
  );
};

export default PurchasesInwardsPage;
