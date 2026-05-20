import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Blend,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Layers,
  Layout,
  LogOut,
  Menu,
  Monitor,
  PackageSearch,
  Route,
  Shield,
  Tag,
  Truck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { adminRouteMetas, adminRouteRegistry, getAdminRouteTitle, resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import type { AdminMenuMain } from "@/features/admin-master/types";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";

/* ─── colour palette per section ──────────────────────────────────── */
const sectionMeta: Record<string, { accent: string; iconBg: string }> = {
  Workspace:        { accent: "from-blue-500 to-indigo-600",   iconBg: "bg-blue-500/15 text-blue-400" },
  "OIMS Masters":   { accent: "from-amber-500 to-orange-600",  iconBg: "bg-amber-500/15 text-amber-400" },
  "Admin Master":   { accent: "from-cyan-500 to-sky-600",      iconBg: "bg-cyan-500/15 text-cyan-400" },
  default:          { accent: "from-slate-500 to-slate-600",   iconBg: "bg-slate-500/15 text-slate-400" },
};

type NavItem = { to: string; icon: LucideIcon; label: string };
type NavSectionConfig = { label: string; items: NavItem[] };

const hiddenSectionLabels = new Set([
  "common masters",
  "masters",
  "wpe masters",
  "wpe users",
]);

const normalizeSectionLabel = (label: string) =>
  label.trim().toLowerCase() === "hr master" ? "Admin Master" : label;

const isHiddenSectionLabel = (label: string) => hiddenSectionLabels.has(label.trim().toLowerCase());

const adminIconByScreenCode: Record<string, LucideIcon> = {
  "main-screen-master": Monitor,
  "screen-section-master": Layers,
  "user-screen-master": Layout,
  "staff-master": UserCog,
  "user-type-master": Tag,
  "user-account-master": Users,
  "user-permission-master": Shield,
};

const navSections: NavSectionConfig[] = [
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
];

/* ─── collapsible nav section ─────────────────────────────────────── */
interface NavSectionProps {
  label: string;
  items: NavItem[];
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

  const staticAdminSections = useMemo(() => {
    const grouped = new Map<string, NavItem[]>();

    for (const meta of adminRouteMetas) {
      const sectionLabel = normalizeSectionLabel(meta.section ?? "Admin Master");
      if (isHiddenSectionLabel(sectionLabel)) {
        continue;
      }
      const currentItems = grouped.get(sectionLabel) ?? [];
      currentItems.push({
        to: meta.path,
        icon: meta.screenCode ? (adminIconByScreenCode[meta.screenCode] ?? Shield) : Shield,
        label: meta.navLabel ?? meta.title,
      });
      grouped.set(sectionLabel, currentItems);
    }

    return Array.from(grouped.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, []);

  const adminNavSections = useMemo(
    () =>
      adminMenu.map((main: AdminMenuMain) => ({
        label: normalizeSectionLabel(main.name),
        items: main.sections.flatMap((section) =>
          section.screens.map((screen) => ({
            to: resolveAdminRoutePath(screen.code, screen.route_path),
            icon: Shield,
            label: getAdminRouteTitle(screen.code, screen.screen_name),
          })),
        ),
      })).filter((section) => !isHiddenSectionLabel(section.label)),
    [adminMenu],
  );

  const allSections = useMemo(() => {
    const sectionMap = new Map<string, NavItem[]>();

    for (const section of [...navSections, ...staticAdminSections, ...adminNavSections]) {
      if (isHiddenSectionLabel(section.label)) {
        continue;
      }
      const existingItems = sectionMap.get(section.label) ?? [];
      const seenPaths = new Set(existingItems.map((item) => item.to));

      for (const item of section.items) {
        if (!seenPaths.has(item.to)) {
          existingItems.push(item);
          seenPaths.add(item.to);
        }
      }

      sectionMap.set(section.label, existingItems);
    }

    return Array.from(sectionMap.entries()).map(([label, items]) => ({ label, items }));
  }, [adminNavSections, staticAdminSections]);

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
              defaultOpen={section.label === "Workspace" || section.label === "Admin Master"}
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
