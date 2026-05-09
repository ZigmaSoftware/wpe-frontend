import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { screenSectionSchema, type ScreenSectionFormValues } from "@/features/admin-master/schemas";
import type { ScreenSectionRecord } from "@/features/admin-master/types";
import { useMainScreenOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: ScreenSectionFormValues = {
  main_screen: 0,
  section_name: "",
  code: "",
  order_no: 1,
  is_active: true,
  description: "",
};

const ScreenSectionsPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScreenSectionRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ScreenSectionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScreenSectionRecord | null>(null);
  const [mainScreenFilter, setMainScreenFilter] = useState("all");
  const optionsQuery = useMainScreenOptions();
  const form = useForm<ScreenSectionFormValues>({ resolver: zodResolver(screenSectionSchema), defaultValues });

  const filterKey = useMemo(() => JSON.stringify({ mainScreenFilter }), [mainScreenFilter]);
  const query = useQuery({
    queryKey: adminMasterKeys.entity("screen-sections", table.page, table.pageSize, debouncedSearch, table.ordering, filterKey),
    queryFn: () => adminMasterApi.listScreenSections({
      page: table.page,
      pageSize: table.pageSize,
      search: debouncedSearch,
      ordering: table.ordering,
      filters: {
        main_screen: mainScreenFilter === "all" ? undefined : Number(mainScreenFilter),
      },
    }),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createScreenSection, queryKey: ["admin-master", "screen-sections"], successMessage: "Screen section created successfully.", errorMessage: "Unable to create screen section." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<ScreenSectionRecord> }) => adminMasterApi.updateScreenSection(id, payload), queryKey: ["admin-master", "screen-sections"], successMessage: "Screen section updated successfully.", errorMessage: "Unable to update screen section." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleScreenSection, queryKey: ["admin-master", "screen-sections"], successMessage: "Screen section status updated.", errorMessage: "Unable to update screen section status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteScreenSection, queryKey: ["admin-master", "screen-sections"], successMessage: "Screen section deleted successfully.", errorMessage: "Unable to delete screen section." });

  return (
    <div className="space-y-6">
      <PageHeader title="Screen Section Master" description="Manage second-level admin sections under each main screen." />
      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add Screen Section"
        onCreate={() => {
          setEditing(null);
          form.reset(defaultValues);
          setDialogOpen(true);
        }}
        filters={
          <Select value={mainScreenFilter} onValueChange={setMainScreenFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by main screen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All main screens</SelectItem>
              {(optionsQuery.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <MasterTable
        columns={[
          { key: "section_name", title: "Section Name", render: (record) => <div className="font-medium">{record.section_name}</div> },
          { key: "main_screen_name", title: "Main Screen", render: (record) => record.main_screen_name || "-" },
          { key: "code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.code}</span> },
          { key: "order_no", title: "Order", render: (record) => record.order_no },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset(record); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Screen sections could not be loaded."
        emptyTitle="No screen sections found"
        emptyDescription="Create sections to organize user screens under each main screen."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Screen Section" : "Create Screen Section"} description="Sections belong to a main screen and drive the user-screen hierarchy.">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (values) => {
            try {
              if (editing) await updateMutation.mutateAsync({ id: editing.id, payload: values });
              else await createMutation.mutateAsync(values);
              setDialogOpen(false);
              form.reset(defaultValues);
            } catch (error) {
              applyBackendErrors(error, form.setError);
            }
          })} className="space-y-4">
            <FormField control={form.control} name="main_screen" render={({ field }) => <FormItem><FormLabel>Main screen</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select main screen" /></SelectTrigger></FormControl><SelectContent>{(optionsQuery.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="section_name" render={({ field }) => <FormItem><FormLabel>Section name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="code" render={({ field }) => <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="order_no" render={({ field }) => <FormItem><FormLabel>Order no</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>Active status</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create Screen Section"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update screen section status" description={`Change the status for ${toggleTarget?.section_name ?? "this section"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete screen section" description={`Delete ${deleteTarget?.section_name ?? "this section"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default ScreenSectionsPage;
