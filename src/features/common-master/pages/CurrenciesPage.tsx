import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { currencySchema, type CurrencyFormValues } from "@/features/common-master/schemas";
import type { CurrencyRecord } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: CurrencyFormValues = {
  country: 0,
  name: "",
  code: "",
  symbol: "",
  is_active: true,
};

const CurrenciesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CurrencyRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<CurrencyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CurrencyRecord | null>(null);
  const countriesQuery = useCountryOptions();
  const form = useForm<CurrencyFormValues>({ resolver: zodResolver(currencySchema), defaultValues });

  const currenciesQuery = useQuery({
    queryKey: commonMasterKeys.currencies(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listCurrencies({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createCurrency,
    queryKey: ["common-masters", "currencies"],
    successMessage: "Currency created successfully.",
    errorMessage: "Unable to create currency.",
  });
  const updateMutation = useCommonMasterMutations({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CurrencyRecord> }) => commonMasterApi.updateCurrency(id, payload),
    queryKey: ["common-masters", "currencies"],
    successMessage: "Currency updated successfully.",
    errorMessage: "Unable to update currency.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.toggleCurrency,
    queryKey: ["common-masters", "currencies"],
    successMessage: "Currency status updated.",
    errorMessage: "Unable to update currency status.",
  });
  const deleteMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.deleteCurrency,
    queryKey: ["common-masters", "currencies"],
    successMessage: "Currency deleted successfully.",
    errorMessage: "Unable to delete currency.",
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (record: CurrencyRecord) => {
    setEditing(record);
    form.reset({
      country: record.country,
      name: record.name,
      code: record.code,
      symbol: record.symbol ?? "",
      is_active: record.is_active,
    });
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

  const result = currenciesQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currencies"
        description="Maintain active currency masters tied to country-level commercial setup."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Currency" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "name", title: "Currency", render: (record) => <div className="font-medium">{record.name}</div> },
          { key: "code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.code}</span> },
          { key: "symbol", title: "Symbol", render: (record) => record.symbol || "-" },
          { key: "country_name", title: "Country", render: (record) => record.country_name || "-" },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[160px] text-right",
            render: (record) => (
              <RowActions
                onEdit={() => openEdit(record)}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ),
          },
        ]}
        records={result?.items ?? []}
        isLoading={currenciesQuery.isLoading}
        isError={currenciesQuery.isError}
        errorDescription="Currencies could not be loaded."
        emptyTitle="No currencies found"
        emptyDescription="Create the first currency to support customer, supplier, and project setup."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => currenciesQuery.refetch()}
      />
      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Currency" : "Create Currency"}
        description="Keep currency names, ISO-style codes, and symbols aligned with backend validation."
      >
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(countriesQuery.data ?? []).map((country) => (
                          <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem><FormLabel>Symbol</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                <FormLabel>Active status</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save changes" : "Create currency"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update currency status"
        description={`Change the status for ${toggleTarget?.name ?? "this currency"}?`}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
            setToggleTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete currency"
        description={`Delete ${deleteTarget?.name ?? "this currency"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};

export default CurrenciesPage;
