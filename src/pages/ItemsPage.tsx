import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, LineChart, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import {
  formatDate,
  formatDecimal,
  getApiErrorMessage,
  normalizeListResponse,
  summarizeImportResponse,
} from "@/lib/api-helpers";
import type { ImportResponse, Item, ItemStockAnalysis, StockTransaction } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const itemSchema = z.object({
  product_type: z.string().default("General Item"),
  category: z.string().min(1, "Category is required."),
  group: z.string().min(1, "Group is required."),
  sub_group: z.string().min(1, "Sub group is required."),
  item_name: z.string().min(1, "Item name is required."),
  hsn_code: z.string().optional(),
  unit: z.string().min(1, "Unit is required."),
  opening_stock: z.string().default("0"),
  product_details: z.string().optional(),
  description: z.string().optional(),
  min_max_status: z.boolean(),
  status: z.boolean(),
});

const stockMovementSchema = z.object({
  date: z.string().optional(),
  ref_id: z.string().optional(),
  trans_type: z.string().optional(),
  sale_type: z.string().optional(),
  doc_id: z.string().optional(),
  contact: z.string().optional(),
  warehouse: z.string().optional(),
  bin: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required."),
});

type ItemFormValues = z.infer<typeof itemSchema>;
type StockMovementValues = z.infer<typeof stockMovementSchema>;

const itemDefaults: ItemFormValues = {
  product_type: "General Item",
  category: "",
  group: "",
  sub_group: "",
  item_name: "",
  hsn_code: "",
  unit: "",
  opening_stock: "0",
  product_details: "",
  description: "",
  min_max_status: false,
  status: true,
};

const movementDefaults: StockMovementValues = {
  date: "",
  ref_id: "",
  trans_type: "",
  sale_type: "",
  doc_id: "",
  contact: "",
  warehouse: "",
  bin: "",
  quantity: "",
};

const ItemsPage = () => {
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [movementMode, setMovementMode] = useState<"inward" | "outward" | null>(null);
  const [movementItem, setMovementItem] = useState<Item | null>(null);
  const [analysisItem, setAnalysisItem] = useState<Item | null>(null);

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: itemDefaults,
  });

  const movementForm = useForm<StockMovementValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: movementDefaults,
  });

  const itemsQuery = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await coreApi.get<Item[] | { data: Item[] }>("/api/items/items/");
      return normalizeListResponse(response.data);
    },
  });

  const stockAnalysisQuery = useQuery({
    queryKey: ["item-stock-analysis", analysisItem?.id],
    enabled: Boolean(analysisItem),
    queryFn: async () => {
      const response = await coreApi.get<ItemStockAnalysis>(`/api/items/items/${analysisItem?.id}/stock-analysis/`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ItemFormValues) => {
      const response = await coreApi.post<Item & { created: boolean; stock_updated: boolean; detail?: string; stock_transaction?: StockTransaction }>(
        "/api/items/items/",
        values,
      );
      return response.data;
    },
    onSuccess: (payload) => {
      toast.success(payload.detail || (payload.created ? "Item created." : "Item updated by stock merge."));
      setDialogOpen(false);
      itemForm.reset(itemDefaults);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to create item.")),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ItemFormValues) => {
      if (!editingItem) {
        throw new Error("No item selected for update.");
      }

      const response = await coreApi.put<Item>(`/api/items/items/${editingItem.id}/`, values);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Item updated.");
      setDialogOpen(false);
      setEditingItem(null);
      itemForm.reset(itemDefaults);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update item.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await coreApi.delete(`/api/items/items/${itemId}/`);
    },
    onSuccess: () => {
      toast.success("Item deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to delete item.")),
  });

  const stockMutation = useMutation({
    mutationFn: async (values: StockMovementValues) => {
      if (!movementItem || !movementMode) {
        throw new Error("No movement context selected.");
      }

      const response = await coreApi.post<{ detail: string }>(
        `/api/items/items/${movementItem.id}/stock/${movementMode}/`,
        values,
      );
      return response.data;
    },
    onSuccess: (payload) => {
      toast.success(payload.detail);
      setMovementMode(null);
      setMovementItem(null);
      movementForm.reset(movementDefaults);
      queryClient.invalidateQueries({ queryKey: ["items"] });
      if (analysisItem) {
        queryClient.invalidateQueries({ queryKey: ["item-stock-analysis", analysisItem.id] });
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update stock.")),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await coreApi.post<ImportResponse>("/api/items/items/import/", formData);
      return { payload: response.data, status: response.status };
    },
    onSuccess: ({ payload }) => {
      toast.success(summarizeImportResponse(payload));
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to import items."));
    },
  });

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const items = itemsQuery.data ?? [];
    if (!needle) {
      return items;
    }

    return items.filter((item) =>
      [item.item_name, item.item_code, item.category, item.group, item.sub_group]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [itemsQuery.data, search]);

  const openCreateDialog = () => {
    setEditingItem(null);
    itemForm.reset(itemDefaults);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    itemForm.reset({
      product_type: item.product_type,
      category: item.category,
      group: item.group,
      sub_group: item.sub_group,
      item_name: item.item_name,
      hsn_code: item.hsn_code ?? "",
      unit: item.unit,
      opening_stock: item.opening_stock,
      product_details: item.product_details ?? "",
      description: item.description ?? "",
      min_max_status: item.min_max_status,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const openMovementDialog = (item: Item, mode: "inward" | "outward") => {
    setMovementItem(item);
    setMovementMode(mode);
    movementForm.reset({
      ...movementDefaults,
      warehouse: mode === "inward" ? "STORE" : "STORE",
    });
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    importMutation.mutate(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        description="CRUD, import, stock analysis, and stock movements using the exact item endpoints."
        actions={
          <>
            <input ref={importInputRef} type="file" accept=".xlsx,.xlsm,.xltx,.xltm" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {importMutation.isPending ? "Importing..." : "Import Excel"}
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Items" value={itemsQuery.data?.length ?? 0} />
        <StatCard label="Active" value={(itemsQuery.data ?? []).filter((item) => item.status).length} />
        <StatCard label="Min/Max" value={(itemsQuery.data ?? []).filter((item) => item.min_max_status).length} />
        <StatCard label="Results" value={filteredItems.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item name, code, category, or group" className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => itemsQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {itemsQuery.isLoading ? <LoadingState label="Loading items..." /> : null}
      {itemsQuery.isError ? <ErrorState description="Items could not be loaded from the backend." /> : null}

      {!itemsQuery.isLoading && !itemsQuery.isError ? (
        filteredItems.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[240px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.item_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-xs text-muted-foreground">{item.group} / {item.sub_group}</div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatDecimal(item.on_hand)}</TableCell>
                    <TableCell>{item.status ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAnalysisItem(item)}>
                          <LineChart className="mr-2 h-4 w-4" />
                          Analysis
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openMovementDialog(item, "inward")}>Inward</Button>
                        <Button variant="outline" size="sm" onClick={() => openMovementDialog(item, "outward")}>Outward</Button>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No items found" description="Create an item or import an Excel file to populate inventory." />
        )
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit item" : "Create item"}</DialogTitle>
            <DialogDescription>The item create endpoint can return `201` for new items or `200` if stock merges into an existing identity.</DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit((values) => editingItem ? updateMutation.mutate(values) : createMutation.mutate(values))} className="grid gap-4 md:grid-cols-2">
              {(["product_type", "category", "group", "sub_group", "item_name", "hsn_code", "unit", "opening_stock"] as const).map((name) => (
                <FormField key={name} control={itemForm.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{name.replaceAll("_", " ")}</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <FormField control={itemForm.control} name="min_max_status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-3">
                  <div><FormLabel>Min Max Status</FormLabel></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={itemForm.control} name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-3">
                  <div><FormLabel>Status</FormLabel></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={itemForm.control} name="product_details" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Product Details</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={itemForm.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingItem ? "Save Changes" : "Create Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(movementMode && movementItem)} onOpenChange={(open) => {
        if (!open) {
          setMovementMode(null);
          setMovementItem(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{movementMode === "inward" ? "Inward Stock" : "Outward Stock"}</DialogTitle>
            <DialogDescription>
              Payload uses the exact stock metadata fields plus `quantity`.
            </DialogDescription>
          </DialogHeader>
          <Form {...movementForm}>
            <form onSubmit={movementForm.handleSubmit((values) => stockMutation.mutate(values))} className="grid gap-4 md:grid-cols-2">
              {(["date", "ref_id", "trans_type", "sale_type", "doc_id", "contact", "warehouse", "bin", "quantity"] as const).map((name) => (
                <FormField key={name} control={movementForm.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{name.replaceAll("_", " ")}</FormLabel>
                    <FormControl><Input {...field} type={name === "date" ? "date" : "text"} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMovementMode(null)}>Cancel</Button>
                <Button type="submit" disabled={stockMutation.isPending}>
                  {movementMode === "inward" ? "Add Inward" : "Add Outward"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(analysisItem)} onOpenChange={(open) => {
        if (!open) {
          setAnalysisItem(null);
        }
      }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Stock Analysis</DialogTitle>
            <DialogDescription>
              {analysisItem ? `${analysisItem.item_name} (${analysisItem.item_code})` : ""}
            </DialogDescription>
          </DialogHeader>
          {stockAnalysisQuery.isLoading ? <LoadingState label="Loading stock analysis..." /> : null}
          {stockAnalysisQuery.data ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Opening Stock" value={stockAnalysisQuery.data.opening_stock} />
                <StatCard label="Current Stock" value={stockAnalysisQuery.data.current_stock} />
                <StatCard label="On Hand" value={stockAnalysisQuery.data.on_hand} />
              </div>
              <div className="overflow-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {stockAnalysisQuery.data.columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockAnalysisQuery.data.rows.map((row, index) => (
                      <TableRow key={index}>
                        {stockAnalysisQuery.data.columns.map((column) => (
                          <TableCell key={column}>{String(row[column] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete item"
        description={`Delete ${deleteTarget?.item_name ?? "this item"}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </div>
  );
};

export default ItemsPage;
