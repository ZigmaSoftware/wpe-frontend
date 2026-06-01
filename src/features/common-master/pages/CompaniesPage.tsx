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
import { Textarea } from "@/components/ui/textarea";
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
import { useCityOptions, useCountryOptions, useStateOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: CompanyFormValues = {
  code: "",
  name: "",
  gst_number: "",
  pan_number: "",
  address: "",
  country: 0,
  state: 0,
  city: 0,
  pincode: "",
  contact_person: "",
  mobile_no: "",
  email: "",
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
  const citiesQuery = useCityOptions(selectedCountry ?? undefined, selectedState ?? undefined);
  const companiesQuery = useQuery({
    queryKey: commonMasterKeys.companies(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listCompanies({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });
  const nextCodeQuery = useQuery({
    queryKey: commonMasterKeys.nextCode("company"),
    queryFn: commonMasterApi.getNextCompanyCode,
    enabled: false,
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

  const openCreate = async () => {
    form.reset(defaultValues);
    setDialogOpen(true);
    const result = await nextCodeQuery.refetch();
    form.setValue("code", result.data ?? "");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values as unknown as Record<string, unknown>);
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Manage company profile and statutory information."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Company" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "company_name", title: "Company", render: (record) => <div className="font-medium">{record.company_name}</div> },
          { key: "company_code", title: "Company Code", render: (record) => <span className="font-mono text-xs">{record.company_code}</span> },
          { key: "country", title: "Country", render: (record) => record.country || "-" },
          { key: "state", title: "State", render: (record) => record.state || "-" },
          { key: "city", title: "City", render: (record) => record.city || "-" },
          { key: "contact_number", title: "Contact Number", render: (record) => record.contact_number || "-" },
          { key: "pincode", title: "Pincode", render: (record) => record.pincode || "-" },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status === "Active"} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[80px] text-right",
            render: (record) => <RowActions onToggle={() => setToggleTarget(record)} isActive={record.is_active} />,
          },
        ]}
        records={companyRows?.items ?? []}
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        errorDescription="Company records could not be loaded."
        emptyTitle="No companies found"
        emptyDescription="Create companies before configuring projects."
        page={table.page}
        pageSize={table.pageSize}
        total={companyRows?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => companiesQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create Company" description="Capture company profile, statutory identifiers, and location dependencies used across the ERP.">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <PageSection title="Identity" description="Core legal and statutory identifiers.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Company Code*</FormLabel><FormControl><Input {...field} value={field.value ?? ""} readOnly placeholder="Generating..." className="bg-slate-50 text-slate-700" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gst_number" render={({ field }) => (
                  <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pan_number" render={({ field }) => (
                  <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Company Address*</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} className="min-h-[96px]" /></FormControl><FormMessage /></FormItem>
              )} />
            </PageSection>
            <PageSection title="Location" description="Map the company to active country, state, and city masters.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country*</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.setValue("state", 0);
                      form.setValue("city", 0);
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger></FormControl>
                      <SelectContent>
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
                    <FormLabel>State*</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.setValue("city", 0);
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl>
                      <SelectContent>
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
                    <FormLabel>City*</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(citiesQuery.data ?? []).map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode*</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <PageSection title="Contacts" description="Primary contact details for the company record.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="contact_person" render={({ field }) => (
                  <FormItem><FormLabel>Manager Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mobile_no" render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Company Email*</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
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
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                <FormLabel>Active Status*</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
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
