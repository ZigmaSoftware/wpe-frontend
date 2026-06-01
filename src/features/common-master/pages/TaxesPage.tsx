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
import { taxSchema, type TaxFormValues } from "@/features/common-master/schemas";
import type { TaxListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: TaxFormValues = {
  code: "",
  country: 0,
  name: "",
  value: 0,
  is_active: true,
};

const TaxesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<TaxListRow | null>(null);
  const form = useForm<TaxFormValues>({ resolver: zodResolver(taxSchema), defaultValues });
  const countryOptionsQuery = useCountryOptions();
  const taxesQuery = useQuery({
    queryKey: commonMasterKeys.taxes(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listTaxes({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });
  const nextCodeQuery = useQuery({
    queryKey: commonMasterKeys.nextCode("taxes"),
    queryFn: commonMasterApi.getNextTaxCode,
    enabled: false,
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createTax,
    queryKey: ["common-masters", "taxes"],
    successMessage: "Tax created successfully.",
    errorMessage: "Unable to create tax.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleTax(id),
    queryKey: ["common-masters", "taxes"],
    successMessage: "Tax status updated.",
    errorMessage: "Unable to update tax status.",
  });

  const openCreate = async () => {
    form.reset(defaultValues);
    setDialogOpen(true);
    const result = await nextCodeQuery.refetch();
    form.setValue("code", result.data ?? "");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const result = taxesQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax"
        description="Configure tax percentages by country."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Tax" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "tax_code", title: "Tax Code", render: (record) => <span className="font-mono text-xs">{record.tax_code}</span> },
          { key: "tax_name", title: "Tax", render: (record) => <div className="font-medium">{record.tax_name}</div> },
          { key: "tax_value", title: "Rate (%)", render: (record) => record.tax_value.toFixed(2) },
          { key: "country", title: "Country", render: (record) => record.country },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (record) => <RowActions onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={result?.items ?? []}
        isLoading={taxesQuery.isLoading}
        isError={taxesQuery.isError}
        errorDescription="Tax records could not be loaded."
        emptyTitle="No taxes found"
        emptyDescription="Create taxes to support country-specific billing and statutory setup."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => taxesQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create Tax" description="The current backend exposes create and status-toggle flows for taxes.">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Code*</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} readOnly placeholder="Generating..." className="bg-slate-50 text-slate-700" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country*</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(countryOptionsQuery.data ?? []).map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Tax Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem><FormLabel>Tax Percentage*</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                <FormLabel>Active Status*</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending}>Create tax</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update tax status"
        description={`Change the status for ${toggleTarget?.tax_name ?? "this tax"}?`}
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

export default TaxesPage;
