/**
 * Auth-route shell — body already carries the beige pattern from the root
 * layout. This wrapper just centers /login + /onboarding/*.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
      {children}
    </main>
  );
}
