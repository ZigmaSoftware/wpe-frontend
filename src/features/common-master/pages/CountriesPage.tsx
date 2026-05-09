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
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { countrySchema, type CountryFormValues } from "@/features/common-master/schemas";
import type { ContinentRecord, CountryListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useContinentOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: CountryFormValues = {
  continent: 0,
  name: "",
  code: "",
  currency: "",
  status: true,
};

const CountriesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CountryListRow | null>(null);
  const [toggleTarget, setToggleTarget] = useState<CountryListRow | null>(null);
  const form = useForm<CountryFormValues>({ resolver: zodResolver(countrySchema), defaultValues });

  const continentsQuery = useContinentOptions();
  const countriesQuery = useQuery({
    queryKey: commonMasterKeys.countries(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listCountries({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createCountry,
    queryKey: ["common-masters", "countries"],
    successMessage: "Country created successfully.",
    errorMessage: "Unable to create country.",
  });
  const updateMutation = useCommonMasterMutations({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      commonMasterApi.updateCountry(id, payload),
    queryKey: ["common-masters", "countries"],
    successMessage: "Country updated successfully.",
    errorMessage: "Unable to update country.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleCountry(id),
    queryKey: ["common-masters", "countries"],
    successMessage: "Country status updated.",
    errorMessage: "Unable to update country status.",
  });

  const continentByName = useMemo(() => {
    const index = new Map<string, ContinentRecord>();
    (continentsQuery.data ?? []).forEach((continent) => index.set(continent.name, continent));
    return index;
  }, [continentsQuery.data]);

  const openCreate = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (record: CountryListRow) => {
    setEditing(record);
    form.reset({
      continent: continentByName.get(record.continent)?.id ?? 0,
      name: record.country_name,
      code: record.country_code,
      currency: record.currency === "-" ? "" : record.currency,
      status: record.status === "Active",
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

  const result = countriesQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Countries"
        description="Country master with continent mapping, code, and reporting currency."
      />

      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Country" onCreate={openCreate} />

      <MasterTable
        columns={[
          { key: "country_name", title: "Country", render: (record) => <div className="font-medium">{record.country_name}</div> },
          { key: "code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.country_code}</span> },
          { key: "continent", title: "Continent", render: (record) => record.continent },
          { key: "currency", title: "Currency", render: (record) => record.currency },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status === "Active"} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (record) => <RowActions onEdit={() => openEdit(record)} onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={result?.items ?? []}
        isLoading={countriesQuery.isLoading}
        isError={countriesQuery.isError}
        errorDescription="Countries could not be loaded."
        emptyTitle="No countries found"
        emptyDescription="Create the first country to unlock state and city configuration."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => countriesQuery.refetch()}
      />

      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Country" : "Create Country"} description="Country edits use the real backend update endpoint, which accepts partial values.">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="continent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Continent</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select continent" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(continentsQuery.data ?? []).map((continent) => (
                          <SelectItem key={continent.id} value={String(continent.id)}>{continent.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Country name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Country code</FormLabel><FormControl><Input {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                  <FormLabel>Active status</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save changes" : "Create country"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update country status"
        description={`Change the status for ${toggleTarget?.country_name ?? "this country"}?`}
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

export default CountriesPage;
