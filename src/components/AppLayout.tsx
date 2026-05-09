import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Blend,
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe2,
  LayoutDashboard,
  Landmark,
  Menu,
  Map,
  MapPinned,
  PackageSearch,
  ReceiptText,
  Route,
  Shield,
  Truck,
  Users,
  X,
} from "lucide-react";
import { LogOut } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { adminRouteRegistry, getAdminRouteTitle, resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import type { AdminMenuMain } from "@/features/admin-master/types";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";

const navSections = [
  {
    label: "Workspace",
    items: [
      { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/app/contacts", icon: Users, label: "Contacts" },
      { to: "/app/items", icon: Box, label: "Items" },
      { to: "/app/blending", icon: Blend, label: "Blending" },
      { to: "/app/presales", icon: FileText, label: "Presales" },
      { to: "/app/store", icon: Archive, label: "Store" },
      { to: "/app/grn", icon: Truck, label: "GRN" },
      { to: "/app/qcr", icon: ClipboardCheck, label: "QCR" },
    ],
  },
  {
    label: "Common Masters",
    items: [
      { to: "/masters/continents", icon: Globe2, label: "Continents" },
      { to: "/masters/countries", icon: Map, label: "Countries" },
      { to: "/masters/states", icon: MapPinned, label: "States" },
      { to: "/masters/cities", icon: Landmark, label: "Cities" },
      { to: "/masters/taxes", icon: ReceiptText, label: "Taxes" },
      { to: "/masters/currencies", icon: ReceiptText, label: "Currencies" },
      { to: "/masters/customers", icon: Users, label: "Customers" },
      { to: "/masters/suppliers", icon: PackageSearch, label: "Suppliers" },
      { to: "/masters/companies", icon: Users, label: "Companies" },
      { to: "/masters/projects", icon: Route, label: "Projects" },
    ],
  },
];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, adminMenu } = useAuth();

  const adminNavSections = useMemo(
    () =>
      adminMenu.map((main: AdminMenuMain) => ({
        label: main.name,
        items: main.sections.flatMap((section) =>
          section.screens.map((screen) => ({
            to: resolveAdminRoutePath(screen.code, screen.route_path),
            icon: Shield,
            label: getAdminRouteTitle(screen.code, screen.screen_name),
          })),
        ),
      })),
    [adminMenu],
  );

  const breadcrumbItems = useMemo(() => {
    const path = location.pathname;
    if (path === "/app" || path === "/dashboard") {
      return ["Dashboard"];
    }
    const adminMatch = Object.values(adminRouteRegistry).find((entry) => entry.path === path);
    if (adminMatch) {
      return ["Admin Master", adminMatch.title];
    }
    const workspaceMatch = navSections.flatMap((section) => section.items).find((item) => item.to === path);
    return workspaceMatch ? ["Workspace", workspaceMatch.label] : [];
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      navigate("/", { replace: true });
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(180deg,#eff4fb_0%,#f8fafc_100%)]">
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed z-50 flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-primary p-2 shadow-lg shadow-sidebar-primary/20">
                <img src="/logo.png" alt="WPE logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-semibold text-sidebar-foreground">WPE Admin</div>
                <div className="text-[11px] text-sidebar-foreground/60">Core + GRN control room</div>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <button onClick={() => setMobileOpen(false)} className="rounded p-1 text-sidebar-foreground/70 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
          {[...navSections, ...adminNavSections].map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 ? <Separator className="my-2 bg-sidebar-border" /> : null}
              {!collapsed ? (
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/40">
                  {section.label}
                </div>
              ) : null}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app" || item.to === "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed ? (
          <div className="border-t border-sidebar-border px-4 py-4 text-[11px] text-sidebar-foreground/55">
            Exact backend paths preserved, including duplicated route segments.
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded p-1 text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <div className="text-sm font-medium text-foreground">Operations Admin</div>
            <div className="text-xs text-muted-foreground">JWT-secured frontend for Core, GRN, and Admin Master services</div>
            {breadcrumbItems.length ? (
              <Breadcrumb className="mt-1">
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => (
                    <div key={item} className="inline-flex items-center gap-1.5">
                      <BreadcrumbItem>
                        {index === breadcrumbItems.length - 1 ? (
                          <BreadcrumbPage>{item}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={index === 0 && item === "Dashboard" ? "/dashboard" : "#"}>{item}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbItems.length - 1 ? <BreadcrumbSeparator /> : null}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-foreground">{user?.username ?? "Authenticated User"}</div>
              <div className="text-xs text-muted-foreground">{user?.email || "Bearer token session"}</div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout} disabled={loggingOut}>
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out..." : "Logout"}
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
