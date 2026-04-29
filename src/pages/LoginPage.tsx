import { ArrowRight, Droplets, Factory, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(90deg,#dbe8f8_0%,#eef2f7_32%,#fff2e6_100%)]">
      <div className="absolute inset-0 opacity-50">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-4 border-x border-slate-300/40">
          <div className="border-r border-slate-300/40" />
          <div className="border-r border-slate-300/40" />
          <div className="border-r border-slate-300/40" />
          <div />
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto flex w-full max-w-md flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#46ad22] shadow-lg shadow-[#46ad22]/25">
                  <img src="/logo.png" alt="WPE logo" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#46ad22]/80">
                    WPE ERP
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900">Welcome</h1>
                </div>
              </div>

              <p className="mb-8 max-w-sm text-sm leading-6 text-slate-500">
                Initial access page for the WPE application. Credentials are not required yet, so you can enter directly.
              </p>

              <div className="w-full space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  disabled
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-500 placeholder:text-slate-400"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  disabled
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-500 placeholder:text-slate-400"
                />

                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-xl bg-[#f59f0b] text-base font-semibold text-white shadow-lg shadow-amber-500/30 transition-transform duration-300 hover:scale-[1.01] hover:bg-[#e28f08]"
                >
                  <Link to="/app">
                    Enter WPE App
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">No credentials required</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">UI preview mode</span>
              </div>
            </div>
          </section>

          <section className="relative flex min-h-[320px] flex-col justify-between bg-[#2f9d27] px-6 py-8 text-white sm:px-10 lg:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(166,216,0,0.28),transparent_28%)]" />

            <div className="relative flex items-center justify-between">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-white/80">
                BLUE PLANET STYLE
              </span>
              <ShieldCheck className="h-5 w-5 text-white/70" />
            </div>

            <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-8">
              <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-white/25">
                <div className="absolute inset-5 rounded-full border border-white/20" />
                <Factory className="h-24 w-24 text-white" strokeWidth={1.3} />
                <Droplets className="absolute left-12 top-16 h-8 w-8 text-[#f59f0b]" strokeWidth={1.5} />
                <Droplets className="absolute bottom-16 right-14 h-10 w-10 text-white/80" strokeWidth={1.5} />
                <div className="absolute bottom-10 rounded-full border border-white/30 px-6 py-2 text-3xl font-light tracking-[0.28em] text-white/90">
                  WPE
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center gap-3">
              <span className="h-1.5 w-8 rounded-full bg-[#f59f0b]" />
              <span className="h-1.5 w-8 rounded-full bg-white/25" />
            </div>
          </section>
        </div>
      </div>

      <p className="relative pb-6 text-center text-sm text-slate-500">
        © 2026 WPE. Initial login interface.
      </p>
    </div>
  );
};

export default LoginPage;
