import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, CheckCircle2, CreditCard,
  ExternalLink, FileText, Landmark, Loader2, MapPin, User,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-helpers";
import type { Contact } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── Schema ────────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name:               z.string().min(1, "Full name is required"),
  display_name:       z.string().default(""),
  contact_code:       z.string().default(""),
  category:           z.string().min(1, "Contact type is required"),
  contact_category:   z.string().default(""),
  customer_loyalty:   z.string().default(""),
  company_name:       z.string().default(""),
  gstin:              z.string().default(""),
  pan:                z.string().default(""),
  sale_person:        z.string().default(""),
  division:           z.string().default(""),
  zone:               z.string().default(""),
  subzone:            z.string().default(""),
  tds_category:       z.string().default(""),
  tds_percent:        z.string().default(""),
  accounting_percent: z.string().default(""),
  lead_source:        z.string().default(""),
  market_segment:     z.string().default(""),
  is_active:          z.boolean().default(true),
  contact_person:     z.string().default(""),
  designation:        z.string().default(""),
  phone:              z.string().min(10, "Work phone 1 is required"),
  work_phone_2:       z.string().default(""),
  work_phone_3:       z.string().default(""),
  fax:                z.string().default(""),
  email:              z.string().email("Enter a valid email").or(z.literal("")).nullable().default(""),
  address:             z.string().min(1, "Mailing address is required"),
  billing_landmark:    z.string().default(""),
  billing_city:        z.string().default(""),
  state:               z.string().min(1, "State is required"),
  billing_postal_code: z.string().default(""),
  billing_country:     z.string().default("India"),
  notes:               z.string().default(""),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const emptyValues: ContactFormValues = {
  name: "", display_name: "", contact_code: "", category: "", contact_category: "",
  customer_loyalty: "", company_name: "", gstin: "", pan: "", sale_person: "",
  division: "", zone: "", subzone: "", tds_category: "", tds_percent: "",
  accounting_percent: "", lead_source: "", market_segment: "", is_active: true,
  contact_person: "", designation: "", phone: "", work_phone_2: "", work_phone_3: "",
  fax: "", email: "",
  address: "", billing_landmark: "", billing_city: "", state: "",
  billing_postal_code: "", billing_country: "India", notes: "",
};

const CONTACT_TYPES   = ["Lead", "Prospect", "Customer", "Supplier", "Dealer", "Distributor", "Shipper", "Service Provider"];
const LOYALTY_OPTIONS = ["Platinum", "Gold", "Silver", "Bronze"];

const toFormValues = (c: Contact): ContactFormValues => ({
  name:               c.name,
  display_name:       c.display_name        ?? "",
  contact_code:       c.contact_code        ?? "",
  category:           c.category,
  contact_category:   c.contact_category    ?? "",
  customer_loyalty:   c.customer_loyalty    ?? "",
  company_name:       c.company_name        ?? "",
  gstin:              c.gstin               ?? "",
  pan:                c.pan                 ?? "",
  sale_person:        c.sale_person         ?? "",
  division:           c.division            ?? "",
  zone:               c.zone                ?? "",
  subzone:            c.subzone             ?? "",
  tds_category:       c.tds_category        ?? "",
  tds_percent:        String(c.tds_percent  ?? ""),
  accounting_percent: String(c.accounting_percent ?? ""),
  lead_source:        c.lead_source         ?? "",
  market_segment:     c.market_segment      ?? "",
  is_active:          c.is_active,
  contact_person:     c.contact_person      ?? "",
  designation:        c.designation         ?? "",
  phone:              c.phone,
  work_phone_2:       c.work_phone_2        ?? "",
  work_phone_3:       c.work_phone_3        ?? "",
  fax:                c.fax                 ?? "",
  email:              c.email               ?? "",
  address:            c.address,
  billing_landmark:   c.billing_landmark    ?? "",
  billing_city:       c.billing_city        ?? "",
  state:              c.state,
  billing_postal_code:c.billing_postal_code ?? "",
  billing_country:    c.billing_country     ?? "India",
  notes:              c.notes               ?? "",
});

const toPayload = (v: ContactFormValues) => ({
  ...v,
  email:              v.email  || null,
  company_name:       v.company_name  || null,
  gstin:              v.gstin  || null,
  tds_percent:        v.tds_percent        ? parseFloat(v.tds_percent)        : null,
  accounting_percent: v.accounting_percent ? parseFloat(v.accounting_percent) : null,
});

// ── Component ─────────────────────────────────────────────────────────────────

const ContactFormPage = () => {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const isEdit      = Boolean(id);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyValues,
  });

  const contactQuery = useQuery({
    queryKey: ["contact", id],
    queryFn:  () => coreApi.get<Contact>(`/api/contacts/contacts/${id}/`).then((r) => r.data),
    enabled:  isEdit,
  });

  useEffect(() => {
    if (contactQuery.data) form.reset(toFormValues(contactQuery.data));
  }, [contactQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (v: ContactFormValues) =>
      isEdit
        ? coreApi.put<Contact>(`/api/contacts/contacts/${id}/`, toPayload(v)).then((r) => r.data)
        : coreApi.post<Contact>("/api/contacts/contacts/", toPayload(v)).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(isEdit ? "Contact updated." : "Contact created.");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      if (isEdit) queryClient.setQueryData(["contact", id], data);
      navigate("/app/contacts");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, `Unable to ${isEdit ? "update" : "create"} contact.`)),
  });

  const isSaving  = saveMutation.isPending;
  const isLoading = isEdit && contactQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEdit && contactQuery.isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-destructive">
        <p className="font-medium">Contact could not be loaded.</p>
        <Button variant="outline" onClick={() => navigate("/app/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  const refCode = contactQuery.data?.ref_code;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        className="min-h-screen rounded-[28px] border border-slate-200/90 bg-white shadow-[0_24px_64px_-40px_rgba(15,23,42,0.3)] overflow-hidden"
      >
        {/*
          Tabs wraps everything so TabsList (in header) and TabsContent (in body)
          stay in sync even though they are in separate DOM sections.
        */}
        <Tabs defaultValue="general" className="flex flex-col">

          {/* ── White header: breadcrumb + title + tab nav ──────────────── */}
          <div className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => navigate("/app/contacts")}
                    className="inline-flex items-center gap-1 transition-colors hover:text-slate-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Contacts
                  </button>
                  <span>/</span>
                  <span className="text-slate-600">
                    {isEdit ? (refCode ?? "Edit") : "New Contact"}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {isEdit
                    ? contactQuery.data?.name ? `Edit — ${contactQuery.data.name}` : "Edit Contact"
                    : "Add New Contact"}
                </h1>
               
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isEdit && refCode && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono font-semibold text-blue-700">
                    {refCode}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {isEdit ? "Existing record preserved" : "New contact"}
                </span>
                {form.formState.isDirty && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            {/* Tab triggers — only the nav bar lives in the header */}
            <TabsList className="mt-5 h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0">
              {[
                { value: "general",   label: "General",   icon: User },
                { value: "personnel", label: "Personnel", icon: User },
                { value: "addresses", label: "Addresses", icon: MapPin },
                { value: "banks",     label: "Banks",     icon: Landmark },
                { value: "resources", label: "Resources", icon: Building2 },
                { value: "notes",     label: "Notes",     icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-500 shadow-none transition-colors hover:text-slate-800 data-[state=active]:border-[#ff6b00] data-[state=active]:bg-transparent data-[state=active]:text-[#ff6b00] data-[state=active]:shadow-none"
                >
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Grey content area: tab bodies ───────────────────────────── */}
          <div className="flex-1 bg-[#f0f4f9] px-6 py-6 lg:px-8">

            {/* ── GENERAL ─────────────────────────────────────────────── */}
            <TabsContent value="general" className="mt-0 space-y-5">

              <div className="grid gap-5 lg:grid-cols-2">
                {/* Account Info */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Account Info</h3>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Enter company or person name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="display_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl><Input placeholder="e.g. XXX COMPANY – PROFILE" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contact_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code (Contact Identification)</FormLabel>
                      <FormControl><Input placeholder="Unique identifier code" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="accounting_percent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accounting %</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tds_category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>TDS Category</FormLabel>
                        <FormControl><Input placeholder="Category" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="tds_percent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>TDS %</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Classification */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Classification</h3>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="–Contact Types–" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CONTACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contact_category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="e.g. Factories, Retail" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customer_loyalty" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Loyalty <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="–Customer Loyalty–" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {LOYALTY_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="division" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <FormControl><Input placeholder="–" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="zone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <FormControl><Input placeholder="–" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="subzone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subzone</FormLabel>
                        <FormControl><Input placeholder="–" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* Company & Tax */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Company & Tax</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField control={form.control} name="company_name" render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="Legal company name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gstin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl><Input placeholder="15-char GSTIN" className="uppercase" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN</FormLabel>
                      <FormControl><Input placeholder="ABCDE1234F" className="uppercase" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sales & Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Sales & Status</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="sale_person" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Person</FormLabel>
                      <FormControl><Input placeholder="Sales representative" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lead_source" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source</FormLabel>
                      <FormControl><Input placeholder="e.g. Referral, Website" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="market_segment" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Segment</FormLabel>
                      <FormControl><Input placeholder="e.g. Residential" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="mt-4">
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-sm font-medium">Active</FormLabel>
                        <p className="text-xs text-muted-foreground">Contact is accessible for use in orders and documents.</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
            </TabsContent>

            {/* ── PERSONNEL ───────────────────────────────────────────── */}
            <TabsContent value="personnel" className="mt-0">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="contact_person" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name / Department <span className="text-xs text-muted-foreground">(Include titles like Mr., Ms.)</span></FormLabel>
                      <FormControl><Input placeholder="e.g. Mr. Rajesh Kumar" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl><Input placeholder="e.g. Purchase Manager" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone 1 <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="+91 9XXXXXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="work_phone_2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone 2</FormLabel>
                      <FormControl><Input placeholder="+91 9XXXXXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="work_phone_3" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone 3</FormLabel>
                      <FormControl><Input placeholder="+91 9XXXXXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="fax" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax</FormLabel>
                      <FormControl><Input placeholder="Fax number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </TabsContent>

            {/* ── ADDRESSES ───────────────────────────────────────────── */}
            <TabsContent value="addresses" className="mt-0">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <Select defaultValue="billing">
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Shipping/Billing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Click Update after you fill/update address details.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Address Composer
                      <span className="ml-2 font-normal normal-case text-slate-400/70">
                        Commas are automatically added at the end of each block
                      </span>
                    </h4>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailing Address (Door Number, Road) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Door number and road name" maxLength={100} rows={2} {...field} />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground">max 100 characters only</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billing_landmark" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Landmark (Building Name, Suite No., Local)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Landmark or locality" maxLength={100} rows={2} {...field} />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground">max 100 characters only</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="billing_city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder="City" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder="State" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem> 
                      )} />
                    </div>
                    <FormField control={form.control} name="billing_postal_code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="6-digit PIN" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billing_country" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl><Input placeholder="India" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {/* <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      NOTE: To confirm the address, refer the GST Portal at{" "}
                      <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noreferrer" className="font-semibold underline">
                        services.gst.gov.in
                      </a>
                    </div> */}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── BANKS ───────────────────────────────────────────────── */}
            <TabsContent value="banks" className="mt-0">
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                <div className="text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Bank Details</p>
                  <p className="text-xs text-slate-400">Bank account information will be added here.</p>
                </div>
              </div>
            </TabsContent>

            {/* ── RESOURCES ───────────────────────────────────────────── */}
            <TabsContent value="resources" className="mt-0">
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                <div className="text-center">
                  <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Resources</p>
                  <p className="text-xs text-slate-400">Document uploads and linked resources will appear here.</p>
                </div>
              </div>
            </TabsContent>

            {/* ── NOTES ───────────────────────────────────────────────── */}
            <TabsContent value="notes" className="mt-0">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes about this contact…" rows={8} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </TabsContent>

          </div>

          {/* ── White footer: save / cancel ──────────────────────────────── */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {isEdit
                  ? "Ensure all required details are filled then click Save."
                  : "The contact will be assigned a unique Ref ID on creation."}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button" variant="outline"
                  className="h-10 rounded-full px-6"
                  onClick={() => navigate("/app/contacts")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit" disabled={isSaving}
                  className="h-10 rounded-full bg-[linear-gradient(135deg,#ff8f1f_0%,#ff6b00_100%)] px-6 text-white shadow-[0_8px_20px_-12px_rgba(255,107,0,0.9)] hover:opacity-95"
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Saving…" : "Creating…"}</>
                  ) : (
                    isEdit ? "Save Changes" : "Create Contact"
                  )}
                </Button>
              </div>
            </div>
          </div>

        </Tabs>
      </form>
    </Form>
  );
};

export default ContactFormPage;
