import { ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { commonModuleDefinitions } from "@/features/common-master/utils/routes";

const CommonMastersLandingPage = () => (
  <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader
      title="Common Masters"
      description="Manage continent, country, state, city, tax, currency, partner setup, and company information."
    />

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">Shared master setup</div>
            <p className="max-w-2xl text-sm text-slate-500">
              Open the required master to maintain geography, taxation, business partners, and company setup records.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          {commonModuleDefinitions.length} module{commonModuleDefinitions.length === 1 ? "" : "s"} available
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {commonModuleDefinitions.map((module) => (
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

export default CommonMastersLandingPage;
