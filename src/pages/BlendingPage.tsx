import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AdditiveItemAutocomplete from "@/components/AdditiveItemAutocomplete";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { DepartmentStock, StoreStockRecord, StoreStockRequest } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const unwrapResults = <T,>(payload: { data?: { results?: T[] } } | T[]) =>
  Array.isArray(payload) ? payload : payload.data?.results ?? [];

const additiveRequestSchema = z.object({
  item_id: z.string().min(1, "Additive item is required."),
  quantity: z.string().min(1, "Quantity is required."),
  requested_for_name: z.string().min(1, "Requested person is required."),
  request_reason: z.string().min(1, "Reason is required."),
});

type AdditiveRequestValues = z.infer<typeof additiveRequestSchema>;

const additiveRequestDefaults: AdditiveRequestValues = {
  item_id: "",
  quantity: "",
  requested_for_name: "",
  request_reason: "",
};

const isAdditiveRecord = (record: { category?: string; group?: string; sub_group?: string; item_name?: string }) =>
  [record.category, record.group, record.sub_group, record.item_name].some((value) =>
    String(value ?? "").toLowerCase().includes("additive"),
  );

const statusTone = (status: StoreStockRequest["status"]) => {
  if (status === "APPROVED") {
    return "text-emerald-700";
  }
  if (status === "REJECTED") {
    return "text-rose-700";
  }
  return "text-amber-700";
};

const BlendingPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdditiveItem, setSelectedAdditiveItem] = useState<StoreStockRecord | null>(null);
  const form = useForm<AdditiveRequestValues>({
    resolver: zodResolver(additiveRequestSchema),
    defaultValues: additiveRequestDefaults,
  });

  const blendingQuery = useQuery({
    queryKey: ["blending-stock"],
    queryFn: async () => {
      const response = await coreApi.get<DepartmentStock[] | { data?: { results?: DepartmentStock[] } }>("/api/blending/stock/");
      return unwrapResults(response.data);
    },
  });

  const storeStockQuery = useQuery({
    queryKey: ["store-intake-options"],
    queryFn: async () => {
      const response = await coreApi.get<StoreStockRecord[] | { data?: { results?: StoreStockRecord[] } }>(
        "/api/blending/request-stock/",
      );
      return unwrapResults(response.data);
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["store-requests"],
    queryFn: async () => {
      const response = await coreApi.get<StoreStockRequest[] | { data?: { results?: StoreStockRequest[] } }>("/api/blending/store-requests/");
      return unwrapResults(response.data);
    },
  });

  const requestStockMutation = useMutation({
    mutationFn: async (payload: AdditiveRequestValues) => {
      const response = await coreApi.post("/api/blending/request-stock/", {
        ...payload,
        item_id: Number(payload.item_id),
        department: "BLENDING",
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Additive store request submitted.");
      setSelectedAdditiveItem(null);
      handleDialogOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["store-requests"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit additive request."));
    },
  });

  const additiveBlendingStock = useMemo(
    () => (blendingQuery.data ?? []).filter((row) => isAdditiveRecord(row)),
    [blendingQuery.data],
  );
  const additiveStoreStock = useMemo(() => storeStockQuery.data ?? [], [storeStockQuery.data]);
  const additiveRequests = useMemo(
    () =>
      (requestsQuery.data ?? []).filter(
        (row) => row.request_type === "ADDITIVE" && row.department.toUpperCase() === "BLENDING",
      ),
    [requestsQuery.data],
  );

  const additiveStoreOptions = useMemo(
    () =>
      additiveStoreStock
        .slice()
        .sort((left, right) => left.item_name.localeCompare(right.item_name)),
    [additiveStoreStock],
  );

  const totalQuantity = additiveBlendingStock.reduce((sum, stock) => sum + Number(stock.quantity), 0);
  const pendingRequests = additiveRequests.filter((request) => request.status === "PENDING").length;
  const additiveItemFieldValue = form.watch("item_id");
  const canSubmitAdditiveRequest = Boolean(additiveItemFieldValue && selectedAdditiveItem) && !requestStockMutation.isPending;

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      form.reset(additiveRequestDefaults);
      setSelectedAdditiveItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blending Additive Requests"
        description="Create store requests for additive materials, track approvals, and monitor additive stock available in blending."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Additive Stock Rows" value={additiveBlendingStock.length} />
        <StatCard label="Blending Qty" value={formatDecimal(totalQuantity)} />
        <StatCard label="Pending Requests" value={pendingRequests} />
        <StatCard label="Department" value="BLENDING" />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Additive Request
        </Button>
      </div>

      {blendingQuery.isLoading || storeStockQuery.isLoading || requestsQuery.isLoading ? <LoadingState label="Loading additive workspace..." /> : null}
      {blendingQuery.isError || storeStockQuery.isError || requestsQuery.isError ? (
        <ErrorState description="Additive request data could not be loaded from the backend." />
      ) : null}

      {!blendingQuery.isLoading && !storeStockQuery.isLoading && !requestsQuery.isLoading && !blendingQuery.isError && !storeStockQuery.isError && !requestsQuery.isError ? (
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Blending Stock</TabsTrigger>
            <TabsTrigger value="requests">Store Requests</TabsTrigger>
            <TabsTrigger value="store">Store Additives</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            {additiveBlendingStock.length ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additiveBlendingStock.map((stock, index) => (
                      <TableRow key={stock.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{stock.item_code}</TableCell>
                        <TableCell>{stock.item_name}</TableCell>
                        <TableCell>{stock.sub_group || stock.group || stock.category || "-"}</TableCell>
                        <TableCell>{formatDecimal(stock.quantity)}</TableCell>
                        <TableCell>{stock.unit}</TableCell>
                        <TableCell>{stock.department}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No additive stock yet" description="Approved additive requests will increase the blending stock table." />
            )}
          </TabsContent>

          <TabsContent value="requests">
            {additiveRequests.length ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Requested For</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additiveRequests.map((request, index) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{request.item_name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{request.item_code}</div>
                        </TableCell>
                        <TableCell>
                          {formatDecimal(request.quantity)} {request.unit}
                        </TableCell>
                        <TableCell>{request.requested_for_name}</TableCell>
                        <TableCell className="max-w-xs truncate" title={request.request_reason}>
                          {request.request_reason}
                        </TableCell>
                        <TableCell>{request.requested_by_username}</TableCell>
                        <TableCell className={statusTone(request.status)}>{request.status}</TableCell>
                        <TableCell>{request.approved_by_username || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No additive requests yet" description="Create the first store request for blending additives." />
            )}
          </TabsContent>

          <TabsContent value="store">
            {additiveStoreOptions.length ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>GRN Reference</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Store Qty</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additiveStoreOptions.map((stock, index) => (
                      <TableRow key={stock.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">STORE</TableCell>
                        <TableCell className="font-mono text-xs">{stock.item_code || "-"}</TableCell>
                        <TableCell>{stock.item_name || "-"}</TableCell>
                        <TableCell>{stock.category || "-"}</TableCell>
                        <TableCell>{formatDecimal(stock.quantity || "0")}</TableCell>
                        <TableCell>BLENDING</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No additive stock in store" description="Store stock does not currently expose any additive items to request." />
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Additive Store Request</DialogTitle>
            <DialogDescription>
              Sends a pending store request to `POST /api/blending/request-stock/` with additive-specific request metadata for the blending team.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => requestStockMutation.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additive Item</FormLabel>
                    <FormControl>
                      <AdditiveItemAutocomplete
                        selectedItem={selectedAdditiveItem}
                        onSelectedItemChange={(item) => {
                          setSelectedAdditiveItem(item);
                          field.onChange(item ? String(item.item) : "");
                          form.clearErrors("item_id");
                        }}
                        error={form.formState.errors.item_id?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requested_for_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Blending operator or supervisor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="request_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Reason for additive request, batch, or production need" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <FlaskConical className="h-4 w-4" />
                  Request Type: Additive Store Request
                </div>
                <p className="mt-1">Department is fixed to BLENDING. Store will approve or reject this request from the store workspace.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmitAdditiveRequest}>
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingPage;
