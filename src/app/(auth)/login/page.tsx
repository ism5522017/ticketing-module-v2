import { Building2, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-1 overflow-hidden rounded-[28px] shadow-deh-card ring-1 ring-deh-border lg:grid-cols-[1.05fr_1fr]">
        {/* Brand pitch — hidden on mobile, replaced by compact header on lg+. */}
        <aside className="relative hidden flex-col justify-between bg-deh-gradient-warm p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-deh-md bg-deh-yellow text-deh-dark shadow-[0_8px_20px_rgba(252,191,73,0.45)]">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-deh-lg font-bold tracking-tight">
                DEH Maintenance
              </p>
              <p className="text-deh-xxs uppercase tracking-[0.22em] text-deh-yellow">
                Society operations
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-deh-2xl font-bold leading-tight">
              Maintenance,
              <br />
              made transparent.
            </h2>
            <p className="mt-3 max-w-sm text-deh-sm text-white/85">
              Raise an issue, watch it through triage, see when it&apos;s fixed.
              One workspace for residents, managers and your DR.
            </p>

            <ul className="mt-8 space-y-3 text-deh-sm text-white/85">
              <Feature icon={Sparkles}>One-tap ticket raise with smart triage</Feature>
              <Feature icon={Building2}>Per-building visibility for DRs</Feature>
              <Feature icon={ShieldCheck}>Bank-grade auth via Supabase</Feature>
            </ul>
          </div>

          <p className="text-deh-xs text-white/60">
            © {new Date().getFullYear()} DEH Estate · Internal portal
          </p>

          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-deh-yellow/20 blur-3xl" />
        </aside>

        {/* Form card */}
        <div className="bg-white p-8 sm:p-12">
          {/* Compact brand row, visible only on mobile (lg:hidden because aside owns it on desktop) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-deh-md bg-deh-dark text-deh-yellow shadow-deh-card">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-deh-md font-bold tracking-tight text-deh-dark">
                DEH Maintenance
              </p>
              <p className="text-deh-xxs uppercase tracking-[0.18em] text-deh-muted">
                Sign in
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  children,
}: {
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
        <Icon className="h-3.5 w-3.5 text-deh-yellow" />
      </span>
      <span>{children}</span>
    </li>
  );
}
