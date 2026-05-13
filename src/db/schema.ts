import { pgTable, index, uniqueIndex, foreignKey, uuid, text, timestamp, boolean, numeric, jsonb, check, date, varchar, pgView, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const requisitionApproval = pgEnum("requisition_approval", ['Pending', 'Approved', 'Rejected'])
export const ticketRaiser = pgEnum("ticket_raiser", ['tenant', 'dr'])
export const ticketScope = pgEnum("ticket_scope", ['unit', 'building', 'society'])
export const ticketStatus = pgEnum("ticket_status", ['open', 'progress', 'resolved'])
export const ticketUrgency = pgEnum("ticket_urgency", ['critical', 'high', 'medium', 'low'])

export const ticketsReferenceSeq = pgSequence("tickets_reference_seq", {  startWith: "101", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	contact: text(),
	passwordDigest: text("password_digest").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	unitId: uuid("unit_id"),
	mustChangePassword: boolean("must_change_password").default(false).notNull(),
	phone: text(),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("tenants_active_idx").using("btree", table.active.asc().nullsLast().op("bool_ops")),
	uniqueIndex("tenants_email_lower_idx").using("btree", sql`lower(email)`),
	index("tenants_phone_idx").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("tenants_unit_id_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "tenants_unit_id_fkey"
		}).onDelete("restrict"),
]);

export const requisitions = pgTable("requisitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	surveyed: boolean().default(false).notNull(),
	inHouseFix: boolean("in_house_fix").default(false).notNull(),
	vendorName: text("vendor_name"),
	estCost: numeric("est_cost", { precision: 12, scale:  2 }).default('0').notNull(),
	costBreakdown: text("cost_breakdown"),
	invoices: jsonb().default([]).notNull(),
	adminApproval: requisitionApproval("admin_approval").default('Pending').notNull(),
	adminRemarks: text("admin_remarks"),
	vendorConfirmed: boolean("vendor_confirmed").default(false).notNull(),
	vendorConfirmedBy: text("vendor_confirmed_by"),
	vendorProof: jsonb("vendor_proof").default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	issueId: uuid("issue_id").notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).notNull(),
	vendorConfirmedAt: timestamp("vendor_confirmed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("requisitions_issue_id_idx").using("btree", table.issueId.asc().nullsLast().op("uuid_ops")),
	index("requisitions_submitted_at_idx").using("btree", table.submittedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.issueId],
			foreignColumns: [tickets.id],
			name: "requisitions_issue_id_fkey"
		}).onDelete("cascade"),
]);

export const managers = pgTable("managers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	username: text().notNull(),
	passwordDigest: text("password_digest").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	mustChangePassword: boolean("must_change_password").default(false).notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("managers_active_idx").using("btree", table.active.asc().nullsLast().op("bool_ops")),
	uniqueIndex("managers_username_lower_idx").using("btree", sql`lower(username)`),
]);

export const societies = pgTable("societies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("societies_name_lower_idx").using("btree", sql`lower(name)`),
]);

export const units = pgTable("units", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buildingId: uuid("building_id").notNull(),
	wing: text(),
	flat: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	floor: text(),
	unitType: text("unit_type"),
	category: text(),
	sqft: numeric({ precision: 10, scale:  2 }),
	sqmt: numeric({ precision: 10, scale:  2 }),
	areaType: text("area_type"),
	residentName: text("resident_name"),
	department: text(),
}, (table) => [
	uniqueIndex("units_building_wing_flat_idx").using("btree", sql`building_id`, sql`lower(COALESCE(wing, ''::text))`, sql`lower(COALESCE(flat, ''::text))`),
	index("units_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("units_unit_type_idx").using("btree", table.unitType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.buildingId],
			foreignColumns: [buildings.id],
			name: "units_building_id_fkey"
		}).onDelete("restrict"),
]);

export const tickets = pgTable("tickets", {
	type: text().notNull(),
	description: text(),
	urgencyOverridden: boolean("urgency_overridden").default(false).notNull(),
	triageReason: text("triage_reason"),
	tenantEmail: text("tenant_email"),
	tenantName: text("tenant_name"),
	contact: text(),
	locationEdited: boolean("location_edited").default(false).notNull(),
	attachments: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	referenceCode: text("reference_code").default(sql`(\'TK-\'::text || lpad((nextval(\'tickets_reference_seq\'::regclass))::text, 5, \'0\'::text))`).notNull(),
	scope: ticketScope().default('unit').notNull(),
	raisedByRole: ticketRaiser("raised_by_role").default('tenant').notNull(),
	societyId: uuid("society_id").notNull(),
	buildingId: uuid("building_id"),
	unitId: uuid("unit_id"),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: ticketStatus().default('open').notNull(),
	urgency: ticketUrgency().default('low').notNull(),
	raisedByDrId: uuid("raised_by_dr_id"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("tickets_building_id_idx").using("btree", table.buildingId.asc().nullsLast().op("uuid_ops")),
	index("tickets_building_submitted_idx").using("btree", table.buildingId.asc().nullsLast().op("timestamptz_ops"), table.submittedAt.desc().nullsFirst().op("uuid_ops")),
	index("tickets_dr_society_idx").using("btree", table.raisedByDrId.asc().nullsLast().op("uuid_ops")).where(sql`(scope = 'society'::ticket_scope)`),
	index("tickets_raised_by_dr_id_idx").using("btree", table.raisedByDrId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("tickets_reference_code_idx").using("btree", table.referenceCode.asc().nullsLast().op("text_ops")),
	index("tickets_resolved_at_idx").using("btree", table.resolvedAt.asc().nullsLast().op("timestamptz_ops")),
	index("tickets_scope_idx").using("btree", table.scope.asc().nullsLast().op("enum_ops")),
	index("tickets_society_id_idx").using("btree", table.societyId.asc().nullsLast().op("uuid_ops")),
	index("tickets_submitted_at_idx").using("btree", table.submittedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("tickets_tenant_email_idx").using("btree", table.tenantEmail.asc().nullsLast().op("text_ops")),
	index("tickets_unit_id_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.buildingId],
			foreignColumns: [buildings.id],
			name: "tickets_building_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.raisedByDrId],
			foreignColumns: [drs.id],
			name: "tickets_raised_by_dr_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.societyId],
			foreignColumns: [societies.id],
			name: "tickets_society_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "tickets_unit_id_fkey"
		}).onDelete("restrict"),
	check("tickets_raiser_identity_check", sql`((raised_by_role = 'tenant'::ticket_raiser) AND (raised_by_dr_id IS NULL)) OR ((raised_by_role = 'dr'::ticket_raiser) AND (raised_by_dr_id IS NOT NULL))`),
	check("tickets_scope_check", sql`((scope = 'unit'::ticket_scope) AND (unit_id IS NOT NULL) AND (building_id IS NOT NULL)) OR ((scope = 'building'::ticket_scope) AND (building_id IS NOT NULL) AND (unit_id IS NULL)) OR ((scope = 'society'::ticket_scope) AND (unit_id IS NULL) AND (building_id IS NULL))`),
]);

export const admins = pgTable("admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	username: text().notNull(),
	passwordDigest: text("password_digest").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	mustChangePassword: boolean("must_change_password").default(false).notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("admins_active_idx").using("btree", table.active.asc().nullsLast().op("bool_ops")),
	uniqueIndex("admins_username_lower_idx").using("btree", sql`lower(username)`),
]);

export const drs = pgTable("drs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	buildingId: uuid("building_id").notNull(),
	username: text().notNull(),
	passwordDigest: text("password_digest").notNull(),
	active: boolean().default(true).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	mustChangePassword: boolean("must_change_password").default(false).notNull(),
}, (table) => [
	uniqueIndex("drs_active_building_idx").using("btree", table.buildingId.asc().nullsLast().op("uuid_ops")).where(sql`active`),
	index("drs_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("drs_username_lower_idx").using("btree", sql`lower(username)`),
	foreignKey({
			columns: [table.buildingId],
			foreignColumns: [buildings.id],
			name: "drs_building_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "drs_tenant_id_fkey"
		}).onDelete("restrict"),
]);

export const monthlyBudgets = pgTable("monthly_budgets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	periodStart: date("period_start").notNull(),
	category: text().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("monthly_budgets_period_category_idx").using("btree", sql`period_start`, sql`lower(category)`),
	index("monthly_budgets_period_idx").using("btree", table.periodStart.asc().nullsLast().op("date_ops")),
]);

export const schemaMigrations = pgTable("schema_migrations", {
	version: varchar().primaryKey().notNull(),
});

export const arInternalMetadata = pgTable("ar_internal_metadata", {
	key: varchar().primaryKey().notNull(),
	value: varchar(),
	createdAt: timestamp("created_at", { precision: 6, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, mode: 'string' }).notNull(),
});

export const buildings = pgTable("buildings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	societyId: uuid("society_id").notNull(),
	name: text().notNull(),
	address: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	locality: text(),
	city: text(),
	state: text(),
	category: text(),
}, (table) => [
	index("buildings_city_idx").using("btree", table.city.asc().nullsLast().op("text_ops")),
	index("buildings_locality_idx").using("btree", table.locality.asc().nullsLast().op("text_ops")),
	uniqueIndex("buildings_society_name_idx").using("btree", sql`society_id`, sql`lower(name)`),
	foreignKey({
			columns: [table.societyId],
			foreignColumns: [societies.id],
			name: "buildings_society_id_fkey"
		}).onDelete("restrict"),
]);
export const tenantCredentials = pgView("tenant_credentials", {	tenantId: uuid("tenant_id"),
	username: text(),
	defaultPassword: text("default_password"),
	usingDefaultPassword: boolean("using_default_password"),
	tenantName: text("tenant_name"),
	building: text(),
	wing: text(),
	flat: text(),
	email: text(),
	active: boolean(),
}).as(sql`SELECT t.id AS tenant_id, (COALESCE(b.name, '?'::text) || '-'::text) || COALESCE(u.flat, '?'::text) AS username, t.phone AS default_password, t.must_change_password AS using_default_password, t.name AS tenant_name, b.name AS building, u.wing, u.flat, t.email, t.active FROM tenants t LEFT JOIN units u ON u.id = t.unit_id LEFT JOIN buildings b ON b.id = u.building_id ORDER BY b.name, u.flat`);