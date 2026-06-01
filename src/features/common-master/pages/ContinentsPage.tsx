import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { continentSchema, type ContinentFormValues } from "@/features/common-master/schemas";
import type { ContinentRecord } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: ContinentFormValues = {
  code: "",
  name: "",
  status: true,
};

const ContinentsPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContinentRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ContinentRecord | null>(null);

  const form = useForm<ContinentFormValues>({
    resolver: zodResolver(continentSchema),
    defaultValues,
  });

  const continentsQuery = useQuery({
    queryKey: commonMasterKeys.continents(debouncedSearch),
    queryFn: commonMasterApi.listContinents,
    select: (records) =>
      records.filter((record) => record.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
  });
  const nextCodeQuery = useQuery({
    queryKey: commonMasterKeys.nextCode("continents"),
    queryFn: commonMasterApi.getNextContinentCode,
    enabled: false,
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createContinent,
    queryKey: ["common-masters", "continents"],
    successMessage: "Continent created successfully.",
    errorMessage: "Unable to create continent.",
  });

  const updateMutation = useCommonMasterMutations({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ContinentRecord> }) =>
      commonMasterApi.updateContinent(id, payload),
    queryKey: ["common-masters", "continents"],
    successMessage: "Continent updated successfully.",
    errorMessage: "Unable to update continent.",
  });

  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleContinent(id),
    queryKey: ["common-masters", "continents"],
    successMessage: "Continent status updated.",
    errorMessage: "Unable to update continent status.",
  });

  const records = continentsQuery.data ?? [];
  const total = records.length;
  const start = (table.page - 1) * table.pageSize;
  const paged = records.slice(start, start + table.pageSize);

  const openCreate = async () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
    const result = await nextCodeQuery.refetch();
    form.setValue("code", result.data ?? "");
  };

  const openEdit = (continent: ContinentRecord) => {
    setEditing(continent);
    form.reset({ code: continent.code ?? "", name: continent.name, status: continent.status });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continent"
        description="Manage continent master records."
      />

      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add Continent"
        onCreate={openCreate}
      />

      <MasterTable
        columns={[
          { key: "code", title: "Continent Code", render: (record) => <span className="font-mono text-xs">{record.code ?? "-"}</span> },
          { key: "name", title: "Continent", render: (record) => <div className="font-medium">{record.name}</div> },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (record) => <RowActions onEdit={() => openEdit(record)} onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={paged}
        isLoading={continentsQuery.isLoading}
        isError={continentsQuery.isError}
        errorDescription="Continent records could not be loaded."
        emptyTitle="No continents found"
        emptyDescription="Add the first continent to start organizing country masters."
        page={table.page}
        pageSize={table.pageSize}
        total={total}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => continentsQuery.refetch()}
      />

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Continent" : "Create Continent"}
        description="This master is used by country setup and shared geography flows."
      >
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Continent Code*</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} readOnly placeholder="Generating..." className="bg-slate-50 text-slate-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
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
                {editing ? "Save changes" : "Create continent"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update continent status"
        description={`Change the status for ${toggleTarget?.name ?? "this continent"}?`}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
            setToggleTarget(null);
          }
        }}
      />
    </div>
  );
};

export default ContinentsPage;
