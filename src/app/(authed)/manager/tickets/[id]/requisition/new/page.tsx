import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, requisitions, tickets, units } from "@/db/schema";
import { getManagerProfileFromSession } from "@/lib/manager/manager-profile";
import { RequisitionForm } from "./requisition-form";

export const dynamic = "force-dynamic";

export default async function NewRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getManagerProfileFromSession();
  if (!profile) redirect("/login");

  const { id } = await params;
  const referenceCode = decodeURIComponent(id);

  const rows = await db
    .select({
      id: tickets.id,
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      scope: tickets.scope,
      buildingName: buildings.name,
      wing: units.wing,
      flat: units.flat,
    })
    .from(tickets)
    .leftJoin(buildings, eq(buildings.id, tickets.buildingId))
    .leftJoin(units, eq(units.id, tickets.unitId))
    .where(eq(tickets.referenceCode, referenceCode))
    .limit(1);
  const ticket = rows[0];
  if (!ticket) notFound();

  const existing = await db
    .select({ id: requisitions.id })
    .from(requisitions)
    .where(eq(requisitions.issueId, ticket.id))
    .limit(1);
  if (existing.length > 0) redirect("/manager/dashboard");

  const location = ticket.scope === "society"
    ? "Society-level"
    : ticket.scope === "building"
      ? ticket.buildingName ?? "Building"
      : [ticket.buildingName, ticket.wing ? `Wing ${ticket.wing}` : null, ticket.flat ? `Flat ${ticket.flat}` : null]
        .filter(Boolean)
        .join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Create Requisition</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          <span className="font-mono">{ticket.referenceCode}</span>
          <span className="mx-1.5">·</span>
          <span>{ticket.type}</span>
          <span className="mx-1.5">·</span>
          <span>{location}</span>
        </p>
      </header>

      <RequisitionForm referenceCode={ticket.referenceCode} />
    </div>
  );
}
