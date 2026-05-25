import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import { WPE_PRODUCT_TYPES_ROUTE } from "@/features/wpe-masters/constants";
import MainScreensPage from "@/features/admin-master/pages/MainScreensPage";
import ScreenSectionsPage from "@/features/admin-master/pages/ScreenSectionsPage";
import UserCreationPage from "@/features/admin-master/pages/UserCreationPage";
import UserScreenPermissionPage from "@/features/admin-master/pages/UserScreenPermissionPage";
import UserScreensPage from "@/features/admin-master/pages/UserScreensPage";
import UserTypesPage from "@/features/admin-master/pages/UserTypesPage";
import { AuthProvider } from "@/providers/AuthProvider";
import BlendingPage from "@/pages/BlendingPage";
import BOMVariantPage from "@/pages/BOMVariantPage";
import ContactsPage from "@/pages/ContactsPage";
import DashboardPage from "@/pages/DashboardPage";
import MachineMasterPage from "@/pages/MachineMasterPage";
import RegrindPage from "@/pages/RegrindPage";
import CompaniesPage from "@/features/common-master/pages/CompaniesPage";
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
import GRNPage from "@/pages/GRNPage";
import ItemsPage from "@/pages/ItemsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import PresalesPage from "@/pages/PresalesPage";
import ProductionManageBatchPage from "@/pages/ProductionManageBatchPage";
import ProductionEditOrderPage from "@/pages/ProductionEditOrderPage";
import ProductionNewOrderPage from "@/pages/ProductionNewOrderPage";
import ProductionPage from "@/pages/ProductionPage";
import StorePage from "@/pages/StorePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/app/contacts" element={<ContactsPage />} />
                  <Route path="/app/items" element={<ItemsPage />} />
                  <Route path="/app/blending" element={<BlendingPage />} />
                  <Route path="/app/presales" element={<PresalesPage />} />
                  <Route path="/app/production/neworder" element={<ProductionNewOrderPage />} />
                  <Route path="/app/production/manage-batch/:orderId" element={<ProductionManageBatchPage />} />
                  <Route path="/app/production/:id/edit" element={<ProductionEditOrderPage />} />
                  <Route path="/app/production" element={<ProductionPage />} />
                  <Route path="/app/regrind" element={<RegrindPage />} />
                  <Route path="/app/store" element={<StorePage />} />
                  <Route path="/oims/machines" element={<MachineMasterPage />} />
                  <Route path="/oims/bom-variants" element={<BOMVariantPage />} />
                  <Route path="/app/grn" element={<GRNPage />} />
                  <Route path="/app/qcr" element={<Navigate to="/app/grn" replace />} />
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
                  <Route path="/admin/main-screens" element={<MainScreensPage />} />
                  <Route path="/admin/screen-sections" element={<ScreenSectionsPage />} />
                  <Route path="/admin/user-screens" element={<UserScreensPage />} />
                  <Route path="/admin/user-types" element={<UserTypesPage />} />
                  <Route path="/admin/user-creation" element={<UserCreationPage />} />
                  <Route path="/admin/user-screen-permission" element={<UserScreenPermissionPage />} />
                  <Route path="/admin/user-accounts" element={<Navigate to="/admin/user-creation" replace />} />
                  <Route path="/admin/user-permissions" element={<Navigate to="/admin/user-screen-permission" replace />} />
                  <Route path="/wpe-masters/locations" element={<LocationMasterPage />} />
                  <Route path="/wpe-masters/branches" element={<BranchMasterPage />} />
                  <Route path="/wpe-masters/price-books" element={<PriceBookMasterPage />} />
                  <Route path="/wpe-masters/warehouses" element={<WarehouseMasterPage />} />
                  <Route path={`${WPE_PRODUCT_TYPES_ROUTE}/*`} element={<ProductTypesPage />} />
                  <Route path="/wpe-masters/production-types" element={<ProductionTypeMasterPage />} />
                  <Route path="/wpe-masters/sale-types" element={<SaleTypeMasterPage />} />
                  <Route path="/wpe-masters/purchase-types" element={<PurchaseTypeMasterPage />} />
                  <Route path="/wpe-masters/roles" element={<RoleMasterPage />} />
                  <Route path="/wpe-masters/departments" element={<DepartmentMasterPage />} />
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
