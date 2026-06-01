import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import ItemCreationsPage from "@/features/wpe-masters/pages/ItemCreationsPage";
import StoreMasterPage from "@/features/wpe-masters/pages/StoreMasterPage";
import UnitMasterPage from "@/features/wpe-masters/pages/UnitMasterPage";
import { INVENTORY_STORE_MASTERS_ROUTE, WPE_PRODUCT_TYPES_ROUTE } from "@/features/wpe-masters/constants";
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
import UserCreationPage from "@/features/admin-master/pages/UserCreationPage";
import UserScreenPermissionAssignmentPage from "@/features/admin-master/pages/UserScreenPermissionAssignmentPage";
import UserScreenPermissionPage from "@/features/admin-master/pages/UserScreenPermissionPage";
import UserScreensPage from "@/features/admin-master/pages/UserScreensPage";
import UserTypesPage from "@/features/admin-master/pages/UserTypesPage";
import { AuthProvider } from "@/providers/AuthProvider";
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
  STORE_INVENTORY_ROUTE,
} from "@/features/items/utils/routes";
import GRNPage from "@/pages/GRNPage";
import ItemsPage from "@/pages/ItemsPage";
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
                    <Route path="/app" element={<DashboardPage />} />
                    <Route path="/app/dashboard" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/app/contacts" element={<ContactsPage />} />
                  <Route path="/app/contacts/new" element={<ContactFormPage />} />
                  <Route path="/app/contacts/:id/edit" element={<ContactFormPage />} />
                  <Route path={INVENTORY_ROUTE} element={<Navigate to={STORE_INVENTORY_ROUTE} replace />} />
                  <Route path={STORE_INVENTORY_ROUTE} element={<ItemsPage module="store" />} />
                  <Route path={BLENDING_INVENTORY_ROUTE} element={<ItemsPage module="blending" />} />
                  <Route path={BLENDING_ROUTE} element={<Navigate to={BLENDING_STOCK_ROUTE} replace />} />
                  <Route path={BLENDING_STOCK_ROUTE} element={<BlendingPage module="stock" />} />
                  <Route path={BLENDING_STORE_REQUEST_ROUTE} element={<BlendingPage module="requests" />} />
                  <Route path={BLENDING_TRANSACTIONS_ROUTE} element={<BlendingPage module="transactions" />} />
                  <Route path={`${BLENDING_STOCK_ROUTE}/:itemId`} element={<BlendingStockItemPage />} />
                  <Route path={`${BLENDING_TRANSACTIONS_ROUTE}/:requestId`} element={<BlendingTransactionPage />} />
                  <Route path="/app/production/neworder" element={<ProductionNewOrderPage />} />
                  <Route path="/app/production/manage-batch/:orderId" element={<ProductionManageBatchPage />} />
                  <Route path="/app/production/:id/edit" element={<ProductionEditOrderPage />} />
                  <Route path={PRODUCTION_ROUTE} element={<Navigate to={PRODUCTION_AD_WEIGHTAGE_ROUTE} replace />} />
                  <Route path={PRODUCTION_AD_WEIGHTAGE_ROUTE} element={<ProductionPage />} />
                  <Route path={PRODUCTION_BL_BLENDING_ROUTE} element={<ProductionStagePage stage="BL" />} />
                  <Route path={PRODUCTION_GL_GRANULATION_ROUTE} element={<ProductionStagePage stage="GL" />} />
                  <Route path={PRODUCTION_PR_PRODUCTION_ROUTE} element={<ProductionStagePage stage="PR" />} />
                  <Route path="/app/regrind" element={<RegrindPage />} />
                  <Route path={STORE_ROUTE} element={<Navigate to={STORE_STOCK_ROUTE} replace />} />
                  <Route path={STORE_STOCK_ROUTE} element={<StorePage module="stock" />} />
                  <Route path={STORE_REQUEST_ROUTE} element={<StorePage module="requests" />} />
                  <Route path={STORE_TRANSACTIONS_ROUTE} element={<StorePage module="transactions" />} />
                  <Route path={`${STORE_STOCK_ROUTE}/:itemId`} element={<StoreStockItemPage />} />
                  <Route path="/oims/machines" element={<Navigate to={`${PRODUCTION_MASTERS_ROUTE}/machine-creations`} replace />} />
                  <Route path="/oims/bom-variants" element={<Navigate to={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`} replace />} />
                  <Route path={GRN_PROCESS_CREATE_ROUTE} element={<GRNCreatePage />} />
                  <Route path={getGrnProcessEditRoute(":id")} element={<GRNEditPage />} />
                  <Route path={getGrnProcessViewRoute(":id")} element={<GRNDetailPage />} />
                  <Route path={getGrnProcessDetailRoute(":id")} element={<GRNDetailPage />} />
                  <Route path={GRN_PROCESS_ROUTE} element={<GRNPage module="process" />} />
                  <Route path={GRN_STATUS_ROUTE} element={<GRNPage module="status" />} />
                  <Route path="/app/grn/new" element={<Navigate to={GRN_PROCESS_CREATE_ROUTE} replace />} />
                  <Route path="/app/grn/:id/edit" element={<LegacyGrnEditRedirect />} />
                  <Route path="/app/grn/:id/view" element={<LegacyGrnViewRedirect />} />
                  <Route path="/app/grn/:id" element={<LegacyGrnDetailRedirect />} />
                  <Route path="/app/grn" element={<Navigate to={GRN_PROCESS_ROUTE} replace />} />
                  <Route path="/app/qcr" element={<Navigate to={GRN_PROCESS_ROUTE} replace />} />
                  <Route path="/masters/common-masters" element={<CommonMastersLandingPage />} />
                  <Route path="/masters/continents" element={<ContinentsPage />} />
                  <Route path="/masters/countries" element={<CountriesPage />} />
                  <Route path="/masters/states" element={<StatesPage />} />
                  <Route path="/masters/cities" element={<CitiesPage />} />
                  <Route path="/masters/taxes" element={<TaxesPage />} />
                  <Route path="/masters/currencies" element={<CurrenciesPage />} />
                  <Route path="/masters/customers" element={<CustomersPage />} />
                  <Route path="/masters/customers/new" element={<CustomerDetailPage />} />
                  <Route path="/masters/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/masters/suppliers" element={<SuppliersPage />} />
                  <Route path="/masters/suppliers/new" element={<SupplierDetailPage />} />
                  <Route path="/masters/suppliers/:id" element={<SupplierDetailPage />} />
                  <Route path="/masters/companies" element={<CompaniesPage />} />
                  <Route path="/masters/projects" element={<ProjectsPage />} />
                  <Route path="/admin/admin-masters" element={<AdminMastersLandingPage />} />
                  <Route path="/admin/main-screens" element={<MainScreensPage />} />
                  <Route path="/admin/screen-sections" element={<ScreenSectionsPage />} />
                  <Route path="/admin/user-screens" element={<UserScreensPage />} />
                  <Route path="/admin/user-types" element={<UserTypesPage />} />
                  <Route path="/admin/user-creation" element={<UserCreationPage />} />
                  <Route path="/admin/user-screen-permission" element={<UserScreenPermissionPage />} />
                  <Route path="/admin/user-screen-permission/new" element={<UserScreenPermissionAssignmentPage />} />
                  <Route path="/admin/user-screen-permission/:id/edit" element={<UserScreenPermissionAssignmentPage />} />
                  <Route path="/admin/user-accounts" element={<Navigate to="/admin/user-creation" replace />} />
                  <Route path="/admin/user-permissions" element={<Navigate to="/admin/user-screen-permission" replace />} />
                  <Route path={INVENTORY_STORE_MASTERS_ROUTE} element={<InventoryStoreMastersLandingPage />} />
                  <Route path="/wpe-masters/locations" element={<LocationMasterPage />} />
                  <Route path="/wpe-masters/branches" element={<BranchMasterPage />} />
                  <Route path="/wpe-masters/price-books" element={<PriceBookMasterPage />} />
                  <Route path="/wpe-masters/warehouses" element={<WarehouseMasterPage />} />
                  <Route path="/wpe-masters/stores" element={<StoreMasterPage />} />
                  <Route path="/wpe-masters/units" element={<UnitMasterPage />} />
                  <Route path="/wpe-masters/item-creations" element={<ItemCreationsPage />} />
                  <Route path={`${WPE_PRODUCT_TYPES_ROUTE}/*`} element={<ProductTypesPage />} />
                  <Route path="/wpe-masters/production-types" element={<ProductionTypeMasterPage />} />
                  <Route path="/wpe-masters/sale-types" element={<SaleTypeMasterPage />} />
                  <Route path="/wpe-masters/purchase-types" element={<PurchaseTypeMasterPage />} />
                  <Route path="/wpe-masters/roles" element={<RoleMasterPage />} />
                  <Route path="/wpe-masters/departments" element={<DepartmentMasterPage />} />
                  <Route path="/wpe-masters/designations" element={<DesignationMasterPage />} />
                  <Route path={PRODUCTION_MASTERS_ROUTE} element={<ProductionMastersLandingPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/profile-creations`} element={<ProfileCreationsPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/profile-sizes`} element={<ProfileSizesPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/color-creations`} element={<ColorCreationsPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/machine-creations`} element={<MachineCreationsPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/work-centre-creations`} element={<WorkCentreCreationsPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/production-lines`} element={<ProductionLinePage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/bin-creations`} element={<BinCreationPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/bag-creations`} element={<BagCreationPage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/packing-types`} element={<PackingTypePage />} />
                  <Route path={`${PRODUCTION_MASTERS_ROUTE}/packing-materials`} element={<PackingMaterialPage />} />
                  <Route path={RECIPE_BOM_MASTERS_ROUTE} element={<RecipeBomMastersLandingPage />} />
                  <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-creations`} element={<RecipeCreationPage />} />
                  <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`} element={<RecipeItemCreationPage />} />
                  <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/bom-creations`} element={<BOMCreationPage />} />
                  <Route path={`${RECIPE_BOM_MASTERS_ROUTE}/bom-item-creations`} element={<BOMItemCreationPage />} />
                  <Route path={DEVICE_LABEL_MASTERS_ROUTE} element={<DeviceLabelMastersLandingPage />} />
                  <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/weighment-scale-creations`} element={<WeighmentScaleCreationPage />} />
                  <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/printer-creations`} element={<PrinterCreationPage />} />
                  <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/qr-label-templates`} element={<QRLabelTemplatePage />} />
                  <Route path={`${DEVICE_LABEL_MASTERS_ROUTE}/serial-port-configurations`} element={<SerialPortConfigurationPage />} />
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
