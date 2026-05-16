import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { verifyToken } from "@/lib/auth/onboarding-token";
import { SetPasswordForm } from "./set-password-form";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/login");

  const payload = verifyToken(token, "first_login");
  if (!payload) redirect("/login");

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center justify-center gap-3 text-deh-dark">
        <span className="flex h-11 w-11 items-center justify-center rounded-deh-md bg-deh-dark text-deh-yellow shadow-deh-card">
          <Lock className="h-5 w-5" />
        </span>
        <p className="font-display text-deh-xl font-bold tracking-tight">
          DEH Maintenance
        </p>
      </div>

      <div className="rounded-3xl bg-white px-6 py-10 shadow-deh-card sm:px-10">
        <header className="mb-6 text-center">
          <h1 className="font-display text-deh-2xl font-bold text-deh-dark">
            Choose your password
          </h1>
          <p className="mt-1.5 text-deh-sm text-deh-muted">
            First-time sign-in — pick a password only you know. The default
            password won&apos;t work after this.
          </p>
        </header>
        <SetPasswordForm token={token} />
      </div>
    </div>
  );
}
