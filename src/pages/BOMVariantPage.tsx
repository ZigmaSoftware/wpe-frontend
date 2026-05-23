import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEventHandler } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/QueryState";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import ComponentAutocompleteDropdown from "@/features/production/components/bom-variants/ComponentAutocompleteDropdown";
import ComponentSearchInput from "@/features/production/components/bom-variants/ComponentSearchInput";
import EmptyComponentState from "@/features/production/components/bom-variants/EmptyComponentState";
import SelectedComponentTable from "@/features/production/components/bom-variants/SelectedComponentTable";
import {
  createDraftComponentFromSubtype,
  isDraftComponentValid,
  toDraftBOMComponent,
  type DraftBOMComponent,
} from "@/features/production/components/bom-variants/types";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { BOMVariant } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── BOM Create form ───────────────────────────────────────────────────────────

const MINIMUM_COMPONENT_SEARCH_LENGTH = 2;
const RECIPE_CODE_PATTERN = /^[A-Za-z0-9 .-]+$/;
const DEFAULT_BOM_REVISION = "v1";

const createSchema = z.object({
  recipe_code: z.string()
    .trim()
    .min(1, "Recipe code is required")
    .max(30, "Recipe code must be 30 characters or fewer")
    .regex(RECIPE_CODE_PATTERN, "Use only letters, numbers, spaces, hyphens, and dots"),
  notes: z.string().default(""),
  recipes: z.array(z.number()).min(1, "Select at least one recipe"),
});
type CreateFormValues = z.infer<typeof createSchema>;

const BOMCreateDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [draftComponents, setDraftComponents] = useState<DraftBOMComponent[]>([]);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { recipe_code: "", notes: "", recipes: [] },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const subtypeSearchQ = useQuery({
    queryKey: ["bom-create-subtype-search", debouncedSearchQuery],
    queryFn: () => wpeMastersApi.productTypeSubtypes.lookup({ search: debouncedSearchQuery }),
    enabled: open && searchOpen && debouncedSearchQuery.length >= MINIMUM_COMPONENT_SEARCH_LENGTH,
    refetchOnWindowFocus: false,
  });

  const searchOptions = useMemo(() => {
    const query = debouncedSearchQuery || searchQuery.trim();
    const selectedSubtypeIds = new Set(
      draftComponents
        .map((component) => component.product_subtype)
        .filter((value): value is number => typeof value === "number" && value > 0),
    );

    return (subtypeSearchQ.data ?? []).filter((option) => {
      if (selectedSubtypeIds.has(option.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const normalizedQuery = query.toLowerCase();
      return [option.name, option.code, option.category_name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [debouncedSearchQuery, draftComponents, searchQuery, subtypeSearchQ.data]);

  useEffect(() => {
    if (!searchOpen) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex(searchOptions.length > 0 ? 0 : -1);
  }, [searchOpen, searchOptions.length]);

  const invalidComponentIds = useMemo(
    () =>
      new Set(
        draftComponents
          .filter((component) => !isDraftComponentValid(component))
          .map((component) => component.client_id),
      ),
    [draftComponents],
  );

  const syncSelectedRecipes = (components: DraftBOMComponent[]) => {
    form.setValue(
      "recipes",
      components
        .map((component) => component.product_subtype)
        .filter((value): value is number => typeof value === "number" && value > 0),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const resetCreateDialog = () => {
    form.reset({ recipe_code: "", notes: "", recipes: [] });
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
    setDraftComponents([]);
  };

  const addSubtypeComponent = (subtypeId: number) => {
    const subtype = searchOptions.find((option) => option.id === subtypeId);
    if (!subtype) {
      return;
    }

    if (draftComponents.some((component) => component.product_subtype === subtype.id)) {
      toast.error(`${subtype.name} is already selected.`);
      return;
    }

    const nextComponents = [...draftComponents, createDraftComponentFromSubtype(subtype, draftComponents.length + 1)];
    setDraftComponents(nextComponents);
    syncSelectedRecipes(nextComponents);
    form.clearErrors("recipes");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSearchKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!searchOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setSearchOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!searchOptions.length) {
        return;
      }
      setHighlightedIndex((current) => (current + 1) % searchOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!searchOptions.length) {
        return;
      }
      setHighlightedIndex((current) => (current <= 0 ? searchOptions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && searchOpen && highlightedIndex >= 0 && searchOptions[highlightedIndex]) {
      event.preventDefault();
      addSubtypeComponent(searchOptions[highlightedIndex].id);
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const updateDraftComponent = (clientId: string, updater: (component: DraftBOMComponent) => DraftBOMComponent) => {
    setDraftComponents((current) =>
      current.map((component) => (component.client_id === clientId ? updater(component) : component)),
    );
  };

  const removeDraftComponent = (clientId: string) => {
    const nextComponents = draftComponents
      .filter((component) => component.client_id !== clientId)
      .map((component, index) => ({ ...component, sequence: index + 1 }));
    setDraftComponents(nextComponents);
    syncSelectedRecipes(nextComponents);
  };

  const mutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      coreApi.post("/api/production/bom-variants/", {
        variant_code: values.recipe_code.trim(),
        name: values.recipe_code.trim(),
        revision: DEFAULT_BOM_REVISION,
        notes: values.notes,
        components: draftComponents.map((component, index) => ({
          product_subtype: component.product_subtype,
          target_weight_grams: component.target_weight_grams,
          min_weight_grams: component.min_weight_grams,
          max_weight_grams: component.max_weight_grams,
          sequence: index + 1,
          is_regrind: component.is_regrind,
          unit: component.unit,
        })),
      }),
    onSuccess: () => {
      toast.success("BOM variant created.");
      resetCreateDialog();
      onOpenChange(false);
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to create BOM variant.")),
  });

  const handleSubmit = (values: CreateFormValues) => {
    const firstInvalidComponent = draftComponents.find((component) => !isDraftComponentValid(component));
    if (firstInvalidComponent) {
      form.setError("recipes", {
        type: "manual",
        message: `Enter a valid quantity and unit for ${firstInvalidComponent.item_name}.`,
      });
      return;
    }

    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetCreateDialog(); onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New BOM Variant</DialogTitle>
          <DialogDescription>
            Create a BOM variant and map Product Type subcategories as recipe rows. A recipe password can be configured later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-3">
              <FormField control={form.control} name="recipe_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Code*</FormLabel>
                  <FormControl><Input {...field} placeholder="WPE0129-RG" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="recipes" render={() => (
              <FormItem>
                <FormLabel>Add Recipe*</FormLabel>
                <FormDescription>
                  Search WPE Masters / Product Types / Subcategories and add one or more recipe mappings.
                </FormDescription>
                <div className="space-y-3">
                  <div className="relative">
                    <ComponentSearchInput
                      value={searchQuery}
                      isLoading={subtypeSearchQ.isLoading}
                      onChange={(value) => {
                        setSearchQuery(value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                      onKeyDown={handleSearchKeyDown}
                    />
                    <ComponentAutocompleteDropdown
                      open={searchOpen}
                      query={searchQuery}
                      options={searchOptions}
                      highlightedIndex={highlightedIndex}
                      isLoading={subtypeSearchQ.isLoading}
                      minimumCharacters={MINIMUM_COMPONENT_SEARCH_LENGTH}
                      onSelect={(option) => addSubtypeComponent(option.id)}
                      onHighlight={setHighlightedIndex}
                    />
                  </div>

                  {draftComponents.length > 0 ? (
                    <SelectedComponentTable
                      components={draftComponents}
                      invalidComponentIds={invalidComponentIds}
                      onQuantityChange={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, target_weight_grams: value }))
                      }
                      onUnitChange={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, unit: value }))
                      }
                      onRemove={removeDraftComponent}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                      Selected recipe rows will appear here.
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { resetCreateDialog(); onOpenChange(false); }}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>Create BOM Variant</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ── Change password dialog ────────────────────────────────────────────────────

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  bom,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bom: BOMVariant | null;
  onSuccess: () => void;
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => coreApi.post(`/api/production/bom-variants/${bom!.id}/set-password/`, { password: pwd }),
    onSuccess: () => {
      toast.success("Recipe password updated.");
      onOpenChange(false);
      setPwd(""); setConfirm("");
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to update password.")),
  });

  const valid = pwd.length >= 1 && pwd === confirm;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPwd(""); setConfirm(""); } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Recipe Password</DialogTitle>
          <DialogDescription>{bom?.variant_code} — {bom?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">New Password</label>
            <div className="relative mt-1">
              <Input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1"
              placeholder="Repeat new password"
            />
            {pwd && confirm && pwd !== confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
              Update Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── BOM Detail / Component editor ─────────────────────────────────────────────

const BOMDetailDialog = ({
  open,
  onOpenChange,
  bom,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bom: BOMVariant | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [draftComponents, setDraftComponents] = useState<DraftBOMComponent[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const detailQ = useQuery({
    queryKey: ["bom-detail", bom?.id],
    queryFn: async () => {
      const res = await coreApi.get<{ data: BOMVariant } | BOMVariant>(`/api/production/bom-variants/${bom!.id}/`);
      const payload = res.data as { data?: BOMVariant } & BOMVariant;
      return (payload.data ?? payload) as BOMVariant;
    },
    enabled: !!bom && open,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!open || !detailQ.data) {
      return;
    }

    setDraftComponents((detailQ.data.components ?? []).map((component, index) => toDraftBOMComponent(component, index + 1)));
    setHasUnsavedChanges(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
  }, [detailQ.data, open]);

  const subtypeSearchQ = useQuery({
    queryKey: ["bom-component-subtype-search", debouncedSearchQuery],
    queryFn: () => wpeMastersApi.productTypeSubtypes.lookup({ search: debouncedSearchQuery }),
    enabled: open && searchOpen && debouncedSearchQuery.length >= MINIMUM_COMPONENT_SEARCH_LENGTH,
    refetchOnWindowFocus: false,
  });

  const searchOptions = useMemo(() => {
    const query = debouncedSearchQuery || searchQuery.trim();
    const selectedSubtypeIds = new Set(
      draftComponents
        .map((component) => component.product_subtype)
        .filter((value): value is number => typeof value === "number" && value > 0),
    );

    return (subtypeSearchQ.data ?? []).filter((option) => {
      if (selectedSubtypeIds.has(option.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const normalizedQuery = query.toLowerCase();
      return [option.name, option.code, option.category_name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [debouncedSearchQuery, draftComponents, searchQuery, subtypeSearchQ.data]);

  useEffect(() => {
    if (!searchOpen) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex(searchOptions.length > 0 ? 0 : -1);
  }, [searchOpen, searchOptions.length]);

  const saveComponentsMutation = useMutation({
    mutationFn: async (components: DraftBOMComponent[]) => {
      const res = await coreApi.put<{ data: BOMVariant } | BOMVariant>(`/api/production/bom-variants/${bom!.id}/components/`, {
        components: components.map((component, index) => ({
          item: component.item,
          product_subtype: component.product_subtype,
          target_weight_grams: component.target_weight_grams,
          min_weight_grams: component.min_weight_grams,
          max_weight_grams: component.max_weight_grams,
          sequence: index + 1,
          is_regrind: component.is_regrind,
          unit: component.unit,
        })),
      });
      const payload = res.data as { data?: BOMVariant } & BOMVariant;
      return (payload.data ?? payload) as BOMVariant;
    },
    onSuccess: (updatedBom) => {
      toast.success("BOM component mappings saved.");
      queryClient.setQueryData(["bom-detail", bom?.id], updatedBom);
      queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
      setDraftComponents((updatedBom.components ?? []).map((component, index) => toDraftBOMComponent(component, index + 1)));
      setHasUnsavedChanges(false);
      onSuccess();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save BOM components.")),
  });

  const invalidComponentIds = useMemo(
    () =>
      new Set(
        draftComponents
          .filter((component) => !isDraftComponentValid(component))
          .map((component) => component.client_id),
      ),
    [draftComponents],
  );

  const addSubtypeComponent = (subtypeId: number) => {
    const subtype = searchOptions.find((option) => option.id === subtypeId);
    if (!subtype) {
      return;
    }

    if (draftComponents.some((component) => component.product_subtype === subtype.id)) {
      toast.error(`${subtype.name} is already in this BOM draft.`);
      return;
    }

    setDraftComponents((current) => [...current, createDraftComponentFromSubtype(subtype, current.length + 1)]);
    setHasUnsavedChanges(true);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSearchKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!searchOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setSearchOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!searchOptions.length) {
        return;
      }
      setHighlightedIndex((current) => (current + 1) % searchOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!searchOptions.length) {
        return;
      }
      setHighlightedIndex((current) => (current <= 0 ? searchOptions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && searchOpen && highlightedIndex >= 0 && searchOptions[highlightedIndex]) {
      event.preventDefault();
      addSubtypeComponent(searchOptions[highlightedIndex].id);
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const updateDraftComponent = (clientId: string, updater: (component: DraftBOMComponent) => DraftBOMComponent) => {
    setDraftComponents((current) =>
      current.map((component) => (component.client_id === clientId ? updater(component) : component)),
    );
    setHasUnsavedChanges(true);
  };

  const removeDraftComponent = (clientId: string) => {
    setDraftComponents((current) =>
      current
        .filter((component) => component.client_id !== clientId)
        .map((component, index) => ({ ...component, sequence: index + 1 })),
    );
    setHasUnsavedChanges(true);
  };

  const resetDraft = () => {
    setDraftComponents((detailQ.data?.components ?? []).map((component, index) => toDraftBOMComponent(component, index + 1)));
    setHasUnsavedChanges(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSave = () => {
    const firstInvalidComponent = draftComponents.find((component) => !isDraftComponentValid(component));
    if (firstInvalidComponent) {
      toast.error(`Enter a valid quantity and unit for ${firstInvalidComponent.item_name}.`);
      return;
    }

    saveComponentsMutation.mutate(draftComponents);
  };

  const componentCount = draftComponents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {bom?.variant_code} — Components
          </DialogTitle>
          <DialogDescription>
            {bom?.name} · Rev {bom?.revision} · {componentCount} component(s)
          </DialogDescription>
        </DialogHeader>

        {detailQ.isLoading && <LoadingState label="Loading BOM details..." />}
        {detailQ.isError && <ErrorState description="Could not load BOM details." />}

        {!detailQ.isLoading && !detailQ.isError ? (
          <div className="space-y-4">
            {draftComponents.length > 0 ? (
              <SelectedComponentTable
                components={draftComponents}
                invalidComponentIds={invalidComponentIds}
                onQuantityChange={(clientId, value) =>
                  updateDraftComponent(clientId, (component) => ({ ...component, target_weight_grams: value }))
                }
                onUnitChange={(clientId, value) =>
                  updateDraftComponent(clientId, (component) => ({ ...component, unit: value }))
                }
                onRemove={removeDraftComponent}
              />
            ) : (
              <EmptyComponentState />
            )}

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Add Component</h4>
                <p className="text-xs text-muted-foreground">
                  Search WPE Product Type subcategories. Components stay in this draft until you save the BOM variant.
                </p>
              </div>

              <div className="relative">
                <ComponentSearchInput
                  value={searchQuery}
                  isLoading={subtypeSearchQ.isLoading}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                  onKeyDown={handleSearchKeyDown}
                />
                <ComponentAutocompleteDropdown
                  open={searchOpen}
                  query={searchQuery}
                  options={searchOptions}
                  highlightedIndex={highlightedIndex}
                  isLoading={subtypeSearchQ.isLoading}
                  minimumCharacters={MINIMUM_COMPONENT_SEARCH_LENGTH}
                  onSelect={(option) => addSubtypeComponent(option.id)}
                  onHighlight={setHighlightedIndex}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {hasUnsavedChanges ? "Unsaved component changes" : "Saved component mappings"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Production batches only receive updated BOM components after this save is completed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetDraft} disabled={!hasUnsavedChanges || saveComponentsMutation.isPending}>
                  Reset Changes
                </Button>
                <Button type="button" onClick={handleSave} disabled={!hasUnsavedChanges || saveComponentsMutation.isPending}>
                  Save BOM Components
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const BOMVariantPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBOM, setDetailBOM] = useState<BOMVariant | null>(null);
  const [pwdBOM, setPwdBOM] = useState<BOMVariant | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BOMVariant | null>(null);

  const bomsQ = useQuery({
    queryKey: ["bom-variants"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/bom-variants/");
      return normalizeListResponse<BOMVariant>(res.data);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (bom: BOMVariant) => coreApi.delete(`/api/production/bom-variants/${bom.id}/`),
    onSuccess: () => {
      toast.success("BOM variant deactivated.");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to deactivate.")),
  });

  const handleSuccess = () => queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
  const totalVariants = (bomsQ.data ?? []).length;
  const passwordConfiguredCount = (bomsQ.data ?? []).filter((bom) => bom.has_password).length;

  const filtered = (bomsQ.data ?? []).filter((b) => {
    if (!search.trim()) return true;
    return [b.variant_code, b.name, b.revision].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="BOM Variants"
        description="Manage Bill of Materials variants and their recipe components."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />New BOM Variant
          </Button>
        }
      />

      {/* Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name..."
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Variants</p>
          <p className="text-2xl font-bold mt-1">{totalVariants}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold mt-1">
            {(bomsQ.data ?? []).reduce((sum, b) => sum + (b.component_count ?? 0), 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Password Configured</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            <Lock className="inline h-5 w-5 mr-1" />{passwordConfiguredCount}/{totalVariants}
          </p>
        </div>
      </div>

      {/* Table */}
      {bomsQ.isLoading && <LoadingState label="Loading BOM variants..." />}
      {bomsQ.isError && <ErrorState description="Could not load BOM variants." />}

      {!bomsQ.isLoading && !bomsQ.isError && (
        filtered.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Variant Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Revision</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Product Item</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bom, i) => (
                  <TableRow key={bom.id}>
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {bom.has_password ? (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <KeyRound className="h-3 w-3 text-amber-600 flex-shrink-0" />
                        )}
                        <span className="font-mono text-xs font-semibold">{bom.variant_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{bom.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{bom.revision}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {bom.component_count ?? 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bom.product_item_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setDetailBOM(bom)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />Components
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Change password"
                          onClick={() => setPwdBOM(bom)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeactivateTarget(bom)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
            title="No BOM variants"
            description={search ? "Try adjusting your search." : "Create the first BOM variant to define recipe components."}
          />
        )
      )}

      {/* Dialogs */}
      <BOMCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />

      <BOMDetailDialog
        open={!!detailBOM}
        onOpenChange={(o) => { if (!o) setDetailBOM(null); }}
        bom={detailBOM}
        onSuccess={handleSuccess}
      />

      <ChangePasswordDialog
        open={!!pwdBOM}
        onOpenChange={(o) => { if (!o) setPwdBOM(null); }}
        bom={pwdBOM}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Deactivate BOM Variant"
        description={`Deactivate "${deactivateTarget?.variant_code}"? It will no longer appear in production order assignment.`}
        confirmLabel="Deactivate"
        onConfirm={() => { if (deactivateTarget) deactivateMutation.mutate(deactivateTarget); }}
      />
    </div>
  );
};

export default BOMVariantPage;
