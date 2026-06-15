import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LocationCenterType, LocationMasterRecord } from "@/features/wpe-masters/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const locationCenters: Array<{ value: LocationCenterType; label: string }> = [
  { value: "GRN_CENTER", label: "GRN Stock Center" },
  { value: "BLENDING_CENTER", label: "Blending Stock Center" },
  { value: "WAREHOUSE_CENTER", label: "Warehouse Stock Center" },
];

const centerLabels: Record<LocationCenterType, string> = {
  GRN_CENTER: "GRN Stock Center",
  BLENDING_CENTER: "Blending Stock Center",
  WAREHOUSE_CENTER: "Warehouse Stock Center",
};

const defaultValues: FormValues = { name: "", is_active: true };

const buildCenterState = <T,>(value: T): Record<LocationCenterType, T> => ({
  GRN_CENTER: value,
  BLENDING_CENTER: value,
  WAREHOUSE_CENTER: value,
});

const LocationMasterPage = () => {
  const qc = useQueryClient();
  const [activeCenter, setActiveCenter] = useState<LocationCenterType>("BLENDING_CENTER");
  const [searchByCenter, setSearchByCenter] = useState<Record<LocationCenterType, string>>(() => buildCenterState(""));
  const [pageByCenter, setPageByCenter] = useState<Record<LocationCenterType, number>>(() => buildCenterState(1));
  const [pageSizeByCenter, setPageSizeByCenter] = useState<Record<LocationCenterType, number>>(() => buildCenterState(25));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationMasterRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<LocationMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationMasterRecord | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const currentSearch = searchByCenter[activeCenter];
  const currentPage = pageByCenter[activeCenter];
  const currentPageSize = pageSizeByCenter[activeCenter];
  const activeCenterLabel = centerLabels[activeCenter];

  const query = useQuery({
    queryKey: ["wpe-masters", "locations", activeCenter, currentPage, currentPageSize, currentSearch],
    queryFn: () => wpeMastersApi.locations.list({
      page: currentPage,
      pageSize: currentPageSize,
      search: currentSearch,
      center_type: activeCenter,
    }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wpe-masters", "locations"] });

  const createMutation = useMutation({
    mutationFn: (payload: FormValues) => wpeMastersApi.locations.create({ ...payload, center_type: activeCenter }),
    onSuccess: () => {
      toast.success(`Location created in ${activeCenterLabel}.`);
      invalidate();
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to create location."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormValues }) =>
      wpeMastersApi.locations.update(id, { ...payload, center_type: activeCenter }),
    onSuccess: () => {
      toast.success("Location updated.");
      invalidate();
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update location."),
  });

  const toggleMutation = useMutation({
    mutationFn: wpeMastersApi.locations.toggle,
    onSuccess: () => {
      toast.success("Status updated.");
      invalidate();
    },
    onError: () => toast.error("Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: wpeMastersApi.locations.delete,
    onSuccess: () => {
      toast.success("Location deleted.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete location."),
  });

  const records = query.data?.items ?? [];

  const handleCenterChange = (value: string) => {
    setActiveCenter(value as LocationCenterType);
    setDialogOpen(false);
    setEditing(null);
    setToggleTarget(null);
    setDeleteTarget(null);
    form.reset(defaultValues);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location"
        description="Manage locations grouped by GRN, blending, and warehouse stock centers."
      />

      <Tabs value={activeCenter} onValueChange={handleCenterChange} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
          {locationCenters.map((center) => (
            <TabsTrigger
              key={center.value}
              value={center.value}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold sm:flex-none"
            >
              {center.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCenter} className="space-y-4">
          <MasterToolbar
            search={currentSearch}
            onSearchChange={(value) => {
              setSearchByCenter((current) => ({ ...current, [activeCenter]: value }));
              setPageByCenter((current) => ({ ...current, [activeCenter]: 1 }));
            }}
            createLabel="Add Location"
            onCreate={() => {
              setEditing(null);
              form.reset(defaultValues);
              setDialogOpen(true);
            }}
          />

          <MasterTable
            columns={[
              { key: "name", title: "Name", render: (record) => <span className="font-medium">{record.name}</span> },
              { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
              {
                key: "actions",
                title: "Actions",
                className: "w-[120px] text-right",
                render: (record) => (
                  <RowActions
                    onEdit={() => {
                      setEditing(record);
                      form.reset({ name: record.name, is_active: record.is_active });
                      setDialogOpen(true);
                    }}
                    onToggle={() => setToggleTarget(record)}
                    onDelete={() => setDeleteTarget(record)}
                    isActive={record.is_active}
                  />
                ),
              },
            ]}
            records={records}
            isLoading={query.isLoading}
            isError={query.isError}
            errorDescription={`${activeCenterLabel} records could not be loaded.`}
            emptyTitle={`No ${activeCenterLabel} records`}
            emptyDescription={`Add a new location under ${activeCenterLabel} to get started.`}
            page={currentPage}
            pageSize={currentPageSize}
            total={query.data?.total ?? 0}
            onPageChange={(page) => setPageByCenter((current) => ({ ...current, [activeCenter]: page }))}
            onPageSizeChange={(pageSize) => {
              setPageSizeByCenter((current) => ({ ...current, [activeCenter]: pageSize }));
              setPageByCenter((current) => ({ ...current, [activeCenter]: 1 }));
            }}
            onRetry={() => query.refetch()}
          />
        </TabsContent>
      </Tabs>

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Location" : "Add Location"}
        description={`${editing ? "Update the" : "Create a new"} location record for ${activeCenterLabel}.`}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: values });
              } else {
                await createMutation.mutateAsync(values);
              }
            })}
            className="space-y-4"
          >
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Center: <span className="font-medium text-foreground">{activeCenterLabel}</span>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter location name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create Location"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Toggle status"
        description={`Change the active status for "${toggleTarget?.name}"?`}
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
        title="Delete Location"
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
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

export default LocationMasterPage;
