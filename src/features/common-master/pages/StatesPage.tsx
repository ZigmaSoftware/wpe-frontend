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
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { stateSchema, type StateFormValues } from "@/features/common-master/schemas";
import type { StateListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: StateFormValues = {
  code: "",
  country: 0,
  name: "",
  is_active: true,
};

const StatesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<StateListRow | null>(null);
  const [countryFilter, setCountryFilter] = useState("all");
  const form = useForm<StateFormValues>({ resolver: zodResolver(stateSchema), defaultValues });

  const countryOptionsQuery = useCountryOptions();
  const statesQuery = useQuery({
    queryKey: ["common-masters", "states", debouncedSearch, countryFilter],
    queryFn: commonMasterApi.listStates,
    select: (rows) =>
      rows.filter((row) => {
        const matchesSearch =
          row.state_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          row.country.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesCountry = countryFilter === "all" || row.country === countryFilter;
        return matchesSearch && matchesCountry;
      }),
  });
  const nextCodeQuery = useQuery({
    queryKey: ["common-masters", "next-code", "states"],
    queryFn: commonMasterApi.getNextStateCode,
    enabled: false,
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createState,
    queryKey: ["common-masters", "states"],
    successMessage: "State created successfully.",
    errorMessage: "Unable to create state.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleState(id),
    queryKey: ["common-masters", "states"],
    successMessage: "State status updated.",
    errorMessage: "Unable to update state status.",
  });

  const records = statesQuery.data ?? [];
  const start = (table.page - 1) * table.pageSize;
  const paged = records.slice(start, start + table.pageSize);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="State"
        description="Manage states mapped to countries."
      />
      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add State"
        onCreate={openCreate}
        filters={
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {(countryOptionsQuery.data ?? []).map((country) => (
                <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <MasterTable
        columns={[
          { key: "state_code", title: "State Code", render: (record) => <span className="font-mono text-xs">{record.state_code}</span> },
          { key: "state_name", title: "State", render: (record) => <div className="font-medium">{record.state_name}</div> },
          { key: "country", title: "Country", render: (record) => record.country },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (record) => <RowActions onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={paged}
        isLoading={statesQuery.isLoading}
        isError={statesQuery.isError}
        errorDescription="State records could not be loaded."
        emptyTitle="No states found"
        emptyDescription="Create states after your country master is ready."
        page={table.page}
        pageSize={table.pageSize}
        total={records.length}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => statesQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create State" description="The current backend exposes create and status-toggle flows for states.">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State Code*</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} readOnly placeholder="Generating..." className="bg-slate-50 text-slate-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
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
                )}
              />
              <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>State Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                  <FormLabel>Active Status*</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Create state</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update state status"
        description={`Change the status for ${toggleTarget?.state_name ?? "this state"}?`}
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

export default StatesPage;
