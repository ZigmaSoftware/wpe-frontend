import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { formatDateTime, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { Contact } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(10, "Phone is required."),
  email: z.string().email("Enter a valid email.").or(z.literal("")).nullable(),
  category: z.string().min(1, "Category is required."),
  company_name: z.string().optional(),
  gstin: z.string().optional(),
  state: z.string().min(1, "State is required."),
  address: z.string().min(1, "Address is required."),
  lead_source: z.string().optional(),
  market_segment: z.string().optional(),
  is_active: z.boolean(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const defaultValues: ContactFormValues = {
  name: "",
  phone: "",
  email: "",
  category: "",
  company_name: "",
  gstin: "",
  state: "",
  address: "",
  lead_source: "",
  market_segment: "",
  is_active: true,
};

const contactCategories = [
  "Lead",
  "Prospect",
  "Customer",
  "Supplier",
  "Dealer",
  "Distributor",
  "Shipper",
  "Service Provider",
];

const ContactsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", search, category],
    queryFn: async () => {
      const response = await coreApi.get<Contact[] | { data: Contact[] }>("/api/contacts/contacts/", {
        params: {
          search: search || undefined,
          category: category === "all" ? undefined : category,
        },
      });
      return normalizeListResponse(response.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const response = await coreApi.post<Contact>("/api/contacts/contacts/", {
        ...values,
        email: values.email || null,
        company_name: values.company_name || null,
        gstin: values.gstin || null,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Contact created.");
      setDialogOpen(false);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create contact."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      if (!editingContact) {
        throw new Error("No contact selected for update.");
      }

      const response = await coreApi.put<Contact>(`/api/contacts/contacts/${editingContact.id}/`, {
        ...values,
        email: values.email || null,
        company_name: values.company_name || null,
        gstin: values.gstin || null,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Contact updated.");
      setDialogOpen(false);
      setEditingContact(null);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update contact."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: number) => {
      await coreApi.delete(`/api/contacts/contacts/${contactId}/`);
    },
    onSuccess: () => {
      toast.success("Contact deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to delete contact."));
    },
  });

  const openCreateDialog = () => {
    setEditingContact(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      phone: contact.phone,
      email: contact.email ?? "",
      category: contact.category,
      company_name: contact.company_name ?? "",
      gstin: contact.gstin ?? "",
      state: contact.state,
      address: contact.address,
      lead_source: contact.lead_source ?? "",
      market_segment: contact.market_segment ?? "",
      is_active: contact.is_active,
    });
    setDialogOpen(true);
  };

  const stats = useMemo(() => {
    const contacts = contactsQuery.data ?? [];
    return {
      total: contacts.length,
      active: contacts.filter((contact) => contact.is_active).length,
      customers: contacts.filter((contact) => contact.category === "Customer").length,
      suppliers: contacts.filter((contact) => contact.category === "Supplier").length,
    };
  }, [contactsQuery.data]);

  const onSubmit = (values: ContactFormValues) => {
    if (editingContact) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="CRUD for the exact `/api/contacts/contacts/` backend endpoints."
        actions={<Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Suppliers" value={stats.suppliers} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, or email" className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-60">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {contactCategories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {contactsQuery.isLoading ? <LoadingState label="Loading contacts..." /> : null}
      {contactsQuery.isError ? <ErrorState description="Contacts could not be loaded from the backend." /> : null}

      {!contactsQuery.isLoading && !contactsQuery.isError ? (
        contactsQuery.data?.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactsQuery.data.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-mono text-xs">{contact.ref_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.email || "No email"}</div>
                    </TableCell>
                    <TableCell>{contact.category}</TableCell>
                    <TableCell>{contact.company_name || "-"}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.state}</TableCell>
                    <TableCell>{formatDateTime(contact.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(contact)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setDeleteTarget(contact)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No contacts found" description="Create the first contact or widen the active filters." />
        )
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit contact" : "Create contact"}</DialogTitle>
            <DialogDescription>Use the backend field names exactly as defined in the API contract.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactCategories.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gstin" render={({ field }) => (
                <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lead_source" render={({ field }) => (
                <FormItem><FormLabel>Lead Source</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="market_segment" render={({ field }) => (
                <FormItem><FormLabel>Market Segment</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">Toggle the `is_active` backend field.</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingContact ? "Save Changes" : "Create Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete contact"
        description={`Delete ${deleteTarget?.name ?? "this contact"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </div>
  );
};

export default ContactsPage;
