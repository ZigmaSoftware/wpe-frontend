import { Suspense, lazy, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import PermissionRouteGuard from "@/components/PermissionRouteGuard";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";
import { PRODUCTION_MASTERS_ROUTE } from "@/features/production-masters/utils/routes";
import { DEVICE_LABEL_MASTERS_ROUTE } from "@/features/device-label-masters/utils/routes";
import { RECIPE_BOM_MASTERS_ROUTE } from "@/features/recipe-bom-masters/utils/routes";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  BLENDING_ROUTE,
  BLENDING_STOCK_ROUTE,
  BLENDING_STORE_REQUEST_ROUTE,
  BLENDING_TRANSACTIONS_ROUTE,
} from "@/features/blending/utils/routes";
import {
  BLENDING_INVENTORY_ROUTE,
  INVENTORY_ROUTE,
  PRODUCTION_INVENTORY_ROUTE,
  STORE_INVENTORY_ROUTE,
} from "@/features/items/utils/routes";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import {
  GRN_PROCESS_CREATE_ROUTE,
  GRN_PROCESS_ROUTE,
  GRN_ROUTE,
  GRN_STATUS_ROUTE,
  getGrnProcessDetailRoute,
  getGrnProcessEditRoute,
  getGrnProcessViewRoute,
} from "@/features/grn/utils/routes";
import { REQUESTS_ROUTE, REQUESTS_STORE_REQUEST_ROUTE } from "@/features/requests/utils/routes";
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
  INVENTORY_STORE_ITEM_HIERARCHY_SCREEN_CODES,
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

const LocationMasterPage = lazy(() => import("@/features/wpe-masters/pages/LocationMasterPage"));
const BranchMasterPage = lazy(() => import("@/features/wpe-masters/pages/BranchMasterPage"));
const PriceBookMasterPage = lazy(() => import("@/features/wpe-masters/pages/PriceBookMasterPage"));
const WarehouseMasterPage = lazy(() => import("@/features/wpe-masters/pages/WarehouseMasterPage"));
const ProductionTypeMasterPage = lazy(() => import("@/features/wpe-masters/pages/ProductionTypeMasterPage"));
const ProductTypesPage = lazy(() => import("@/features/wpe-masters/pages/ProductTypesPage"));
const SaleTypeMasterPage = lazy(() => import("@/features/wpe-masters/pages/SaleTypeMasterPage"));
const PurchaseTypeMasterPage = lazy(() => import("@/features/wpe-masters/pages/PurchaseTypeMasterPage"));
const RoleMasterPage = lazy(() => import("@/features/wpe-masters/pages/RoleMasterPage"));
const DepartmentMasterPage = lazy(() => import("@/features/wpe-masters/pages/DepartmentMasterPage"));
const DesignationMasterPage = lazy(() => import("@/features/wpe-masters/pages/DesignationMasterPage"));
const InventoryStoreMastersLandingPage = lazy(() => import("@/features/wpe-masters/pages/InventoryStoreMastersLandingPage"));
const StoreMasterPage = lazy(() => import("@/features/wpe-masters/pages/StoreMasterPage"));
const UnitMasterPage = lazy(() => import("@/features/wpe-masters/pages/UnitMasterPage"));
const ProductionMastersLandingPage = lazy(() => import("@/features/production-masters/pages/ProductionMastersLandingPage"));
const ProfileCreationsPage = lazy(() => import("@/features/production-masters/pages/ProfileCreationsPage"));
const ProfileSizesPage = lazy(() => import("@/features/production-masters/pages/ProfileSizesPage"));
const ColorCreationsPage = lazy(() => import("@/features/production-masters/pages/ColorCreationsPage"));
const MachineCreationsPage = lazy(() => import("@/features/production-masters/pages/MachineCreationsPage"));
const WorkCentreCreationsPage = lazy(() => import("@/features/production-masters/pages/WorkCentreCreationsPage"));
const ProductionLinePage = lazy(() => import("@/features/production-masters/pages/ProductionLinePage"));
const BinCreationPage = lazy(() => import("@/features/production-masters/pages/BinCreationPage"));
const BagCreationPage = lazy(() => import("@/features/production-masters/pages/BagCreationPage"));
const PackingTypePage = lazy(() => import("@/features/production-masters/pages/PackingTypePage"));
const PackingMaterialPage = lazy(() => import("@/features/production-masters/pages/PackingMaterialPage"));
const DeviceLabelMastersLandingPage = lazy(() => import("@/features/device-label-masters/pages/DeviceLabelMastersLandingPage"));
const WeighmentScaleCreationPage = lazy(() => import("@/features/device-label-masters/pages/WeighmentScaleCreationPage"));
const PrinterCreationPage = lazy(() => import("@/features/device-label-masters/pages/PrinterCreationPage"));
const QRLabelTemplatePage = lazy(() => import("@/features/device-label-masters/pages/QRLabelTemplatePage"));
const SerialPortConfigurationPage = lazy(() => import("@/features/device-label-masters/pages/SerialPortConfigurationPage"));
const RecipeBomMastersLandingPage = lazy(() => import("@/features/recipe-bom-masters/pages/RecipeBomMastersLandingPage"));
const RecipeCreationPage = lazy(() => import("@/features/recipe-bom-masters/pages/RecipeCreationPage"));
const RecipeItemCreationPage = lazy(() => import("@/features/recipe-bom-masters/pages/RecipeItemCreationPage"));
const BOMCreationPage = lazy(() => import("@/features/recipe-bom-masters/pages/BOMCreationPage"));
const BOMItemCreationPage = lazy(() => import("@/features/recipe-bom-masters/pages/BOMItemCreationPage"));
const AdminMastersLandingPage = lazy(() => import("@/features/admin-master/pages/AdminMastersLandingPage"));
const MainScreensPage = lazy(() => import("@/features/admin-master/pages/MainScreensPage"));
const ScreenSectionsPage = lazy(() => import("@/features/admin-master/pages/ScreenSectionsPage"));
const StaffCreationPage = lazy(() => import("@/features/admin-master/pages/StaffCreationPage"));
const UserCreationPage = lazy(() => import("@/features/admin-master/pages/UserCreationPage"));
const UserScreenPermissionAssignmentPage = lazy(() => import("@/features/admin-master/pages/UserScreenPermissionAssignmentPage"));
const UserScreenPermissionPage = lazy(() => import("@/features/admin-master/pages/UserScreenPermissionPage"));
const UserScreensPage = lazy(() => import("@/features/admin-master/pages/UserScreensPage"));
const UserTypesPage = lazy(() => import("@/features/admin-master/pages/UserTypesPage"));
const BlendingPage = lazy(() => import("@/pages/BlendingPage"));
const BlendingStockItemPage = lazy(() => import("@/pages/BlendingStockItemPage"));
const BlendingTransactionPage = lazy(() => import("@/pages/BlendingTransactionPage"));
const ContactsPage = lazy(() => import("@/pages/ContactsPage"));
const ContactFormPage = lazy(() => import("@/pages/ContactFormPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const GRNCreatePage = lazy(() => import("@/pages/GRNCreatePage"));
const GRNDetailPage = lazy(() => import("@/pages/GRNDetailPage"));
const GRNEditPage = lazy(() => import("@/pages/GRNEditPage"));
const RegrindPage = lazy(() => import("@/pages/RegrindPage"));
const CompaniesPage = lazy(() => import("@/features/common-master/pages/CompaniesPage"));
const CommonMastersLandingPage = lazy(() => import("@/features/common-master/pages/CommonMastersLandingPage"));
const ContinentsPage = lazy(() => import("@/features/common-master/pages/ContinentsPage"));
const CountriesPage = lazy(() => import("@/features/common-master/pages/CountriesPage"));
const CitiesPage = lazy(() => import("@/features/common-master/pages/CitiesPage"));
const CurrenciesPage = lazy(() => import("@/features/common-master/pages/CurrenciesPage"));
const CustomerDetailPage = lazy(() => import("@/features/common-master/pages/CustomerDetailPage"));
const CustomersPage = lazy(() => import("@/features/common-master/pages/CustomersPage"));
const ProjectsPage = lazy(() => import("@/features/common-master/pages/ProjectsPage"));
const StatesPage = lazy(() => import("@/features/common-master/pages/StatesPage"));
const SupplierDetailPage = lazy(() => import("@/features/common-master/pages/SupplierDetailPage"));
const SuppliersPage = lazy(() => import("@/features/common-master/pages/SuppliersPage"));
const TaxesPage = lazy(() => import("@/features/common-master/pages/TaxesPage"));
const GRNPage = lazy(() => import("@/pages/GRNPage"));
const ItemsPage = lazy(() => import("@/pages/ItemsPage"));
const ProductionInventoryPage = lazy(() => import("@/pages/ProductionInventoryPage"));
const RequestsPage = lazy(() => import("@/pages/RequestsPage"));
const StorePage = lazy(() => import("@/pages/StorePage"));
const StoreStockItemPage = lazy(() => import("@/pages/StoreStockItemPage"));
const ProductionManageBatchPage = lazy(() => import("@/pages/ProductionManageBatchPage"));
const ProductionEditOrderPage = lazy(() => import("@/pages/ProductionEditOrderPage"));
const ProductionNewOrderPage = lazy(() => import("@/pages/ProductionNewOrderPage"));
const ProductionPage = lazy(() => import("@/pages/ProductionPage"));
const ProductionStagePage = lazy(() => import("@/pages/ProductionStagePage"));

const RouteLoadingFallback = () => (
  <div className="p-6 text-sm text-muted-foreground">Loading production workspace...</div>
);

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
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.blendingTransactions} />}>
                    <Route path={BLENDING_TRANSACTIONS_ROUTE} element={<BlendingPage module="transactions" />} />
                    <Route path={`${BLENDING_TRANSACTIONS_ROUTE}/:requestId`} element={<BlendingTransactionPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.requestsWorkspace} />}>
                    <Route path={REQUESTS_ROUTE} element={<WorkspaceGroupRedirect groupKey="requests" fallback={REQUESTS_STORE_REQUEST_ROUTE} />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.requestsStoreRequest} />}>
                    <Route path={BLENDING_STORE_REQUEST_ROUTE} element={<Navigate to={REQUESTS_STORE_REQUEST_ROUTE} replace />} />
                    <Route path={REQUESTS_STORE_REQUEST_ROUTE} element={<RequestsPage />} />
                  </Route>

                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionAdWeightage} />}>
                    <Route
                      path="/app/production/neworder"
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionNewOrderPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/app/production/manage-batch/:orderId"
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionManageBatchPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/app/production/:id/edit"
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionEditOrderPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path={PRODUCTION_AD_WEIGHTAGE_ROUTE}
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionPage />
                        </Suspense>
                      }
                    />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={appRouteScreenCodeGroups.productionWorkspace} />}>
                    <Route path={PRODUCTION_ROUTE} element={<WorkspaceGroupRedirect groupKey="production" fallback={PRODUCTION_AD_WEIGHTAGE_ROUTE} />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionBlBlending} />}>
                    <Route
                      path={PRODUCTION_BL_BLENDING_ROUTE}
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionStagePage stage="BL" />
                        </Suspense>
                      }
                    />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionGlGranulation} />}>
                    <Route
                      path={PRODUCTION_GL_GRANULATION_ROUTE}
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionStagePage stage="GL" />
                        </Suspense>
                      }
                    />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={WORKSPACE_SCREEN_CODES.productionPrProduction} />}>
                    <Route
                      path={PRODUCTION_PR_PRODUCTION_ROUTE}
                      element={
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <ProductionStagePage stage="PR" />
                        </Suspense>
                      }
                    />
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
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.mainScreens} />}>
                    <Route path="/admin/main-screens" element={<MainScreensPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.screenSections} />}>
                    <Route path="/admin/screen-sections" element={<ScreenSectionsPage />} />
                  </Route>
                  <Route element={<PermissionRouteGuard screenCodes={ADMIN_SCREEN_CODES.designations} />}>
                    <Route path="/wpe-masters/designations" element={<DesignationMasterPage />} />
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
                  <Route element={<PermissionRouteGuard screenCodes={INVENTORY_STORE_ITEM_HIERARCHY_SCREEN_CODES} />}>
                    <Route path="/wpe-masters/item-creations" element={<LegacyItemVariantRedirect />} />
                    <Route path={WPE_ITEM_VARIANTS_ROUTE} element={<LegacyItemVariantRedirect />} />
                    <Route path={`${WPE_ITEM_VARIANTS_ROUTE}/:categoryId`} element={<LegacyItemVariantRedirect />} />
                    <Route path={`${WPE_ITEM_VARIANTS_ROUTE}/:categoryId/subtypes/:subtypeId`} element={<LegacyItemVariantRedirect />} />
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
