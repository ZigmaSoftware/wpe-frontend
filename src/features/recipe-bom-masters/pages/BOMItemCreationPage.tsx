import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { toast } from "@/components/ui/sonner";
import {
  bomItemCreationSchema,
  type BOMItemCreationFormValues,
} from "@/features/recipe-bom-masters/schemas";
import type {
  BOMItemCreationRecord,
} from "@/features/recipe-bom-masters/types";
import { recipeBomMastersApi } from "@/features/recipe-bom-masters/api/recipeBomMastersApi";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";

const defaultValues: BOMItemCreationFormValues = {
  bom: 0,
  item: 0,
  item_type: "RM",
  required_quantity: undefined,
  uom: "",
  is_active: true,
};

const BOMItemFormDialog = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  record: BOMItemCreationRecord | null;
  onSuccess: () => void;
}) => {
  const bomLookupQ = useQuery({
    queryKey: ["recipe-bom-masters", "bom-creations", "lookup"],
    queryFn: recipeBomMastersApi.bomCreations.lookup,
    enabled: open,
  });
  const itemLookupQ = useQuery({
    queryKey: ["wpe-masters", "item-creations", "lookup"],
    queryFn: () => wpeMastersApi.itemCreations.lookup(),
    enabled: open,
  });
  const unitLookupQ = useQuery({
    queryKey: ["wpe-masters", "units", "lookup"],
    queryFn: wpeMastersApi.units.lookup,
    enabled: open,
  });

  const itemLookupMap = useMemo(
    () =>
      new Map(
        (itemLookupQ.data ?? []).map((option) => [option.id, option]),
      ),
    [itemLookupQ.data],
  );

  const form = useForm<BOMItemCreationFormValues>({
    resolver: zodResolver(bomItemCreationSchema),
    defaultValues: record
      ? {
          bom: record.bom,
          item: record.item,
          item_type: record.item_type,
          required_quantity: record.required_quantity ? Number(record.required_quantity) : undefined,
          uom: record.uom,
          is_active: record.is_active,
        }
      : defaultValues,
  });

  useEffect(() => {
    if (!record) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      bom: record.bom,
      item: record.item,
      item_type: record.item_type,
      required_quantity: record.required_quantity ? Number(record.required_quantity) : undefined,
      uom: record.uom,
      is_active: record.is_active,
    });
  }, [form, record]);

  const mutation = useMutation({
    mutationFn: (values: BOMItemCreationFormValues) =>
      record
        ? recipeBomMastersApi.bomItemCreations.update(record.id, {
            bom: values.bom,
            item: values.item,
            item_type: values.item_type,
            required_quantity: values.required_quantity ?? null,
            uom: values.uom,
            is_active: values.is_active,
          })
        : recipeBomMastersApi.bomItemCreations.create({
            bom: values.bom,
            item: values.item,
            item_type: values.item_type,
            required_quantity: values.required_quantity ?? null,
            uom: values.uom,
            is_active: values.is_active,
          }),
    onSuccess: async () => {
      toast.success(record ? "BOM item updated." : "BOM item created.");
      onOpenChange(false);
      await onSuccess();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save BOM item.")),
  });

  return (
    <MasterFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Edit BOM Item Creation" : "Create BOM Item Creation"}
      description="Define BOM item requirements by item type, quantity, and UOM."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BOM*</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select BOM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(bomLookupQ.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.code ? `${option.code} - ${option.name}` : option.name}
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
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => {
                      const itemId = Number(value);
                      field.onChange(itemId);
                      const option = itemLookupMap.get(itemId);
                      if (option?.code && !form.getValues("uom")) {
                        const fallbackUom = (option as { uom_code?: string }).uom_code;
                        if (fallbackUom) {
                          form.setValue("uom", fallbackUom);
                        }
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(itemLookupQ.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.code ? `${option.code} - ${option.name}` : option.name}
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
                      <SelectItem value="PACKING">Packing</SelectItem>
                      <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="required_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UOM</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(unitLookupQ.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={option.code ?? option.name}>
                          {option.code ? `${option.code} - ${option.name}` : option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {record ? "Update BOM Item" : "Create BOM Item"}
            </Button>
          </div>
        </form>
      </Form>
    </MasterFormDialog>
  );
};

const BOMItemCreationPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BOMItemCreationRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<BOMItemCreationRecord | null>(null);

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["recipe-bom-masters", "bom-item-creations", page, pageSize, search],
    queryFn: () => recipeBomMastersApi.bomItemCreations.list({ page, pageSize, search }),
  });

  const toggleMutation = useMutation({
    mutationFn: (record: BOMItemCreationRecord) => recipeBomMastersApi.bomItemCreations.toggle(record.id),
    onSuccess: async () => {
      toast.success("Status updated.");
      setToggleTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["recipe-bom-masters", "bom-item-creations"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update status.")),
  });

  const handleSuccess = async () => {
    setDialogOpen(false);
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["recipe-bom-masters", "bom-item-creations"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="BOM Item Creation"
        description="Define BOM item requirements by item type, quantity, and UOM."
      />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel="Add BOM Item"
        onCreate={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <MasterTable
        columns={[
          {
            key: "bom",
            title: "BOM",
            render: (record) => (
              <div className="space-y-1">
                <div className="font-medium">{record.bom_name}</div>
                <div className="font-mono text-xs text-muted-foreground">{record.bom_code}</div>
              </div>
            ),
          },
          {
            key: "item",
            title: "Item",
            render: (record) => (
              <div className="space-y-1">
                <div className="font-medium">{record.item_name}</div>
                <div className="font-mono text-xs text-muted-foreground">{record.item_code}</div>
              </div>
            ),
          },
          {
            key: "item_type",
            title: "Item Type",
            render: (record) => record.item_type === "PACKING" ? "Packing" : record.item_type === "CONSUMABLE" ? "Consumable" : "RM",
          },
          {
            key: "required_quantity",
            title: "Required Quantity",
            render: (record) => record.required_quantity || "-",
          },
          {
            key: "uom",
            title: "UOM",
            render: (record) => record.uom || "-",
          },
          {
            key: "status",
            title: "Active Status",
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
                  setDialogOpen(true);
                }}
                onToggle={() => setToggleTarget(record)}
              />
            ),
          },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="BOM item records could not be loaded."
        emptyTitle="No BOM item records"
        emptyDescription="Add a new BOM item requirement to get started."
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        onRetry={() => query.refetch()}
      />

      <BOMItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(value) => {
          if (!value) {
            setToggleTarget(null);
          }
        }}
        title="Change BOM Item Status"
        description={`Update the active status for "${toggleTarget?.item_name ?? "this BOM item"}"?`}
        confirmLabel="Update Status"
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget);
          }
        }}
      />
    </div>
  );
};

export default BOMItemCreationPage;
