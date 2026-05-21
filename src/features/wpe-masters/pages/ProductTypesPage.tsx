import { zodResolver } from "@hookform/resolvers/zod";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMatch, useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/QueryState";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import ProductCategoryList from "@/features/wpe-masters/components/product-types/ProductCategoryList";
import ProductSubtypePanel from "@/features/wpe-masters/components/product-types/ProductSubtypePanel";
import ProductTypesStats from "@/features/wpe-masters/components/product-types/ProductTypesStats";
import ProductTypeCategoryForm from "@/features/wpe-masters/components/ProductTypeCategoryForm";
import ProductTypeSubtypeForm from "@/features/wpe-masters/components/ProductTypeSubtypeForm";
import { WPE_PRODUCT_TYPES_ROUTE, WPE_PRODUCT_TYPES_TITLE } from "@/features/wpe-masters/constants";
import {
  useProductTypeCategoriesQuery,
  useProductTypeCategoryLookupQuery,
  useProductTypeMutations,
  useProductTypePermissions,
  useProductTypeSubtypesQuery,
  useProductTypeTreeQuery,
} from "@/features/wpe-masters/hooks/useProductTypes";
import {
  productTypeCategorySchema,
  productTypeSubtypeSchema,
  type ProductTypeCategoryFormValues,
  type ProductTypeSubtypeFormValues,
} from "@/features/wpe-masters/schemas/productTypes";
import type {
  ProductTypeCategoryRecord,
  ProductTypeCategoryWritePayload,
  ProductTypeStatusFilterValue,
  ProductTypeSubtypeRecord,
  ProductTypeSubtypeWritePayload,
  ProductTypeTreeCategoryRecord,
} from "@/features/wpe-masters/types";

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

const toApiStatusFilter = (value: ProductTypeStatusFilterValue) => {
  if (value === "active") return true;
  if (value === "inactive") return false;
  return undefined;
};

const ProductTypesPage = () => {
  const navigate = useNavigate();
  const categoryDetailMatch = useMatch(`${WPE_PRODUCT_TYPES_ROUTE}/:categoryId`);
  const permissions = useProductTypePermissions();
  const mutations = useProductTypeMutations();

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [categoryStatus, setCategoryStatus] = useState<ProductTypeStatusFilterValue>("all");

  const [subtypeSearch, setSubtypeSearch] = useState("");
  const [subtypePage, setSubtypePage] = useState(1);
  const [subtypePageSize, setSubtypePageSize] = useState(10);
  const [subtypeStatus, setSubtypeStatus] = useState<ProductTypeStatusFilterValue>("all");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subtypeDialogOpen, setSubtypeDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductTypeCategoryRecord | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<ProductTypeSubtypeRecord | null>(null);
  const [toggleCategoryTarget, setToggleCategoryTarget] = useState<ProductTypeCategoryRecord | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ProductTypeCategoryRecord | null>(null);
  const [toggleSubtypeTarget, setToggleSubtypeTarget] = useState<ProductTypeSubtypeRecord | null>(null);
  const [deleteSubtypeTarget, setDeleteSubtypeTarget] = useState<ProductTypeSubtypeRecord | null>(null);

  const deferredCategorySearch = useDeferredValue(categorySearch.trim());
  const deferredSubtypeSearch = useDeferredValue(subtypeSearch.trim());

  const categoryForm = useForm<ProductTypeCategoryFormValues>({
    resolver: zodResolver(productTypeCategorySchema),
    defaultValues: categoryDefaultValues,
  });

  const subtypeForm = useForm<ProductTypeSubtypeFormValues>({
    resolver: zodResolver(productTypeSubtypeSchema),
    defaultValues: subtypeDefaultValues,
  });

  const categoryQuery = useProductTypeCategoriesQuery(
    {
      page: categoryPage,
      pageSize: categoryPageSize,
      search: deferredCategorySearch,
      ordering: "sort_order",
      is_active: toApiStatusFilter(categoryStatus),
    },
    permissions.canView,
  );

  const selectedCategoryId = useMemo(() => {
    const rawValue = categoryDetailMatch?.params.categoryId;
    if (!rawValue) {
      return null;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }, [categoryDetailMatch?.params.categoryId]);

  const subtypeQuery = useProductTypeSubtypesQuery(
    {
      page: subtypePage,
      pageSize: subtypePageSize,
      search: deferredSubtypeSearch,
      ordering: "sort_order",
      is_active: toApiStatusFilter(subtypeStatus),
      category_id: selectedCategoryId ?? undefined,
    },
    permissions.canView && Boolean(selectedCategoryId),
  );

  const categoryLookupQuery = useProductTypeCategoryLookupQuery(permissions.canView);
  const hierarchyQuery = useProductTypeTreeQuery("", permissions.canView);
  const isCategoryDetailView = Boolean(categoryDetailMatch);

  const categoryOptions = categoryLookupQuery.data ?? [];

  const summary = useMemo(() => {
    const categories = hierarchyQuery.data ?? [];

    return {
      categories: categories.length,
      activeCategories: categories.filter((entry) => entry.is_active).length,
      subtypes: categories.reduce((total, category) => total + category.subtypes.length, 0),
      activeSubtypes: categories.reduce(
        (total, category) => total + category.subtypes.filter((entry) => entry.is_active).length,
        0,
      ),
    };
  }, [hierarchyQuery.data]);

  const selectedCategory = useMemo<ProductTypeTreeCategoryRecord | ProductTypeCategoryRecord | null>(() => {
    if (!selectedCategoryId) {
      return null;
    }

    return (
      categoryQuery.data?.items.find((record) => record.id === selectedCategoryId) ??
      hierarchyQuery.data?.find((record) => record.id === selectedCategoryId) ??
      null
    );
  }, [selectedCategoryId, categoryQuery.data?.items, hierarchyQuery.data]);

  const activeSubtypeCount = useMemo(() => {
    if (!selectedCategoryId) {
      return 0;
    }

    const category = hierarchyQuery.data?.find((record) => record.id === selectedCategoryId);
    if (!category) {
      return 0;
    }

    return category.subtypes.filter((entry) => entry.is_active).length;
  }, [selectedCategoryId, hierarchyQuery.data]);

  useEffect(() => {
    if (isCategoryDetailView && hierarchyQuery.data && !hierarchyQuery.isLoading && !selectedCategory) {
      navigate(WPE_PRODUCT_TYPES_ROUTE, { replace: true });
    }
  }, [
    isCategoryDetailView,
    navigate,
    selectedCategory,
    hierarchyQuery.data,
    hierarchyQuery.isLoading,
  ]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset(categoryDefaultValues);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (record: ProductTypeCategoryRecord) => {
    setEditingCategory(record);
    categoryForm.reset({
      name: record.name,
      description: record.description ?? "",
      sort_order: record.sort_order,
      is_active: record.is_active,
    });
    setCategoryDialogOpen(true);
  };

  const openCreateSubtype = () => {
    setEditingSubtype(null);
    subtypeForm.reset({
      ...subtypeDefaultValues,
      category: selectedCategoryId ?? categoryOptions[0]?.id ?? 0,
    });
    setSubtypeDialogOpen(true);
  };

  const openEditSubtype = (record: ProductTypeSubtypeRecord) => {
    setEditingSubtype(record);
    subtypeForm.reset({
      category: record.category,
      name: record.name,
      description: record.description ?? "",
      sort_order: record.sort_order,
      is_active: record.is_active,
    });
    setSubtypeDialogOpen(true);
  };

  if (!permissions.canView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={WPE_PRODUCT_TYPES_TITLE}
          description="Product type governance is limited to users with explicit WPE master access."
        />
        <ErrorState
          title="Permission required"
          description="You do not have access to view Product Types. Ask an administrator to grant the Product Types Master screen permission."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={WPE_PRODUCT_TYPES_TITLE}
        description={
          isCategoryDetailView
            ? `Manage subtypes under ${selectedCategory?.name ?? "the selected category"} in a dedicated workspace.`
            : "Manage the master category hierarchy. Click a category to open its subtype workspace."
        }
      />

      {isCategoryDetailView ? (
        selectedCategory ? (
          <ProductSubtypePanel
            selectedCategory={selectedCategory}
            activeSubtypeCount={activeSubtypeCount}
            records={subtypeQuery.data?.items ?? []}
            isLoading={subtypeQuery.isLoading}
            isError={subtypeQuery.isError}
            errorDescription="Product type subtypes could not be loaded."
            search={subtypeSearch}
            onSearchChange={(value) => {
              setSubtypeSearch(value);
              setSubtypePage(1);
            }}
            status={subtypeStatus}
            onStatusChange={(value) => {
              setSubtypeStatus(value);
              setSubtypePage(1);
            }}
            page={subtypePage}
            pageSize={subtypePageSize}
            total={subtypeQuery.data?.total ?? 0}
            onPageChange={setSubtypePage}
            onPageSizeChange={setSubtypePageSize}
            onRetry={() => subtypeQuery.refetch()}
            onCreateSubtype={openCreateSubtype}
            onEditCategory={permissions.canEdit ? openEditCategory : undefined}
            onToggleCategory={permissions.canEdit ? setToggleCategoryTarget : undefined}
            onDeleteCategory={permissions.canDelete ? setDeleteCategoryTarget : undefined}
            onEditSubtype={permissions.canEdit ? openEditSubtype : undefined}
            onToggleSubtype={permissions.canEdit ? setToggleSubtypeTarget : undefined}
            onDeleteSubtype={permissions.canDelete ? setDeleteSubtypeTarget : undefined}
            onBackToCategories={() => navigate(WPE_PRODUCT_TYPES_ROUTE)}
            canAdd={permissions.canAdd}
          />
        ) : (
          <LoadingState label="Loading subtype workspace..." />
        )
      ) : (
        <>
          <ProductTypesStats isLoading={hierarchyQuery.isLoading} summary={summary} />
          <ProductCategoryList
            records={categoryQuery.data?.items ?? []}
            isLoading={categoryQuery.isLoading}
            isError={categoryQuery.isError}
            errorDescription="Product type categories could not be loaded."
            search={categorySearch}
            onSearchChange={(value) => {
              setCategorySearch(value);
              setCategoryPage(1);
            }}
            status={categoryStatus}
            onStatusChange={(value) => {
              setCategoryStatus(value);
              setCategoryPage(1);
            }}
            onSelectCategory={(record) => {
              setSubtypePage(1);
              setSubtypeSearch("");
              setSubtypeStatus("all");
              navigate(`${WPE_PRODUCT_TYPES_ROUTE}/${record.id}`);
            }}
            page={categoryPage}
            pageSize={categoryPageSize}
            total={categoryQuery.data?.total ?? 0}
            onPageChange={setCategoryPage}
            onPageSizeChange={setCategoryPageSize}
            onRetry={() => categoryQuery.refetch()}
            onCreateCategory={openCreateCategory}
            onEditCategory={permissions.canEdit ? openEditCategory : undefined}
            onToggleCategory={permissions.canEdit ? setToggleCategoryTarget : undefined}
            onDeleteCategory={permissions.canDelete ? setDeleteCategoryTarget : undefined}
            canAdd={permissions.canAdd}
          />
        </>
      )}

      <MasterFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title={editingCategory ? "Edit Product Type Category" : "Create Product Type Category"}
        description="Categories are the governed parent nodes for all product-type subtype mappings."
      >
        <ProductTypeCategoryForm
          form={categoryForm}
          isSubmitting={mutations.createCategory.isPending || mutations.updateCategory.isPending}
          submitLabel={editingCategory ? "Save Category" : "Create Category"}
          onSubmit={async (values) => {
            if (editingCategory) {
              await mutations.updateCategory.mutateAsync({ id: editingCategory.id, payload: values });
            } else {
              await mutations.createCategory.mutateAsync(values as ProductTypeCategoryWritePayload);
            }

            setCategoryDialogOpen(false);
            categoryForm.reset(categoryDefaultValues);
          }}
        />
      </MasterFormDialog>

      <MasterFormDialog
        open={subtypeDialogOpen}
        onOpenChange={setSubtypeDialogOpen}
        title={editingSubtype ? "Edit Product Type Subtype" : "Create Product Type Subtype"}
        description="Subtypes stay normalized under a single category and become reusable lookup values across the ERP."
      >
        <ProductTypeSubtypeForm
          categoryOptions={categoryOptions}
          form={subtypeForm}
          isSubmitting={mutations.createSubtype.isPending || mutations.updateSubtype.isPending}
          submitLabel={editingSubtype ? "Save Subtype" : "Create Subtype"}
          onSubmit={async (values) => {
            if (editingSubtype) {
              await mutations.updateSubtype.mutateAsync({ id: editingSubtype.id, payload: values });
            } else {
              await mutations.createSubtype.mutateAsync(values as ProductTypeSubtypeWritePayload);
            }

            setSubtypeDialogOpen(false);
            subtypeForm.reset({
              ...subtypeDefaultValues,
              category: selectedCategoryId ?? categoryOptions[0]?.id ?? 0,
            });
          }}
        />
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleCategoryTarget)}
        onOpenChange={(open) => !open && setToggleCategoryTarget(null)}
        title="Update category status"
        description={`Change the status for "${toggleCategoryTarget?.name ?? "this category"}"?`}
        onConfirm={() => {
          if (toggleCategoryTarget) {
            mutations.toggleCategory.mutate(toggleCategoryTarget.id);
          }

          setToggleCategoryTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
        title="Delete category"
        description={`Delete "${deleteCategoryTarget?.name ?? "this category"}"? Existing subtype references must be cleared first.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteCategoryTarget) {
            if (deleteCategoryTarget.id === selectedCategoryId) {
              navigate(WPE_PRODUCT_TYPES_ROUTE);
            }
            mutations.deleteCategory.mutate(deleteCategoryTarget.id);
          }

          setDeleteCategoryTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(toggleSubtypeTarget)}
        onOpenChange={(open) => !open && setToggleSubtypeTarget(null)}
        title="Update subtype status"
        description={`Change the status for "${toggleSubtypeTarget?.name ?? "this subtype"}"?`}
        onConfirm={() => {
          if (toggleSubtypeTarget) {
            mutations.toggleSubtype.mutate(toggleSubtypeTarget.id);
          }

          setToggleSubtypeTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteSubtypeTarget)}
        onOpenChange={(open) => !open && setDeleteSubtypeTarget(null)}
        title="Delete subtype"
        description={`Delete "${deleteSubtypeTarget?.name ?? "this subtype"}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteSubtypeTarget) {
            mutations.deleteSubtype.mutate(deleteSubtypeTarget.id);
          }

          setDeleteSubtypeTarget(null);
        }}
      />
    </div>
  );
};

export default ProductTypesPage;
