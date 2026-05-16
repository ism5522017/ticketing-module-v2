import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { buildings, tickets, units } from "@/db/schema";
import { formatSubmittedAt } from "@/lib/format";
import { attachmentCount } from "@/lib/tickets";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TicketConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) redirect("/tenant/dashboard");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const rows = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      submittedAt: tickets.submittedAt,
      tenantEmail: tickets.tenantEmail,
      attachments: tickets.attachments,
      buildingName: buildings.name,
      buildingAddress: buildings.address,
      wing: units.wing,
      flat: units.flat,
    })
    .from(tickets)
    .leftJoin(units, eq(units.id, tickets.unitId))
    .leftJoin(buildings, eq(buildings.id, tickets.buildingId))
    .where(eq(tickets.referenceCode, ref))
    .limit(1);

  const t = rows[0];
  if (!t) redirect("/tenant/dashboard");

  if (t.tenantEmail && authUser.email && t.tenantEmail.toLowerCase() !== authUser.email.toLowerCase()) {
    redirect("/tenant/dashboard");
  }

  const location = t.buildingAddress
    ? `${t.buildingName ?? ""}, ${t.buildingAddress}`
    : t.buildingName ?? "";

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
            <p className="text-deh-sm text-deh-muted">We&apos;ll keep you posted on your dashboard.</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Reference</dt>
            <dd className="font-mono text-deh-base text-deh-text">{t.referenceCode}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Issue type</dt>
            <dd className="text-deh-base text-deh-text">{t.type}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Location</dt>
            <dd className="text-deh-base text-deh-text">
              {location} — Wing {t.wing || "—"}, Flat {t.flat || "—"}
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
        <Link href="/tenant/tickets/new">
          <Button variant="ghost" size="sm">
            Raise another
          </Button>
        </Link>
        <Link href="/tenant/dashboard">
          <Button size="sm">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
