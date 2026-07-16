import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import {
  useCreateProfileConfig,
  useDeleteProfileConfig,
  useProfileConfigs,
  useUpdateProfileConfig,
} from "@/features/production/extrusion/hooks/useExtrusion";
import { profileConfigSchema, type ProfileConfigFormValues } from "@/features/production/extrusion/schemas";
import type { ExtrusionProfileConfigRecord } from "@/features/production/extrusion/types";
import type { LookupItem } from "@/features/wpe-masters/types";

const defaultValues: ProfileConfigFormValues = {
  profile: 0,
  section_weight_per_meter: 0,
  standard_length_per_piece: 0,
  default_pieces_per_packet: 1,
  default_tare_weight: 0,
  tolerance_type: "FIXED",
  tolerance_value: 0,
  is_active: true,
};

const ExtrusionProfileConfigPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExtrusionProfileConfigRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtrusionProfileConfigRecord | null>(null);

  const profilesQuery = useQuery({
    queryKey: ["extrusion-profile-lookup"],
    queryFn: () => productionMastersApi.profileCreations.lookup() as Promise<LookupItem[]>,
  });
  const profiles = profilesQuery.data ?? [];

  const query = useProfileConfigs({ page, pageSize, search });
  const createMutation = useCreateProfileConfig();
  const updateMutation = useUpdateProfileConfig();
  const deleteMutation = useDeleteProfileConfig();

  const form = useForm<ProfileConfigFormValues>({
    resolver: zodResolver(profileConfigSchema),
    defaultValues,
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (record: ExtrusionProfileConfigRecord) => {
    setEditing(record);
    form.reset({
      profile: record.profile,
      section_weight_per_meter: Number(record.section_weight_per_meter),
      standard_length_per_piece: Number(record.standard_length_per_piece),
      default_pieces_per_packet: record.default_pieces_per_packet,
      default_tare_weight: Number(record.default_tare_weight),
      tolerance_type: record.tolerance_type,
      tolerance_value: Number(record.tolerance_value),
      is_active: record.is_active,
    });
    setDialogOpen(true);
  };

  const records = query.data?.items ?? [];
  const submitDisabled = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Profile Config"
        description="Configure section weight, tolerance and default tare/packet size per profile for extrusion weight validation."
      />
      <MasterToolbar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} createLabel="Add Profile Config" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "profile", title: "Profile", render: (r) => <div className="font-medium">{r.profile_name} <span className="text-xs text-muted-foreground">({r.profile_code})</span></div> },
          { key: "section_weight", title: "Section Wt/m", render: (r) => r.section_weight_per_meter },
          { key: "length", title: "Std Length/pc", render: (r) => r.standard_length_per_piece },
          { key: "pieces", title: "Pcs/Packet", render: (r) => r.default_pieces_per_packet },
          { key: "tare", title: "Default Tare", render: (r) => r.default_tare_weight },
          { key: "tolerance", title: "Tolerance", render: (r) => `${r.tolerance_value} (${r.tolerance_type === "PERCENTAGE" ? "%" : "fixed"})` },
          {
            key: "actions",
            title: "Actions",
            className: "w-[100px] text-right",
            render: (r) => <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />,
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Profile configs could not be loaded."
        emptyTitle="No profile configs"
        emptyDescription="Add a profile config to enable extrusion weight validation for that profile."
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
        title={editing ? "Edit Profile Config" : "Create Profile Config"}
        description="Set the extrusion weight and tolerance configuration for a profile."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                profile: values.profile,
                section_weight_per_meter: values.section_weight_per_meter,
                standard_length_per_piece: values.standard_length_per_piece,
                default_pieces_per_packet: values.default_pieces_per_packet,
                default_tare_weight: values.default_tare_weight,
                tolerance_type: values.tolerance_type,
                tolerance_value: values.tolerance_value,
                is_active: values.is_active,
              };
              try {
                if (editing) {
                  await updateMutation.mutateAsync({ id: editing.id, payload });
                  toast.success("Profile config updated.");
                } else {
                  await createMutation.mutateAsync(payload);
                  toast.success("Profile config created.");
                }
                setDialogOpen(false);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to save profile config."));
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile*</FormLabel>
                  <Select
                    value={String(field.value || "")}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={Boolean(editing)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} {p.code ? `(${p.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="section_weight_per_meter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Weight / Meter (kg)*</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standard_length_per_piece"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Length / Piece (m)*</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_pieces_per_packet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Pieces / Packet*</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_tare_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tare Weight (kg)*</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tolerance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerance Type*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tolerance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixed Weight</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tolerance_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerance Value*</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
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
                {editing ? "Save Changes" : "Create Profile Config"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Profile Config"
        description={`Permanently delete the extrusion config for "${deleteTarget?.profile_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await deleteMutation.mutateAsync(deleteTarget.id);
              toast.success("Profile config deleted.");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Failed to delete profile config."));
            }
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default ExtrusionProfileConfigPage;
