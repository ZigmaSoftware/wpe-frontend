import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Blend,
  Box,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe2,
  LayoutDashboard,
  Landmark,
  Layers,
  Layout,
  LogOut,
  MapPin,
  Menu,
  Map,
  Monitor,
  MapPinned,
  PackageSearch,
  ReceiptText,
  Route,
  Shield,
  ShoppingCart,
  Tag,
  Truck,
  UserCog,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { adminRouteRegistry, getAdminRouteTitle, resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import type { AdminMenuMain } from "@/features/admin-master/types";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";

/* ─── colour palette per section ──────────────────────────────────── */
const sectionMeta: Record<string, { accent: string; iconBg: string }> = {
  Workspace:        { accent: "from-blue-500 to-indigo-600",   iconBg: "bg-blue-500/15 text-blue-400" },
  "Common Masters": { accent: "from-violet-500 to-purple-600", iconBg: "bg-violet-500/15 text-violet-400" },
  "WPE Masters":    { accent: "from-emerald-500 to-teal-600",  iconBg: "bg-emerald-500/15 text-emerald-400" },
  "WPE Users":      { accent: "from-rose-500 to-pink-600",     iconBg: "bg-rose-500/15 text-rose-400" },
  "OIMS Masters":   { accent: "from-amber-500 to-orange-600",  iconBg: "bg-amber-500/15 text-amber-400" },
  default:          { accent: "from-slate-500 to-slate-600",   iconBg: "bg-slate-500/15 text-slate-400" },
};

const wpeMastersSections = [
  {
    label: "WPE Masters",
    items: [
      { to: "/wpe-masters/locations",       icon: MapPin,       label: "Locations" },
      { to: "/wpe-masters/branches",        icon: Building2,    label: "Branches" },
      { to: "/wpe-masters/price-books",     icon: Tag,          label: "Price Books" },
      { to: "/wpe-masters/warehouses",      icon: Warehouse,    label: "Warehouses" },
      { to: "/wpe-masters/production-types",icon: Box,          label: "Production Types" },
      { to: "/wpe-masters/sale-types",      icon: Truck,        label: "Sale Types" },
      { to: "/wpe-masters/purchase-types",  icon: ShoppingCart, label: "Purchase Types" },
      { to: "/wpe-masters/roles",           icon: Shield,       label: "Roles" },
      { to: "/wpe-masters/departments",     icon: Globe2,       label: "Departments" },
    ],
  },
  {
    label: "WPE Users",
    items: [
      { to: "/wpe-masters/users", icon: UserCog, label: "User Creation" },
      { to: "/wpe-masters/role-permissions", icon: Shield, label: "Role Permissions" },
      { to: "/wpe-masters/user-screen-permissions", icon: Monitor, label: "Screen Permissions" },
    ],
  },
];

const adminMasterSections = [
  {
    label: "Admin Master",
    items: [
      { to: "/admin/main-screens",    icon: Monitor,         label: "Main Screen"       },
      { to: "/admin/screen-sections", icon: Layers,          label: "Screen Sections"   },
      { to: "/admin/user-screens",    icon: Layout,          label: "User Screens"      },
      { to: "/admin/user-types",      icon: Tag,             label: "User Types"        },
      { to: "/admin/user-accounts",   icon: Users,           label: "User Accounts"     },
      { to: "/admin/user-permissions",icon: Shield,          label: "User Permissions"  },
    ],
  },
  {
    label: "HR Master",
    items: [
      { to: "/admin/staff", icon: UserCog, label: "Staff" },
    ],
  },
];

const navSections = [
  {
    label: "Workspace",
    items: [
      { to: "/app",                icon: LayoutDashboard, label: "Dashboard" },
      { to: "/app/contacts",       icon: Users,           label: "Contacts" },
      { to: "/app/items",          icon: Box,             label: "Inventory" },
      { to: "/app/blending",       icon: Blend,           label: "Blending" },
      { to: "/app/presales",       icon: FileText,        label: "Presales" },
      { to: "/app/production",     icon: Layers,          label: "Production" },
      { to: "/app/regrind",        icon: Route,           label: "Regrind" },
      { to: "/app/store",          icon: Archive,         label: "Store" },
      { to: "/app/grn",            icon: Truck,           label: "GRN" },
      { to: "/app/qcr",            icon: ClipboardCheck,  label: "QCR" },
    ],
  },
  {
    label: "OIMS Masters",
    items: [
      { to: "/oims/machines",      icon: Monitor,         label: "Machines" },
      { to: "/oims/bom-variants",  icon: PackageSearch,   label: "BOM Variants" },
    ],
  },
  {
    label: "Common Masters",
    items: [
      { to: "/masters/continents",  icon: Globe2,        label: "Continents" },
      { to: "/masters/countries",   icon: Map,           label: "Countries" },
      { to: "/masters/states",      icon: MapPinned,     label: "States" },
      { to: "/masters/cities",      icon: Landmark,      label: "Cities" },
      { to: "/masters/taxes",       icon: ReceiptText,   label: "Taxes" },
      { to: "/masters/currencies",  icon: ReceiptText,   label: "Currencies" },
      { to: "/masters/customers",   icon: Users,         label: "Customers" },
      { to: "/masters/suppliers",   icon: PackageSearch, label: "Suppliers" },
      { to: "/masters/companies",   icon: Users,         label: "Companies" },
      { to: "/masters/projects",    icon: Route,         label: "Projects" },
    ],
  },
];

/* ─── collapsible nav section ─────────────────────────────────────── */
interface NavSectionProps {
  label: string;
  items: { to: string; icon: React.ElementType; label: string }[];
  collapsed: boolean;
  onMobileClose: () => void;
  defaultOpen?: boolean;
}

const NavSection = ({ label, items, collapsed, onMobileClose, defaultOpen = true }: NavSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const { accent, iconBg } = sectionMeta[label] ?? sectionMeta.default;
  const location = useLocation();
  const hasActive = items.some((i) => location.pathname === i.to || location.pathname.startsWith(i.to + "/"));

  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full items-center justify-between px-3 py-1.5 text-left"
        >
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
            hasActive ? "text-white/70" : "text-white/30 group-hover:text-white/50"
          }`}>
            {label}
          </span>
          <ChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 group-hover:text-white/50 ${open ? "" : "-rotate-90"}`} />
        </button>
      )}

      <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${open || collapsed ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app" || item.to === "/dashboard"}
            onClick={onMobileClose}
            className={({ isActive }) => [
              "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center" : "",
              isActive
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/50 hover:bg-white/6 hover:text-white/80",
            ].join(" ")}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b ${accent}`} />
                )}
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
                  isActive ? `${iconBg} scale-105` : "text-white/40 group-hover:text-white/70"
                }`}>
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                {!collapsed && (
                  <span className="truncate leading-none">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

/* ─── main layout ─────────────────────────────────────────────────── */
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

  const allSections = [...navSections, ...wpeMastersSections, ...adminMasterSections, ...adminNavSections];

  const breadcrumbItems = useMemo(() => {
    const path = location.pathname;
    if (path === "/app" || path === "/dashboard") return ["Dashboard"];
    const adminMatch = Object.values(adminRouteRegistry).find((e) => e.path === path);
    if (adminMatch) return ["Admin Master", adminMatch.title];
    for (const section of allSections) {
      const match = section.items.find((i) => i.to === path);
      if (match) return [section.label, match.label];
    }
    return [];
  }, [location.pathname, allSections]);

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

  const initials = (user?.username ?? "U")
    .split(/[\s._-]/)
    .map((p: string) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed z-50 flex h-full flex-col transition-all duration-300 lg:static ${
          collapsed ? "w-[60px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #162035 100%)" }}
      >
        {/* ── Brand header ─── */}
        <div className={`flex items-center border-b border-white/8 ${collapsed ? "justify-center px-0 py-4" : "gap-3 px-4 py-4"}`}>
          {!collapsed && (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <img src="/logo.png" alt="WPE" className="h-5 w-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="hidden text-[11px] font-black text-white [img+&]:hidden">W</span>
            </div>
          )}

          {collapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <span className="text-[11px] font-black text-white">W</span>
            </div>
          )}

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-white">WPE Admin</div>
              <div className="truncate text-[10px] text-white/40">Operations Control</div>
            </div>
          )}

          <button
            onClick={() => { setCollapsed((c) => !c); setMobileOpen(false); }}
            className="hidden h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/8 hover:text-white/70 lg:flex"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <button onClick={() => setMobileOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:text-white/70 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Nav ─── */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {allSections.map((section) => (
            <NavSection
              key={section.label}
              label={section.label}
              items={section.items}
              collapsed={collapsed}
              onMobileClose={() => setMobileOpen(false)}
              defaultOpen={section.label === "Workspace" || section.label === "WPE Masters" || section.label === "WPE Users"}
            />
          ))}
        </nav>

        {/* ── User footer ─── */}
        <div className={`border-t border-white/8 ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[11px] font-bold text-white shadow">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-white/80">{user?.username ?? "User"}</div>
                <div className="truncate text-[10px] text-white/35">{user?.email || "Authenticated"}</div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-9 w-full items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => (
                    <div key={item} className="inline-flex items-center gap-1.5">
                      <BreadcrumbItem>
                        {index === breadcrumbItems.length - 1 ? (
                          <BreadcrumbPage className="text-sm font-medium text-slate-800">{item}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link className="text-sm text-slate-500 hover:text-slate-800" to={index === 0 && item === "Dashboard" ? "/dashboard" : "#"}>
                              {item}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-700">{user?.username ?? "User"}</div>
              <div className="text-xs text-slate-400">{user?.email || "Bearer session"}</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
