import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import BlendingPage from "@/pages/BlendingPage";
import ContactsPage from "@/pages/ContactsPage";
import DashboardPage from "@/pages/DashboardPage";
import GRNPage from "@/pages/GRNPage";
import ItemsPage from "@/pages/ItemsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import PresalesPage from "@/pages/PresalesPage";
import QCRPage from "@/pages/QCRPage";

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
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="items" element={<ItemsPage />} />
                  <Route path="blending" element={<BlendingPage />} />
                  <Route path="presales" element={<PresalesPage />} />
                  <Route path="grn" element={<GRNPage />} />
                  <Route path="qcr" element={<QCRPage />} />
                </Route>
              </Route>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
