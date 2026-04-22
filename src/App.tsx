import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import LiveWeightPage from "@/pages/LiveWeightPage";
import DeviceStatusPage from "@/pages/DeviceStatusPage";
import QRScannerPage from "@/pages/QRScannerPage";
import BinTrackingPage from "@/pages/BinTrackingPage";
import BlendingPage from "@/pages/BlendingPage";
import GranulationPage from "@/pages/GranulationPage";
import ExtrusionPage from "@/pages/ExtrusionPage";
import PackingPage from "@/pages/PackingPage";
import QCPage from "@/pages/QCPage";
import WarehousePage from "@/pages/WarehousePage";
import DispatchPage from "@/pages/DispatchPage";
import ProductionMonitorPage from "@/pages/ProductionMonitorPage";
import ContactsPage from "@/pages/ContactsPage";
import ItemsPage from "@/pages/ItemsPage";
import PresalesPage from "@/pages/PresalesPage";
import SalesOutwardsPage from "@/pages/SalesOutwardsPage";
import IndentsPage from "@/pages/IndentsPage";
import PurchasesInwardsPage from "@/pages/PurchasesInwardsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/presales" element={<PresalesPage />} />
            <Route path="/sales-outwards" element={<SalesOutwardsPage />} />
            <Route path="/production-monitor" element={<ProductionMonitorPage />} />
            <Route path="/indents" element={<IndentsPage />} />
            <Route path="/purchases-inwards" element={<PurchasesInwardsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/blending" element={<BlendingPage />} />
            <Route path="/granulation" element={<GranulationPage />} />
            <Route path="/extrusion" element={<ExtrusionPage />} />
            <Route path="/packing" element={<PackingPage />} />
            <Route path="/qc" element={<QCPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/live-weight" element={<LiveWeightPage />} />
            <Route path="/device-status" element={<DeviceStatusPage />} />
            <Route path="/qr-scanner" element={<QRScannerPage />} />
            <Route path="/bin-tracking" element={<BinTrackingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
