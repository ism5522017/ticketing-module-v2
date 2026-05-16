import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db/client";
import { buildings, tickets, units } from "@/db/schema";
import { getDrProfileFromSession } from "@/lib/dr/dr-profile";
import { formatSubmittedAt } from "@/lib/format";
import { statusMeta, toAttachmentList, urgencyMeta } from "@/lib/tickets";
import { AttachmentGallery } from "@/components/shared/lightbox";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SCOPE_LABEL: Record<string, string> = {
  unit: "Unit",
  building: "Building",
  society: "Society",
};

export default async function DrTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getDrProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      description: tickets.description,
      status: tickets.status,
      urgency: tickets.urgency,
      urgencyOverridden: tickets.urgencyOverridden,
      scope: tickets.scope,
      submittedAt: tickets.submittedAt,
      attachments: tickets.attachments,
      buildingId: tickets.buildingId,
      raisedByDrId: tickets.raisedByDrId,
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

  // DR can see: tickets in their building (any scope) OR society tickets they raised themselves.
  const inBuilding = t.buildingId === profile.buildingId;
  const ownSociety = t.scope === "society" && t.raisedByDrId === profile.drId;
  if (!inBuilding && !ownSociety) notFound();

  const sMeta = statusMeta(t.status);
  const uMeta = urgencyMeta(t.urgency);
  const attachments = toAttachmentList(t.attachments);
  const location = t.buildingAddress
    ? `${t.buildingName ?? ""}, ${t.buildingAddress}`
    : t.buildingName ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/dr/dashboard"
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
                uMeta.pillClass,
              )}
            >
              {uMeta.label}
              {t.urgencyOverridden ? " · set" : ""}
            </span>
            <span
              className={cn(
                "rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
                sMeta.pillClass,
              )}
            >
              {sMeta.label}
            </span>
          </div>
        </header>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Description</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-deh-base text-deh-text">
              {t.description || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Scope</dt>
            <dd className="text-deh-base text-deh-text">{SCOPE_LABEL[t.scope] ?? t.scope}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Submitted</dt>
            <dd className="text-deh-base text-deh-text">{formatSubmittedAt(t.submittedAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Location</dt>
            <dd className="text-deh-base text-deh-text">
              {t.scope === "society"
                ? "Society-level"
                : t.scope === "building"
                  ? location || "—"
                  : `${location} — Wing ${t.wing || "—"}, Flat ${t.flat || "—"}`}
            </dd>
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
