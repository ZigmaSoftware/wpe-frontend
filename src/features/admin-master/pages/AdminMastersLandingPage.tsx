import { ArrowRight, Shield } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { adminModuleDefinitions, getAdminMastersModulesFromMenu } from "@/features/admin-master/utils/routes";
import { useAuth } from "@/providers/AuthProvider";

const AdminMastersLandingPage = () => {
  const { adminMenu, isBootstrapping, user } = useAuth();

  const modules = useMemo(() => {
    const modulesFromMenu = getAdminMastersModulesFromMenu(adminMenu);

    if (modulesFromMenu.length > 0) {
      return modulesFromMenu;
    }

    if (user?.is_staff && adminMenu.length === 0) {
      return adminModuleDefinitions;
    }

    return [];
  }, [adminMenu, user?.is_staff]);

  if (isBootstrapping) {
    return null;
  }

  if (adminMenu.length > 0 && modules.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Admin Masters"
        description="Manage core administration screens, user setup, screen sections, and permission configuration."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Shield className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Administration module access</div>
              <p className="max-w-2xl text-sm text-slate-500">
                Open the required setup screen to maintain navigation structure, user definitions, and access control.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {modules.length} module{modules.length === 1 ? "" : "s"} available
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.to}
              to={module.to}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/70"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200 transition-colors group-hover:bg-sky-100 group-hover:ring-sky-200">
                  <module.icon className="h-[18px] w-[18px]" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-semibold text-slate-900">{module.label}</div>
                  <p className="text-sm leading-6 text-slate-500">{module.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-medium text-slate-500 transition-colors group-hover:text-sky-700">
                <span>Open module</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminMastersLandingPage;
