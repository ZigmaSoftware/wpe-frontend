import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Database,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";
import {
  buildAppNavigation,
  buildBreadcrumbs,
  DASHBOARD_SECTION_LABEL,
  flattenNavigationLinks,
  getTopLevelNavKey,
  isNavGroupActive,
  isNavItemActive,
  type AppNavGroup,
} from "@/lib/appNavigation";

type MegaSectionKey = "workspace" | "masters" | null;

const fullscreenMatchers = [
  /^\/app\/production\/neworder\/?$/,
  /^\/app\/production\/[^/]+\/edit\/?$/,
  /^\/app\/production\/manage-batch\/[^/]+\/?$/,
  /^\/app\/grn\/new\/?$/,
  /^\/app\/grn\/[^/]+\/edit\/?$/,
  /^\/app\/grn\/[^/]+\/?$/,
];

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<MegaSectionKey>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const { user, signOut, adminMenu = [] } = useAuth();

  const isFullscreenFormLayout = fullscreenMatchers.some((matcher) => matcher.test(location.pathname));

  const navigation = useMemo(
    () => buildAppNavigation(adminMenu, { hasFullAccess: Boolean(user?.is_staff) }),
    [adminMenu, user?.is_staff],
  );
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname, navigation), [location.pathname, navigation]);
  const topLevelKey = useMemo(() => getTopLevelNavKey(location.pathname, navigation), [location.pathname, navigation]);
  const searchableLinks = useMemo(() => flattenNavigationLinks(navigation), [navigation]);
  const homePath = navigation.dashboard?.to ?? searchableLinks[0]?.to ?? "/app";

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return searchableLinks
      .filter((entry) =>
        [entry.label, entry.description, entry.group, entry.section]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 8);
  }, [searchQuery, searchableLinks]);

  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

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

  const handleSearchNavigate = (to: string) => {
    setSearchQuery("");
    setSearchOpen(false);
    navigate(to);
  };

  const initials = (user?.username ?? "U")
    .split(/[\s._-]/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const sessionTitle = user?.username ?? "Authenticated user";
  const sessionSubtitle = user?.email || `${adminMenu.length} permission group${adminMenu.length === 1 ? "" : "s"}`;

  if (isFullscreenFormLayout) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <Outlet />
      </div>
    );
  }

  const renderWorkspaceMega = () => (
    <div className={`wpe-mega ${openMega === "workspace" ? "is-open" : ""}`}>
      <div className="wpe-mega-inner">
        <div className="wpe-mega-main">
          {navigation.workspace.map((group) => (
            <div key={group.key} className="wpe-mega-col">
              <div className="wpe-mega-col-head">
                <span className="wpe-mega-col-icon">
                  <group.icon className="h-4 w-4" />
                </span>
                <span>{group.label}</span>
                {group.tag ? <span className="wpe-chip-count">{group.tag}</span> : null}
              </div>
              <div className="wpe-mega-stack">
                {group.items.map((item) => {
                  const active = isNavItemActive(location.pathname, item);

                  return (
                    <Link key={item.to} to={item.to} className={`wpe-mega-link ${active ? "is-active" : ""}`}>
                      <span className="wpe-mega-link-icon">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="wpe-mega-link-copy">
                        <span className="wpe-mega-link-title">{item.label}</span>
                        <span className="wpe-mega-link-description">{item.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMastersMega = () => (
    <div className={`wpe-mega ${openMega === "masters" ? "is-open" : ""}`}>
      <div className="wpe-mega-inner">
        <div className="wpe-mega-main wpe-mega-main--masters">
          {navigation.masters.map((group) => (
            <div key={group.key} className="wpe-mega-col">
              <div className="wpe-mega-col-head">
                <span className="wpe-mega-col-icon">
                  <group.icon className="h-4 w-4" />
                </span>
                <span>{group.label}</span>
                <span className="wpe-chip-count">{group.items.length}</span>
              </div>
              <div className="wpe-mega-list">
                {group.items.map((item) => {
                  const active = isNavItemActive(location.pathname, item);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`wpe-mega-list-link ${active ? "is-active" : ""}`}
                    >
                      <span className="wpe-mega-list-dot" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMobileGroup = (group: AppNavGroup) => (
      <div key={group.key} className="wpe-mobile-group">
        <div className="wpe-mobile-group-head">
          <span className="wpe-mobile-group-icon">
            <group.icon className="h-4 w-4" />
          </span>
          <span>{group.label}</span>
          <span className="wpe-chip-count">{group.items.length}</span>
        </div>
      <div className="wpe-mobile-links">
        {group.items.map((item) => (
          <Link key={item.to} to={item.to} className="wpe-mobile-link" onClick={() => setMobileOpen(false)}>
            <span className="wpe-mobile-link-copy">
              <span className="wpe-mobile-link-title">{item.label}</span>
              <span className="wpe-mobile-link-description">{item.description}</span>
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="wpe-app-shell">
      <header className="wpe-topnav">
        <div className="wpe-topnav-inner">
          <button
            type="button"
            className="wpe-toolbar-iconbtn wpe-mobile-trigger"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link className="wpe-brand" to={homePath}>
            <img src="/zigma.png" alt="Zigma WPE ERP" className="h-9 w-auto object-contain" />
          </Link>

          <span className="wpe-nav-sep wpe-desktop-only" />

          <nav className="wpe-nav-primary wpe-desktop-only">
            {navigation.dashboard ? (
              <Link
                className={`wpe-nav-item ${topLevelKey === "dashboard" ? "is-active" : ""}`}
                to={navigation.dashboard.to}
                onClick={() => setOpenMega(null)}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{DASHBOARD_SECTION_LABEL}</span>
              </Link>
            ) : null}

            {navigation.workspace.length > 0 ? (
              <button
                type="button"
                className={`wpe-nav-item ${topLevelKey === "workspace" ? "is-active" : ""} ${openMega === "workspace" ? "is-open" : ""}`}
                onClick={() => setOpenMega((current) => (current === "workspace" ? null : "workspace"))}
                onMouseEnter={() => {
                  if (openMega) {
                    setOpenMega("workspace");
                  }
                }}
              >
                <Layers className="h-4 w-4" />
                <span>WPE Workspace</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ) : null}

            {navigation.masters.length > 0 ? (
              <button
                type="button"
                className={`wpe-nav-item ${topLevelKey === "masters" ? "is-active" : ""} ${openMega === "masters" ? "is-open" : ""}`}
                onClick={() => setOpenMega((current) => (current === "masters" ? null : "masters"))}
                onMouseEnter={() => {
                  if (openMega) {
                    setOpenMega("masters");
                  }
                }}
              >
                <Database className="h-4 w-4" />
                <span>Masters</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </nav>

          <div className="wpe-nav-right">
            <div ref={searchRef} className="wpe-search-shell wpe-desktop-only">
              <Search className="h-4 w-4" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults[0]) {
                    event.preventDefault();
                    handleSearchNavigate(searchResults[0].to);
                  }
                }}
                placeholder="Search routes, masters, workspaces…"
              />
              {searchOpen && searchResults.length > 0 ? (
                <div className="wpe-search-results">
                  {searchResults.map((entry) => (
                    <button
                      key={`${entry.to}-${entry.label}`}
                      type="button"
                      className="wpe-search-result"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSearchNavigate(entry.to);
                      }}
                    >
                      <span className="wpe-search-result-icon">
                        <entry.icon className="h-4 w-4" />
                      </span>
                      <span className="wpe-search-result-copy">
                        <span className="wpe-search-result-title">{entry.label}</span>
                        <span className="wpe-search-result-meta">
                          {entry.section}
                          {entry.group ? ` · ${entry.group}` : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="wpe-session-chip">
              <span className="wpe-session-chip-icon">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <span className="wpe-session-chip-copy">
                <b>{sessionTitle}</b>
                <span>{sessionSubtitle}</span>
              </span>
            </div>

            <button
              type="button"
              className="wpe-toolbar-iconbtn"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            <div className="wpe-avatar">
              <span>{initials || "U"}</span>
            </div>
          </div>
        </div>

        {navigation.workspace.length > 0 ? renderWorkspaceMega() : null}
        {navigation.masters.length > 0 ? renderMastersMega() : null}
      </header>

      <div
        className={`wpe-mega-scrim ${openMega || mobileOpen ? "is-open" : ""}`}
        onClick={() => {
          setOpenMega(null);
          setMobileOpen(false);
        }}
      />

      <div className={`wpe-mobile-sheet ${mobileOpen ? "is-open" : ""}`}>
        <div className="wpe-mobile-sheet-inner">
          {navigation.dashboard ? (
            <Link className="wpe-mobile-dashboard" to={navigation.dashboard.to} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard className="h-4 w-4" />
              <span>{DASHBOARD_SECTION_LABEL}</span>
            </Link>
          ) : null}

          {navigation.workspace.length > 0 ? (
            <div className="wpe-mobile-section">
              <div className="wpe-mobile-section-title">WPE Workspace</div>
              {navigation.workspace.map(renderMobileGroup)}
            </div>
          ) : null}

          {navigation.masters.length > 0 ? (
            <div className="wpe-mobile-section">
              <div className="wpe-mobile-section-title">Masters</div>
              {navigation.masters.map(renderMobileGroup)}
            </div>
          ) : null}
        </div>
      </div>

      <main className="wpe-app-main">
        <div className="wpe-page">
          {breadcrumbs.length > 0 ? (
            <div className="wpe-crumbbar">
              <div className="wpe-crumbs">
                {breadcrumbs.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="wpe-crumb">
                    {item.to && index < breadcrumbs.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                    {index < breadcrumbs.length - 1 ? <span className="wpe-crumb-sep">/</span> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
