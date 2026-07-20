import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LookupItem, ScrapTypeValue, WarehouseMasterRecord } from "@/features/wpe-masters/types";
import { coreApi } from "@/lib/api";
import { formatDateTime, getApiErrorMessage, normalizeListResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ProductionBatch } from "@/lib/types";
import { cn } from "@/lib/utils";

type WeightSnapshot = {
  value: number;
  stable: boolean;
  timestamp: Date;
} | null;

type ScaleCapturePayload = {
  device_id?: string;
  bridge_client_id?: string;
  workstation_id?: string;
  source?: string;
};

type ScrapCaptureRecord = {
  id: number;
  source_batch_no: string;
  scrap_type: number;
  scrap_type_name: string;
  scrap_type_type: ScrapTypeValue;
  warehouse: number;
  warehouse_code: string | null;
  warehouse_name: string;
  line_connection_baglot: string | null;
  weight_kg: string;
  captured_at: string;
  created_by_username: string | null;
};

type ProductionScrapCapturePanelProps = {
  active: boolean;
  orderId: number | null;
  activeBatch: ProductionBatch | null;
  weight: WeightSnapshot;
  connected: boolean;
  statusLabel: string;
  scaleCapturePayload: ScaleCapturePayload;
  onTare: () => void;
  onCaptured: () => void;
};

const SCRAP_TYPE_OPTIONS: Array<{ value: ScrapTypeValue; label: string }> = [
  { value: "STARTUP", label: "Startup" },
  { value: "SETUP", label: "Setup" },
  { value: "PROCESS", label: "Process" },
  { value: "DOWNTIME", label: "Downtime" },
];

const typeLabel = (value: ScrapTypeValue | string) =>
  SCRAP_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const formatCaptureTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
};

const ProductionScrapCapturePanel = ({
  active,
  orderId,
  activeBatch,
  weight,
  connected,
  statusLabel,
  scaleCapturePayload,
  onTare,
  onCaptured,
}: ProductionScrapCapturePanelProps) => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ScrapTypeValue>("PROCESS");
  const [selectedScrapTypeId, setSelectedScrapTypeId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  useEffect(() => {
    setSelectedScrapTypeId("");
  }, [selectedType]);

  const scrapTypesQuery = useQuery({
    queryKey: ["wpe-masters", "scrap-types", "lookup", selectedType],
    enabled: active,
    queryFn: () => wpeMastersApi.scrapTypes.lookup({ type: selectedType }) as Promise<LookupItem[]>,
  });

  const scrapWarehousesQuery = useQuery({
    queryKey: ["wpe-masters", "warehouses", "scrap-lookup"],
    enabled: active,
    queryFn: () => wpeMastersApi.warehouses.list({ pageSize: 500, is_active: true, warehouse_type: "SCRAP" }),
  });

  const allWarehousesQuery = useQuery({
    queryKey: ["wpe-masters", "warehouses", "active-lookup"],
    enabled: active && !scrapWarehousesQuery.isLoading && (scrapWarehousesQuery.data?.items.length ?? 0) === 0,
    queryFn: () => wpeMastersApi.warehouses.list({ pageSize: 500, is_active: true }),
  });

  const capturesQuery = useQuery({
    queryKey: ["production-scrap-captures", orderId],
    enabled: active && orderId !== null,
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/orders/${orderId}/scrap-captures/`);
      return normalizeListResponse<ScrapCaptureRecord>(response.data);
    },
  });

  const warehouses = useMemo<WarehouseMasterRecord[]>(
    () =>
      scrapWarehousesQuery.data?.items.length
        ? scrapWarehousesQuery.data.items
        : allWarehousesQuery.data?.items ?? [],
    [allWarehousesQuery.data?.items, scrapWarehousesQuery.data?.items],
  );

  const canCapture = Boolean(
    active &&
      orderId !== null &&
      activeBatch?.id &&
      selectedScrapTypeId &&
      selectedWarehouseId &&
      connected &&
      weight?.stable &&
      weight.value > 0,
  );

  const captureMutation = useMutation({
    mutationFn: async () => {
      const response = await coreApi.post<unknown>(`/api/production/orders/${orderId}/scrap-captures/`, {
        source_batch: activeBatch?.id,
        scrap_type: Number(selectedScrapTypeId),
        warehouse: Number(selectedWarehouseId),
        weight_kg: weight?.value.toFixed(3),
        ...scaleCapturePayload,
      });
      return unwrapSuccessEnvelope<ScrapCaptureRecord>(response.data as ScrapCaptureRecord | unknown);
    },
    onSuccess: async () => {
      toast.success("Scrap captured.");
      setSelectedScrapTypeId("");
      await capturesQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["production-inventory"] });
      onCaptured();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to capture scrap.")),
  });

  const captures = capturesQuery.data ?? [];
  const selectedScrapTypes = scrapTypesQuery.data ?? [];
  const currentBatchLabel = activeBatch?.display_batch_no?.trim() || activeBatch?.batch_no?.trim() || "-";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.25)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid gap-x-4 gap-y-3 lg:grid-cols-[132px_168px_minmax(280px,1fr)]">
            <div className="pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Scrap Type
            </div>

            <div className="flex flex-wrap gap-2 lg:row-span-2 lg:flex-col">
              {SCRAP_TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedType === option.value ? "default" : "outline"}
                  className="h-9 w-[calc(50%-0.25rem)] rounded-lg px-4 text-xs sm:w-auto lg:w-full"
                  onClick={() => setSelectedType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <Select value={selectedScrapTypeId} onValueChange={setSelectedScrapTypeId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={scrapTypesQuery.isLoading ? "Loading scrap types..." : "Select Scrap Type"} />
              </SelectTrigger>
              <SelectContent>
                {selectedScrapTypes.map((scrapType) => (
                  <SelectItem key={scrapType.id} value={String(scrapType.id)}>
                    {scrapType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Warehouse
            </div>

            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={scrapWarehousesQuery.isLoading ? "Loading warehouses..." : "Select Warehouse"} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:col-span-3">
              <span className="rounded-full bg-slate-100 px-3 py-1">PR Batch: {currentBatchLabel}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{weight?.stable ? "Stable" : "Awaiting stable reading"}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{statusLabel}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-white xl:min-h-[168px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">
                <Scale className="h-4 w-4" />
                Compact Scale
              </div>
              <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-400" : "bg-slate-500")} />
            </div>
            <div className="mt-5 text-right">
              <span className="font-weight-display text-[44px] font-bold leading-none tracking-[0.06em]">
                {weight ? weight.value.toFixed(3) : "0.000"}
              </span>
              <span className="ml-1 text-sm font-bold">kg</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" className="h-9 rounded-lg px-4 text-xs" onClick={onTare}>
                Tare
              </Button>
              <Button
                type="button"
                className="h-9 rounded-lg px-4 text-xs"
                disabled={!canCapture || captureMutation.isPending}
                onClick={() => captureMutation.mutate()}
              >
                {captureMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Capture
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.22)]">
        <div className="border-b border-slate-200/75 px-4 py-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-900">
            Captured Scrap Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[920px] text-[12px]">
            <TableHeader>
              <TableRow>
                <TableHead>S.No.</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scrap Type</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Baglot</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead>Captured By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {captures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                    No scrap transactions captured.
                  </TableCell>
                </TableRow>
              ) : (
                captures.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>{formatDateTime(record.captured_at)}</div>
                      <div className="text-[11px] text-slate-500">{formatCaptureTime(record.captured_at)}</div>
                    </TableCell>
                    <TableCell>{record.source_batch_no || "-"}</TableCell>
                    <TableCell>{typeLabel(record.scrap_type_type)}</TableCell>
                    <TableCell>{record.scrap_type_name}</TableCell>
                    <TableCell>{record.warehouse_name || record.warehouse_code || "-"}</TableCell>
                    <TableCell>{record.line_connection_baglot || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{Number(record.weight_kg || 0).toFixed(3)}</TableCell>
                    <TableCell>{record.created_by_username || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ProductionScrapCapturePanel;
