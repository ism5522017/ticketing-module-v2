import { redirect } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center bg-deh-gray-bg px-4 py-12">
      <div className="w-full max-w-md rounded-deh-lg border border-deh-border bg-white p-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-deh-xl font-bold text-deh-dark">Choose your password</h1>
          <p className="text-deh-sm text-deh-muted mt-1">
            First-time sign-in — choose a password only you know. The default password won't work after this.
          </p>
        </header>
        <SetPasswordForm token={token} />
      </div>
    </main>
  );
}
