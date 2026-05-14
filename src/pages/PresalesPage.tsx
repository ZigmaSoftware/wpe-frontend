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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { formatDate, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { Presale } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const fieldNames = [
  "order_code",
  "stage",
  "sale_type",
  "sale_category",
  "project_name",
  "version_no",
  "description",
  "lead_source",
  "sale_contact",
  "gp_percent",
  "gp_value",
  "line_of_business",
  "sub_segment",
  "segment_keyword",
  "required_date",
  "request_person_id",
  "request_department",
  "required_time_start",
  "required_time_end",
  "required_reason",
  "internal_ref_id",
  "invoice_ref_id",
  "tolerance",
  "profile_type",
  "capex",
  "tl_code",
  "delivery_challan_type",
  "indent_number",
  "indent_date",
  "indent_receiving_datetime",
  "movement_description",
  "customer_po",
  "customer_po_date",
  "destination",
  "document_contact",
  "previous_document_contact",
  "base_order_id",
  "base_customer_id",
  "base_customer_name",
  "base_order_date",
  "activity_id",
] as const;

type PresaleFormValues = Record<(typeof fieldNames)[number], string>;

const presaleSchema = z.object(
  Object.fromEntries(
    fieldNames.map((name) => [name, z.string().default("")]),
  ) as Record<(typeof fieldNames)[number], z.ZodDefault<z.ZodString>>,
);

const numericFields = new Set([
  "request_person_id",
  "internal_ref_id",
  "invoice_ref_id",
  "base_order_id",
  "base_customer_id",
  "activity_id",
]);

const textAreaFields = new Set(["description", "movement_description", "document_contact", "previous_document_contact"]);
const dateFields = new Set(["required_date", "customer_po_date"]);
const dateTimeFields = new Set(["indent_date", "indent_receiving_datetime", "base_order_date"]);
const timeFields = new Set(["required_time_start", "required_time_end"]);

const defaultValues = fieldNames.reduce((accumulator, fieldName) => {
  accumulator[fieldName] = "";
  return accumulator;
}, {} as PresaleFormValues);

const buildPayload = (values: PresaleFormValues) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (numericFields.has(key) && value !== "") {
        return [key, Number(value)];
      }

      return [key, value === "" ? null : value];
    }),
  );

const PresalesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresale, setEditingPresale] = useState<Presale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Presale | null>(null);

  const form = useForm<PresaleFormValues>({
    resolver: zodResolver(presaleSchema),
    defaultValues,
  });

  const presalesQuery = useQuery({
    queryKey: ["presales"],
    queryFn: async () => {
      const response = await coreApi.get<Presale[] | { data: Presale[] }>("/api/presales/presales/");
      return normalizeListResponse(response.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: PresaleFormValues) => {
      const response = await coreApi.post<Presale>("/api/presales/presales/", buildPayload(values));
      return response.data;
    },
    onSuccess: () => {
      toast.success("Presales record created.");
      setDialogOpen(false);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["presales"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to create presales record.")),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: PresaleFormValues) => {
      if (!editingPresale) {
        throw new Error("No presales record selected for update.");
      }
      const response = await coreApi.put<Presale>(`/api/presales/presales/${editingPresale.id}/`, buildPayload(values));
      return response.data;
    },
    onSuccess: () => {
      toast.success("Presales record updated.");
      setDialogOpen(false);
      setEditingPresale(null);
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["presales"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update presales record.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await coreApi.delete(`/api/presales/presales/${id}/`);
    },
    onSuccess: () => {
      toast.success("Presales record deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["presales"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to delete presales record.")),
  });

  const filteredPresales = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const records = presalesQuery.data ?? [];
    if (!needle) {
      return records;
    }

    return records.filter((record) =>
      [record.order_code, record.project_name, record.sale_contact, record.stage]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [presalesQuery.data, search]);

  const openCreateDialog = () => {
    setEditingPresale(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (record: Presale) => {
    setEditingPresale(record);
    form.reset(
      fieldNames.reduce((accumulator, fieldName) => {
        const value = record[fieldName];
        accumulator[fieldName] = value === null || value === undefined ? "" : String(value);
        return accumulator;
      }, {} as PresaleFormValues),
    );
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presales"
        description="Full CRUD against `/api/presales/presales/` using the backend field names exactly."
        actions={<Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Create Presales Record</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Records" value={presalesQuery.data?.length ?? 0} />
        <StatCard label="Projects" value={new Set((presalesQuery.data ?? []).map((item) => item.project_name)).size} />
        <StatCard label="Stages" value={new Set((presalesQuery.data ?? []).map((item) => item.stage)).size} />
        <StatCard label="Results" value={filteredPresales.length} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order code, project, contact, or stage" className="pl-9" />
        </div>
      </div>

      {presalesQuery.isLoading ? <LoadingState label="Loading presales..." /> : null}
      {presalesQuery.isError ? <ErrorState description="Presales records could not be loaded from the backend." /> : null}

      {!presalesQuery.isLoading && !presalesQuery.isError ? (
        filteredPresales.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">S.No</TableHead>
                  <TableHead>Order Code</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Sale Contact</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPresales.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{record.order_code}</TableCell>
                    <TableCell>{record.project_name}</TableCell>
                    <TableCell>{record.stage}</TableCell>
                    <TableCell>{record.sale_contact}</TableCell>
                    <TableCell>{formatDate(record.required_date)}</TableCell>
                    <TableCell>{formatDate(record.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setDeleteTarget(record)}>
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
          <EmptyState title="No presales records found" description="Create a record to begin managing presales flow." />
        )
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{editingPresale ? "Edit presales record" : "Create presales record"}</DialogTitle>
            <DialogDescription>The form includes the exact model fields exposed by the backend.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => editingPresale ? updateMutation.mutate(values) : createMutation.mutate(values))} className="max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fieldNames.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem className={textAreaFields.has(fieldName) ? "xl:col-span-3 md:col-span-2" : undefined}>
                        <FormLabel>{fieldName.replaceAll("_", " ")}</FormLabel>
                        <FormControl>
                          {textAreaFields.has(fieldName) ? (
                            <Textarea {...field} rows={3} />
                          ) : (
                            <Input
                              {...field}
                              type={
                                dateFields.has(fieldName)
                                  ? "date"
                                  : dateTimeFields.has(fieldName)
                                    ? "datetime-local"
                                    : timeFields.has(fieldName)
                                      ? "time"
                                      : numericFields.has(fieldName)
                                        ? "number"
                                        : "text"
                              }
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPresale ? "Save Changes" : "Create Record"}
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
        title="Delete presales record"
        description={`Delete ${deleteTarget?.order_code ?? "this record"}?`}
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

export default PresalesPage;
