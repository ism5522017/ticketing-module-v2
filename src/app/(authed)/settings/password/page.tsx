import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Change password</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          You&apos;ll stay signed in after the change.
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
