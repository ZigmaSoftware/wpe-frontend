import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMatch, useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import TablePagination from "@/components/TablePagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import RowActions from "@/features/common-master/components/RowActions";
import ItemVariantForm from "@/features/wpe-masters/components/ItemVariantForm";
import ProductTypeCategoryForm from "@/features/wpe-masters/components/ProductTypeCategoryForm";
import ProductTypeSubtypeForm from "@/features/wpe-masters/components/ProductTypeSubtypeForm";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import {
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
  WPE_PRODUCT_TYPES_TITLE,
} from "@/features/wpe-masters/constants";
import {
  productTypeKeys,
  useProductTypeCategoriesQuery,
  useProductTypeMutations,
  useProductTypeSubtypesQuery,
  useProductTypeTreeQuery,
} from "@/features/wpe-masters/hooks/useProductTypes";
import {
  itemMasterSchema,
  type ItemMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";
import {
  productTypeCategorySchema,
  productTypeSubtypeSchema,
  type ProductTypeCategoryFormValues,
  type ProductTypeSubtypeFormValues,
} from "@/features/wpe-masters/schemas/productTypes";
import type {
  ItemMasterRecord,
  ItemMasterWritePayload,
  LookupItem,
  ProductTypeCategoryRecord,
  ProductTypeCategoryWritePayload,
  ProductTypeStatusFilterValue,
  ProductTypeSubtypeRecord,
  ProductTypeSubtypeWritePayload,
  ProductTypeTreeCategoryRecord,
} from "@/features/wpe-masters/types";
import { INVENTORY_STORE_MASTER_SCREEN_CODES } from "@/lib/routePermissions";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { useAuth } from "@/providers/AuthProvider";

type ItemHierarchyMode = "categories" | "subtypes" | "variants";

type HierarchyPageProps = {
  mode: ItemHierarchyMode;
};

type ColumnCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  trailing?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

const categoryDefaultValues: ProductTypeCategoryFormValues = {
  name: "",
  description: "",
  sort_order: 10,
  is_active: true,
};

const subtypeDefaultValues: ProductTypeSubtypeFormValues = {
  category: 0,
  name: "",
  description: "",
  sort_order: 10,
  is_active: true,
};

const variantDefaultValues: ItemMasterFormValues = {
  code: "",
  item_name: "",
  category: 0,
  sub_category: 0,
  description: "",
  item_type: "RM",
  uom: 0,
  hsn_code: "",
  gst_percentage: 0,
  minimum_stock: 0,
  maximum_stock: 0,
  reorder_level: 0,
  is_active: true,
};

const toApiStatusFilter = (value: ProductTypeStatusFilterValue) => {
  if (value === "active") return true;
  if (value === "inactive") return false;
  return undefined;
};

const ColumnCard = ({ eyebrow, title, description, trailing, toolbar, children }: ColumnCardProps) => (
  <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            <div className="text-lg font-semibold text-slate-950">{title}</div>
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {trailing ? <div className="flex flex-wrap items-center gap-2">{trailing}</div> : null}
        </div>
        {toolbar ? <div className="pt-1">{toolbar}</div> : null}
      </div>
    </div>
    {children}
  </section>
);

const SearchAndStatusToolbar = ({
  search,
  onSearchChange,
  searchPlaceholder,
  status,
  onStatusChange,
  addLabel,
  onAdd,
  addDisabled = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  status: ProductTypeStatusFilterValue;
  onStatusChange: (value: ProductTypeStatusFilterValue) => void;
  addLabel?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
}) => (
  <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm shadow-slate-100"
      />
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={status} onValueChange={(value) => onStatusChange(value as ProductTypeStatusFilterValue)}>
        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm shadow-slate-100 sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active only</SelectItem>
          <SelectItem value="inactive">Inactive only</SelectItem>
        </SelectContent>
      </Select>
      {addLabel && onAdd ? (
        <Button onClick={onAdd} className="h-11 rounded-xl px-4" disabled={addDisabled}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  </div>
);

const useScreenPermissions = (screenCodes: readonly string[]) => {
  const { can } = useAuth();

  return {
    canView: screenCodes.some((screenCode) => can(screenCode, "view") || can(screenCode, "list")),
    canAdd: screenCodes.some((screenCode) => can(screenCode, "add")),
    canEdit: screenCodes.some((screenCode) => can(screenCode, "update")),
    canDelete: screenCodes.some((screenCode) => can(screenCode, "delete")),
  };
};

const parseNumericParam = (value: string | undefined) => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const routeConfig = {
  categories: {
    baseRoute: WPE_PRODUCT_TYPES_ROUTE,
    pageTitle: WPE_PRODUCT_TYPES_TITLE,
    pageDescription: "Start with item categories, drill into item sub categories, and maintain the exact item variants under each branch.",
  },
  subtypes: {
    baseRoute: WPE_PRODUCT_SUBTYPES_ROUTE,
    pageTitle: "Item Sub Category",
    pageDescription: "Select an item category first, then manage only the related item sub categories and their downstream item variants.",
  },
  variants: {
    baseRoute: WPE_ITEM_VARIANTS_ROUTE,
    pageTitle: "Item Variants",
    pageDescription: "Select the category and sub category path first, then maintain only the actual item variants that belong to that branch.",
  },
} as const;

const ItemHierarchyPage = ({ mode }: HierarchyPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { baseRoute, pageTitle, pageDescription } = routeConfig[mode];
  const categoryAndSubtypeMatch = useMatch(`${baseRoute}/:categoryId/subtypes/:subtypeId`);
  const categoryOnlyMatch = useMatch(`${baseRoute}/:categoryId`);

  const selectedCategoryId = parseNumericParam(
    categoryAndSubtypeMatch?.params.categoryId ?? categoryOnlyMatch?.params.categoryId,
  );
  const selectedSubtypeId = parseNumericParam(categoryAndSubtypeMatch?.params.subtypeId);

  const categoryPermissions = useScreenPermissions(INVENTORY_STORE_MASTER_SCREEN_CODES.productTypes);
  const subtypePermissions = useScreenPermissions(INVENTORY_STORE_MASTER_SCREEN_CODES.productSubtypes);
  const variantPermissions = useScreenPermissions(INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations);
  const canViewHierarchy = categoryPermissions.canView || subtypePermissions.canView || variantPermissions.canView;

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [categoryStatus, setCategoryStatus] = useState<ProductTypeStatusFilterValue>("all");

  const [subtypeSearch, setSubtypeSearch] = useState("");
  const [subtypePage, setSubtypePage] = useState(1);
  const [subtypePageSize, setSubtypePageSize] = useState(10);
  const [subtypeStatus, setSubtypeStatus] = useState<ProductTypeStatusFilterValue>("all");

  const [variantSearch, setVariantSearch] = useState("");
  const [variantPage, setVariantPage] = useState(1);
  const [variantPageSize, setVariantPageSize] = useState(10);
  const [variantStatus, setVariantStatus] = useState<ProductTypeStatusFilterValue>("all");

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subtypeDialogOpen, setSubtypeDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<ProductTypeCategoryRecord | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<ProductTypeSubtypeRecord | null>(null);
  const [editingVariant, setEditingVariant] = useState<ItemMasterRecord | null>(null);

  const [toggleCategoryTarget, setToggleCategoryTarget] = useState<ProductTypeCategoryRecord | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ProductTypeCategoryRecord | null>(null);
  const [toggleSubtypeTarget, setToggleSubtypeTarget] = useState<ProductTypeSubtypeRecord | null>(null);
  const [deleteSubtypeTarget, setDeleteSubtypeTarget] = useState<ProductTypeSubtypeRecord | null>(null);
  const [toggleVariantTarget, setToggleVariantTarget] = useState<ItemMasterRecord | null>(null);
  const [deleteVariantTarget, setDeleteVariantTarget] = useState<ItemMasterRecord | null>(null);

  const [categoryCodePreview, setCategoryCodePreview] = useState("");
  const [subcategoryCodePreview, setSubcategoryCodePreview] = useState("");
  const [variantCodePreview, setVariantCodePreview] = useState("");

  const deferredCategorySearch = useDeferredValue(categorySearch.trim());
  const deferredSubtypeSearch = useDeferredValue(subtypeSearch.trim());
  const deferredVariantSearch = useDeferredValue(variantSearch.trim());

  const categoryForm = useForm<ProductTypeCategoryFormValues>({
    resolver: zodResolver(productTypeCategorySchema),
    defaultValues: categoryDefaultValues,
  });
  const subtypeForm = useForm<ProductTypeSubtypeFormValues>({
    resolver: zodResolver(productTypeSubtypeSchema),
    defaultValues: subtypeDefaultValues,
  });
  const variantForm = useForm<ItemMasterFormValues>({
    resolver: zodResolver(itemMasterSchema),
    defaultValues: variantDefaultValues,
  });

  const categoryQuery = useProductTypeCategoriesQuery(
    {
      page: categoryPage,
      pageSize: categoryPageSize,
      search: deferredCategorySearch,
      ordering: "sort_order",
      is_active: toApiStatusFilter(categoryStatus),
    },
    canViewHierarchy,
  );

  const hierarchyQuery = useProductTypeTreeQuery("", canViewHierarchy);

  const subtypeQuery = useProductTypeSubtypesQuery(
    {
      page: subtypePage,
      pageSize: subtypePageSize,
      search: deferredSubtypeSearch,
      ordering: "sort_order",
      is_active: toApiStatusFilter(subtypeStatus),
      category_id: selectedCategoryId ?? undefined,
    },
    canViewHierarchy && Boolean(selectedCategoryId),
  );

  const variantQuery = useQuery({
    queryKey: [
      "wpe-masters",
      "item-variants",
      variantPage,
      variantPageSize,
      deferredVariantSearch,
      variantStatus,
      selectedCategoryId ?? "all",
      selectedSubtypeId ?? "all",
    ],
    queryFn: () =>
      wpeMastersApi.itemVariants.list({
        page: variantPage,
        pageSize: variantPageSize,
        search: deferredVariantSearch,
        ordering: "item_name",
        is_active: toApiStatusFilter(variantStatus),
        category_id: selectedCategoryId ?? undefined,
        sub_category_id: selectedSubtypeId ?? undefined,
      }),
    enabled: Boolean(selectedSubtypeId),
  });

  const unitLookupQuery = useQuery({
    queryKey: ["wpe-masters", "units", "lookup"],
    queryFn: () => wpeMastersApi.units.lookup(),
    enabled: canViewHierarchy,
  });

  const productTypeMutations = useProductTypeMutations();

  const invalidateVariantQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wpe-masters", "item-creations"] }),
      queryClient.invalidateQueries({ queryKey: ["wpe-masters", "item-variants"] }),
      queryClient.invalidateQueries({ queryKey: productTypeKeys.categoriesRoot }),
      queryClient.invalidateQueries({ queryKey: productTypeKeys.subtypesRoot }),
      queryClient.invalidateQueries({ queryKey: ["wpe-masters", "product-type-categories", "tree"] }),
    ]);
  };

  const createVariantMutation = useMutation({
    mutationFn: wpeMastersApi.itemVariants.create,
    onSuccess: async () => {
      toast.success("Item variant created.");
      await invalidateVariantQueries();
      setVariantDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to create item variant.")),
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ItemMasterWritePayload> }) =>
      wpeMastersApi.itemVariants.update(id, payload),
    onSuccess: async () => {
      toast.success("Item variant updated.");
      await invalidateVariantQueries();
      setVariantDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update item variant.")),
  });

  const toggleVariantMutation = useMutation({
    mutationFn: wpeMastersApi.itemVariants.toggle,
    onSuccess: async () => {
      toast.success("Item variant status updated.");
      await invalidateVariantQueries();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update item variant status.")),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: wpeMastersApi.itemVariants.delete,
    onSuccess: async () => {
      toast.success("Item variant deleted.");
      await invalidateVariantQueries();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to delete item variant.")),
  });

  const selectedCategory = useMemo<ProductTypeTreeCategoryRecord | ProductTypeCategoryRecord | null>(() => {
    if (!selectedCategoryId) {
      return null;
    }
    return (
      hierarchyQuery.data?.find((record) => record.id === selectedCategoryId) ??
      categoryQuery.data?.items.find((record) => record.id === selectedCategoryId) ??
      null
    );
  }, [selectedCategoryId, hierarchyQuery.data, categoryQuery.data?.items]);

  const selectedSubtype = useMemo<ProductTypeSubtypeRecord | null>(() => {
    if (!selectedCategoryId || !selectedSubtypeId) {
      return null;
    }
    const category = hierarchyQuery.data?.find((record) => record.id === selectedCategoryId);
    return category?.subtypes.find((record) => record.id === selectedSubtypeId) ?? null;
  }, [selectedCategoryId, selectedSubtypeId, hierarchyQuery.data]);

  const categoryOptions = useMemo<LookupItem[]>(
    () => (hierarchyQuery.data ?? []).map((record) => ({ id: record.id, name: record.name, code: record.code })),
    [hierarchyQuery.data],
  );

  const selectedVariantCategoryId = variantForm.watch("category");
  const variantSubCategoryOptions = useMemo(
    () => hierarchyQuery.data?.find((record) => record.id === selectedVariantCategoryId)?.subtypes ?? [],
    [hierarchyQuery.data, selectedVariantCategoryId],
  );

  useEffect(() => {
    const currentSubtype = variantForm.getValues("sub_category");
    if (currentSubtype && !variantSubCategoryOptions.some((option) => option.id === currentSubtype)) {
      variantForm.setValue("sub_category", 0, { shouldValidate: true });
    }
  }, [variantForm, variantSubCategoryOptions]);

  useEffect(() => {
    if (!variantDialogOpen) {
      return;
    }

    const currentUom = variantForm.getValues("uom");
    const defaultUomId = unitLookupQuery.data?.[0]?.id ?? 0;

    if (!currentUom && defaultUomId) {
      variantForm.setValue("uom", defaultUomId, { shouldValidate: true });
    }
  }, [unitLookupQuery.data, variantDialogOpen, variantForm]);

  useEffect(() => {
    if (selectedCategoryId && hierarchyQuery.data && !hierarchyQuery.isLoading && !selectedCategory) {
      navigate(baseRoute, { replace: true });
    }
  }, [baseRoute, hierarchyQuery.data, hierarchyQuery.isLoading, navigate, selectedCategory, selectedCategoryId]);

  useEffect(() => {
    if (selectedSubtypeId && selectedCategory && !selectedSubtype) {
      navigate(selectedCategoryId ? `${baseRoute}/${selectedCategoryId}` : baseRoute, { replace: true });
    }
  }, [baseRoute, navigate, selectedCategory, selectedCategoryId, selectedSubtype, selectedSubtypeId]);

  const hierarchyTrail = `${WPE_PRODUCT_TYPES_TITLE} -> Item Sub Category -> Item Variants`;
  const categoryRecords = categoryQuery.data?.items ?? [];
  const subtypeRecords = subtypeQuery.data?.items ?? [];
  const variantRecords = variantQuery.data?.items ?? [];
  const isSubtypeDetailView = Boolean(selectedCategory);
  const isVariantDetailView = Boolean(selectedCategory && selectedSubtype);
  const headerTitle = isVariantDetailView
    ? "Item Variants"
    : isSubtypeDetailView
      ? "Item Sub Category"
      : pageTitle;
  const headerDescription = isVariantDetailView
    ? `View and maintain only the item variants linked to ${selectedSubtype?.name ?? "the selected item sub category"}.`
    : isSubtypeDetailView
      ? `View and maintain only the item sub categories linked to ${selectedCategory?.name ?? "the selected item category"}.`
      : pageDescription;

  const openCreateCategory = async () => {
    setEditingCategory(null);
    categoryForm.reset(categoryDefaultValues);
    setCategoryDialogOpen(true);
    try {
      setCategoryCodePreview(await wpeMastersApi.productTypeCategories.nextCode());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to generate the next item category code."));
      setCategoryCodePreview("");
    }
  };

  const openCreateSubtype = async () => {
    setEditingSubtype(null);
    subtypeForm.reset({
      ...subtypeDefaultValues,
      category: selectedCategoryId ?? categoryOptions[0]?.id ?? 0,
    });
    setSubtypeDialogOpen(true);
    try {
      setSubcategoryCodePreview(await wpeMastersApi.productTypeSubtypes.nextCode());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to generate the next item sub category code."));
      setSubcategoryCodePreview("");
    }
  };

  const openCreateVariant = async () => {
    const fallbackCategoryId = selectedCategoryId ?? categoryOptions[0]?.id ?? 0;
    const fallbackSubCategoryId =
      selectedSubtypeId ??
      hierarchyQuery.data?.find((record) => record.id === fallbackCategoryId)?.subtypes[0]?.id ??
      0;

    setEditingVariant(null);
    variantForm.reset({
      ...variantDefaultValues,
      category: fallbackCategoryId,
      sub_category: fallbackSubCategoryId,
      uom: unitLookupQuery.data?.[0]?.id ?? 0,
    });
    setVariantDialogOpen(true);
    try {
      setVariantCodePreview(await wpeMastersApi.itemVariants.nextCode());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to generate the next item variant code."));
      setVariantCodePreview("");
    }
  };

  if (!canViewHierarchy) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={pageTitle}
          description={pageDescription}
        />
        <ErrorState
          title="Permission required"
          description="You do not have permission to view this master hierarchy."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={headerTitle} description={headerDescription} />

      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {hierarchyTrail}
      </div>

      {!hierarchyQuery.isLoading && !hierarchyQuery.isError ? (
        isVariantDetailView ? (
          <ColumnCard
            eyebrow="Level 3"
            title={`Item Variants in ${selectedSubtype.name}`}
            description={`Only the item variants mapped under ${selectedSubtype.name} are shown on this page.`}
            trailing={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-slate-200"
                  onClick={() => navigate(selectedCategoryId ? `${baseRoute}/${selectedCategoryId}` : baseRoute)}
                >
                  Back to Item Sub Categories
                </Button>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {selectedCategory?.name}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {variantQuery.data?.total ?? 0} visible
                </Badge>
              </>
            }
            toolbar={
              <SearchAndStatusToolbar
                search={variantSearch}
                onSearchChange={(value) => {
                  setVariantSearch(value);
                  setVariantPage(1);
                }}
                searchPlaceholder={`Search item variants in ${selectedSubtype.name}`}
                status={variantStatus}
                onStatusChange={(value) => {
                  setVariantStatus(value);
                  setVariantPage(1);
                }}
                addLabel={variantPermissions.canAdd ? "Add Item Variant" : undefined}
                onAdd={variantPermissions.canAdd ? openCreateVariant : undefined}
              />
            }
          >
            {variantQuery.isLoading ? (
              <div className="p-5"><LoadingState label="Loading item variants..." /></div>
            ) : variantQuery.isError ? (
              <div className="p-5">
                <ErrorState
                  description="Item variant records could not be loaded."
                  action={<Button variant="outline" onClick={() => variantQuery.refetch()}>Retry</Button>}
                />
              </div>
            ) : !variantRecords.length ? (
              <div className="p-5">
                <EmptyState
                  title="No item variants found"
                  description={`No item variants are currently mapped under ${selectedSubtype.name}.`}
                />
              </div>
            ) : (
              <div className="overflow-x-auto px-5 pb-5 pt-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <Table className="min-w-[820px]">
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>Item Variant</TableHead>
                        <TableHead>Variant Code</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variantRecords.map((record, index) => (
                        <TableRow key={record.id} className="transition-colors hover:bg-slate-50">
                          <TableCell className="text-center text-sm font-medium text-slate-500">
                            {(variantPage - 1) * variantPageSize + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{record.item_name}</div>
                              <div className="line-clamp-2 text-xs text-slate-500">{record.description || "No specification provided"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">{record.item_code || "-"}</span>
                          </TableCell>
                          <TableCell>{record.uom_code}{record.uom_name ? ` - ${record.uom_name}` : ""}</TableCell>
                          <TableCell>{record.item_type === "ADDITIVE" ? "Additive" : record.item_type === "PACKING" ? "Packing" : record.item_type}</TableCell>
                          <TableCell><MasterStatusBadge active={record.is_active} /></TableCell>
                          <TableCell className="text-right">
                            <RowActions
                              onEdit={variantPermissions.canEdit ? () => {
                                setEditingVariant(record);
                                setVariantCodePreview(record.item_code ?? "");
                                variantForm.reset({
                                  code: record.item_code ?? "",
                                  item_name: record.item_name,
                                  category: record.category,
                                  sub_category: record.sub_category,
                                  description: record.description ?? "",
                                  item_type: record.item_type,
                                  uom: record.uom,
                                  hsn_code: record.hsn_code ?? "",
                                  gst_percentage: Number(record.gst_percentage),
                                  minimum_stock: Number(record.minimum_stock),
                                  maximum_stock: Number(record.maximum_stock),
                                  reorder_level: Number(record.reorder_level),
                                  is_active: record.is_active,
                                });
                                setVariantDialogOpen(true);
                              } : undefined}
                              onToggle={variantPermissions.canEdit ? () => setToggleVariantTarget(record) : undefined}
                              onDelete={variantPermissions.canDelete ? () => setDeleteVariantTarget(record) : undefined}
                              isActive={record.is_active}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={variantPage}
                    pageSize={variantPageSize}
                    total={variantQuery.data?.total ?? 0}
                    onPageChange={setVariantPage}
                    onPageSizeChange={setVariantPageSize}
                  />
                </div>
              </div>
            )}
          </ColumnCard>
        ) : isSubtypeDetailView ? (
          <ColumnCard
            eyebrow="Level 2"
            title={`Item Sub Categories in ${selectedCategory.name}`}
            description={`Only the item sub categories linked to ${selectedCategory.name} are shown on this page.`}
            trailing={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-slate-200"
                  onClick={() => navigate(baseRoute)}
                >
                  Back to Item Categories
                </Button>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  Code: {selectedCategory.code}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {subtypeQuery.data?.total ?? 0} visible
                </Badge>
              </>
            }
            toolbar={
              <SearchAndStatusToolbar
                search={subtypeSearch}
                onSearchChange={(value) => {
                  setSubtypeSearch(value);
                  setSubtypePage(1);
                }}
                searchPlaceholder={`Search sub categories in ${selectedCategory.name}`}
                status={subtypeStatus}
                onStatusChange={(value) => {
                  setSubtypeStatus(value);
                  setSubtypePage(1);
                }}
                addLabel={subtypePermissions.canAdd ? "Add Item Sub Category" : undefined}
                onAdd={subtypePermissions.canAdd ? openCreateSubtype : undefined}
              />
            }
          >
            {subtypeQuery.isLoading ? (
              <div className="p-5"><LoadingState label="Loading item sub categories..." /></div>
            ) : subtypeQuery.isError ? (
              <div className="p-5">
                <ErrorState
                  description="Item sub category records could not be loaded."
                  action={<Button variant="outline" onClick={() => subtypeQuery.refetch()}>Retry</Button>}
                />
              </div>
            ) : !subtypeRecords.length ? (
              <div className="p-5">
                <EmptyState
                  title="No item sub categories found"
                  description={`No item sub categories are currently mapped under ${selectedCategory.name}.`}
                />
              </div>
            ) : (
              <div className="overflow-x-auto px-5 pb-5 pt-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <Table className="min-w-[720px]">
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>Sub Category Name</TableHead>
                        <TableHead>Sub Category Code</TableHead>
                        <TableHead>Item Variants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subtypeRecords.map((record, index) => (
                        <TableRow
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                          onClick={() => {
                            setVariantSearch("");
                            setVariantStatus("all");
                            setVariantPage(1);
                            navigate(`${baseRoute}/${record.category}/subtypes/${record.id}`);
                          }}
                        >
                          <TableCell className="text-center text-sm font-medium text-slate-500">
                            {(subtypePage - 1) * subtypePageSize + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{record.name}</div>
                              <div className="line-clamp-1 text-xs text-slate-500">{record.description || "No description provided"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">{record.code}</span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">{record.variant_count}</TableCell>
                          <TableCell><MasterStatusBadge active={record.is_active} /></TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions
                              onEdit={subtypePermissions.canEdit ? () => {
                                setEditingSubtype(record);
                                setSubcategoryCodePreview(record.code);
                                subtypeForm.reset({
                                  category: record.category,
                                  name: record.name,
                                  description: record.description ?? "",
                                  sort_order: record.sort_order,
                                  is_active: record.is_active,
                                });
                                setSubtypeDialogOpen(true);
                              } : undefined}
                              onToggle={subtypePermissions.canEdit ? () => setToggleSubtypeTarget(record) : undefined}
                              onDelete={subtypePermissions.canDelete ? () => setDeleteSubtypeTarget(record) : undefined}
                              isActive={record.is_active}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={subtypePage}
                    pageSize={subtypePageSize}
                    total={subtypeQuery.data?.total ?? 0}
                    onPageChange={setSubtypePage}
                    onPageSizeChange={setSubtypePageSize}
                  />
                </div>
              </div>
            )}
          </ColumnCard>
        ) : (
          <ColumnCard
            eyebrow="Level 1"
            title={mode === "categories" ? "Item Categories" : "Select Item Category"}
            description={
              mode === "categories"
                ? "Start from the main material or item grouping."
                : "Open the required item category to continue to the next master level on a separate page."
            }
            trailing={
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {categoryQuery.data?.total ?? 0} visible
              </Badge>
            }
            toolbar={
              <SearchAndStatusToolbar
                search={categorySearch}
                onSearchChange={(value) => {
                  setCategorySearch(value);
                  setCategoryPage(1);
                }}
                searchPlaceholder="Search item categories by name or code"
                status={categoryStatus}
                onStatusChange={(value) => {
                  setCategoryStatus(value);
                  setCategoryPage(1);
                }}
                addLabel={categoryPermissions.canAdd ? "Add Item Category" : undefined}
                onAdd={categoryPermissions.canAdd ? openCreateCategory : undefined}
              />
            }
          >
            {categoryQuery.isLoading ? (
              <div className="p-5"><LoadingState label="Loading item categories..." /></div>
            ) : categoryQuery.isError ? (
              <div className="p-5">
                <ErrorState
                  description="Item category records could not be loaded."
                  action={<Button variant="outline" onClick={() => categoryQuery.refetch()}>Retry</Button>}
                />
              </div>
            ) : !categoryRecords.length ? (
              <div className="p-5">
                <EmptyState
                  title="No item categories found"
                  description="Create the first item category to establish the hierarchy."
                />
              </div>
            ) : (
              <div className="overflow-x-auto px-5 pb-5 pt-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <Table className="min-w-[720px]">
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">S.No</TableHead>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Category Code</TableHead>
                        <TableHead>Sub Categories</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRecords.map((record, index) => (
                        <TableRow
                          key={record.id}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                          onClick={() => {
                            setSubtypeSearch("");
                            setSubtypeStatus("all");
                            setSubtypePage(1);
                            setVariantSearch("");
                            setVariantStatus("all");
                            setVariantPage(1);
                            navigate(`${baseRoute}/${record.id}`);
                          }}
                        >
                          <TableCell className="text-center text-sm font-medium text-slate-500">
                            {(categoryPage - 1) * categoryPageSize + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{record.name}</div>
                              <div className="line-clamp-1 text-xs text-slate-500">{record.description || "No description provided"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">{record.code}</span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">{record.subtype_count}</TableCell>
                          <TableCell><MasterStatusBadge active={record.is_active} /></TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions
                              onEdit={categoryPermissions.canEdit ? () => {
                                setEditingCategory(record);
                                setCategoryCodePreview(record.code);
                                categoryForm.reset({
                                  name: record.name,
                                  description: record.description ?? "",
                                  sort_order: record.sort_order,
                                  is_active: record.is_active,
                                });
                                setCategoryDialogOpen(true);
                              } : undefined}
                              onToggle={categoryPermissions.canEdit ? () => setToggleCategoryTarget(record) : undefined}
                              onDelete={categoryPermissions.canDelete ? () => setDeleteCategoryTarget(record) : undefined}
                              isActive={record.is_active}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={categoryPage}
                    pageSize={categoryPageSize}
                    total={categoryQuery.data?.total ?? 0}
                    onPageChange={setCategoryPage}
                    onPageSizeChange={setCategoryPageSize}
                  />
                </div>
              </div>
            )}
          </ColumnCard>
        )
      ) : hierarchyQuery.isLoading ? (
        <LoadingState label="Loading hierarchy..." />
      ) : (
        <ErrorState description={getApiErrorMessage(hierarchyQuery.error, "Unable to load the item hierarchy.")} />
      )}

      <MasterFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title={editingCategory ? "Edit Item Category" : "Create Item Category"}
        description="Maintain the main grouping for sub categories and item variants."
      >
        <ProductTypeCategoryForm
          codePreview={editingCategory?.code ?? categoryCodePreview}
          form={categoryForm}
          isSubmitting={productTypeMutations.createCategory.isPending || productTypeMutations.updateCategory.isPending}
          submitLabel={editingCategory ? "Save Item Category" : "Create Item Category"}
          onSubmit={async (values) => {
            if (editingCategory) {
              await productTypeMutations.updateCategory.mutateAsync({ id: editingCategory.id, payload: values });
            } else {
              await productTypeMutations.createCategory.mutateAsync(values as ProductTypeCategoryWritePayload);
            }
            setCategoryDialogOpen(false);
            categoryForm.reset(categoryDefaultValues);
          }}
        />
      </MasterFormDialog>

      <MasterFormDialog
        open={subtypeDialogOpen}
        onOpenChange={setSubtypeDialogOpen}
        title={editingSubtype ? "Edit Item Sub Category" : "Create Item Sub Category"}
        description="Link each item sub category to its parent item category."
      >
        <ProductTypeSubtypeForm
          categoryLocked={Boolean(selectedCategoryId)}
          categoryOptions={categoryOptions}
          codePreview={editingSubtype?.code ?? subcategoryCodePreview}
          form={subtypeForm}
          isSubmitting={productTypeMutations.createSubtype.isPending || productTypeMutations.updateSubtype.isPending}
          submitLabel={editingSubtype ? "Save Item Sub Category" : "Create Item Sub Category"}
          onSubmit={async (values) => {
            if (editingSubtype) {
              await productTypeMutations.updateSubtype.mutateAsync({ id: editingSubtype.id, payload: values });
            } else {
              await productTypeMutations.createSubtype.mutateAsync(values as ProductTypeSubtypeWritePayload);
            }
            setSubtypeDialogOpen(false);
            subtypeForm.reset({
              ...subtypeDefaultValues,
              category: selectedCategoryId ?? categoryOptions[0]?.id ?? 0,
            });
          }}
        />
      </MasterFormDialog>

      <MasterFormDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        title={editingVariant ? "Edit Item Variant" : "Create Item Variant"}
        description="Capture the actual item specification under the selected item sub category."
      >
        <ItemVariantForm
          categoryOptions={categoryOptions}
          subCategoryOptions={variantSubCategoryOptions}
          unitOptions={unitLookupQuery.data ?? []}
          codePreview={editingVariant?.item_code ?? variantCodePreview}
          form={variantForm}
          isSubmitting={createVariantMutation.isPending || updateVariantMutation.isPending}
          submitLabel={editingVariant ? "Save Item Variant" : "Create Item Variant"}
          onSubmit={async (values) => {
            const payload: ItemMasterWritePayload = {
              item_name: values.item_name,
              sub_category: values.sub_category,
              description: values.description,
              item_type: values.item_type,
              uom: values.uom,
              hsn_code: values.hsn_code,
              gst_percentage: values.gst_percentage,
              minimum_stock: values.minimum_stock,
              maximum_stock: values.maximum_stock,
              reorder_level: values.reorder_level,
              is_active: values.is_active,
            };

            if (editingVariant) {
              await updateVariantMutation.mutateAsync({ id: editingVariant.id, payload });
            } else {
              await createVariantMutation.mutateAsync(payload);
            }

            setVariantDialogOpen(false);
            variantForm.reset({
              ...variantDefaultValues,
              category: selectedCategoryId ?? categoryOptions[0]?.id ?? 0,
              sub_category:
                selectedSubtypeId ??
                hierarchyQuery.data?.find((record) => record.id === (selectedCategoryId ?? categoryOptions[0]?.id))?.subtypes[0]?.id ??
                0,
            });
          }}
        />
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleCategoryTarget)}
        onOpenChange={(open) => !open && setToggleCategoryTarget(null)}
        title="Update item category status"
        description={`Change the status for "${toggleCategoryTarget?.name ?? "this item category"}"?`}
        onConfirm={() => {
          if (toggleCategoryTarget) {
            productTypeMutations.toggleCategory.mutate(toggleCategoryTarget.id);
          }
          setToggleCategoryTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
        title="Delete item category"
        description={`Delete "${deleteCategoryTarget?.name ?? "this item category"}"? Existing sub categories and variants must be cleared first.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteCategoryTarget) {
            if (deleteCategoryTarget.id === selectedCategoryId) {
              navigate(baseRoute);
            }
            productTypeMutations.deleteCategory.mutate(deleteCategoryTarget.id);
          }
          setDeleteCategoryTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(toggleSubtypeTarget)}
        onOpenChange={(open) => !open && setToggleSubtypeTarget(null)}
        title="Update item sub category status"
        description={`Change the status for "${toggleSubtypeTarget?.name ?? "this item sub category"}"?`}
        onConfirm={() => {
          if (toggleSubtypeTarget) {
            productTypeMutations.toggleSubtype.mutate(toggleSubtypeTarget.id);
          }
          setToggleSubtypeTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteSubtypeTarget)}
        onOpenChange={(open) => !open && setDeleteSubtypeTarget(null)}
        title="Delete item sub category"
        description={`Delete "${deleteSubtypeTarget?.name ?? "this item sub category"}"? Existing item variants must be cleared first.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteSubtypeTarget) {
            if (deleteSubtypeTarget.id === selectedSubtypeId && selectedCategoryId) {
              navigate(`${baseRoute}/${selectedCategoryId}`);
            }
            productTypeMutations.deleteSubtype.mutate(deleteSubtypeTarget.id);
          }
          setDeleteSubtypeTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(toggleVariantTarget)}
        onOpenChange={(open) => !open && setToggleVariantTarget(null)}
        title="Update item variant status"
        description={`Change the status for "${toggleVariantTarget?.item_name ?? "this item variant"}"?`}
        onConfirm={() => {
          if (toggleVariantTarget) {
            toggleVariantMutation.mutate(toggleVariantTarget.id);
          }
          setToggleVariantTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteVariantTarget)}
        onOpenChange={(open) => !open && setDeleteVariantTarget(null)}
        title="Delete item variant"
        description={`Delete "${deleteVariantTarget?.item_name ?? "this item variant"}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteVariantTarget) {
            deleteVariantMutation.mutate(deleteVariantTarget.id);
          }
          setDeleteVariantTarget(null);
        }}
      />
    </div>
  );
};

export default ItemHierarchyPage;
