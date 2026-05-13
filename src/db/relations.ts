import { relations } from "drizzle-orm/relations";
import { units, tenants, tickets, requisitions, buildings, drs, societies } from "./schema";

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	unit: one(units, {
		fields: [tenants.unitId],
		references: [units.id]
	}),
	drs: many(drs),
}));

export const unitsRelations = relations(units, ({one, many}) => ({
	tenants: many(tenants),
	building: one(buildings, {
		fields: [units.buildingId],
		references: [buildings.id]
	}),
	tickets: many(tickets),
}));

export const requisitionsRelations = relations(requisitions, ({one}) => ({
	ticket: one(tickets, {
		fields: [requisitions.issueId],
		references: [tickets.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	requisitions: many(requisitions),
	building: one(buildings, {
		fields: [tickets.buildingId],
		references: [buildings.id]
	}),
	dr: one(drs, {
		fields: [tickets.raisedByDrId],
		references: [drs.id]
	}),
	society: one(societies, {
		fields: [tickets.societyId],
		references: [societies.id]
	}),
	unit: one(units, {
		fields: [tickets.unitId],
		references: [units.id]
	}),
}));

export const buildingsRelations = relations(buildings, ({one, many}) => ({
	units: many(units),
	tickets: many(tickets),
	drs: many(drs),
	society: one(societies, {
		fields: [buildings.societyId],
		references: [societies.id]
	}),
}));

export const drsRelations = relations(drs, ({one, many}) => ({
	tickets: many(tickets),
	building: one(buildings, {
		fields: [drs.buildingId],
		references: [buildings.id]
	}),
	tenant: one(tenants, {
		fields: [drs.tenantId],
		references: [tenants.id]
	}),
}));

export const societiesRelations = relations(societies, ({many}) => ({
	tickets: many(tickets),
	buildings: many(buildings),
}));