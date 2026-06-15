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
  supplierDocumentSchema,
  supplierSchema,
  type SupplierDocumentFormValues,
  type SupplierFormValues,
} from "@/features/common-master/schemas";
import type { DocumentRecord, SupplierRecord } from "@/features/common-master/types";

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

const defaultValues: SupplierFormValues = {
  supplier_name: "",
  supplier_group: "",
  currency: null,
  reference: "",
  country: null,
  state: null,
  city: null,
  pincode: "",
  address: "",
  corporate_address: "",
  mobile_no: "",
  phone_no: "",
  fax_no: "",
  pan_number: "",
  gst_number: "",
  gst_registration_date: "",
  gst_status: "unregistered",
  email: "",
  website: "",
  msme_type: "not_applicable",
  arn_no: "",
  payment_terms: "",
  credit_days: 0,
  vendor_rating: 0,
  remarks: "",
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

const defaultDocumentValues: SupplierDocumentFormValues = {
  supplier: 0,
  document_type: "",
  file: null,
  remarks: "",
  is_active: true,
};

const mapRecordToForm = (record: SupplierRecord): SupplierFormValues => ({
  supplier_name: record.supplier_name,
  supplier_group: record.supplier_group ?? "",
  currency: record.currency ?? null,
  reference: record.reference ?? "",
  country: record.country ?? null,
  state: record.state ?? null,
  city: record.city ?? null,
  pincode: record.pincode ?? "",
  address: record.address ?? "",
  corporate_address: record.corporate_address ?? "",
  mobile_no: record.mobile_no ?? "",
  phone_no: record.phone_no ?? "",
  fax_no: record.fax_no ?? "",
  pan_number: record.pan_number ?? "",
  gst_number: record.gst_number ?? "",
  gst_registration_date: record.gst_registration_date ?? "",
  gst_status: record.gst_status,
  email: record.email ?? "",
  website: record.website ?? "",
  msme_type: record.msme_type ?? "not_applicable",
  arn_no: record.arn_no ?? "",
  payment_terms: record.payment_terms ?? "",
  credit_days: Number(record.credit_days ?? 0),
  vendor_rating: Number(record.vendor_rating ?? 0),
  remarks: record.remarks ?? "",
  contact_persons: (record.contact_persons ?? []).map((contact) => ({
    id: contact.id,
    contact_person_name: contact.contact_person_name,
    designation: contact.designation ?? "",
    email: contact.email ?? "",
    mobile_no: contact.mobile_no ?? "",
    landline: contact.landline ?? "",
    department: contact.department ?? "",
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
    account_number: bank.account_number,
    account_holder_name: bank.account_holder_name,
    bank_address: bank.bank_address ?? "",
    ifsc_code: bank.ifsc_code ?? "",
    swift_code: bank.swift_code ?? "",
    is_primary: bank.is_primary ?? false,
    is_active: bank.is_active ?? true,
  })),
  billing_address: { ...emptyAddress, ...(record.billing_address ?? {}) },
  shipping_address: { ...emptyAddress, ...(record.shipping_address ?? {}) },
});

const SupplierDetailPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = "new" } = useParams();
  const supplierId = id !== "new" ? Number(id) : null;
  const [deleteTarget, setDeleteTarget] = useState<SupplierRecord | null>(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<DocumentRecord | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null);

  const form = useForm<SupplierFormValues>({ resolver: zodResolver(supplierSchema), defaultValues });
  const documentForm = useForm<SupplierDocumentFormValues>({
    resolver: zodResolver(supplierDocumentSchema),
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

  const supplierQuery = useQuery({
    queryKey: commonMasterKeys.supplier(supplierId ?? "new"),
    queryFn: () => commonMasterApi.getSupplier(supplierId as number),
    enabled: Boolean(supplierId),
  });

  const documentsQuery = useQuery({
    queryKey: commonMasterKeys.supplierDocuments(supplierId ?? "new"),
    queryFn: () => commonMasterApi.listSupplierDocuments(supplierId as number),
    enabled: Boolean(supplierId),
  });

  const contactArray = useFieldArray({ control: form.control, name: "contact_persons" });
  const bankArray = useFieldArray({ control: form.control, name: "bank_details" });

  useEffect(() => {
    if (supplierQuery.data) {
      form.reset(mapRecordToForm(supplierQuery.data));
    }
  }, [supplierQuery.data, form]);

  const createMutation = useMutation({
    mutationFn: commonMasterApi.createSupplier,
    onSuccess: async (result) => {
      toast.success("Supplier created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "suppliers"] });
      navigate(`/masters/suppliers/${result.id}`);
    },
    onError: (error) => toast.error((error as Error).message || "Unable to create supplier."),
  });
  const updateMutation = useMutation({
    mutationFn: ({ targetId, payload }: { targetId: number; payload: Partial<SupplierRecord> }) =>
      commonMasterApi.updateSupplier(targetId, payload),
    onSuccess: async () => {
      toast.success("Supplier updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "supplier"] });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "suppliers"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to update supplier."),
  });
  const deleteMutation = useMutation({
    mutationFn: commonMasterApi.deleteSupplier,
    onSuccess: async () => {
      toast.success("Supplier deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "suppliers"] });
      navigate("/masters/suppliers");
    },
    onError: (error) => toast.error((error as Error).message || "Unable to delete supplier."),
  });
  const saveDocumentMutation = useMutation({
    mutationFn: (values: SupplierDocumentFormValues) =>
      editingDocument
        ? commonMasterApi.updateSupplierDocument(editingDocument.id, values as unknown as Record<string, unknown>)
        : commonMasterApi.createSupplierDocument(values as unknown as Record<string, unknown>),
    onSuccess: async () => {
      toast.success(editingDocument ? "Document updated successfully." : "Document uploaded successfully.");
      setEditingDocument(null);
      documentForm.reset({ ...defaultDocumentValues, supplier: supplierId ?? 0 });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "supplier-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "supplier"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to save document."),
  });
  const toggleDocumentMutation = useMutation({
    mutationFn: commonMasterApi.toggleSupplierDocument,
    onSuccess: async () => {
      toast.success("Document status updated.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "supplier-documents"] });
    },
    onError: (error) => toast.error((error as Error).message || "Unable to update document status."),
  });
  const deleteDocumentMutation = useMutation({
    mutationFn: commonMasterApi.deleteSupplierDocument,
    onSuccess: async () => {
      toast.success("Document deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["common-masters", "supplier-documents"] });
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
      if (supplierId) {
        await updateMutation.mutateAsync({ targetId: supplierId, payload: values as unknown as Partial<SupplierRecord> });
      } else {
        await createMutation.mutateAsync(values as unknown as Partial<SupplierRecord>);
      }
    } catch (error) {
      applyBackendErrors(error, form.setError);
    }
  });

  const onSubmitDocument = documentForm.handleSubmit(async (values) => {
    try {
      await saveDocumentMutation.mutateAsync({ ...values, supplier: supplierId ?? 0 });
    } catch (error) {
      applyBackendErrors(error, documentForm.setError);
    }
  });

  const supplier = supplierQuery.data;
  const documents = documentsQuery.data ?? supplier?.documents ?? [];

  if (supplierId && supplierQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading supplier details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/masters/suppliers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Supplier Creations
        </Button>
        {supplier ? <MasterStatusBadge active={supplier.is_active} /> : null}
      </div>
      <PageHeader
        title={supplierId ? supplier?.supplier_name || "Supplier Details" : "Create Supplier"}
        description={supplierId ? `Supplier code ${supplier?.supplier_no ?? "-"}` : "Set up a new supplier with nested statutory, bank, and document details."}
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
              <TabsTrigger value="documents" disabled={!supplierId}>Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <PageSection title="Commercial Identity" description="Supplier header profile, commercial terms, and root geography.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField control={form.control} name="supplier_name" render={({ field }) => (
                    <FormItem><FormLabel>Supplier name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="supplier_group" render={({ field }) => (
                    <FormItem><FormLabel>Supplier group</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="reference" render={({ field }) => (
                    <FormItem><FormLabel>Reference</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No currency</SelectItem>{(currenciesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gst_status" render={({ field }) => (
                    <FormItem><FormLabel>GST status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="registered">Registered</SelectItem><SelectItem value="unregistered">Unregistered</SelectItem><SelectItem value="provisional">Provisional</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="msme_type" render={({ field }) => (
                    <FormItem><FormLabel>MSME type</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="micro">Micro</SelectItem><SelectItem value="small">Small</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="not_applicable">Not applicable</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("state", null); form.setValue("city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(statesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(citiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
              </PageSection>
              <PageSection title="Communication and Terms" description="Core contact, commercial, and supplier control data.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["mobile_no", "Mobile no"],
                    ["phone_no", "Phone no"],
                    ["fax_no", "Fax no"],
                    ["email", "Email"],
                    ["pan_number", "PAN number"],
                    ["gst_number", "GST number"],
                    ["gst_registration_date", "GST registration date"],
                    ["payment_terms", "Payment terms"],
                    ["credit_days", "Credit days"],
                    ["vendor_rating", "Vendor rating"],
                    ["website", "Website"],
                    ["arn_no", "ARN no"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as keyof SupplierFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type={name.includes("date") ? "date" : name === "credit_days" || name === "vendor_rating" ? "number" : "text"}
                              step={name === "vendor_rating" ? "0.01" : undefined}
                              value={(field.value as string | number | null | undefined) ?? ""}
                              className={name.includes("pan") || name.includes("gst") ? "uppercase" : undefined}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="corporate_address" render={({ field }) => (
                    <FormItem><FormLabel>Corporate address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="remarks" render={({ field }) => (
                  <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>
                )} />
              </PageSection>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <PageSection title="Contact Persons" description="Maintain multiple supplier-side points of contact.">
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => contactArray.append({ contact_person_name: "", designation: "", email: "", mobile_no: "", landline: "", department: "", is_active: true })}>
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
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          ["contact_person_name", "Name"],
                          ["designation", "Designation"],
                          ["email", "Email"],
                          ["mobile_no", "Mobile"],
                          ["landline", "Landline"],
                          ["department", "Department"],
                        ].map(([name, label]) => (
                          <FormField
                            key={name}
                            control={form.control}
                            name={`contact_persons.${index}.${name}` as never}
                            render={({ field }) => (
                              <FormItem><FormLabel>{label}</FormLabel><FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} /></FormControl><FormMessage /></FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </PageSection>
            </TabsContent>

            <TabsContent value="statutory" className="space-y-4">
              <PageSection title="Statutory Details" description="Capture detailed regulatory identifiers and registrations.">
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
              <PageSection title="Bank Details" description="Support multiple supplier bank rows with IFSC and SWIFT validation.">
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => bankArray.append({ bank_name: "", account_number: "", account_holder_name: "", bank_address: "", ifsc_code: "", swift_code: "", is_primary: false, is_active: true })}>
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
                        {[
                          ["bank_name", "Bank name"],
                          ["account_holder_name", "Account holder name"],
                          ["account_number", "Account number"],
                          ["ifsc_code", "IFSC code"],
                          ["swift_code", "SWIFT code"],
                          ["bank_address", "Bank address"],
                        ].map(([name, label]) => (
                          <FormField
                            key={name}
                            control={form.control}
                            name={`bank_details.${index}.${name}` as never}
                            render={({ field }) => (
                              <FormItem className={name === "bank_address" ? "md:col-span-2" : ""}>
                                <FormLabel>{label}</FormLabel>
                                <FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} className={name.includes("code") ? "uppercase" : undefined} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
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
              <PageSection title="Billing Address" description="Billing address is saved separately from the root address fields.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {["name","contact_name","contact_no","pincode","gst_number"].map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={`billing_address.${name}` as never}
                      render={({ field }) => (
                        <FormItem><FormLabel>{name.replaceAll("_", " ")}</FormLabel><FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} className={name === "gst_number" ? "uppercase" : undefined} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                  ))}
                  <FormField control={form.control} name="billing_address.country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("billing_address.state", null); form.setValue("billing_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("billing_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(billingStatesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billing_address.city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(billingCitiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
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
              <PageSection title="Shipping Address" description="Shipping can inherit billing while preserving backend-compatible structure.">
                <FormField control={form.control} name="shipping_address.same_as_billing" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-xl border border-border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Same as billing address</FormLabel></FormItem>
                )} />
                <div className={`space-y-4 ${shippingSameAsBilling ? "pointer-events-none opacity-60" : ""}`}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {["name","contact_name","contact_no","pincode","gst_number"].map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={`shipping_address.${name}` as never}
                        render={({ field }) => (
                          <FormItem><FormLabel>{name.replaceAll("_", " ")}</FormLabel><FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} className={name === "gst_number" ? "uppercase" : undefined} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                    ))}
                    <FormField control={form.control} name="shipping_address.country" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("shipping_address.state", null); form.setValue("shipping_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No country</SelectItem>{(countriesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.state" render={({ field }) => (
                      <FormItem><FormLabel>State</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("shipping_address.city", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No state</SelectItem>{(shippingStatesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="shipping_address.city" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No city</SelectItem>{(shippingCitiesQuery.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
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
              <PageSection title="Documents" description="Upload and replace supplier documents through multipart endpoints.">
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
                      {editingDocument ? <Button type="button" variant="outline" onClick={() => { setEditingDocument(null); documentForm.reset({ ...defaultDocumentValues, supplier: supplierId ?? 0 }); }}>Cancel Edit</Button> : null}
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
                              <Button variant="outline" size="sm" onClick={() => { setEditingDocument(doc); documentForm.reset({ supplier: supplierId ?? 0, document_type: doc.document_type, file: null, remarks: doc.remarks ?? "", is_active: doc.is_active }); }}>Replace</Button>
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
              {supplierId ? <Button type="button" variant="destructive" onClick={() => supplier && setDeleteTarget(supplier)}>Delete Supplier</Button> : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {supplierId ? "Save Changes" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </Form>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete supplier"
        description={`Delete ${deleteTarget?.supplier_name ?? "this supplier"}? This action cannot be undone.`}
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

export default SupplierDetailPage;
