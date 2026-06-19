import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { type DefaultValues, type FieldValues, type Path, type UseFormReturn, useForm } from "react-hook-form";
import { type ZodType } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { CodeMasterRecord, CodeMasterWritePayload, TableParams } from "@/features/wpe-masters/types";

type CodeMasterApi<TRecord extends CodeMasterRecord, TPayload extends CodeMasterWritePayload> = {
  list: (params: TableParams) => Promise<{ items: TRecord[]; total: number }>;
  nextCode: () => Promise<string>;
  create: (payload: TPayload) => Promise<TRecord>;
  update: (id: number, payload: Partial<TPayload>) => Promise<TRecord>;
  delete: (id: number) => Promise<void>;
  toggle: (id: number) => Promise<TRecord>;
};

type ExtraColumn<TRecord> = {
  key: string;
  title: string;
  className?: string;
  render: (record: TRecord) => ReactNode;
};

type RenderExtrasArgs<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  editing: boolean;
};

export type TableColumnConfig = {
  key: string;
  title: string;
  field: string;
};

interface CodeMasterPageProps<
  TRecord extends CodeMasterRecord,
  TFormValues extends FieldValues,
  TPayload extends CodeMasterWritePayload,
> {
  title: string;
  description: string;
  queryKey: string;
  api: CodeMasterApi<TRecord, TPayload>;
  schema: ZodType<TFormValues>;
  defaultValues: DefaultValues<TFormValues>;
  mapRecordToForm: (record: TRecord) => TFormValues;
  mapFormToPayload: (values: TFormValues) => TPayload;
  extraColumns?: ExtraColumn<TRecord>[];
  renderExtras?: (args: RenderExtrasArgs<TFormValues>) => ReactNode;
  renderNameSecondary?: (record: TRecord) => ReactNode;
  columnConfig?: TableColumnConfig[];
  codeFieldName?: Path<TFormValues>;
  nameFieldName?: Path<TFormValues>;
  descriptionFieldName?: Path<TFormValues>;
  activeFieldName?: Path<TFormValues>;
  codeLabel?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  showDescription?: boolean;
  dialogDescription?: string;
  createLabel?: string;
  createTitle?: string;
  editTitle?: string;
  createButtonLabel?: string;
  saveButtonLabel?: string;
  allowDelete?: boolean;
}

const CodeMasterPage = <
  TRecord extends CodeMasterRecord,
  TFormValues extends FieldValues,
  TPayload extends CodeMasterWritePayload,
>({
  title,
  description,
  queryKey,
  api,
  schema,
  defaultValues,
  mapRecordToForm,
  mapFormToPayload,
  extraColumns = [],
  renderExtras,
  renderNameSecondary,
  columnConfig,
  codeFieldName = "code" as Path<TFormValues>,
  nameFieldName = "name" as Path<TFormValues>,
  descriptionFieldName = "description" as Path<TFormValues>,
  activeFieldName = "is_active" as Path<TFormValues>,
  codeLabel = "Code*",
  nameLabel = "Name*",
  namePlaceholder,
  descriptionLabel = "Details",
  descriptionPlaceholder = "Add supporting details for downstream users.",
  showDescription = true,
  dialogDescription,
  createLabel,
  createTitle,
  editTitle,
  createButtonLabel,
  saveButtonLabel,
  allowDelete = true,
}: CodeMasterPageProps<TRecord, TFormValues, TPayload>) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TRecord | null>(null);
  const [codePreview, setCodePreview] = useState("");
  const [loadingCodePreview, setLoadingCodePreview] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<TRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TRecord | null>(null);

  const form = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const query = useQuery({
    queryKey: ["wpe-masters", queryKey, page, pageSize, search],
    queryFn: () => api.list({ page, pageSize, search }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wpe-masters", queryKey] });
  };

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: async () => {
      toast.success(`${title} created.`);
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, `Failed to create ${title}.`)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TPayload> }) => api.update(id, payload),
    onSuccess: async () => {
      toast.success(`${title} updated.`);
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, `Failed to update ${title}.`)),
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggle,
    onSuccess: async () => {
      toast.success("Status updated.");
      await invalidate();
    },
    onError: async (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update status."));
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        await invalidate();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.delete,
    onSuccess: async () => {
      toast.success(`${title} deleted.`);
      await invalidate();
    },
    onError: async (error) => {
      toast.error(getApiErrorMessage(error, `Failed to delete ${title}.`));
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        await invalidate();
      }
    },
  });

  const openCreate = async () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
    setLoadingCodePreview(true);
    try {
      setCodePreview(await api.nextCode());
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to generate the next ${title} code.`));
      setCodePreview("");
    } finally {
      setLoadingCodePreview(false);
    }
  };

  const openEdit = (record: TRecord) => {
    setEditing(record);
    setCodePreview(record.code ?? "");
    form.reset(mapRecordToForm(record));
    setDialogOpen(true);
  };

  const records = query.data?.items ?? [];
  const submitDisabled = createMutation.isPending || updateMutation.isPending;

  const actionsColumn = {
    key: "actions",
    title: "Actions",
    className: "w-[140px] text-right",
    render: (record: TRecord) => (
      <RowActions
        onEdit={() => openEdit(record)}
        onToggle={() => setToggleTarget(record)}
        onDelete={allowDelete ? () => setDeleteTarget(record) : undefined}
        isActive={record.is_active}
      />
    ),
  };

  const resolvedColumns =
    columnConfig && columnConfig.length > 0
      ? [
          ...columnConfig.map((col) => ({
            key: col.key,
            title: col.title,
            render: (record: TRecord) => {
              const value = (record as Record<string, unknown>)[col.field];
              if (col.field === "is_active") return <MasterStatusBadge active={Boolean(value)} />;
              if (col.field === "code")
                return <span className="font-mono text-xs text-muted-foreground">{String(value ?? "-")}</span>;
              if (col.field === "name")
                return (
                  <div className="space-y-1">
                    <div className="font-medium">{String(value ?? "-")}</div>
                    {renderNameSecondary ? (
                      <div className="text-xs text-muted-foreground">{renderNameSecondary(record)}</div>
                    ) : null}
                  </div>
                );
              return <span>{String(value ?? "-")}</span>;
            },
          })),
          actionsColumn,
        ]
      : [
          {
            key: "code",
            title: codeLabel.replace("*", ""),
            render: (record: TRecord) => (
              <span className="font-mono text-xs text-muted-foreground">{record.code || "-"}</span>
            ),
          },
          {
            key: "name",
            title: nameLabel.replace("*", ""),
            render: (record: TRecord) => (
              <div className="space-y-1">
                <div className="font-medium">{record.name}</div>
                {renderNameSecondary ? (
                  <div className="text-xs text-muted-foreground">{renderNameSecondary(record)}</div>
                ) : null}
              </div>
            ),
          },
          ...extraColumns,
          {
            key: "status",
            title: "Status",
            render: (record: TRecord) => <MasterStatusBadge active={record.is_active} />,
          },
          actionsColumn,
        ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel={createLabel ?? `Add ${title}`}
        onCreate={openCreate}
      />
      <MasterTable
        columns={resolvedColumns}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription={`${title} records could not be loaded.`}
        emptyTitle={`No ${title} records`}
        emptyDescription={`Add a new ${title.toLowerCase()} record to get started.`}
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? editTitle ?? `Edit ${title}` : createTitle ?? `Create ${title}`}
        description={dialogDescription ?? `Create and maintain ${title.toLowerCase()} records.`}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = mapFormToPayload(values);
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              form.reset(defaultValues);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name={codeFieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{codeLabel}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={editing?.code ?? codePreview}
                      placeholder={loadingCodePreview ? "Generating..." : undefined}
                      readOnly
                      className="bg-muted/40 font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={nameFieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{nameLabel}</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} placeholder={namePlaceholder} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderExtras ? renderExtras({ form, editing: Boolean(editing) }) : null}

            {showDescription ? (
              <FormField
                control={form.control}
                name={descriptionFieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{descriptionLabel}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={String(field.value ?? "")} rows={3} placeholder={descriptionPlaceholder} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name={activeFieldName}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                  <FormLabel>Active Status*</FormLabel>
                  <FormControl>
                    <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={submitDisabled}>
                {editing ? saveButtonLabel ?? "Save Changes" : createButtonLabel ?? `Create ${title}`}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Toggle status"
        description={`Change the active status for "${toggleTarget?.name}"?`}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
          }
          setToggleTarget(null);
        }}
      />
      {allowDelete ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={`Delete ${title}`}
          description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default CodeMasterPage;
