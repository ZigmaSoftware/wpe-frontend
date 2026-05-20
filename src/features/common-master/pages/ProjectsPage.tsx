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
import { Textarea } from "@/components/ui/textarea";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import PageSection from "@/features/common-master/components/PageSection";
import RowActions from "@/features/common-master/components/RowActions";
import { projectSchema, type ProjectFormValues } from "@/features/common-master/schemas";
import type { ProjectListRow } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useApplicationTypeOptions, useCompanyOptions, useCountryOptions, useStateOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: ProjectFormValues = {
  company: 0,
  name: "",
  code: "",
  client_name: "",
  application_type: null,
  capacity: "",
  duration: "",
  project_date: "",
  country: null,
  state: null,
  city: null,
  address: "",
  latitude: "",
  longitude: "",
  pincode: "",
  pan_number: "",
  gst_number: "",
  gst_reg_date: "",
  contact_person: "",
  contact_number: "",
  contact_email: "",
  website: "",
  description: "",
  is_active: true,
};

const ProjectsPage = () => {
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<ProjectListRow | null>(null);
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema), defaultValues });
  const selectedCountry = useWatch({ control: form.control, name: "country" });
  const selectedState = useWatch({ control: form.control, name: "state" });

  const companiesQuery = useCompanyOptions();
  const applicationTypesQuery = useApplicationTypeOptions();
  const countriesQuery = useCountryOptions();
  const statesQuery = useStateOptions(selectedCountry ?? undefined);
  const citiesQuery = useQuery({
    queryKey: ["common-masters", "city-lookup-project", selectedState],
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
  const projectsQuery = useQuery({
    queryKey: commonMasterKeys.projects(table.page, table.pageSize, debouncedSearch),
    queryFn: () => commonMasterApi.listProjects({ page: table.page, pageSize: table.pageSize, search: debouncedSearch }),
  });

  const createMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.createProject,
    queryKey: ["common-masters", "projects"],
    successMessage: "Project created successfully.",
    errorMessage: "Unable to create project.",
  });
  const toggleMutation = useCommonMasterMutations({
    mutationFn: (id: number) => commonMasterApi.toggleProject(id),
    queryKey: ["common-masters", "projects"],
    successMessage: "Project status updated.",
    errorMessage: "Unable to update project status.",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const projectRows = projectsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Project setup combines company, geography, commercial identity, and application context in one enterprise form."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Project" onCreate={() => setDialogOpen(true)} />
      <MasterTable
        columns={[
          { key: "project_name", title: "Project", render: (record) => <div className="font-medium">{record.project_name}</div> },
          { key: "company_name", title: "Company", render: (record) => record.company_name },
          { key: "project_code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.project_code}</span> },
          { key: "application_type", title: "Application Type", render: (record) => record.application_type || "-" },
          { key: "contact_person", title: "Contact", render: (record) => record.contact_person || "-" },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.status === "Active"} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[80px] text-right",
            render: (record) => <RowActions onToggle={() => setToggleTarget(record)} />,
          },
        ]}
        records={projectRows?.items ?? []}
        isLoading={projectsQuery.isLoading}
        isError={projectsQuery.isError}
        errorDescription="Projects could not be loaded."
        emptyTitle="No projects found"
        emptyDescription="Create a project after company and geography masters are available."
        page={table.page}
        pageSize={table.pageSize}
        total={projectRows?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => projectsQuery.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create Project" description="The project form is organized into compact ERP sections for faster keyboard-driven entry." size="xl">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <PageSection title="Identity" description="Primary references and commercial identity.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(companiesQuery.data ?? []).map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Project name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Project code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client_name" render={({ field }) => (
                  <FormItem><FormLabel>Client name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="application_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application type</FormLabel>
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select application type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No application type</SelectItem>
                        {(applicationTypesQuery.data ?? []).map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="project_date" render={({ field }) => (
                  <FormItem><FormLabel>Project date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <PageSection title="Commercial Details" description="Capacity, duration, statutory, and communication details.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pan_number" render={({ field }) => (
                  <FormItem><FormLabel>PAN number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gst_number" render={({ field }) => (
                  <FormItem><FormLabel>GST number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gst_reg_date" render={({ field }) => (
                  <FormItem><FormLabel>GST registration date</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact_person" render={({ field }) => (
                  <FormItem><FormLabel>Contact person</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact_number" render={({ field }) => (
                  <FormItem><FormLabel>Contact number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact_email" render={({ field }) => (
                  <FormItem><FormLabel>Contact email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <PageSection title="Location" description="Country, state, city, address, and map coordinates.">
              <div className="grid gap-4 md:grid-cols-2">
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
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="mt-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </PageSection>
            <PageSection title="Description" description="Project overview and operational notes.">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
            </PageSection>
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Create project</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update project status"
        description={`Change the status for ${toggleTarget?.project_name ?? "this project"}?`}
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

export default ProjectsPage;
