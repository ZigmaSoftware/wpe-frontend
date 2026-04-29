import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Scale, ScanLine, Package, Blend, Cog, Layers,
  PackageCheck, ClipboardCheck, Warehouse, Truck, Wifi, ChevronLeft,
  ChevronRight, Activity, Menu, X, Users, Box, FileText, ShoppingCart,
  ClipboardList, PackageOpen, Wallet, BarChart3
} from "lucide-react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navSections = [
  {
    label: "Main",
    items: [
      { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/app/contacts", icon: Users, label: "Contacts" },
      { to: "/app/items", icon: Box, label: "Items" },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/app/presales", icon: FileText, label: "Presales" },
      { to: "/app/sales-outwards", icon: ShoppingCart, label: "Sales & Outwards" },
    ],
  },
  {
    label: "Production",
    items: [
      { to: "/app/production-monitor", icon: Activity, label: "Production Monitor" },
      { to: "/app/blending", icon: Blend, label: "Blending" },
      { to: "/app/granulation", icon: Cog, label: "Granulation" },
      { to: "/app/extrusion", icon: Layers, label: "Extrusion" },
      { to: "/app/packing", icon: PackageCheck, label: "Packing" },
      { to: "/app/qc", icon: ClipboardCheck, label: "QC Inspection" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { to: "/app/indents", icon: ClipboardList, label: "Indents" },
      { to: "/app/purchases-inwards", icon: PackageOpen, label: "Purchases & Inwards" },
      { to: "/app/payments", icon: Wallet, label: "Payments" },
      
    ],
  },
  {
    label: "Warehouse & IoT",
    items: [
      { to: "/app/warehouse", icon: Warehouse, label: "Warehouse" },
      { to: "/app/dispatch", icon: Truck, label: "Dispatch" },
      { to: "/app/bin-tracking", icon: Package, label: "Bin Tracking" },
      { to: "/app/live-weight", icon: Scale, label: "Live Weight" },
      { to: "/app/qr-scanner", icon: ScanLine, label: "QR Scanner" },
      { to: "/app/device-status", icon: Wifi, label: "Device Status" },
    ],
  },
  {
    label: "Reports",
    items: [
      { to: "/app/reports", icon: BarChart3, label: "Reports & Tools" },
    ],
  },
];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:static z-50 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center p-1">
                <img src="/logo.png" alt="Zigma logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold text-sidebar-foreground">Zigma</div>
                {/* <div className="text-[10px] text-sidebar-foreground/60">Plant IoT ERP</div> */}
              </div>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hidden lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1 lg:hidden text-sidebar-foreground/60">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navSections.map((section, sIdx) => (
            <div key={section.label}>
              {sIdx > 0 && <Separator className="my-1.5 bg-sidebar-border" />}
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <div className="text-[10px] text-sidebar-foreground/40"> Zigma</div>
            <div className="text-[10px] text-sidebar-foreground/40"></div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-card border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="p-1 lg:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground hidden lg:block">
            WPE
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {/* <span className="text-muted-foreground">System Online</span> */}
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/">
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
