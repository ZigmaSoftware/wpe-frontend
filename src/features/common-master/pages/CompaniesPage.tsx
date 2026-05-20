import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import FileField from "@/features/common-master/components/FileField";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import PageSection from "@/features/common-master/components/PageSection";
import RowActions from "@/features/common-master/components/RowActions";
import { companySchema, type CompanyFormValues } from "@/features/common-master/schemas";
import type { CompanyListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions, useStateOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: CompanyFormValues = {
  name: "",
  code: "",
  country: null,
  state: null,
  city: null,
  pincode: "",
  latitude: "",
  longitude: "",
  logo: null,
  document: null,
  is_active: true,
};

const CompaniesPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<CompanyListRow | null>(null);
  const form = useForm<CompanyFormValues>({ resolver: zodResolver(companySchema), defaultValues });
  const selectedCountry = useWatch({ control: form.control, name: "country" });
  const selectedState = useWatch({ control: form.control, name: "state" });

  const countriesQuery = useCountryOptions();
  const statesQuery = useStateOptions(selectedCountry ?? undefined);
  const citiesQuery = useQuery({
    queryKey: ["common-masters", "city-lookup-company", selectedState],
    queryFn: async () => {
      const countryId = selectedCountry ?? 0;
      const stateId = selectedState ?? 0;
      if (!countryId || !stateId) {
        return [];
      }
      const result = await commonMasterApi.listCities({ page: 1, pageSize: 200, search: "" });
      return result.items.filter((item) => item.state === statesQuery.data?.find((state) => state.id === stateId)?.name);
    },
    enabled: Boolean(selectedCountry && selectedState),
  });
  const companiesQuery = useQuery({
    queryKey: commonMasterKeys.companies(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listCompanies({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createCompany,
    queryKey: ["common-masters", "companies"],
    successMessage: "Company created successfully.",
    errorMessage: "Unable to create company.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleCompany(id),
    queryKey: ["common-masters", "companies"],
    successMessage: "Company status updated.",
    errorMessage: "Unable to update company status.",
  });

  const companyRows = companiesQuery.data;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          return;
        }
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        formData.append(key, String(value));
      });
      await createMutation.mutateAsync(formData);
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const countryNameById = useMemo(() => {
    const map = new Map<number, string>();
    (countriesQuery.data ?? []).forEach((item) => map.set(item.id, item.name));
    return map;
  }, [countriesQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Create legal entities with location and upload metadata used across common and project masters."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Company" onCreate={() => setDialogOpen(true)} />
      <MasterTable
        columns={[
          { key: "company_name", title: "Company", render: (record) => <div className="font-medium">{record.company_name}</div> },
          { key: "company_code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.company_code}</span> },
          { key: "state", title: "State", render: (record) => record.state || "-" },
          { key: "city", title: "City", render: (record) => record.city || "-" },
          { key: "pincode", title: "Pincode", render: (record) => record.pincode || "-" },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status === "Active"} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[80px] text-right",
            render: (record) => <RowActions onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={companyRows?.items ?? []}
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        errorDescription="Companies could not be loaded."
        emptyTitle="No companies found"
        emptyDescription="Create companies before configuring projects."
        page={table.page}
        pageSize={table.pageSize}
        total={companyRows?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => companiesQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create Company" description="Company creation uses multipart form submission for logo and supporting documents." size="xl">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <PageSection title="Identity" description="Core legal and location details.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Company code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => {
                      field.onChange(value === "none" ? null : Number(value));
                      form.setValue("state", null);
                      form.setValue("city", null);
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No country</SelectItem>
                        {(countriesQuery.data ?? []).map((country) => (
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
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No state</SelectItem>
                        {(statesQuery.data ?? []).map((state) => (
                          <SelectItem key={state.id} value={String(state.id)}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No city</SelectItem>
                        {(citiesQuery.data ?? []).map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>{city.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <PageSection title="Geo Coordinates" description="Optional map coordinates for plant and office positioning.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="logo" render={({ field }) => (
                <FormItem><FormControl><FileField label="Company Logo" file={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="document" render={({ field }) => (
                <FormItem><FormControl><FileField label="Supporting Document" file={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Create company</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update company status"
        description={`Change the status for ${toggleTarget?.company_name ?? "this company"}?`}
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

export default CompaniesPage;
