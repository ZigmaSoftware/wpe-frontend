import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coreApi } from "@/lib/api";
import { formatDateTime, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { Contact } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const CONTACT_TYPES = [
  "Lead", "Prospect", "Customer", "Supplier", "Dealer",
  "Distributor", "Shipper", "Service Provider",
];

const CATEGORY_COLOR: Record<string, string> = {
  Customer:           "bg-blue-50 text-blue-700 border-blue-200",
  Supplier:           "bg-violet-50 text-violet-700 border-violet-200",
  Lead:               "bg-amber-50 text-amber-700 border-amber-200",
  Prospect:           "bg-orange-50 text-orange-700 border-orange-200",
  Dealer:             "bg-emerald-50 text-emerald-700 border-emerald-200",
  Distributor:        "bg-teal-50 text-teal-700 border-teal-200",
  Shipper:            "bg-sky-50 text-sky-700 border-sky-200",
  "Service Provider": "bg-rose-50 text-rose-700 border-rose-200",
};

const ContactsPage = () => {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", search, category],
    queryFn: async () => {
      const res = await coreApi.get<Contact[] | { data: Contact[] }>("/api/contacts/contacts/", {
        params: {
          search:   search   || undefined,
          category: category === "all" ? undefined : category,
        },
      });
      return normalizeListResponse<Contact>(res.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => coreApi.delete(`/api/contacts/contacts/${id}/`),
    onSuccess: () => {
      toast.success("Contact deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Unable to delete contact.")),
  });

  const stats = useMemo(() => {
    const list = contactsQuery.data ?? [];
    return {
      total:     list.length,
      active:    list.filter((c) => c.is_active).length,
      customers: list.filter((c) => c.category === "Customer").length,
      suppliers: list.filter((c) => c.category === "Supplier").length,
    };
  }, [contactsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage customers, suppliers, leads, and all external contacts."
        actions={
          <Button onClick={() => navigate("/app/contacts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total"     value={stats.total} />
        <StatCard label="Active"    value={stats.active} />
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Suppliers" value={stats.suppliers} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All contact types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contact types</SelectItem>
            {CONTACT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {contactsQuery.isLoading && <LoadingState label="Loading contacts…" />}
      {contactsQuery.isError   && <ErrorState description="Contacts could not be loaded." />}

      {!contactsQuery.isLoading && !contactsQuery.isError && (
        contactsQuery.data?.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">S.No</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City / State</TableHead>
                  <TableHead>GST / PAN</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactsQuery.data.map((c, i) => (
                  <TableRow key={c.id} className="hover:bg-blue-50/40">
                    <TableCell className="text-center text-sm text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.ref_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_COLOR[c.category] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {c.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{c.company_name || "—"}</TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell className="text-sm">
                      <div>{c.billing_city || "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.state}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{c.gstin || "—"}</div>
                      <div className="text-muted-foreground">{c.pan || "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => navigate(`/app/contacts/${c.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No contacts found"
            description="Add the first contact or widen your filters."
          />
        )
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete contact"
        description={`Delete ${deleteTarget?.name ?? "this contact"}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
      />
    </div>
  );
};

export default ContactsPage;
