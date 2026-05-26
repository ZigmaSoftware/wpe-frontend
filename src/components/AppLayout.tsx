import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Blend,
  Box,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { adminRouteRegistry, getAdminRouteTitle, resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import { WPE_PRODUCT_TYPES_ROUTE } from "@/features/wpe-masters/constants";
import type { AdminMenuMain } from "@/features/admin-master/types";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";

/* ─── colour palette per section ──────────────────────────────────── */
const sectionMeta: Record<string, { accent: string; marker: string; glow: string }> = {
  Workspace: { accent: "from-emerald-400 to-cyan-400", marker: "bg-emerald-400", glow: "shadow-emerald-500/20" },
  "Common Masters": { accent: "from-sky-400 to-indigo-400", marker: "bg-sky-400", glow: "shadow-sky-500/20" },
  "WPE Masters": { accent: "from-lime-400 to-emerald-400", marker: "bg-lime-400", glow: "shadow-lime-500/20" },
  "OIMS Masters": { accent: "from-amber-300 to-orange-400", marker: "bg-amber-300", glow: "shadow-amber-500/20" },
  Masters: { accent: "from-sky-400 to-cyan-400", marker: "bg-sky-400", glow: "shadow-sky-500/20" },
  default: { accent: "from-stone-300 to-zinc-100", marker: "bg-zinc-300", glow: "shadow-white/10" },
};

const wpeMastersSections = [
  {
    label: "WPE Masters",
    items: [
      { to: "/wpe-masters/locations",       icon: MapPin,       label: "Locations" },
      { to: "/wpe-masters/branches",        icon: Building2,    label: "Branches" },
      { to: "/wpe-masters/price-books",     icon: Tag,          label: "Price Books" },
      { to: "/wpe-masters/warehouses",      icon: Warehouse,    label: "Warehouses" },
      { to: WPE_PRODUCT_TYPES_ROUTE,        icon: Layers,       label: "Product Types" },
      { to: "/wpe-masters/production-types",icon: Box,          label: "Production Types" },
      { to: "/wpe-masters/sale-types",      icon: Truck,        label: "Sale Types" },
      { to: "/wpe-masters/purchase-types",  icon: ShoppingCart, label: "Purchase Types" },
      { to: "/wpe-masters/roles",           icon: Shield,       label: "Roles" },
      { to: "/wpe-masters/departments",     icon: Globe2,       label: "Departments" },
    ],
  },
];

const adminScreenItems = [
  { codes: ["main-screen-master"], to: "/admin/main-screens", icon: Monitor, label: "Main Screens" },
  { codes: ["screen-section-master"], to: "/admin/screen-sections", icon: Layers, label: "Screen Sections" },
  { codes: ["user-screen-master"], to: "/admin/user-screens", icon: Layout, label: "User Screens" },
  { codes: ["user-type-master"], to: "/admin/user-types", icon: Users, label: "User Types" },
  { codes: ["user-account-master", "user-creation-master"], to: "/admin/user-creation", icon: UserCog, label: "User Creation" },
  { codes: ["user-permission-master", "user-screen-permission-master"], to: "/admin/user-screen-permission", icon: Shield, label: "User Screen Permission" },
] as const;

const adminScreenIconMap: Record<string, React.ElementType> = Object.fromEntries(
  adminScreenItems.flatMap((item) => item.codes.map((code) => [code, item.icon])),
);

const adminMasterSections = [
  {
    label: "Masters",
    items: adminScreenItems.map(({ to, icon, label }) => ({ to, icon, label })),
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
  const { accent, marker, glow } = sectionMeta[label] ?? sectionMeta.default;
  const location = useLocation();
  const hasActive = items.some((i) => location.pathname === i.to || location.pathname.startsWith(i.to + "/"));
  const [open, setOpen] = useState(defaultOpen || hasActive);

  useEffect(() => {
    if (hasActive) {
      setOpen(true);
    }
  }, [hasActive]);

  return (
    <div className={collapsed ? "space-y-1" : "space-y-1.5"}>
      {!collapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className={[
            "group flex h-8 w-full items-center justify-between rounded-md px-3 text-left transition-colors",
            hasActive ? "bg-white/[0.07]" : "hover:bg-white/[0.05]",
          ].join(" ")}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${marker}`} />
            <span className={`truncate text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
              hasActive ? "text-white/80" : "text-white/40 group-hover:text-white/70"
            }`}>
              {label}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white/50">
              {items.length}
            </span>
            <ChevronDown className={`h-3 w-3 text-white/40 transition-transform duration-200 group-hover:text-white/60 ${open ? "" : "-rotate-90"}`} />
          </span>
        </button>
      )}

      <div className={`space-y-1 overflow-hidden transition-all duration-200 ${open || collapsed ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"}`}>
        {items.map((item) => {
          const link = (
            <NavLink
              to={item.to}
              end={item.to === "/app" || item.to === "/dashboard"}
              onClick={onMobileClose}
              className={({ isActive }) => [
                "group relative flex h-10 items-center gap-3 overflow-hidden rounded-md px-2.5 text-[13px] font-medium transition-all duration-150",
                collapsed ? "mx-auto w-10 justify-center px-0" : "",
                isActive
                  ? `bg-white/[0.12] text-white shadow-lg ${glow} ring-1 ring-white/[0.10]`
                  : "text-white/60 hover:bg-white/[0.07] hover:text-white",
              ].join(" ")}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <>
                      <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b ${accent}`} />
                      <span className={`absolute inset-y-1 right-1 w-10 rounded-full bg-gradient-to-l ${accent} opacity-10 blur-md`} />
                    </>
                  )}
                  <span className={`relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
                    isActive
                      ? `bg-gradient-to-br ${accent} text-zinc-950 shadow-sm`
                      : "bg-white/[0.06] text-white/60 group-hover:bg-white/[0.10] group-hover:text-white"
                  }`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  {!collapsed && (
                    <span className="relative min-w-0 flex-1 truncate leading-none">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );

          if (!collapsed) {
            return <div key={item.to}>{link}</div>;
          }

          return (
            <Tooltip key={item.to} delayDuration={150}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" className="border-zinc-800 bg-zinc-950 text-white">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
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
      adminMenu
        .map((main: AdminMenuMain) => ({
          label: main.name,
          items: main.sections.flatMap((section) =>
            section.screens
              .map((screen) => ({
                to: resolveAdminRoutePath(screen.code, screen.route_path),
                icon: adminScreenIconMap[screen.code] ?? Shield,
                label: getAdminRouteTitle(screen.code, screen.screen_name),
              }))
              .filter(
                (item, index, items) =>
                  item.to !== "/dashboard" &&
                  items.findIndex((candidate) => candidate.to === item.to) === index,
              ),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [adminMenu],
  );

  const allSections = useMemo(
    () => [...navSections, ...wpeMastersSections, ...(adminNavSections.length > 0 ? adminNavSections : adminMasterSections)],
    [adminNavSections],
  );

  const breadcrumbItems = useMemo(() => {
    const path = location.pathname;
    if (path === "/app" || path === "/dashboard") return ["Dashboard"];
    const adminMatch = Object.values(adminRouteRegistry).find((e) => e.path === path);
    if (adminMatch) return ["Masters", adminMatch.title];
    for (const section of allSections) {
      const match = section.items.find((i) => path === i.to || path.startsWith(i.to + "/"));
      if (match) return [section.label, match.label];
    }
    return [];
  }, [location.pathname, allSections]);

  const isFullscreenFormLayout = useMemo(() => {
    const path = location.pathname;
    const fullscreenMatchers = [
      /^\/app\/production\/neworder\/?$/,
      /^\/app\/production\/[^/]+\/edit\/?$/,
      /^\/app\/production\/manage-batch\/[^/]+\/?$/,
      /^\/app\/grn\/new\/?$/,
      /^\/app\/grn\/[^/]+\/edit\/?$/,
      /^\/app\/grn\/[^/]+\/?$/,
    ];
    return fullscreenMatchers.some((matcher) => matcher.test(path));
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

  const initials = (user?.username ?? "U")
    .split(/[\s._-]/)
    .map((p: string) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && !isFullscreenFormLayout && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      {!isFullscreenFormLayout ? (
        <aside
          className={`fixed z-50 flex h-full flex-col border-r border-black/20 shadow-2xl shadow-black/20 transition-all duration-300 lg:static ${
            collapsed ? "w-[72px]" : "w-[278px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{ background: "linear-gradient(180deg, #1e3f7a 0%, #1a3570 44%, #152b5e 100%)" }}
        >
        {/* ── Brand header ─── */}
        <div className={`border-b border-white/[0.08] ${collapsed ? "px-3 py-4" : "px-4 py-4"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-white text-zinc-950 shadow-lg shadow-sky-500/20 ring-1 ring-sky-300/30">
              {!collapsed ? (
                <img src="/logo.png" alt="WPE" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-[12px] font-black">WPE</span>
              )}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[14px] font-bold text-white">WPE ERP</div>
                  <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-sky-200">
                    Live
                  </span>
                </div>
                <div className="truncate text-[11px] font-medium text-white/50">Plant operations suite</div>
              </div>
            )}

            <button
              onClick={() => { setCollapsed((c) => !c); setMobileOpen(false); }}
              className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white lg:flex"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-white/[0.08] hover:text-white lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!collapsed && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.06] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Modules</div>
                <div className="mt-1 text-sm font-bold text-white">{allSections.length}</div>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-white/[0.06] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Session</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-sky-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                  Online
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav ─── */}
        <nav className={`flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collapsed ? "space-y-3 px-2 py-3" : "space-y-4 px-3 py-4"}`}>
          {allSections.map((section) => (
            <NavSection
              key={section.label}
              label={section.label}
              items={section.items}
              collapsed={collapsed}
              onMobileClose={() => setMobileOpen(false)}
              defaultOpen={section.label === "Workspace" || section.label === "WPE Masters" || section.label === "Masters"}
            />
          ))}
        </nav>

        {/* ── User footer ─── */}
        <div className={`border-t border-white/[0.08] bg-black/[0.12] ${collapsed ? "px-3 py-3" : "px-3 py-3"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.06] p-2">
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-emerald-300 text-[11px] font-black text-zinc-950 shadow">
                <span>{initials}</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1e3f7a] bg-sky-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{user?.username ?? "User"}</div>
                <div className="truncate text-[10px] font-medium text-white/40">{user?.email || "Authenticated"}</div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-emerald-300 text-[11px] font-black text-zinc-950">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
                className="flex h-10 w-full items-center justify-center rounded-md text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        </aside>
      ) : null}

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            {!isFullscreenFormLayout ? (
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            ) : null}

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
