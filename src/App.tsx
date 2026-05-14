import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRouteGuard from "@/features/admin-master/components/AdminRouteGuard";
import MainScreensPage from "@/features/admin-master/pages/MainScreensPage";
import ScreenSectionsPage from "@/features/admin-master/pages/ScreenSectionsPage";
import StaffPage from "@/features/admin-master/pages/StaffPage";
import UserAccountsPage from "@/features/admin-master/pages/UserAccountsPage";
import UserPermissionsPage from "@/features/admin-master/pages/UserPermissionsPage";
import UserScreensPage from "@/features/admin-master/pages/UserScreensPage";
import UserTypesPage from "@/features/admin-master/pages/UserTypesPage";
import { AuthProvider } from "@/providers/AuthProvider";
import BlendingPage from "@/pages/BlendingPage";
import ContactsPage from "@/pages/ContactsPage";
import DashboardPage from "@/pages/DashboardPage";
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
import QCRPage from "@/pages/QCRPage";
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
    <BrowserRouter>
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
                  <Route path="/app/store" element={<StorePage />} />
                  <Route path="/app/grn" element={<GRNPage />} />
                  <Route path="/app/qcr" element={<QCRPage />} />
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
                  <Route element={<AdminRouteGuard screenCode="main-screen-master" />}>
                    <Route path="/admin/main-screens" element={<MainScreensPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="screen-section-master" />}>
                    <Route path="/admin/screen-sections" element={<ScreenSectionsPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="user-screen-master" />}>
                    <Route path="/admin/user-screens" element={<UserScreensPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="staff-master" />}>
                    <Route path="/admin/staff" element={<StaffPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="user-type-master" />}>
                    <Route path="/admin/user-types" element={<UserTypesPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="user-account-master" />}>
                    <Route path="/admin/user-accounts" element={<UserAccountsPage />} />
                  </Route>
                  <Route element={<AdminRouteGuard screenCode="user-permission-master" />}>
                    <Route path="/admin/user-permissions" element={<UserPermissionsPage />} />
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
