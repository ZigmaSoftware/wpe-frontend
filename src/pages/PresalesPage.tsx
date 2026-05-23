import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { PresalesAuditLog, PresalesRequest, PresalesRequestItem } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type ItemOption = { id: number; item_code: string; item_name: string; unit: string };
type DashboardData = { total: number; draft: number; submitted: number; approved: number; rejected: number; sent_to_production: number };

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SENT_TO_PRODUCTION: "bg-purple-100 text-purple-700",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-700"}`}>
    {status.replace(/_/g, " ")}
  </span>
);

// ── Item picker (inline autocomplete) ─────────────────────────────────────────

const ItemPicker = ({ onSelect }: { onSelect: (item: ItemOption) => void }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchQuery = useQuery({
    queryKey: ["item-search", query],
    queryFn: async () => {
      if (query.trim().length < 2) return [];
      const res = await coreApi.get<unknown>(`/api/items/items/?search=${encodeURIComponent(query)}&page_size=20`);
      return normalizeListResponse<ItemOption>(res.data);
    },
    enabled: query.trim().length >= 2,
  });

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search item code or name..."
          className="pl-9"
        />
      </div>
      {open && (searchQuery.data?.length ?? 0) > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
          {searchQuery.data!.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent text-sm"
              onMouseDown={() => { onSelect(item); setQuery(""); setOpen(false); }}
            >
              <span className="font-medium">{item.item_name}</span>
              <span className="text-xs text-muted-foreground">{item.item_code} · {item.unit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Form schema ────────────────────────────────────────────────────────────────

const itemLineSchema = z.object({
  item: z.number({ required_error: "Item required" }),
  item_code: z.string(),
  item_name: z.string(),
  unit: z.string(),
  quantity: z.string().min(1, "Quantity required"),
  remarks: z.string().default(""),
});

const requestSchema = z.object({
  request_date: z.string().min(1, "Date required"),
  category: z.enum(["STORE", "PURCHASE"]),
  request_person: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  required_reason: z.string().min(1, "Required"),
  customer_type: z.string().default("ADDITIVE_MO"),
  customer_name: z.string().default(""),
  remarks: z.string().default(""),
  items: z.array(itemLineSchema).min(1, "Add at least one item"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const defaultFormValues: RequestFormValues = {
  request_date: new Date().toISOString().slice(0, 10),
  category: "STORE",
  request_person: "",
  department: "",
  required_reason: "",
  customer_type: "ADDITIVE_MO",
  customer_name: "",
  remarks: "",
  items: [],
};

// ── Main page ──────────────────────────────────────────────────────────────────

const PresalesPage = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PresalesRequest | null>(null);

  const [detailRequest, setDetailRequest] = useState<PresalesRequest | null>(null);
  const [auditTarget, setAuditTarget] = useState<PresalesRequest | null>(null);

  const [submitTarget, setSubmitTarget] = useState<PresalesRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<PresalesRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PresalesRequest | null>(null);
  const [sendTarget, setSendTarget] = useState<PresalesRequest | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const listQuery = useQuery({
    queryKey: ["presales-requests"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/presales/requests/");
      return normalizeListResponse<PresalesRequest>(res.data);
    },
  });

  const dashboardQuery = useQuery({
    queryKey: ["presales-dashboard"],
    queryFn: async () => {
      const res = await coreApi.get<{ data: DashboardData } | DashboardData>("/api/presales/dashboard/");
      const payload = res.data as { data?: DashboardData } & DashboardData;
      return (payload.data ?? payload) as DashboardData;
    },
  });

  const auditQuery = useQuery({
    queryKey: ["presales-audit", auditTarget?.id],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(`/api/presales/requests/${auditTarget!.id}/audit-log/`);
      return normalizeListResponse<PresalesAuditLog>(res.data);
    },
    enabled: !!auditTarget,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (values: RequestFormValues) =>
      coreApi.post("/api/presales/requests/", values),
    onSuccess: () => {
      toast.success("Request created.");
      closeForm();
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
      queryClient.invalidateQueries({ queryKey: ["presales-dashboard"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to create request.")),
  });

  const updateMutation = useMutation({
    mutationFn: (values: RequestFormValues) =>
      coreApi.patch(`/api/presales/requests/${editingRequest!.id}/`, values),
    onSuccess: () => {
      toast.success("Request updated.");
      closeForm();
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to update request.")),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => coreApi.post(`/api/presales/requests/${id}/submit/`),
    onSuccess: () => {
      toast.success("Request submitted for approval.");
      setSubmitTarget(null);
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
      queryClient.invalidateQueries({ queryKey: ["presales-dashboard"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to submit request.")),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) =>
      coreApi.post(`/api/presales/requests/${id}/approve/`, { remarks }),
    onSuccess: () => {
      toast.success("Request approved.");
      setApproveTarget(null);
      setApprovalRemarks("");
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
      queryClient.invalidateQueries({ queryKey: ["presales-dashboard"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to approve request.")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) =>
      coreApi.post(`/api/presales/requests/${id}/reject/`, { remarks }),
    onSuccess: () => {
      toast.success("Request rejected.");
      setRejectTarget(null);
      setRejectRemarks("");
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
      queryClient.invalidateQueries({ queryKey: ["presales-dashboard"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to reject request.")),
  });

  const sendToProductionMutation = useMutation({
    mutationFn: (id: number) => coreApi.post(`/api/presales/requests/${id}/send-to-production/`),
    onSuccess: () => {
      toast.success("Request sent to production.");
      setSendTarget(null);
      queryClient.invalidateQueries({ queryKey: ["presales-requests"] });
      queryClient.invalidateQueries({ queryKey: ["presales-dashboard"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to send to production.")),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const closeForm = () => {
    setFormOpen(false);
    setEditingRequest(null);
    form.reset(defaultFormValues);
  };

  const openCreate = () => {
    setEditingRequest(null);
    form.reset(defaultFormValues);
    setFormOpen(true);
  };

  const openEdit = (req: PresalesRequest) => {
    setEditingRequest(req);
    form.reset({
      request_date: req.request_date ?? new Date().toISOString().slice(0, 10),
      category: req.category,
      request_person: req.request_person,
      department: req.department,
      required_reason: req.required_reason,
      customer_type: req.customer_type,
      customer_name: req.customer_name,
      remarks: req.remarks,
      items: (req.items ?? []).map((it: PresalesRequestItem) => ({
        item: it.item,
        item_code: it.item_code,
        item_name: it.item_name,
        unit: it.unit,
        quantity: it.quantity,
        remarks: it.remarks ?? "",
      })),
    });
    setFormOpen(true);
  };

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (listQuery.data ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!needle) return true;
      return [r.request_no, r.request_person, r.department, r.customer_name]
        .join(" ").toLowerCase().includes(needle);
    });
  }, [listQuery.data, search, statusFilter]);

  const dash = dashboardQuery.data;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presales Requests"
        description="Manage material requests from presales to production."
        actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Request</Button>}
      />

      {/* Dashboard cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={dash?.total ?? listQuery.data?.length ?? 0} />
        <StatCard label="Draft" value={dash?.draft ?? 0} />
        <StatCard label="Submitted" value={dash?.submitted ?? 0} />
        <StatCard label="Approved" value={dash?.approved ?? 0} />
        <StatCard label="Sent to Prod" value={dash?.sent_to_production ?? 0} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search request no, person, department..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SENT_TO_PRODUCTION">Sent to Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {listQuery.isLoading && <LoadingState label="Loading requests..." />}
      {listQuery.isError && <ErrorState description="Could not load presales requests." />}

      {!listQuery.isLoading && !listQuery.isError && (
        filtered.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Request No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req, i) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{req.request_no}</TableCell>
                    <TableCell>{formatDate(req.request_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.category}</Badge>
                    </TableCell>
                    <TableCell>{req.request_person}</TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell><StatusBadge status={req.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setDetailRequest(req)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => setAuditTarget(req)}>Log</Button>
                        {(req.status === "DRAFT" || req.status === "REJECTED") && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(req)}>Edit</Button>
                        )}
                        {req.status === "DRAFT" && (
                          <Button size="sm" onClick={() => setSubmitTarget(req)}>Submit</Button>
                        )}
                        {req.status === "SUBMITTED" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproveTarget(req)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejectTarget(req)}>Reject</Button>
                          </>
                        )}
                        {req.status === "APPROVED" && (
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setSendTarget(req)}>Send to Prod</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No requests found" description="Create a new presales request to get started." />
        )
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingRequest ? "Edit Request" : "New Presales Request"}</DialogTitle>
            <DialogDescription>Fill in the request details and add items below.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                editingRequest ? updateMutation.mutate(values) : createMutation.mutate(values)
              )}
              className="max-h-[75vh] overflow-y-auto pr-1 space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="request_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STORE">Store</SelectItem>
                        <SelectItem value="PURCHASE">Purchase</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="request_person" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Person</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customer_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customer_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="required_reason" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Required Reason</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="remarks" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Remarks</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Items section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Items</h4>
                </div>
                <ItemPicker
                  onSelect={(item) =>
                    append({ item: item.id, item_code: item.item_code, item_name: item.item_name, unit: item.unit, quantity: "", remarks: "" })
                  }
                />
                {form.formState.errors.items?.root && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.items.root.message}</p>
                )}
                {form.formState.errors.items && typeof form.formState.errors.items === "object" && "message" in form.formState.errors.items && (
                  <p className="text-sm text-destructive mt-1">{String(form.formState.errors.items.message)}</p>
                )}
                {fields.length > 0 && (
                  <div className="mt-3 rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="w-28">Qty</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell className="text-sm">{field.item_name}</TableCell>
                            <TableCell className="font-mono text-xs">{field.item_code}</TableCell>
                            <TableCell className="text-sm">{field.unit}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                {...form.register(`items.${index}.quantity`)}
                                className="h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                {...form.register(`items.${index}.remarks`)}
                                className="h-8 text-sm"
                                placeholder="optional"
                              />
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingRequest ? "Save Changes" : "Create Request"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Detail dialog ── */}
      <Dialog open={!!detailRequest} onOpenChange={(open) => { if (!open) setDetailRequest(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request — {detailRequest?.request_no}</DialogTitle>
            <DialogDescription>
              {detailRequest && <StatusBadge status={detailRequest.status} />}
            </DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                {[
                  ["Date", formatDate(detailRequest.request_date)],
                  ["Category", detailRequest.category],
                  ["Person", detailRequest.request_person],
                  ["Department", detailRequest.department],
                  ["Customer Type", detailRequest.customer_type],
                  ["Customer Name", detailRequest.customer_name || "—"],
                  ["Reason", detailRequest.required_reason],
                  ["Remarks", detailRequest.remarks || "—"],
                  ["Submitted By", detailRequest.submitted_by_username ?? "—"],
                  ["Submitted At", formatDateTime(detailRequest.submitted_at)],
                  ["Approved By", detailRequest.approved_by_username ?? "—"],
                  ["Approved At", formatDateTime(detailRequest.approved_at)],
                  ["Approval Remarks", detailRequest.approval_remarks || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Items ({detailRequest.items?.length ?? 0})</h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detailRequest.items ?? []).map((it) => (
                        <TableRow key={it.id}>
                          <TableCell>{it.item_name}</TableCell>
                          <TableCell className="font-mono text-xs">{it.item_code}</TableCell>
                          <TableCell>{it.unit}</TableCell>
                          <TableCell>{it.quantity}</TableCell>
                          <TableCell>{it.remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Audit log dialog ── */}
      <Dialog open={!!auditTarget} onOpenChange={(open) => { if (!open) setAuditTarget(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log — {auditTarget?.request_no}</DialogTitle>
            <DialogDescription>Full activity history for this request.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {auditQuery.isLoading && <LoadingState label="Loading audit log..." />}
            {auditQuery.isError && <ErrorState description="Could not load audit log." />}
            {!auditQuery.isLoading && !auditQuery.isError && (
              (auditQuery.data?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {auditQuery.data!.map((entry) => (
                    <div key={entry.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{entry.action}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">By: {entry.performed_by_username ?? "System"}</p>
                      {entry.notes && <p className="mt-1">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity yet" description="Actions on this request will appear here." />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Submit confirm ── */}
      <ConfirmDialog
        open={!!submitTarget}
        onOpenChange={(open) => { if (!open) setSubmitTarget(null); }}
        title="Submit for Approval"
        description={`Submit request ${submitTarget?.request_no} for approval? This cannot be undone.`}
        confirmLabel="Submit"
        onConfirm={() => submitTarget && submitMutation.mutate(submitTarget.id)}
      />

      {/* ── Approve dialog ── */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => { if (!open) { setApproveTarget(null); setApprovalRemarks(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>{approveTarget?.request_no}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Approval Remarks (optional)</label>
            <Textarea value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setApproveTarget(null); setApprovalRemarks(""); }}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={approveMutation.isPending}
              onClick={() => approveTarget && approveMutation.mutate({ id: approveTarget.id, remarks: approvalRemarks })}
            >
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ── */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectRemarks(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>{rejectTarget?.request_no}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Rejection Remarks <span className="text-destructive">*</span></label>
            <Textarea value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectRemarks(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending || !rejectRemarks.trim()}
              onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, remarks: rejectRemarks })}
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Send to production confirm ── */}
      <ConfirmDialog
        open={!!sendTarget}
        onOpenChange={(open) => { if (!open) setSendTarget(null); }}
        title="Send to Production"
        description={`Send request ${sendTarget?.request_no} to the production team?`}
        confirmLabel="Send to Production"
        onConfirm={() => sendTarget && sendToProductionMutation.mutate(sendTarget.id)}
      />
    </div>
  );
};

export default PresalesPage;
