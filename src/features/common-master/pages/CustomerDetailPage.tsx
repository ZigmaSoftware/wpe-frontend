import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import FileField from "@/features/common-master/components/FileField";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import PageSection from "@/features/common-master/components/PageSection";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import { useCityOptions, useCountryOptions, useCurrencyOptions, useStateOptions } from "@/features/common-master/hooks/useLookupOptions";
import {
  customerDocumentSchema,
  customerSchema,
  type CustomerDocumentFormValues,
  type CustomerFormValues,
} from "@/features/common-master/schemas";
import type { CustomerRecord, DocumentRecord } from "@/features/common-master/types";

const emptyAddress = {
  same_as_billing: false,
  name: "",
  address: "",
  country: null,
  state: null,
  city: null,
  pincode: "",
  contact_name: "",
  contact_no: "",
  gst_number: "",
  gst_status: "unregistered" as const,
  ecc_no: "",
};

const defaultValues: CustomerFormValues = {
  customer_name: "",
  customer_group: "domestic",
  customer_division: "",
  currency: null,
  country: null,
  state: null,
  city: null,
  address: "",
  pincode: "",
  mobile_no: "",
  phone_no: "",
  email: "",
  pan_number: "",
  gst_number: "",
  gst_registered: false,
  gst_provisional: false,
  customer_status: "active",
  website: "",
  remarks: "",
  credit_limit: 0,
  payment_terms: "",
  customer_since: "",
  contact_persons: [],
  statutory_detail: {
    ecc_no: "",
    commissionerate: "",
    division: "",
    range_name: "",
    cst_no: "",
    tin_no: "",
    service_tax_no: "",
    iec_code: "",
    cin_no: "",
    tan_no: "",
  },
  bank_details: [],
  billing_address: { ...emptyAddress },
  shipping_address: { ...emptyAddress },
};

const defaultDocumentValues: CustomerDocumentFormValues = {
  customer: 0,
  document_type: "",
  file: null,
  remarks: "",
  is_active: true,
};

const mapRecordToForm = (record: CustomerRecord): CustomerFormValues => ({
  customer_name: record.customer_name,
  customer_group: record.customer_group,
  customer_division: record.customer_division ?? "",
  currency: record.currency ?? null,
  country: record.country ?? null,
  state: record.state ?? null,
  city: record.city ?? null,
  address: record.address ?? "",
  pincode: record.pincode ?? "",
  mobile_no: record.mobile_no ?? "",
  phone_no: record.phone_no ?? "",
  email: record.email ?? "",
  pan_number: record.pan_number ?? "",
  gst_number: record.gst_number ?? "",
  gst_registered: Boolean(record.gst_registered),
  gst_provisional: Boolean(record.gst_provisional),
  customer_status: record.customer_status,
  website: record.website ?? "",
  remarks: record.remarks ?? "",
  credit_limit: Number(record.credit_limit ?? 0),
  payment_terms: record.payment_terms ?? "",
  customer_since: record.customer_since ?? "",
  contact_persons: (record.contact_persons ?? []).map((contact) => ({
    id: contact.id,
    contact_person_name: contact.contact_person_name,
    designation: contact.designation ?? "",
    email: contact.email ?? "",
    mobile_no: contact.mobile_no ?? "",
    is_active: contact.is_active ?? true,
  })),
  statutory_detail: {
    ecc_no: record.statutory_detail?.ecc_no ?? "",
    commissionerate: record.statutory_detail?.commissionerate ?? "",
    division: record.statutory_detail?.division ?? "",
    range_name: record.statutory_detail?.range_name ?? "",
    cst_no: record.statutory_detail?.cst_no ?? "",
    tin_no: record.statutory_detail?.tin_no ?? "",
    service_tax_no: record.statutory_detail?.service_tax_no ?? "",
    iec_code: record.statutory_detail?.iec_code ?? "",
    cin_no: record.statutory_detail?.cin_no ?? "",
    tan_no: record.statutory_detail?.tan_no ?? "",
  },
  bank_details: (record.bank_details ?? []).map((bank) => ({
    id: bank.id,
    bank_name: bank.bank_name,
    bank_address: bank.bank_address ?? "",
    ifsc_code: bank.ifsc_code ?? "",
    beneficiary_account_name: bank.beneficiary_account_name,
    account_number: bank.account_number,
    is_primary: bank.is_primary ?? false,
    is_active: bank.is_active ?? true,
  })),
  billing_address: { ...emptyAddress, ...(record.billing_address ?? {}) },
  shipping_address: { ...emptyAddress, ...(record.shipping_address ?? {}) },
});

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = "new" } = useParams();
  const customerId = id !== "new" ? Number(id) : null;
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<DocumentRecord | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null);

  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema), defaultValues });
  const documentForm = useForm<CustomerDocumentFormValues>({
    resolver: zodResolver(customerDocumentSchema),
    defaultValues: defaultDocumentValues,
  });

  const countriesQuery = useCountryOptions();
  const currenciesQuery = useCurrencyOptions();

  const rootCountry = useWatch({ control: form.control, name: "country" });
  const rootState = useWatch({ control: form.control, name: "state" });
  const billingCountry = useWatch({ control: form.control, name: "billing_address.country" });
  const billingState = useWatch({ control: form.control, name: "billing_address.state" });
  const shippingCountry = useWatch({ control: form.control, name: "shipping_address.country" });
  const shippingState = useWatch({ control: form.control, name: "shipping_address.state" });
  const shippingSameAsBilling = useWatch({ control: form.control, name: "shipping_address.same_as_billing" });

  const statesQuery = useStateOptions(rootCountry);
  const citiesQuery = useCityOptions(rootCountry, rootState);
  const billingStatesQuery = useStateOptions(billingCountry);
  const billingCitiesQuery = useCityOptions(billingCountry, billingState);
  const shippingStatesQuery = useStateOptions(shippingCountry);
  const shippingCitiesQuery = useCityOptions(shippingCountry, shippingState);

  const customerQuery = useQuery({
    queryKey: commonMasterKeys.customer(customerId ?? "new"),
    queryFn: () => commonMasterApi.getCustomer(customerId as number),
    enabled: Boolean(customerId),
  });

  const documentsQuery = useQuery({
    queryKey: commonMasterKeys.customerDocuments(customerId ?? "new"),
    queryFn: () => commonMasterApi.listCustomerDocuments(customerId as number),
    enabled: Boolean(customerId),
  });

  const contactArray = useFieldArray({ control: form.control, name: "contact_persons" });
  const bankArray = useFieldArray({ control: form.control, name: "bank_details" });

  useEffect(() => {
    if (customerQuery.data) {
      form.reset(mapRecordToForm(customerQuery.data));
    }
  }, [customerQuery.data, form]);

  const createMutation = useMutation({
    mutationFn: commonMasterApi.createCustomer,
    onSuccess: async (result) => {
      toast.success("Customer created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customers"] });
      navigate(`/masters/customers/${result.id}`);
    },
    onError: (error) => toast.error((error as Error).message || "Unable to create customer."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ targetId, payload }: { targetId: number; payload: Partial<CustomerRecord> }) =>
      commonMasterApi.updateCustomer(targetId, payload),
    onSuccess: async () => {
      toast.success("Customer updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customer"] });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customers"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to update customer."),
  });

  const deleteMutation = useMutation({
    mutationFn: commonMasterApi.deleteCustomer,
    onSuccess: async () => {
      toast.success("Customer deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customers"] });
      navigate("/masters/customers");
    },
    onError: (error) => toast.error((error as Error).message || "Unable to delete customer."),
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (values: CustomerDocumentFormValues) =>
      editingDocument
        ? commonMasterApi.updateCustomerDocument(editingDocument.id, values as unknown as Record<string, unknown>)
        : commonMasterApi.createCustomerDocument(values as unknown as Record<string, unknown>),
    onSuccess: async () => {
      toast.success(editingDocument ? "Document updated successfully." : "Document uploaded successfully.");
      setEditingDocument(null);
      documentForm.reset({ ...defaultDocumentValues, customer: customerId ?? 0 });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customer-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customer"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to save document."),
  });

  const toggleDocumentMutation = useMutation({
    mutationFn: commonMasterApi.toggleCustomerDocument,
    onSuccess: async () => {
      toast.success("Document status updated.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customer-documents"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to update document status."),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: commonMasterApi.deleteCustomerDocument,
    onSuccess: async () => {
      toast.success("Document deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "customer-documents"] });
      setDeleteDocumentTarget(null);
    },
    onError: (error) => toast.error((error as Error).message || "Unable to delete document."),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (values.shipping_address?.same_as_billing) {
        values.shipping_address = {
          ...values.shipping_address,
          ...values.billing_address,
          same_as_billing: true,
        };
      }
      if (customerId) {
        await updateMutation.mutateAsync({ targetId: customerId, payload: values as unknown as Partial<CustomerRecord> });
      } else {
        await createMutation.mutateAsync(values as unknown as Partial<CustomerRecord>);
      }
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const onSubmitDocument = documentForm.handleSubmit(async (values) => {
    try {
      await saveDocumentMutation.mutateAsync({ ...values, customer: customerId ?? 0 });
    } catch (error) {
      applyBackendErrors(error, documentForm.setError);
    }
  });

  const customer = customerQuery.data;
  const documents = documentsQuery.data ?? customer?.documents ?? [];

  if (customerId && customerQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading customer details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/masters/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
        {customer ? <MasterStatusBadge active={customer.is_active} /> : null}
      </div>

      <PageHeader
        title={customerId ? customer?.customer_name || "Customer Details" : "Create Customer"}
        description={customerId ? `Customer code ${customer?.customer_no ?? "-"}` : "Set up a new customer with nested contact, bank, address, and document data."}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-transparent p-0">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="contacts">Contact Persons</TabsTrigger>
              <TabsTrigger value="statutory">Statutory Details</TabsTrigger>
              <TabsTrigger value="banking">Bank Details</TabsTrigger>
              <TabsTrigger value="billing">Billing Address</TabsTrigger>
              <TabsTrigger value="shipping">Shipping Address</TabsTrigger>
              <TabsTrigger value="documents" disabled={!customerId}>Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <PageSection title="Commercial Identity" description="Primary customer attributes, status, commercial currency, and root geography.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField control={form.control} name="customer_name" render={({ field }) => (
                    <FormItem><FormLabel>Customer name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer_group" render={({ field }) => (
                    <FormItem><FormLabel>Customer group</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="domestic">Domestic</SelectItem><SelectItem value="international">International</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer_division" render={({ field }) => (
                    <FormItem><FormLabel>Customer division</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No currency</SelectItem>{(currenciesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer_status" render={({ field }) => (
                    <FormItem><FormLabel>Customer status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="credit_limit" render={({ field }) => (
                    <FormItem><FormLabel>Credit limit</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("state", null); form.setValue("city", null); }}><FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("city", null); }}><FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(statesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(citiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
              </PageSection>
              <PageSection title="Contact and Statutory Basics" description="Main communication channels and tax identifiers used at header level.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField control={form.control} name="mobile_no" render={({ field }) => (
                    <FormItem><FormLabel>Mobile no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone_no" render={({ field }) => (
                    <FormItem><FormLabel>Phone no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="pan_number" render={({ field }) => (
                    <FormItem><FormLabel>PAN number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gst_number" render={({ field }) => (
                    <FormItem><FormLabel>GST number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer_since" render={({ field }) => (
                    <FormItem><FormLabel>Customer since</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="payment_terms" render={({ field }) => (
                    <FormItem><FormLabel>Payment terms</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="remarks" render={({ field }) => (
                    <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="gst_registered" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>GST registered</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="gst_provisional" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>GST provisional</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                  )} />
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <PageSection title="Contact Persons" description="Maintain multiple active customer-side contacts.">
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => contactArray.append({ contact_person_name: "", designation: "", email: "", mobile_no: "", is_active: true })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact Person
                  </Button>
                </div>
                <div className="space-y-4">
                  {contactArray.fields.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-border p-4">
                      <div className="mb-4 flex justify-between">
                        <div className="text-sm font-medium">Contact #{index + 1}</div>
                        <Button type="button" variant="ghost" onClick={() => contactArray.remove(index)}>Remove</Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FormField control={form.control} name={`contact_persons.${index}.contact_person_name`} render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`contact_persons.${index}.designation`} render={({ field }) => (
                          <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`contact_persons.${index}.email`} render={({ field }) => (
                          <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`contact_persons.${index}.mobile_no`} render={({ field }) => (
                          <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="statutory" className="space-y-4">
              <PageSection title="Statutory Details" description="Capture secondary compliance references and registrations.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {["ecc_no","commissionerate","division","range_name","cst_no","tin_no","service_tax_no","iec_code","cin_no","tan_no"].map((fieldName) => (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={`statutory_detail.${fieldName}` as never}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{fieldName.replaceAll("_", " ")}</FormLabel>
                          <FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <PageSection title="Bank Details" description="Multiple bank rows are supported with primary account marking.">
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => bankArray.append({ bank_name: "", bank_address: "", ifsc_code: "", beneficiary_account_name: "", account_number: "", is_primary: false, is_active: true })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Row
                  </Button>
                </div>
                <div className="space-y-4">
                  {bankArray.fields.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-border p-4">
                      <div className="mb-4 flex justify-between">
                        <div className="text-sm font-medium">Bank #{index + 1}</div>
                        <Button type="button" variant="ghost" onClick={() => bankArray.remove(index)}>Remove</Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <FormField control={form.control} name={`bank_details.${index}.bank_name`} render={({ field }) => (
                          <FormItem><FormLabel>Bank name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_details.${index}.beneficiary_account_name`} render={({ field }) => (
                          <FormItem><FormLabel>Beneficiary account name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_details.${index}.account_number`} render={({ field }) => (
                          <FormItem><FormLabel>Account number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_details.${index}.ifsc_code`} render={({ field }) => (
                          <FormItem><FormLabel>IFSC code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_details.${index}.bank_address`} render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Bank address</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="mt-4 flex items-center gap-6">
                        <FormField control={form.control} name={`bank_details.${index}.is_primary`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Primary bank</FormLabel></FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_details.${index}.is_active`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Active</FormLabel></FormItem>
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <PageSection title="Billing Address" description="Country, state, and city dependency is enforced in the form.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField control={form.control} name="billing_address.name" render={({ field }) => (
                    <FormItem><FormLabel>Address name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.contact_name" render={({ field }) => (
                    <FormItem><FormLabel>Contact name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.contact_no" render={({ field }) => (
                    <FormItem><FormLabel>Contact no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("billing_address.state", null); form.setValue("billing_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("billing_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(billingStatesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(billingCitiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.pincode" render={({ field }) => (
                    <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.gst_number" render={({ field }) => (
                    <FormItem><FormLabel>GST number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.gst_status" render={({ field }) => (
                    <FormItem><FormLabel>GST status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="registered">Registered</SelectItem><SelectItem value="unregistered">Unregistered</SelectItem><SelectItem value="provisional">Provisional</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="billing_address.address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                )} />
              </PageSection>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <PageSection title="Shipping Address" description="Optionally inherit billing data while preserving backend-compatible payloads.">
                <FormField control={form.control} name="shipping_address.same_as_billing" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-xl border border-border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Same as billing address</FormLabel></FormItem>
                )} />
                <div className={`space-y-4 ${shippingSameAsBilling ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FormField control={form.control} name="shipping_address.name" render={({ field }) => (
                      <FormItem><FormLabel>Address name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.contact_name" render={({ field }) => (
                      <FormItem><FormLabel>Contact name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.contact_no" render={({ field }) => (
                      <FormItem><FormLabel>Contact no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.country" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("shipping_address.state", null); form.setValue("shipping_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.state" render={({ field }) => (
                      <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("shipping_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(shippingStatesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.city" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(shippingCitiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.pincode" render={({ field }) => (
                      <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.gst_number" render={({ field }) => (
                      <FormItem><FormLabel>GST number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="uppercase" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.gst_status" render={({ field }) => (
                      <FormItem><FormLabel>GST status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="registered">Registered</SelectItem><SelectItem value="unregistered">Unregistered</SelectItem><SelectItem value="provisional">Provisional</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="shipping_address.address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <PageSection title="Documents" description="Upload supporting files using multipart document endpoints.">
                <Form {...documentForm}>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField control={documentForm.control} name="document_type" render={({ field }) => (
                        <FormItem><FormLabel>Document type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={documentForm.control} name="remarks" render={({ field }) => (
                        <FormItem><FormLabel>Remarks</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={documentForm.control} name="file" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormControl><FileField label="Document file" file={field.value} existingUrl={editingDocument?.file_url ?? null} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="flex justify-end gap-3">
                      {editingDocument ? <Button type="button" variant="outline" onClick={() => { setEditingDocument(null); documentForm.reset({ ...defaultDocumentValues, customer: customerId ?? 0 }); }}>Cancel Edit</Button> : null}
                      <Button type="button" disabled={saveDocumentMutation.isPending} onClick={() => void onSubmitDocument()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {editingDocument ? "Update document" : "Upload document"}
                      </Button>
                    </div>
                  </div>
                </Form>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length ? documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.document_type}</TableCell>
                          <TableCell>{doc.file_url ? <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{doc.file_url.split("/").pop()}</a> : "-"}</TableCell>
                          <TableCell><MasterStatusBadge active={doc.is_active} /></TableCell>
                          <TableCell>{doc.remarks || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setEditingDocument(doc); documentForm.reset({ customer: customerId ?? 0, document_type: doc.document_type, file: null, remarks: doc.remarks ?? "", is_active: doc.is_active }); }}>Replace</Button>
                              <Button variant="outline" size="sm" onClick={() => toggleDocumentMutation.mutate(doc.id)}>Toggle</Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteDocumentTarget(doc)}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No documents uploaded yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </PageSection>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between">
            <div>
              {customerId ? (
                <Button type="button" variant="destructive" onClick={() => customer && setDeleteTarget(customer)}>
                  Delete Customer
                </Button>
              ) : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {customerId ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete customer"
        description={`Delete ${deleteTarget?.customer_name ?? "this customer"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteDocumentTarget)}
        onOpenChange={(open) => !open && setDeleteDocumentTarget(null)}
        title="Delete document"
        description={`Delete ${deleteDocumentTarget?.document_type ?? "this document"}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDocumentTarget) {
            deleteDocumentMutation.mutate(deleteDocumentTarget.id);
          }
        }}
      />
    </div>
  );
};

export default CustomerDetailPage;
