import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, MoveRight, Plus, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { grnApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeGrnResponse, summarizeImportResponse } from "@/lib/api-helpers";
import type { GrnListResponse, GrnRecord, ImportResponse } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

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

const defaultItem = {
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

const GRNPage = () => {
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<GrnRecord | null>(null);
  const [moveTarget, setMoveTarget] = useState<GrnRecord | null>(null);
  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues,
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
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

  const moveMutation = useMutation({
    mutationFn: async (grnId: number) => {
      const response = await grnApi.post(`/api/grn/${grnId}/move-to-qcr/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("GRN moved to QCR.");
      setMoveTarget(null);
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

  const renderTable = (records: GrnRecord[], showMoveAction: boolean) => {
    if (!records.length) {
      return <EmptyState title="No GRN records" description="Create a GRN or import an Excel workbook to populate this tab." />;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN No</TableHead>
              <TableHead>GRN Date</TableHead>
              <TableHead>PO No</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice No</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Total After Tax</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Moved To QCR</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.grn_no}</TableCell>
                <TableCell>{formatDate(record.grn_date)}</TableCell>
                <TableCell>{record.document_details.po_no || "-"}</TableCell>
                <TableCell>{record.supplier_details.trade_name || record.trade_name || "-"}</TableCell>
                <TableCell>{record.document_details.supplier_invoice_no || "-"}</TableCell>
                <TableCell>{record.product_description || record.items?.[0]?.product_description || "-"}</TableCell>
                <TableCell>{formatDecimal(getPrimaryItemQuantity(record))}</TableCell>
                <TableCell>{record.document_requirement_details.req_department || "-"}</TableCell>
                <TableCell>{formatDecimal(record.value_details.total_after_tax ?? record.total_after_tax, 2)}</TableCell>
                <TableCell>{record.process_status}</TableCell>
                <TableCell>{formatDateTime(record.moved_to_qcr_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailRecord(record)}>View</Button>
                    {showMoveAction ? (
                      <Button variant="outline" size="sm" onClick={() => setMoveTarget(record)}>
                        <MoveRight className="mr-2 h-4 w-4" />
                        Move to QCR
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GRN Management"
        description="Active GRN, moved-to-QCR records, nested create form, and Excel import against the GRN service."
        actions={
          <>
            <input ref={importInputRef} type="file" accept=".xlsx,.xlsm,.xltx,.xltm" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                importMutation.mutate(file);
              }
            }} />
            <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button variant="outline" onClick={() => {
              activeQuery.refetch();
              movedQuery.refetch();
            }}>
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
        <StatCard label="Multi-item Support" value="Enabled" hint="Frontend submits `items[]` exactly." />
      </div>

      {activeQuery.isLoading || movedQuery.isLoading ? <LoadingState label="Loading GRN records..." /> : null}
      {activeQuery.isError || movedQuery.isError ? <ErrorState description="GRN records could not be loaded from the GRN service." /> : null}

      {!activeQuery.isLoading && !movedQuery.isLoading && !activeQuery.isError && !movedQuery.isError ? (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active GRN</TabsTrigger>
            <TabsTrigger value="moved">Moved to QCR</TabsTrigger>
          </TabsList>
          <TabsContent value="active">{renderTable(activeQuery.data?.data ?? [], true)}</TabsContent>
          <TabsContent value="moved">{renderTable(movedQuery.data?.data ?? [], false)}</TabsContent>
        </Tabs>
      ) : null}

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
                {(["po_no", "po_date", "grn_no", "grn_date", "supplier_invoice_no", "supplier_invoice_date", "gateentry_bookno", "gateentry_bookdate", "tolerance"] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={`document_details.${fieldName}`} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName.replace(/_/g, " ")}</FormLabel>
                      <FormControl><Input {...field} type={fieldName.includes("date") ? "date" : "text"} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(["req_date", "req_person_name", "req_person_id", "req_department", "req_reason"] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={`document_requirement_details.${fieldName}`} render={({ field }) => (
                    <FormItem className={fieldName === "req_reason" ? "xl:col-span-3" : undefined}>
                      <FormLabel>{fieldName.replace(/_/g, " ")}</FormLabel>
                      <FormControl>{fieldName === "req_reason" ? <Textarea {...field} rows={2} /> : <Input {...field} type={fieldName === "req_date" ? "date" : "text"} />}</FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(["supplier_id", "gstin", "contact_name", "trade_name", "contact_type", "address1", "address2", "location", "pincode", "state_name", "state_code", "country", "person_name", "phone_number", "email", "category", "segment", "sub_segment", "sales_contact_id", "currency"] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={`supplier_details.${fieldName}`} render={({ field }) => (
                    <FormItem className={fieldName === "address1" || fieldName === "address2" ? "xl:col-span-3" : undefined}>
                      <FormLabel>{fieldName.replace(/_/g, " ")}</FormLabel>
                      <FormControl>{fieldName === "address1" || fieldName === "address2" ? <Textarea {...field} rows={2} /> : <Input {...field} />}</FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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
                      {(["item_id", "item_serial_number", "product_description", "hsn_code", "total_quantity", "quantity", "free_quantity", "accepted_qty", "rejected_qty", "unit", "unit_price", "total_amount", "discount", "assessable_value", "gst_rate", "igst_amount", "cgst_amount", "sgst_amount", "total_item_value"] as const).map((fieldName) => (
                        <FormField key={fieldName} control={form.control} name={`items.${index}.${fieldName}`} render={({ field }) => (
                          <FormItem className={fieldName === "product_description" ? "xl:col-span-3" : undefined}>
                            <FormLabel>{fieldName.replace(/_/g, " ")}</FormLabel>
                            <FormControl>{fieldName === "product_description" ? <Textarea {...field} rows={2} /> : <Input {...field} />}</FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(["freight_charge", "loading_unloading_charge", "total_before_tax", "total_tax_amount", "total_after_tax"] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={`value_details.${fieldName}`} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName.replace(/_/g, " ")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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

      <Dialog open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detailRecord?.grn_no}</DialogTitle>
            <DialogDescription>Read view returned by `GET GRN/api/grn/`.</DialogDescription>
          </DialogHeader>
          {detailRecord ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="GRN Date" value={formatDate(detailRecord.grn_date)} />
                <StatCard label="Supplier" value={detailRecord.supplier_details.trade_name || detailRecord.trade_name || "-"} />
                <StatCard label="Status" value={detailRecord.process_status} />
                <StatCard label="Moved At" value={formatDateTime(detailRecord.moved_to_qcr_at)} />
              </div>
              <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                {JSON.stringify(detailRecord, null, 2)}
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
