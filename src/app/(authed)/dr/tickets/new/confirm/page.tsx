import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { tickets } from "@/db/schema";
import { formatSubmittedAt } from "@/lib/format";
import { attachmentCount, urgencyMeta } from "@/lib/tickets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDrProfileFromSession } from "@/lib/dr/dr-profile";

export const dynamic = "force-dynamic";

const SCOPE_LABEL: Record<string, string> = {
  building: "Building-level issue",
  society: "Society-level query",
};

export default async function DrTicketConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) redirect("/dr/dashboard");

  const profile = await getDrProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      urgency: tickets.urgency,
      scope: tickets.scope,
      submittedAt: tickets.submittedAt,
      attachments: tickets.attachments,
      raisedByDrId: tickets.raisedByDrId,
    })
    .from(tickets)
    .where(eq(tickets.referenceCode, ref))
    .limit(1);

  const t = rows[0];
  if (!t || t.raisedByDrId !== profile.drId) redirect("/dr/dashboard");

  const uMeta = urgencyMeta(t.urgency);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="rounded-deh-lg bg-deh-white p-6 ring-1 ring-deh-border">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-deh-light-green text-deh-green">
            ✓
          </span>
          <div>
            <h1 className="text-deh-lg font-semibold text-deh-text">
              Ticket {t.referenceCode} submitted
            </h1>
            <p className="text-deh-sm text-deh-muted">
              We&apos;ll keep you posted on your dashboard.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Reference</dt>
            <dd className="font-mono text-deh-base text-deh-text">{t.referenceCode}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Scope</dt>
            <dd className="text-deh-base text-deh-text">{SCOPE_LABEL[t.scope] ?? t.scope}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Issue type</dt>
            <dd className="text-deh-base text-deh-text">{t.type}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Urgency</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
                  uMeta.pillClass,
                )}
              >
                {uMeta.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Attachments</dt>
            <dd className="text-deh-base text-deh-text">{attachmentCount(t.attachments)} file(s)</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Submitted</dt>
            <dd className="text-deh-base text-deh-text">{formatSubmittedAt(t.submittedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link href="/dr/tickets/new">
          <Button variant="ghost" size="sm">
            Raise another
          </Button>
        </Link>
        <Link href="/dr/dashboard">
          <Button size="sm">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
