import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db/client";
import { buildings, tickets, units } from "@/db/schema";
import { getTenantProfileFromSession } from "@/lib/tenant-profile";
import { formatSubmittedAt } from "@/lib/format";
import { statusMeta, toAttachmentList } from "@/lib/tickets";
import { AttachmentGallery } from "@/components/shared/lightbox";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getTenantProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      description: tickets.description,
      status: tickets.status,
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
    .where(eq(tickets.referenceCode, decodeURIComponent(id)))
    .limit(1);

  const t = rows[0];
  if (!t) notFound();

  // Tenant-scoped: never reveal someone else's ticket. The middleware + RLS
  // are belt-and-braces; this is the suspenders.
  if (!t.tenantEmail || t.tenantEmail.toLowerCase() !== profile.email.toLowerCase()) {
    notFound();
  }

  const meta = statusMeta(t.status);
  const attachments = toAttachmentList(t.attachments);
  const location = t.buildingAddress
    ? `${t.buildingName ?? ""}, ${t.buildingAddress}`
    : t.buildingName ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/tenant/dashboard"
        className="inline-flex items-center gap-1 text-deh-sm text-deh-blue hover:underline"
      >
        ← Back to dashboard
      </Link>

      <article className="rounded-deh-lg bg-deh-white p-6 ring-1 ring-deh-border">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-deh-xs text-deh-muted">{t.referenceCode}</p>
            <h1 className="mt-1 text-deh-xl font-bold text-deh-text">{t.type}</h1>
          </div>
          <span
            className={cn(
              "rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
              meta.pillClass,
            )}
          >
            {meta.label}
          </span>
        </header>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Description</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-deh-base text-deh-text">
              {t.description || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Location</dt>
            <dd className="text-deh-base text-deh-text">
              {location} — Wing {t.wing || "—"}, Flat {t.flat || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Submitted</dt>
            <dd className="text-deh-base text-deh-text">{formatSubmittedAt(t.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Attachments</dt>
            <dd className="text-deh-base text-deh-text">{attachments.length} file(s)</dd>
          </div>
        </dl>

        {attachments.length > 0 ? (
          <div className="mt-5">
            <h2 className="mb-2 text-deh-xs uppercase tracking-wide text-deh-muted">Files</h2>
            <AttachmentGallery attachments={attachments} />
          </div>
        ) : null}
      </article>
    </div>
  );
}
