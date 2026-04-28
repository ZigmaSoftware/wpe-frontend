import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, EllipsisVertical, FileSpreadsheet, PackageOpen, Plus, RefreshCw, Search } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const GRN_API_URL = import.meta.env.VITE_GRN_API_URL ?? "/api/grn/";
const GRN_MOVED_API_URL = import.meta.env.VITE_GRN_MOVED_API_URL ?? "/api/grn/moved/";
const GRN_IMPORT_API_URL = import.meta.env.VITE_GRN_IMPORT_API_URL ?? "/api/grn/import/";
const QCR_API_URL = import.meta.env.VITE_QCR_API_URL ?? "/api/qcr/";
const GRN_MOVE_TO_QCR_API_URL = import.meta.env.VITE_GRN_MOVE_TO_QCR_API_URL ?? "/api/grn";
const QCR_STATUS_API_URL = import.meta.env.VITE_QCR_STATUS_API_URL ?? "/api/qcr";
const QCR_CANCELLED_API_URL = import.meta.env.VITE_QCR_CANCELLED_API_URL ?? "/api/qcr/cancelled/";

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
    return data as GRNRecord[];
  }

  if (Array.isArray(data.results)) {
    return data.results as GRNRecord[];
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
                        {selectedTab === "grn_process" ? <TableHead className="w-20 text-right">Action</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grnFilteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={selectedTab === "grn_process" ? 10 : 9} className="h-24 text-center text-muted-foreground">
                            No GRN records match the current search or filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        grnFilteredRows.map((record, index) => (
                          <TableRow key={record.id} className="hover:bg-muted/50">
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
                                className={record.process_status === "Moved to QCR" ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : "bg-success/10 text-success"}
                              >
                                {record.process_status}
                              </Badge>
                            </TableCell>
                            {selectedTab === "grn_process" ? (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <EllipsisVertical className="h-4 w-4" />
                                      <span className="sr-only">Open row actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => openMoveDialog(record)}
                                      disabled={record.process_status !== "GRN Process"}
                                    >
                                      Move to QCR
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            ) : null}
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
                                      : record.status === "Moved to GRN"
                                        ? "border-blue-200 bg-blue-500/10 text-blue-700"
                                        : "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                                  }
                                >
                                  {record.status}
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
                                        Move to GRN
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
                ? "Do you want to move this QCR record to GRN?"
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
                  ? "Move to GRN"
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
