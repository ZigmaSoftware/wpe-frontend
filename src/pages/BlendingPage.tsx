import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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

const additiveRequestLineSchema = z.object({
  item_id: z.string().min(1, "Additive item is required."),
  quantity: z
    .string()
    .min(1, "Quantity is required.")
    .refine((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric > 0;
    }, "Quantity must be greater than zero."),
});

const additiveRequestSchema = z.object({
  items: z.array(additiveRequestLineSchema).min(1, "At least one additive item is required."),
  requested_for_name: z.string().min(1, "Requested person is required."),
  request_reason: z.string().min(1, "Reason is required."),
});

type AdditiveRequestValues = z.infer<typeof additiveRequestSchema>;

const additiveRequestDefaults: AdditiveRequestValues = {
  items: [],
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

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const getRequestItemSummary = (request: StoreStockRequest) => {
  const items = request.items ?? [];
  if (!items.length) {
    return {
      title: request.item_name || "-",
      subtitle: request.item_code || null,
      extra: null as string | null,
    };
  }

  const [firstItem, ...restItems] = items;
  return {
    title: firstItem.item_name,
    subtitle: firstItem.item_code,
    extra: restItems.length ? `+${restItems.length} more item${restItems.length > 1 ? "s" : ""}` : null,
  };
};

type StoreAdditiveRequestGroupItem = {
  itemKey: string;
  itemCode: string;
  itemName: string;
  unit: string;
  category: string;
  requestIds: string[];
  requestedQty: number;
  availableQty: string;
  status: string;
  department: string;
};

type StoreAdditiveRequestGroup = {
  key: string;
  requestIds: string[];
  requests: StoreStockRequest[];
  items: StoreAdditiveRequestGroupItem[];
  status: string;
  department: string;
  requestedAt: string | null;
};

const getRequestDisplayId = (request: StoreStockRequest) => request.request_no || `SR-${request.id}`;

const getRequestGroupKey = (request: StoreStockRequest) => {
  const itemKeys = (request.items ?? [])
    .map((item) => String(item.item))
    .sort((left, right) => left.localeCompare(right));

  return itemKeys.length ? itemKeys.join("|") : `request:${request.id}`;
};

const buildStoreAdditiveRequestGroups = (requests: StoreStockRequest[]): StoreAdditiveRequestGroup[] => {
  const groups = requests.reduce<Map<string, StoreAdditiveRequestGroup>>((result, request) => {
    const key = getRequestGroupKey(request);
    const requestId = getRequestDisplayId(request);
    const existingGroup =
      result.get(key) ??
      ({
        key,
        requestIds: [],
        requests: [],
        items: [],
        status: request.status,
        department: request.department,
        requestedAt: request.requested_at || null,
      } satisfies StoreAdditiveRequestGroup);

    existingGroup.requestIds.push(requestId);
    existingGroup.requests.push(request);

    if (request.requested_at) {
      const currentTime = existingGroup.requestedAt ? new Date(existingGroup.requestedAt).getTime() : 0;
      const nextTime = new Date(request.requested_at).getTime();
      if (nextTime > currentTime) {
        existingGroup.requestedAt = request.requested_at;
      }
    }

    const statuses = new Set(existingGroup.requests.map((row) => row.status));
    existingGroup.status = statuses.size === 1 ? request.status : "MIXED";

    const departments = new Set(existingGroup.requests.map((row) => row.department));
    existingGroup.department = departments.size === 1 ? request.department : "Multiple";

    (request.items ?? []).forEach((item) => {
      const itemKey = String(item.item);
      const existingItem = existingGroup.items.find((row) => row.itemKey === itemKey);
      const requestedQty = Number(item.requested_qty || 0);

      if (existingItem) {
        existingItem.requestIds.push(requestId);
        existingItem.requestedQty += Number.isFinite(requestedQty) ? requestedQty : 0;
        existingItem.status = existingItem.status === request.status ? existingItem.status : "MIXED";
        return;
      }

      existingGroup.items.push({
        itemKey,
        itemCode: item.item_code || "-",
        itemName: item.item_name || "-",
        unit: item.unit || "",
        category: item.sub_group || item.group || item.category || "-",
        requestIds: [requestId],
        requestedQty: Number.isFinite(requestedQty) ? requestedQty : 0,
        availableQty: item.available_qty || "0",
        status: request.status,
        department: request.department,
      });
    });

    existingGroup.items.sort((left, right) => left.itemName.localeCompare(right.itemName));
    result.set(key, existingGroup);
    return result;
  }, new Map());

  return Array.from(groups.values()).sort((left, right) => {
    const leftTime = left.requestedAt ? new Date(left.requestedAt).getTime() : 0;
    const rightTime = right.requestedAt ? new Date(right.requestedAt).getTime() : 0;
    return rightTime - leftTime;
  });
};

const BlendingPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productPickerItem, setProductPickerItem] = useState<StoreStockRecord | null>(null);
  const [selectedAdditiveItems, setSelectedAdditiveItems] = useState<StoreStockRecord[]>([]);
  const [detailRequestGroup, setDetailRequestGroup] = useState<StoreAdditiveRequestGroup | null>(null);
  const form = useForm<AdditiveRequestValues>({
    resolver: zodResolver(additiveRequestSchema),
    defaultValues: additiveRequestDefaults,
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
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
      const normalizedItems = payload.items.reduce<Array<{ item_id: number; quantity: string }>>((result, item) => {
        const itemId = Number(item.item_id);
        const existingItem = result.find((row) => row.item_id === itemId);

        if (!existingItem) {
          result.push({
            item_id: itemId,
            quantity: item.quantity,
          });
          return result;
        }

        existingItem.quantity = String(Number(existingItem.quantity) + Number(item.quantity));
        return result;
      }, []);

      const response = await coreApi.post("/api/blending/store-requests/", {
        request_type: "ADDITIVE",
        department: "BLENDING",
        requested_for_name: payload.requested_for_name,
        request_reason: payload.request_reason,
        items: normalizedItems,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Additive store request submitted.");
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
  const additiveRequests = useMemo(
    () =>
      (requestsQuery.data ?? []).filter(
        (row) => row.request_type === "ADDITIVE" && row.department.toUpperCase() === "BLENDING",
      ),
    [requestsQuery.data],
  );

  const additiveRequestGroups = useMemo(() => buildStoreAdditiveRequestGroups(additiveRequests), [additiveRequests]);

  const totalQuantity = additiveBlendingStock.reduce((sum, stock) => sum + Number(stock.quantity), 0);
  const pendingRequests = additiveRequests.filter((request) => request.status === "PENDING").length;
  const watchedItems = form.watch("items");
  const hasDuplicateSelectedItems =
    watchedItems.filter((item) => item.item_id).length !== new Set(watchedItems.map((item) => item.item_id).filter(Boolean)).size;
  const canSubmitAdditiveRequest =
    watchedItems.length > 0 &&
    watchedItems.every((item, index) => Boolean(item.item_id && item.quantity && Number(item.quantity) > 0 && selectedAdditiveItems[index])) &&
    !hasDuplicateSelectedItems &&
    !requestStockMutation.isPending;

  const handlePickerItemChange = (item: StoreStockRecord | null) => {
    if (!item) {
      setProductPickerItem(null);
      return;
    }

    const alreadySelected = watchedItems.some((row) => row.item_id === String(item.item));
    if (alreadySelected) {
      toast.error("This product is already added to the request.");
      setProductPickerItem(null);
      return;
    }

    itemsFieldArray.append({ item_id: String(item.item), quantity: "" });
    setSelectedAdditiveItems((current) => [...current, item]);
    setProductPickerItem(null);
    form.clearErrors("items");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      form.reset(additiveRequestDefaults);
      setProductPickerItem(null);
      setSelectedAdditiveItems([]);
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
                    {additiveRequests.map((request, index) => {
                      const summary = getRequestItemSummary(request);
                      return (
                      <TableRow key={request.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{summary.title}</div>
                          {summary.subtitle ? (
                            <div className="font-mono text-xs text-muted-foreground">{summary.subtitle}</div>
                          ) : null}
                          {summary.extra ? (
                            <div className="text-xs text-muted-foreground">{summary.extra}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(request.total_requested_qty ?? request.quantity)} {request.unit || request.items?.[0]?.unit || ""}
                        </TableCell>
                        <TableCell>{request.requested_for_name}</TableCell>
                        <TableCell className="max-w-xs truncate" title={request.request_reason}>
                          {request.request_reason}
                        </TableCell>
                        <TableCell>{request.requested_by_username}</TableCell>
                        <TableCell className={statusTone(request.status)}>{request.status}</TableCell>
                        <TableCell>{request.approved_by_username || "-"}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No additive requests yet" description="Create the first store request for blending additives." />
            )}
          </TabsContent>

          <TabsContent value="store">
            {additiveRequestGroups.length ? (
              <div className="grid gap-4">
                {additiveRequestGroups.map((group, groupIndex) => (
                  <div key={group.key} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Group {groupIndex + 1}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="font-semibold text-foreground">{group.requestIds.length} request ID{group.requestIds.length > 1 ? "s" : ""}</p>
                          <p className={group.status === "MIXED" ? "text-muted-foreground" : statusTone(group.status as StoreStockRequest["status"])}>{group.status}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(group.requestedAt)}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.items.length} item{group.items.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{group.requestIds.join(", ")}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setDetailRequestGroup(group)}>
                        View
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">S.No</TableHead>
                          <TableHead>Request ID</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Requested Qty</TableHead>
                          <TableHead>Available Qty</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, index) => (
                          <TableRow key={item.itemKey}>
                            <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{item.requestIds.join(", ")}</TableCell>
                            <TableCell className="font-mono text-xs">{item.itemCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>
                              {formatDecimal(String(item.requestedQty))} {item.unit}
                            </TableCell>
                            <TableCell>
                              {formatDecimal(item.availableQty)} {item.unit}
                            </TableCell>
                            <TableCell className={item.status === "MIXED" ? "text-muted-foreground" : statusTone(item.status as StoreStockRequest["status"])}>{item.status}</TableCell>
                            <TableCell>{item.department}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No grouped additive requests" description="Create an additive request to see the selected products grouped together." />
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Additive Store Request</DialogTitle>
            <DialogDescription>
              Sends one pending store request to `POST /api/blending/store-requests/` with one or more product lines for the blending team.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => requestStockMutation.mutate(values))} className="space-y-4">
              <div className="space-y-3">
                <FormItem>
                  <FormLabel>Additive Items</FormLabel>
                  <FormControl>
                    <AdditiveItemAutocomplete
                      selectedItem={productPickerItem}
                      onSelectedItemChange={handlePickerItemChange}
                      error={typeof form.formState.errors.items?.message === "string" ? form.formState.errors.items.message : undefined}
                    />
                  </FormControl>
                </FormItem>

                {hasDuplicateSelectedItems ? (
                  <p className="text-sm text-destructive">Duplicate products are not allowed in the same request.</p>
                ) : null}

                {itemsFieldArray.fields.length ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-36">Quantity</TableHead>
                          <TableHead className="w-12 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsFieldArray.fields.map((itemField, index) => {
                          const selectedItem = selectedAdditiveItems[index];
                          return (
                            <TableRow key={itemField.id}>
                              <TableCell>
                                <div className="font-medium">{selectedItem?.item_name || "-"}</div>
                                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                                  <span className="font-mono">{selectedItem?.item_code || "-"}</span>
                                  <span>
                                    {formatDecimal(selectedItem?.quantity || "0")} {selectedItem?.unit || ""} available
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} placeholder="0.000" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    itemsFieldArray.remove(index);
                                    setSelectedAdditiveItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                  }}
                                  aria-label={`Remove ${selectedItem?.item_name || "item"}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    Search and select products from the dropdown to add them to this request.
                  </div>
                )}

              </div>

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

      <Dialog open={Boolean(detailRequestGroup)} onOpenChange={(open) => !open && setDetailRequestGroup(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detailRequestGroup?.requestIds.join(", ") || "Store Additive Requests"}</DialogTitle>
            <DialogDescription>Matching products grouped together across these additive store requests.</DialogDescription>
          </DialogHeader>

          {detailRequestGroup ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Status" value={detailRequestGroup.status} />
                <StatCard label="Request IDs" value={detailRequestGroup.requestIds.length} />
                <StatCard label="Items" value={detailRequestGroup.items.length} />
                <StatCard label="Department" value={detailRequestGroup.department} />
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Requested Qty</TableHead>
                      <TableHead>Available Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailRequestGroup.items.map((item, index) => (
                      <TableRow key={item.itemKey}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.requestIds.join(", ")}</TableCell>
                        <TableCell className="font-mono text-xs">{readText(item.itemCode)}</TableCell>
                        <TableCell>{readText(item.itemName)}</TableCell>
                        <TableCell>{formatDecimal(String(item.requestedQty))}</TableCell>
                        <TableCell>{formatDecimal(item.availableQty)}</TableCell>
                        <TableCell>{readText(item.unit)}</TableCell>
                        <TableCell>{readText(item.category)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingPage;
