import { relations } from "drizzle-orm/relations";
import { units, tenants, users, tickets, requisitions, buildings, admins, managers, drs, societies, managerBuildingAssignments } from "./schema";

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	unit: one(units, {
		fields: [tenants.unitId],
		references: [units.id]
	}),
	user: one(users, {
		fields: [tenants.userId],
		references: [users.id]
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

export const usersRelations = relations(users, ({one, many}) => ({
	tenants: many(tenants),
	admins: many(admins),
	managers: many(managers),
	drs: many(drs),
	managerBuildingAssignments: many(managerBuildingAssignments),
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
	managerBuildingAssignments: many(managerBuildingAssignments),
	society: one(societies, {
		fields: [buildings.societyId],
		references: [societies.id]
	}),
}));

