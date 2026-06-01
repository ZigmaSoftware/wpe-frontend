import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEventHandler } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/QueryState";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
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
import { recipeBomMastersApi } from "@/features/recipe-bom-masters/api/recipeBomMastersApi";
import type { RecipeRecord } from "@/features/recipe-bom-masters/types";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api-helpers";

const MINIMUM_COMPONENT_SEARCH_LENGTH = 2;

const recipeItemSchema = z.object({
  recipe: z.coerce.number().min(1, "Recipe is required."),
});

type RecipeItemFormValues = z.infer<typeof recipeItemSchema>;

const RecipeItemsDialog = ({
  open,
  onOpenChange,
  recipe,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  recipe: RecipeRecord | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [draftComponents, setDraftComponents] = useState<DraftBOMComponent[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const form = useForm<RecipeItemFormValues>({
    resolver: zodResolver(recipeItemSchema),
    defaultValues: { recipe: recipe?.id ?? 0 },
  });

  const selectedRecipeId = Number(form.watch("recipe") || 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    form.reset({ recipe: recipe?.id ?? 0 });
    setDraftComponents([]);
    setHasUnsavedChanges(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSearchOpen(false);
    setHighlightedIndex(-1);
  }, [form, recipe, open]);

  const recipeLookupQ = useQuery({
    queryKey: ["recipe-bom-masters", "recipes", "lookup"],
    queryFn: recipeBomMastersApi.recipes.lookup,
    enabled: open,
  });

  const detailQ = useQuery({
    queryKey: ["recipe-bom-masters", "recipe-detail", selectedRecipeId],
    queryFn: () => recipeBomMastersApi.recipes.detail(selectedRecipeId),
    enabled: open && selectedRecipeId > 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!detailQ.data) {
      return;
    }

    setDraftComponents((detailQ.data.components ?? []).map((component, index) => toDraftBOMComponent(component, index + 1)));
    setHasUnsavedChanges(false);
  }, [detailQ.data]);

  const subtypeSearchQ = useQuery({
    queryKey: ["recipe-bom-masters", "recipe-item-search", debouncedSearchQuery],
    queryFn: () => wpeMastersApi.productTypeSubtypes.lookup({ search: debouncedSearchQuery }),
    enabled: open && selectedRecipeId > 0 && searchOpen && debouncedSearchQuery.length >= MINIMUM_COMPONENT_SEARCH_LENGTH,
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

  const addSubtypeComponent = (subtypeId: number) => {
    const subtype = searchOptions.find((option) => option.id === subtypeId);
    if (!subtype) {
      return;
    }

    if (draftComponents.some((component) => component.product_subtype === subtype.id)) {
      toast.error(`${subtype.name} is already in this recipe.`);
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

  const saveMutation = useMutation({
    mutationFn: () =>
      recipeBomMastersApi.recipes.saveItems(
        selectedRecipeId,
        draftComponents.map((component, index) => ({
          item: component.item,
          product_subtype: component.product_subtype,
          target_weight_grams: component.target_weight_grams,
          min_weight_grams: component.min_weight_grams,
          max_weight_grams: component.max_weight_grams,
          sequence: index + 1,
          is_regrind: component.is_regrind,
          unit: component.unit,
          is_active: Boolean(component.is_active),
        })),
      ),
    onSuccess: async () => {
      toast.success("Recipe items saved.");
      await queryClient.invalidateQueries({ queryKey: ["recipe-bom-masters", "recipes"] });
      await queryClient.invalidateQueries({ queryKey: ["recipe-bom-masters", "recipe-detail", selectedRecipeId] });
      setHasUnsavedChanges(false);
      onSuccess();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save recipe items.")),
  });

  const handleSave = async () => {
    const valid = await form.trigger("recipe");
    if (!selectedRecipeId || !valid) {
      return;
    }

    const firstInvalidComponent = draftComponents.find((component) => !isDraftComponentValid(component));
    if (firstInvalidComponent) {
      toast.error(`Enter valid standard, minimum, and maximum weights for ${firstInvalidComponent.item_name}.`);
      return;
    }

    saveMutation.mutate();
  };

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      form.reset({ recipe: recipe?.id ?? 0 });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Recipe Item Creation</DialogTitle>
          <DialogDescription>
            Select a recipe, add item sub categories, and maintain standard, minimum, and maximum weight limits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="recipe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe*</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Recipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(recipeLookupQ.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.code ? `${option.code} - ${option.name}` : option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRecipeId > 0 ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Add Items*</div>
                  <p className="text-xs text-muted-foreground">
                    Search Masters / Inventory and Store Masters / Item Sub Category and add one or more recipe rows.
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

                {detailQ.isLoading ? <LoadingState label="Loading recipe items..." /> : null}
                {detailQ.isError ? <ErrorState description="Recipe items could not be loaded." /> : null}

                {!detailQ.isLoading && !detailQ.isError ? (
                  draftComponents.length > 0 ? (
                    <SelectedComponentTable
                      components={draftComponents}
                      invalidComponentIds={invalidComponentIds}
                      onStandardWeightChange={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, target_weight_grams: value }))
                      }
                      onMinimumWeightChange={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, min_weight_grams: value }))
                      }
                      onMaximumWeightChange={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, max_weight_grams: value }))
                      }
                      onToggleActive={(clientId, value) =>
                        updateDraftComponent(clientId, (component) => ({ ...component, is_active: value }))
                      }
                      onRemove={removeDraftComponent}
                    />
                  ) : (
                    <EmptyComponentState />
                  )
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                Select a recipe first to manage recipe items.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={!hasUnsavedChanges || saveMutation.isPending} onClick={handleSave}>
                Save Recipe Items
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const RecipeItemCreationPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecord | null>(null);

  const queryClient = useQueryClient();
  const recipesQ = useQuery({
    queryKey: ["recipe-bom-masters", "recipes", page, pageSize, search],
    queryFn: () => recipeBomMastersApi.recipes.list({ page, pageSize, search }),
  });

  const openDialog = (recipe: RecipeRecord | null) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["recipe-bom-masters", "recipes"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipe Item Creation"
        description="Define recipe input items with standard, minimum, and maximum weight limits."
      />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel="Add Recipe Items"
        onCreate={() => openDialog(null)}
      />

      <MasterTable
        columns={[
          {
            key: "recipe_code",
            title: "Recipe Code",
            render: (record) => <span className="font-mono text-xs text-muted-foreground">{record.code || "-"}</span>,
          },
          {
            key: "recipe_name",
            title: "Recipe Name",
            render: (record) => <div className="font-medium">{record.name}</div>,
          },
          {
            key: "version",
            title: "Recipe Version",
            render: (record) => record.recipe_version || "-",
          },
          {
            key: "batch",
            title: "Batch Size",
            render: (record) =>
              record.batch_size ? `${record.batch_size}${record.batch_uom ? ` ${record.batch_uom}` : ""}` : "-",
          },
          {
            key: "items",
            title: "Recipe Items",
            render: (record) => (
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                {record.component_count} item{record.component_count === 1 ? "" : "s"}
              </Badge>
            ),
          },
          {
            key: "status",
            title: "Status",
            render: (record) => (
              <Badge
                variant="outline"
                className={
                  record.status === "APPROVED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : record.status === "INACTIVE"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {record.status === "APPROVED" ? "Approved" : record.status === "INACTIVE" ? "Inactive" : "Draft"}
              </Badge>
            ),
          },
          {
            key: "active_status",
            title: "Active Status",
            render: (record) => <MasterStatusBadge active={record.is_active} />,
          },
          {
            key: "actions",
            title: "Actions",
            className: "w-[180px] text-right",
            render: (record) => (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => openDialog(record)}>
                  Manage Items
                </Button>
              </div>
            ),
          },
        ]}
        records={recipesQ.data?.items ?? []}
        isLoading={recipesQ.isLoading}
        isError={recipesQ.isError}
        errorDescription="Recipe item records could not be loaded."
        emptyTitle="No recipes available"
        emptyDescription="Create a recipe first, then manage its recipe items here."
        page={page}
        pageSize={pageSize}
        total={recipesQ.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        onRetry={() => recipesQ.refetch()}
      />

      <RecipeItemsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipe={selectedRecipe}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default RecipeItemCreationPage;
