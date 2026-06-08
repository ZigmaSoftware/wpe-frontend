import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import PermissionRouteGuard from "@/components/PermissionRouteGuard";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LocationMasterPage from "@/features/wpe-masters/pages/LocationMasterPage";
import BranchMasterPage from "@/features/wpe-masters/pages/BranchMasterPage";
import PriceBookMasterPage from "@/features/wpe-masters/pages/PriceBookMasterPage";
import WarehouseMasterPage from "@/features/wpe-masters/pages/WarehouseMasterPage";
import ProductionTypeMasterPage from "@/features/wpe-masters/pages/ProductionTypeMasterPage";
import ProductTypesPage from "@/features/wpe-masters/pages/ProductTypesPage";
import SaleTypeMasterPage from "@/features/wpe-masters/pages/SaleTypeMasterPage";
import PurchaseTypeMasterPage from "@/features/wpe-masters/pages/PurchaseTypeMasterPage";
import RoleMasterPage from "@/features/wpe-masters/pages/RoleMasterPage";
import DepartmentMasterPage from "@/features/wpe-masters/pages/DepartmentMasterPage";
import DesignationMasterPage from "@/features/wpe-masters/pages/DesignationMasterPage";
import InventoryStoreMastersLandingPage from "@/features/wpe-masters/pages/InventoryStoreMastersLandingPage";
import StoreMasterPage from "@/features/wpe-masters/pages/StoreMasterPage";
import UnitMasterPage from "@/features/wpe-masters/pages/UnitMasterPage";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";
import ProductionMastersLandingPage from "@/features/production-masters/pages/ProductionMastersLandingPage";
import ProfileCreationsPage from "@/features/production-masters/pages/ProfileCreationsPage";
import ProfileSizesPage from "@/features/production-masters/pages/ProfileSizesPage";
import ColorCreationsPage from "@/features/production-masters/pages/ColorCreationsPage";
import MachineCreationsPage from "@/features/production-masters/pages/MachineCreationsPage";
import WorkCentreCreationsPage from "@/features/production-masters/pages/WorkCentreCreationsPage";
import ProductionLinePage from "@/features/production-masters/pages/ProductionLinePage";
import BinCreationPage from "@/features/production-masters/pages/BinCreationPage";
import BagCreationPage from "@/features/production-masters/pages/BagCreationPage";
import PackingTypePage from "@/features/production-masters/pages/PackingTypePage";
import PackingMaterialPage from "@/features/production-masters/pages/PackingMaterialPage";
import { PRODUCTION_MASTERS_ROUTE } from "@/features/production-masters/utils/routes";
import DeviceLabelMastersLandingPage from "@/features/device-label-masters/pages/DeviceLabelMastersLandingPage";
import WeighmentScaleCreationPage from "@/features/device-label-masters/pages/WeighmentScaleCreationPage";
import PrinterCreationPage from "@/features/device-label-masters/pages/PrinterCreationPage";
import QRLabelTemplatePage from "@/features/device-label-masters/pages/QRLabelTemplatePage";
import SerialPortConfigurationPage from "@/features/device-label-masters/pages/SerialPortConfigurationPage";
import { DEVICE_LABEL_MASTERS_ROUTE } from "@/features/device-label-masters/utils/routes";
import RecipeBomMastersLandingPage from "@/features/recipe-bom-masters/pages/RecipeBomMastersLandingPage";
import RecipeCreationPage from "@/features/recipe-bom-masters/pages/RecipeCreationPage";
import RecipeItemCreationPage from "@/features/recipe-bom-masters/pages/RecipeItemCreationPage";
import BOMCreationPage from "@/features/recipe-bom-masters/pages/BOMCreationPage";
import BOMItemCreationPage from "@/features/recipe-bom-masters/pages/BOMItemCreationPage";
import { RECIPE_BOM_MASTERS_ROUTE } from "@/features/recipe-bom-masters/utils/routes";
import AdminMastersLandingPage from "@/features/admin-master/pages/AdminMastersLandingPage";
import MainScreensPage from "@/features/admin-master/pages/MainScreensPage";
import ScreenSectionsPage from "@/features/admin-master/pages/ScreenSectionsPage";
import StaffCreationPage from "@/features/admin-master/pages/StaffCreationPage";
import UserCreationPage from "@/features/admin-master/pages/UserCreationPage";
import UserScreenPermissionAssignmentPage from "@/features/admin-master/pages/UserScreenPermissionAssignmentPage";
import UserScreenPermissionPage from "@/features/admin-master/pages/UserScreenPermissionPage";
import UserScreensPage from "@/features/admin-master/pages/UserScreensPage";
import UserTypesPage from "@/features/admin-master/pages/UserTypesPage";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  BLENDING_ROUTE,
  BLENDING_STOCK_ROUTE,
  BLENDING_STORE_REQUEST_ROUTE,
  BLENDING_TRANSACTIONS_ROUTE,
} from "@/features/blending/utils/routes";
import BlendingPage from "@/pages/BlendingPage";
import BlendingStockItemPage from "@/pages/BlendingStockItemPage";
import BlendingTransactionPage from "@/pages/BlendingTransactionPage";
import ContactsPage from "@/pages/ContactsPage";
import ContactFormPage from "@/pages/ContactFormPage";
import DashboardPage from "@/pages/DashboardPage";
import GRNCreatePage from "@/pages/GRNCreatePage";
import GRNDetailPage from "@/pages/GRNDetailPage";
import GRNEditPage from "@/pages/GRNEditPage";
import RegrindPage from "@/pages/RegrindPage";
import CompaniesPage from "@/features/common-master/pages/CompaniesPage";
import CommonMastersLandingPage from "@/features/common-master/pages/CommonMastersLandingPage";
import ContinentsPage from "@/features/common-master/pages/ContinentsPage";
import CountriesPage from "@/features/common-master/pages/CountriesPage";
import CitiesPage from "@/features/common-master/pages/CitiesPage";
import CurrenciesPage from "@/features/common-master/pages/CurrenciesPage";
import CustomerDetailPage from "@/features/common-master/pages/CustomerDetailPage";
import CustomersPage from "@/features/common-master/pages/CustomersPage";
import ProjectsPage from "@/features/common-master/pages/ProjectsPage";
import StatesPage from "@/features/common-master/pages/StatesPage";
import SupplierDetailPage from "@/features/common-master/pages/SupplierDetailPage";
import SuppliersPage from "@/features/common-master/pages/SuppliersPage";
import TaxesPage from "@/features/common-master/pages/TaxesPage";
import {
  BLENDING_INVENTORY_ROUTE,
  INVENTORY_ROUTE,
  PRODUCTION_INVENTORY_ROUTE,
  STORE_INVENTORY_ROUTE,
} from "@/features/items/utils/routes";
import GRNPage from "@/pages/GRNPage";
import ItemsPage from "@/pages/ItemsPage";
import ProductionInventoryPage from "@/pages/ProductionInventoryPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import ProductionManageBatchPage from "@/pages/ProductionManageBatchPage";
import ProductionEditOrderPage from "@/pages/ProductionEditOrderPage";
import ProductionNewOrderPage from "@/pages/ProductionNewOrderPage";
import ProductionPage from "@/pages/ProductionPage";
import ProductionStagePage from "@/pages/ProductionStagePage";
import StorePage from "@/pages/StorePage";
import StoreStockItemPage from "@/pages/StoreStockItemPage";
import {
  GRN_PROCESS_CREATE_ROUTE,
  GRN_PROCESS_ROUTE,
  GRN_ROUTE,
  GRN_STATUS_ROUTE,
  getGrnProcessDetailRoute,
  getGrnProcessEditRoute,
  getGrnProcessViewRoute,
} from "@/features/grn/utils/routes";
import {
  STORE_REQUEST_ROUTE,
  STORE_ROUTE,
  STORE_STOCK_ROUTE,
  STORE_TRANSACTIONS_ROUTE,
} from "@/features/store/utils/routes";
import {
  PRODUCTION_AD_WEIGHTAGE_ROUTE,
  PRODUCTION_BL_BLENDING_ROUTE,
  PRODUCTION_GL_GRANULATION_ROUTE,
  PRODUCTION_PR_PRODUCTION_ROUTE,
  PRODUCTION_ROUTE,
} from "@/features/production/utils/routes";
import { buildAppNavigation } from "@/lib/appNavigation";
import {
  ADMIN_SCREEN_CODES,
  COMMON_MASTER_SCREEN_CODES,
  DASHBOARD_SCREEN_CODES,
  DEVICE_LABEL_MASTER_SCREEN_CODES,
  INVENTORY_STORE_MASTER_SCREEN_CODES,
  PRODUCTION_MASTER_SCREEN_CODES,
  RECIPE_BOM_MASTER_SCREEN_CODES,
  WORKSPACE_SCREEN_CODES,
  appRouteScreenCodeGroups,
} from "@/lib/routePermissions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LegacyGrnDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? getGrnProcessDetailRoute(id) : GRN_PROCESS_ROUTE} replace />;
};

const LegacyGrnEditRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? getGrnProcessEditRoute(id) : GRN_PROCESS_ROUTE} replace />;
};

const LegacyGrnViewRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? getGrnProcessViewRoute(id) : GRN_PROCESS_ROUTE} replace />;
};

const LegacyProductSubtypeRedirect = () => {
  const { categoryId, subtypeId } = useParams<{ categoryId?: string; subtypeId?: string }>();

  if (categoryId && subtypeId) {
    return <Navigate to={`${WPE_PRODUCT_TYPES_ROUTE}/${categoryId}/subtypes/${subtypeId}`} replace />;
  }

  if (categoryId) {
    return <Navigate to={`${WPE_PRODUCT_TYPES_ROUTE}/${categoryId}`} replace />;
  }

  return <Navigate to={WPE_PRODUCT_TYPES_ROUTE} replace />;
};

const LegacyItemVariantRedirect = () => {
  const { categoryId, subtypeId } = useParams<{ categoryId?: string; subtypeId?: string }>();

  if (categoryId && subtypeId) {
    return <Navigate to={`${WPE_PRODUCT_TYPES_ROUTE}/${categoryId}/subtypes/${subtypeId}`} replace />;
  }

  if (categoryId) {
    return <Navigate to={`${WPE_PRODUCT_TYPES_ROUTE}/${categoryId}`} replace />;
  }

  return <Navigate to={WPE_PRODUCT_TYPES_ROUTE} replace />;
};

const WorkspaceGroupRedirect = ({ groupKey, fallback }: { groupKey: string; fallback: string }) => {
  const { adminMenu = [], user } = useAuth();
  const navigation = useMemo(
    () => buildAppNavigation(adminMenu, { hasFullAccess: Boolean(user?.is_staff) }),
    [adminMenu, user?.is_staff],
  );

  const target = navigation.workspace.find((group) => group.key === groupKey)?.items[0]?.to ?? fallback;
  return <Navigate to={target} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route element={<AuthGuard />}>
                <Route element={<AppLayout />}>
                  <Route element={<PermissionRouteGuard screenCodes={DASHBOARD_SCREEN_CODES} />}>
                    <Route path="/app" element={<DashboardPage />} />
                    <Route path="/app/dashboard" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.contacts} />}>
                    <Route path="/app/contacts" element={<ContactsPage />} />
                    <Route path="/app/contacts/new" element={<ContactFormPage />} />
                    <Route path="/app/contacts/:id/edit" element={<ContactFormPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.inventoryWorkspace} />}>
                    <Route path={INVENTORY_ROUTE} element={<WorkspaceGroupRedirect groupKey="inventory" fallback={STORE_INVENTORY_ROUTE} />} />
                    <Route path={BLENDING_INVENTORY_ROUTE} element={<ItemsPage module="blending" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.storeInventory} />}>
                    <Route path={STORE_INVENTORY_ROUTE} element={<ItemsPage module="store" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionInventory} />}>
                    <Route path={PRODUCTION_INVENTORY_ROUTE} element={<ProductionInventoryPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.blendingWorkspace} />}>
                    <Route path={BLENDING_ROUTE} element={<WorkspaceGroupRedirect groupKey="blending" fallback={BLENDING_STOCK_ROUTE} />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.blendingStock} />}>
                    <Route path={BLENDING_STOCK_ROUTE} element={<BlendingPage module="stock" />} />
                    <Route path={`${BLENDING_STOCK_ROUTE}/:itemId`} element={<BlendingStockItemPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.blendingStoreRequest} />}>
                    <Route path={BLENDING_STORE_REQUEST_ROUTE} element={<BlendingPage module="requests" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.blendingTransactions} />}>
                    <Route path={BLENDING_TRANSACTIONS_ROUTE} element={<BlendingPage module="transactions" />} />
                    <Route path={`${BLENDING_TRANSACTIONS_ROUTE}/:requestId`} element={<BlendingTransactionPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionAdWeightage} />}>
                    <Route path="/app/production/neworder" element={<ProductionNewOrderPage />} />
                    <Route path="/app/production/manage-batch/:orderId" element={<ProductionManageBatchPage />} />
                    <Route path="/app/production/:id/edit" element={<ProductionEditOrderPage />} />
                    <Route path={PRODUCTION_AD_WEIGHTAGE_ROUTE} element={<ProductionPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.productionWorkspace} />}>
                    <Route path={PRODUCTION_ROUTE} element={<WorkspaceGroupRedirect groupKey="production" fallback={PRODUCTION_AD_WEIGHTAGE_ROUTE} />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionBlBlending} />}>
                    <Route path={PRODUCTION_BL_BLENDING_ROUTE} element={<ProductionStagePage stage="BL" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionGlGranulation} />}>
                    <Route path={PRODUCTION_GL_GRANULATION_ROUTE} element={<ProductionStagePage stage="GL" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionPrProduction} />}>
                    <Route path={PRODUCTION_PR_PRODUCTION_ROUTE} element={<ProductionStagePage stage="PR" />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.regrind} />}>
                    <Route path="/app/regrind" element={<RegrindPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.storeWorkspace} />}>
                    <Route path={STORE_ROUTE} element={<WorkspaceGroupRedirect groupKey="store" fallback={STORE_STOCK_ROUTE} />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.storeStock} />}>
                    <Route path={STORE_STOCK_ROUTE} element={<StorePage module="stock" />} />
                    <Route path={`${STORE_STOCK_ROUTE}/:itemId`} element={<StoreStockItemPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.storeRequest} />}>
                    <Route path={STORE_REQUEST_ROUTE} element={<StorePage module="requests" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.storeTransactions} />}>
                    <Route path={STORE_TRANSACTIONS_ROUTE} element={<StorePage module="transactions" />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.machineCreations} />}>
                    <Route path="/oims/machines" element={<Navigate to={`${PRODUCTION_MASTERS_ROUTE}/machine-creations`} replace />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={RECIPE_BOM_MASTER_SCREEN_CODES.recipeItemCreations} />}>
                    <Route path="/oims/bom-variants" element={<Navigate to={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`} replace />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.grnProcess} />}>
                    <Route path={GRN_PROCESS_CREATE_ROUTE} element={<GRNCreatePage />} />
                    <Route path={getGrnProcessEditRoute(":id")} element={<GRNEditPage />} />
                    <Route path={getGrnProcessViewRoute(":id")} element={<GRNDetailPage />} />
                    <Route path={getGrnProcessDetailRoute(":id")} element={<GRNDetailPage />} />
                    <Route path={GRN_PROCESS_ROUTE} element={<GRNPage module="process" />} />
                    <Route path="/app/grn/new" element={<Navigate to={GRN_PROCESS_CREATE_ROUTE} replace />} />
                    <Route path="/app/grn/:id/edit" element={<LegacyGrnEditRedirect />} />
                    <Route path="/app/grn/:id/view" element={<LegacyGrnViewRedirect />} />
                    <Route path="/app/grn/:id" element={<LegacyGrnDetailRedirect />} />
                    <Route path="/app/qcr" element={<Navigate to={GRN_PROCESS_ROUTE} replace />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.grnStatus} />}>
                    <Route path={GRN_STATUS_ROUTE} element={<GRNPage module="status" />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.grnWorkspace} />}>
                    <Route path={GRN_ROUTE} element={<WorkspaceGroupRedirect groupKey="grn" fallback={GRN_PROCESS_ROUTE} />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.commonMasters} />}>
                    <Route path="/masters/common-masters" element={<CommonMastersLandingPage />} />
                    <Route path="/masters/projects" element={<ProjectsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.continents} />}>
                    <Route path="/masters/continents" element={<ContinentsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.countries} />}>
                    <Route path="/masters/countries" element={<CountriesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.states} />}>
                    <Route path="/masters/states" element={<StatesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.cities} />}>
                    <Route path="/masters/cities" element={<CitiesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.taxes} />}>
                    <Route path="/masters/taxes" element={<TaxesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.currencies} />}>
                    <Route path="/masters/currencies" element={<CurrenciesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.customers} />}>
                    <Route path="/masters/customers" element={<CustomersPage />} />
                    <Route path="/masters/customers/new" element={<CustomerDetailPage />} />
                    <Route path="/masters/customers/:id" element={<CustomerDetailPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.suppliers} />}>
                    <Route path="/masters/suppliers" element={<SuppliersPage />} />
                    <Route path="/masters/suppliers/new" element={<SupplierDetailPage />} />
                    <Route path="/masters/suppliers/:id" element={<SupplierDetailPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={COMMON_MASTER_SCREEN_CODES.companies} />}>
                    <Route path="/masters/companies" element={<CompaniesPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.adminMasters} />}>
                    <Route path="/admin/admin-masters" element={<AdminMastersLandingPage />} />
                    <Route path="/wpe-masters/designations" element={<DesignationMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.mainScreens} />}>
                    <Route path="/admin/main-screens" element={<MainScreensPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.screenSections} />}>
                    <Route path="/admin/screen-sections" element={<ScreenSectionsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.staffCreation} />}>
                    <Route path="/admin/staff-creation" element={<StaffCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.userScreens} />}>
                    <Route path="/admin/user-screens" element={<UserScreensPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.userTypeMapping} />}>
                    <Route path="/admin/user-types" element={<UserTypesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.userCreation} />}>
                    <Route path="/admin/user-creation" element={<UserCreationPage />} />
                    <Route path="/admin/user-accounts" element={<Navigate to="/admin/user-creation" replace />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.userTypePermissions} />}>
                    <Route path="/admin/user-screen-permission" element={<UserScreenPermissionPage />} />
                    <Route path="/admin/user-screen-permission/new" element={<UserScreenPermissionAssignmentPage />} />
                    <Route path="/admin/user-screen-permission/:id/edit" element={<UserScreenPermissionAssignmentPage />} />
                    <Route path="/admin/user-permissions" element={<Navigate to="/admin/user-screen-permission" replace />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.departments} />}>
                    <Route path="/wpe-masters/departments" element={<DepartmentMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.roles} />}>
                    <Route path="/wpe-masters/roles" element={<RoleMasterPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.inventoryStoreMasters} />}>
                    <Route path={INVENTORY_STORE_MASTERS_ROUTE} element={<InventoryStoreMastersLandingPage />} />
                    <Route path="/wpe-masters/locations" element={<LocationMasterPage />} />
                    <Route path="/wpe-masters/branches" element={<BranchMasterPage />} />
                    <Route path="/wpe-masters/price-books" element={<PriceBookMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.warehouses} />}>
                    <Route path="/wpe-masters/warehouses" element={<WarehouseMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.stores} />}>
                    <Route path="/wpe-masters/stores" element={<StoreMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.units} />}>
                    <Route path="/wpe-masters/units" element={<UnitMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations} />}>
                    <Route path="/wpe-masters/item-creations" element={<LegacyItemVariantRedirect />} />
                    <Route path={WPE_ITEM_VARIANTS_ROUTE} element={<LegacyItemVariantRedirect />} />
                    <Route path={`${WPE_ITEM_VARIANTS_ROUTE}/:categoryId`} element={<LegacyItemVariantRedirect />} />
                    <Route path={`${WPE_ITEM_VARIANTS_ROUTE}/:categoryId/subtypes/:subtypeId`} element={<LegacyItemVariantRedirect />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={[...INVENTORY_STORE_MASTER_SCREEN_CODES.productTypes, ...INVENTORY_STORE_MASTER_SCREEN_CODES.productSubtypes]} />}>
                    <Route path="/wpe-masters/product-types/subcategories" element={<Navigate to={WPE_PRODUCT_TYPES_ROUTE} replace />} />
                    <Route path={WPE_PRODUCT_SUBTYPES_ROUTE} element={<LegacyProductSubtypeRedirect />} />
                    <Route path={`${WPE_PRODUCT_SUBTYPES_ROUTE}/:categoryId`} element={<LegacyProductSubtypeRedirect />} />
                    <Route path={`${WPE_PRODUCT_SUBTYPES_ROUTE}/:categoryId/subtypes/:subtypeId`} element={<LegacyProductSubtypeRedirect />} />
                    <Route path={`${WPE_PRODUCT_TYPES_ROUTE}/*`} element={<ProductTypesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.productionTypes} />}>
                    <Route path="/wpe-masters/production-types" element={<ProductionTypeMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.saleTypes} />}>
                    <Route path="/wpe-masters/sale-types" element={<SaleTypeMasterPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_MASTER_SCREEN_CODES.purchaseTypes} />}>
                    <Route path="/wpe-masters/purchase-types" element={<PurchaseTypeMasterPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.productionMasters} />}>
                    <Route path={PRODUCTION_MASTERS_ROUTE} element={<ProductionMastersLandingPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.profileCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/profile-creations`} element={<ProfileCreationsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.profileSizes} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/profile-sizes`} element={<ProfileSizesPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.colorCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/color-creations`} element={<ColorCreationsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.machineCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/machine-creations`} element={<MachineCreationsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.workCentreCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/work-centre-creations`} element={<WorkCentreCreationsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.productionLines} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/production-lines`} element={<ProductionLinePage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.binCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/bin-creations`} element={<BinCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.bagCreations} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/bag-creations`} element={<BagCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.packingTypes} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/packing-types`} element={<PackingTypePage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={PRODUCTION_MASTER_SCREEN_CODES.packingMaterials} />}>
                    <Route path={`${PRODUCTION_MASTERS_ROUTE}/packing-materials`} element={<PackingMaterialPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.recipeBomMasters} />}>
                    <Route path={RECIPE_BOM_MASTERS_ROUTE} element={<RecipeBomMastersLandingPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={RECIPE_BOM_MASTER_SCREEN_CODES.recipeCreations} />}>
                    <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-creations`} element={<RecipeCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={RECIPE_BOM_MASTER_SCREEN_CODES.recipeItemCreations} />}>
                    <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`} element={<RecipeItemCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={RECIPE_BOM_MASTER_SCREEN_CODES.bomCreations} />}>
                    <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/bom-creations`} element={<BOMCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={RECIPE_BOM_MASTER_SCREEN_CODES.bomItemCreations} />}>
                    <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/bom-item-creations`} element={<BOMItemCreationPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.deviceLabelMasters} />}>
                    <Route path={DEVICE_LABEL_MASTERS_ROUTE} element={<DeviceLabelMastersLandingPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={DEVICE_LABEL_MASTER_SCREEN_CODES.weighmentScaleCreations} />}>
                    <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/weighment-scale-creations`} element={<WeighmentScaleCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={DEVICE_LABEL_MASTER_SCREEN_CODES.printerCreations} />}>
                    <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/printer-creations`} element={<PrinterCreationPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={DEVICE_LABEL_MASTER_SCREEN_CODES.qrLabelTemplates} />}>
                    <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/qr-label-templates`} element={<QRLabelTemplatePage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={DEVICE_LABEL_MASTER_SCREEN_CODES.serialPortConfigurations} />}>
                    <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/serial-port-configurations`} element={<SerialPortConfigurationPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
