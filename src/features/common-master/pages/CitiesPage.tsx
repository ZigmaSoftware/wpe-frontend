import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { citySchema, type CityFormValues } from "@/features/common-master/schemas";
import type { CityListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCityTypeOptions, useCountryOptions, useStateOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: CityFormValues = {
  country: 0,
  state: 0,
  name: "",
  pincode: "",
  city_type: null,
  is_active: true,
};

const CitiesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toggleTarget, setToggleTarget] = useState<CityListRow | null>(null);
  const form = useForm<CityFormValues>({ resolver: zodResolver(citySchema), defaultValues });
  const selectedCountry = useWatch({ control: form.control, name: "country" });

  const countryOptionsQuery = useCountryOptions();
  const stateOptionsQuery = useStateOptions(selectedCountry);
  const cityTypeOptionsQuery = useCityTypeOptions();
  const cityDetailQuery = useQuery({
    queryKey: ["common-masters", "city-detail", editingId],
    queryFn: () => commonMasterApi.getCity(editingId as number),
    enabled: Boolean(editingId),
  });
  const citiesQuery = useQuery({
    queryKey: commonMasterKeys.cities(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listCities({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createCity,
    queryKey: ["common-masters", "cities"],
    successMessage: "City created successfully.",
    errorMessage: "Unable to create city.",
  });
  const updateMutation = useCommonMasterMutations({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      commonMasterApi.updateCity(id, payload),
    queryKey: ["common-masters", "cities"],
    successMessage: "City updated successfully.",
    errorMessage: "Unable to update city.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleCity(id),
    queryKey: ["common-masters", "cities"],
    successMessage: "City status updated.",
    errorMessage: "Unable to update city status.",
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditingId(id);
    const detail = await commonMasterApi.getCity(id);
    form.reset({
      country: detail.country,
      state: detail.state,
      name: detail.name,
      pincode: detail.pincode ?? "",
      city_type: detail.city_type ?? null,
      is_active: detail.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setDialogOpen(false);
      setEditingId(null);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const result = citiesQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cities"
        description="Maintain cities with state and country dependencies plus optional city type metadata."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add City" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "city", title: "City", render: (record) => <div className="font-medium">{record.city}</div> },
          { key: "state", title: "State", render: (record) => record.state },
          { key: "country", title: "Country", render: (record) => record.country },
          { key: "pincode", title: "Pincode", render: (record) => record.pincode || "-" },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (record) => <RowActions onEdit={() => openEdit(record.id)} onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={result?.items ?? []}
        isLoading={citiesQuery.isLoading}
        isError={citiesQuery.isError}
        errorDescription="Cities could not be loaded."
        emptyTitle="No cities found"
        emptyDescription="Create cities after defining countries and states."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => citiesQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Edit City" : "Create City"} description="Country and state stay dependency-safe through backend lookups.">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => {
                    field.onChange(Number(value));
                    form.setValue("state", 0);
                  }}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(countryOptionsQuery.data ?? []).map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(stateOptionsQuery.data ?? []).map((state) => (
                        <SelectItem key={state.id} value={String(state.id)}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>City name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pincode" render={({ field }) => (
                <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>City type</FormLabel>
                  <Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select city type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">No city type</SelectItem>
                      {(cityTypeOptionsQuery.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
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
                {editingId ? "Save changes" : "Create city"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update city status"
        description={`Change the status for ${toggleTarget?.city ?? "this city"}?`}
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

export default CitiesPage;
