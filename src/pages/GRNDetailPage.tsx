import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Boxes, FileJson, FileText, MoveRight, Wallet } from "lucide-react";
import { useState } from "react";
import { useMatch, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import GrnPageLayout from "@/features/grn/components/GrnPageLayout";
import GrnSectionCard from "@/features/grn/components/GrnSectionCard";
import {
  GRN_GATE_ENTRY_STATUS,
  buildSupplierAddress,
  defaultItem,
  documentFieldConfigs,
  formatSupplierName,
  getGrnDepartment,
  getPrimaryItemQuantity,
  readValue,
  requirementFieldConfigs,
  supplierFieldConfigs,
  valueFieldConfigs,
} from "@/features/grn/grnShared";
import { grnFieldLabelClassName, grnMetricCardClassName } from "@/features/grn/components/grnPageStyles";
import {
  GRN_PROCESS_ROUTE,
  getGrnProcessEditRoute,
} from "@/features/grn/utils/routes";
import { grnApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { GrnRecord } from "@/lib/types";
import type { GrnUpdateResponse } from "@/features/grn/grnShared";

const DetailField = ({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) => (
  <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-3">
    <div className={grnFieldLabelClassName}>{label}</div>
    <div className={`mt-1.5 text-sm text-slate-700 ${emphasized ? "font-semibold text-slate-900" : ""}`}>{value}</div>
  </div>
);

const GRNDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isViewOnly = Boolean(useMatch("/app/grn/process/:id/view"));
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [moveConfirmOpen, setMoveConfirmOpen] = useState(false);
  const hasValidRecordId = Number.isFinite(recordId);

  const detailQuery = useQuery({
    queryKey: ["grn-detail", recordId],
    enabled: hasValidRecordId,
    queryFn: async () => {
      const response = await grnApi.get<GrnUpdateResponse>(`/api/grn/${recordId}/`);
      return response.data;
    },
  });

  const detailRecord: GrnRecord | null = detailQuery.data?.data ?? null;
  const isActiveRecord = detailRecord?.process_status === GRN_GATE_ENTRY_STATUS;

  const moveMutation = useMutation({
    mutationFn: async () => {
      const response = await grnApi.post(`/api/grn/${recordId}/move-to-qcr/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Gate Entry moved to QCR.");
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      navigate(GRN_PROCESS_ROUTE);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move Gate Entry to QCR.")),
  });

  if (detailQuery.isLoading) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <LoadingState label="Loading GRN details..." />
      </GrnPageLayout>
    );
  }

  if (!hasValidRecordId || detailQuery.isError || !detailRecord) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <ErrorState description="Could not load the selected GRN record." />
      </GrnPageLayout>
    );
  }

  return (
    <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.38)]">
        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 bg-white">
            <div className="px-5 py-4 lg:px-6 lg:py-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center rounded-full border border-[#d8e6ff] bg-[#f6f9ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2d6cdf]">
                      Gate Entry Review
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span>Inventory Receipt</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span>Commercial Validation</span>
                    </span>
                    <span>Posting Context</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-950 lg:text-[1.9rem]">
                        {detailRecord.grn_no}
                      </h1>
                      <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                        {detailRecord.process_status}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
                        {isViewOnly ? "View Only" : isActiveRecord ? "Active Queue" : "Processed Queue"}
                      </Badge>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                      Review document, supplier, line, and commercial details in a full-page gate entry workspace before inventory progression.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isViewOnly && isActiveRecord && (
                      <Button
                        className="rounded-full bg-[linear-gradient(135deg,#2d6cdf_0%,#1953bc_100%)] text-white hover:opacity-95"
                        onClick={() => navigate(getGrnProcessEditRoute(detailRecord.id))}
                      >
                        Edit Gate Entry
                      </Button>
                    )}

                    {!isViewOnly && isActiveRecord ? (
                      <Button variant="outline" className="rounded-full" onClick={() => setMoveConfirmOpen(true)}>
                        <MoveRight className="mr-2 h-4 w-4" />
                        Move to QCR
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
                  <div className={grnMetricCardClassName}>
                    <div className={grnFieldLabelClassName}>Supplier</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900">{formatSupplierName(detailRecord)}</div>
                  </div>
                  <div className={grnMetricCardClassName}>
                    <div className={grnFieldLabelClassName}>Department</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900">{getGrnDepartment(detailRecord)}</div>
                  </div>
                  <div className={grnMetricCardClassName}>
                    <div className={grnFieldLabelClassName}>GRN Date</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900">{formatDate(detailRecord.grn_date)}</div>
                  </div>
                  <div className={grnMetricCardClassName}>
                    <div className={grnFieldLabelClassName}>Total After Tax</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900">
                      {formatDecimal(detailRecord.value_details.total_after_tax ?? detailRecord.total_after_tax, 2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-0 lg:px-6">
              <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-none bg-transparent p-0">
                {[
                  ["overview", "Overview"],
                  ["supplier", "Supplier"],
                  ["items", "Items"],
                  ["commercial", "Commercial"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="relative min-w-fit rounded-none border-b-2 border-transparent px-3 py-2.5 text-[13px] font-semibold text-slate-500 shadow-none transition-colors hover:text-slate-800 data-[state=active]:border-[#ff6b00] data-[state=active]:bg-transparent data-[state=active]:text-[#ff6b00] data-[state=active]:shadow-none"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
            <TabsContent value="overview" className="mt-0 space-y-4 outline-none">
              <div className="grid gap-4 xl:grid-cols-2">
                <GrnSectionCard
                  title="Document Details"
                  description="Receipt references, invoice linkage, and gate entry values."
                  tone="amber"
                  icon={FileText}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {documentFieldConfigs.map((config) => (
                      <DetailField
                        key={config.name}
                        label={config.label}
                        value={readValue(detailRecord.document_details[config.name] ?? (config.name === "grn_no" ? detailRecord.grn_no : config.name === "grn_date" ? detailRecord.grn_date : ""))}
                        emphasized={config.name === "grn_no"}
                      />
                    ))}
                  </div>
                </GrnSectionCard>

                <GrnSectionCard
                  title="Requirement Details"
                  description="Request ownership, department, and inward reason."
                  tone="blue"
                  icon={Boxes}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {requirementFieldConfigs.map((config) => (
                      <DetailField
                        key={config.name}
                        label={config.label}
                        value={readValue(detailRecord.document_requirement_details[config.name])}
                        emphasized={config.name === "req_department"}
                      />
                    ))}
                  </div>
                </GrnSectionCard>
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="mt-0 space-y-4 outline-none">
              <GrnSectionCard
                title="Supplier Information"
                description="Supplier master details, contact information, and location context."
                tone="violet"
                icon={Building2}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {supplierFieldConfigs
                    .filter((config) => config.name !== "address1" && config.name !== "address2")
                    .map((config) => (
                      <DetailField
                        key={config.name}
                        label={config.label}
                        value={readValue(detailRecord.supplier_details[config.name])}
                        emphasized={config.name === "trade_name"}
                      />
                    ))}
                  <div className="sm:col-span-2 xl:col-span-3">
                    <DetailField label="Supplier Address" value={readValue(buildSupplierAddress(detailRecord))} />
                  </div>
                </div>
              </GrnSectionCard>
            </TabsContent>

            <TabsContent value="items" className="mt-0 space-y-4 outline-none">
              <div className="grid gap-4 xl:grid-cols-2">
                {(detailRecord.items.length ? detailRecord.items : [defaultItem]).map((item, index) => (
                  <GrnSectionCard
                    key={`${detailRecord.id}-item-${index}`}
                    title={`Line ${index + 1}`}
                    description="Material identity, quantity split, and tax valuation."
                    tone="gold"
                    icon={Boxes}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField label="Item ID" value={readValue(item.item_id)} emphasized />
                      <DetailField label="Serial Number" value={readValue(item.item_serial_number)} />
                      <div className="sm:col-span-2">
                        <DetailField label="Product Description" value={readValue(item.product_description)} />
                      </div>
                      <DetailField label="HSN Code" value={readValue(item.hsn_code)} />
                      <DetailField label="Total Quantity" value={readValue(item.total_quantity)} />
                      <DetailField label="Quantity" value={readValue(item.quantity)} />
                      <DetailField label="Free Quantity" value={readValue(item.free_quantity)} />
                      <DetailField label="Accepted Quantity" value={readValue(item.accepted_qty)} emphasized />
                      <DetailField label="Rejected Quantity" value={readValue(item.rejected_qty)} />
                      <DetailField label="Unit" value={readValue(item.unit)} />
                      <DetailField label="Unit Price" value={readValue(item.unit_price)} />
                      <DetailField label="Total Item Value" value={readValue(item.total_item_value)} emphasized />
                    </div>
                  </GrnSectionCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="mt-0 space-y-4 outline-none">
              <div className="grid gap-4 xl:grid-cols-2">
                <GrnSectionCard
                  title="Commercial Totals"
                  description="Freight, tax, and total valuation values posted with the receipt."
                  tone="emerald"
                  icon={Wallet}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {valueFieldConfigs.map((config) => (
                      <DetailField
                        key={config.name}
                        label={config.label}
                        value={readValue(
                          config.name === "total_after_tax"
                            ? detailRecord.value_details.total_after_tax ?? detailRecord.total_after_tax
                            : detailRecord.value_details[config.name],
                        )}
                        emphasized={config.name === "total_after_tax"}
                      />
                    ))}
                  </div>
                </GrnSectionCard>

                <GrnSectionCard
                  title="Workflow Snapshot"
                  description="Current GRN workflow status and movement timestamps."
                  tone="slate"
                  icon={FileText}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Process Status" value={readValue(detailRecord.process_status)} emphasized />
                    <DetailField label="Record Status" value={detailRecord.status ? "Active" : "Inactive"} />
                    <DetailField label="Moved To QCR At" value={formatDateTime(detailRecord.moved_to_qcr_at)} />
                    <DetailField label="Moved To QCR By" value={readValue(detailRecord.moved_to_qcr_by)} />
                    <DetailField label="Created At" value={formatDateTime(detailRecord.created_at)} />
                    <DetailField label="Updated At" value={formatDateTime(detailRecord.updated_at)} />
                    <DetailField label="Primary Quantity" value={readValue(getPrimaryItemQuantity(detailRecord))} />
                    <DetailField label="Unique ID" value={readValue(detailRecord.unique_id)} />
                  </div>
                </GrnSectionCard>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={payloadOpen} onOpenChange={setPayloadOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detailRecord.grn_no} Payload</DialogTitle>
            <DialogDescription>Preserved external GRN payload stored in the record snapshot.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(detailRecord.raw_payload ?? detailRecord, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={moveConfirmOpen}
        onOpenChange={setMoveConfirmOpen}
        title="Move Gate Entry to QCR"
        description={`Move ${detailRecord.grn_no} directly to QCR? This will complete Gate Entry and send the record to the QCR queue.`}
        confirmLabel={moveMutation.isPending ? "Moving..." : "Move to QCR"}
        onConfirm={() => moveMutation.mutate()}
      />
    </GrnPageLayout>
  );
};

export default GRNDetailPage;
