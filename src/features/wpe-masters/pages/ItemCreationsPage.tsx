import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import {
  itemMasterSchema,
  type ItemMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";
import { getApiErrorMessage } from "@/lib/api-helpers";
import type { ItemMasterRecord } from "@/features/wpe-masters/types";

const defaultValues: ItemMasterFormValues = {
  code: "",
  item_name: "",
  sub_category: 0,
  item_type: "RM",
  uom: 0,
  hsn_code: "",
  gst_percentage: 0,
  minimum_stock: 0,
  maximum_stock: 0,
  reorder_level: 0,
  is_active: true,
};

const ItemCreationsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemMasterRecord | null>(null);
  const [codePreview, setCodePreview] = useState("");
  const [loadingCodePreview, setLoadingCodePreview] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<ItemMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemMasterRecord | null>(null);

  const form = useForm<ItemMasterFormValues>({
    resolver: zodResolver(itemMasterSchema),
    defaultValues,
  });

  const query = useQuery({
    queryKey: ["wpe-masters", "item-creations", page, pageSize, search],
    queryFn: () => wpeMastersApi.itemCreations.list({ page, pageSize, search }),
  });

  const subtypeLookupQuery = useQuery({
    queryKey: ["wpe-masters", "product-type-subtypes", "lookup"],
    queryFn: () => wpeMastersApi.productTypeSubtypes.lookup(),
  });

  const unitLookupQuery = useQuery({
    queryKey: ["wpe-masters", "units", "lookup"],
    queryFn: () => wpeMastersApi.units.lookup(),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wpe-masters", "item-creations"] });
  };

  const createMutation = useMutation({
    mutationFn: wpeMastersApi.itemCreations.create,
    onSuccess: async () => {
      toast.success("Item created.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create item.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ItemMasterFormValues> }) => wpeMastersApi.itemCreations.update(id, payload),
    onSuccess: async () => {
      toast.success("Item updated.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update item.")),
  });

  const toggleMutation = useMutation({
    mutationFn: wpeMastersApi.itemCreations.toggle,
    onSuccess: async () => {
      toast.success("Status updated.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update status.")),
  });

  const deleteMutation = useMutation({
    mutationFn: wpeMastersApi.itemCreations.delete,
    onSuccess: async () => {
      toast.success("Item deleted.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete item.")),
  });

  const openCreate = async () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
    setLoadingCodePreview(true);
    try {
      setCodePreview(await wpeMastersApi.itemCreations.nextCode());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to generate the next item code."));
      setCodePreview("");
    } finally {
      setLoadingCodePreview(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }
    if (!form.getValues("reorder_level")) {
      form.setValue("reorder_level", 0);
    }
  }, [dialogOpen, form]);

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Item Creations" description="Create and maintain raw material, additive, packing, and finished goods items." />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel="Add Item"
        onCreate={openCreate}
      />
      <MasterTable
        columns={[
          {
            key: "item_code",
            title: "Item Code",
            render: (record) => <span className="font-mono text-xs text-muted-foreground">{record.item_code || "-"}</span>,
          },
          {
            key: "item_name",
            title: "Item Name",
            render: (record) => (
              <div className="space-y-1">
                <div className="font-medium">{record.item_name}</div>
                <div className="text-xs text-muted-foreground">{record.category_name} / {record.sub_category_name}</div>
              </div>
            ),
          },
          {
            key: "item_type",
            title: "Item Type",
            render: (record) => record.item_type === "ADDITIVE" ? "Additive" : record.item_type === "PACKING" ? "Packing" : record.item_type,
          },
          {
            key: "uom",
            title: "UOM",
            render: (record) => `${record.uom_code}${record.uom_name ? ` - ${record.uom_name}` : ""}`,
          },
          {
            key: "gst",
            title: "GST %",
            render: (record) => record.gst_percentage,
          },
          {
            key: "status",
            title: "Status",
            render: (record) => <MasterStatusBadge active={record.is_active} />,
          },
          {
            key: "actions",
            title: "Actions",
            className: "w-[140px] text-right",
            render: (record) => (
              <RowActions
                onEdit={() => {
                  setEditing(record);
                  setCodePreview(record.item_code ?? "");
                  form.reset({
                    code: record.item_code ?? "",
                    item_name: record.item_name,
                    sub_category: record.sub_category,
                    item_type: record.item_type,
                    uom: record.uom,
                    hsn_code: record.hsn_code ?? "",
                    gst_percentage: Number(record.gst_percentage),
                    minimum_stock: Number(record.minimum_stock),
                    maximum_stock: Number(record.maximum_stock),
                    reorder_level: Number(record.reorder_level),
                    is_active: record.is_active,
                  });
                  setDialogOpen(true);
                }}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Item records could not be loaded."
        emptyTitle="No item records"
        emptyDescription="Add a new item record to get started."
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Item" : "Create Item"}
        description="Configure item category, stock controls, tax, and unit setup."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                item_name: values.item_name,
                sub_category: values.sub_category,
                item_type: values.item_type,
                uom: values.uom,
                hsn_code: values.hsn_code,
                gst_percentage: values.gst_percentage,
                minimum_stock: values.minimum_stock,
                maximum_stock: values.maximum_stock,
                reorder_level: values.reorder_level,
                is_active: values.is_active,
              };
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              form.reset(defaultValues);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Code*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={editing?.item_code ?? codePreview}
                      placeholder={loadingCodePreview ? "Generating..." : undefined}
                      readOnly
                      className="bg-muted/40 font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter item name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sub_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Sub Category*</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Item Sub Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(subtypeLookupQuery.data ?? []).map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.category_name} / {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="item_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Item Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RM">RM</SelectItem>
                        <SelectItem value="ADDITIVE">Additive</SelectItem>
                        <SelectItem value="PACKING">Packing</SelectItem>
                        <SelectItem value="FG">FG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="uom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UOM*</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UOM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(unitLookupQuery.data ?? []).map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.uom_code ? `${option.uom_code} - ` : ""}{option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter HSN code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gst_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Percentage*</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimum_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock*</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="maximum_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Stock*</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                  <FormLabel>Active Status*</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create Item"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Toggle status"
        description={`Change the active status for "${toggleTarget?.item_name}"?`}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
          }
          setToggleTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Item"
        description={`Permanently delete "${deleteTarget?.item_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default ItemCreationsPage;
