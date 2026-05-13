-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."requisition_approval" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."ticket_raiser" AS ENUM('tenant', 'dr');--> statement-breakpoint
CREATE TYPE "public"."ticket_scope" AS ENUM('unit', 'building', 'society');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."ticket_urgency" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE SEQUENCE "public"."tickets_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 101 CACHE 1;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"contact" text,
	"password_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unit_id" uuid,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surveyed" boolean DEFAULT false NOT NULL,
	"in_house_fix" boolean DEFAULT false NOT NULL,
	"vendor_name" text,
	"est_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"cost_breakdown" text,
	"invoices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"admin_approval" "requisition_approval" DEFAULT 'Pending' NOT NULL,
	"admin_remarks" text,
	"vendor_confirmed" boolean DEFAULT false NOT NULL,
	"vendor_confirmed_by" text,
	"vendor_proof" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"issue_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"vendor_confirmed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "requisitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "managers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "societies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "societies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"wing" text,
	"flat" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"floor" text,
	"unit_type" text,
	"category" text,
	"sqft" numeric(10, 2),
	"sqmt" numeric(10, 2),
	"area_type" text,
	"resident_name" text,
	"department" text
);
--> statement-breakpoint
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tickets" (
	"type" text NOT NULL,
	"description" text,
	"urgency_overridden" boolean DEFAULT false NOT NULL,
	"triage_reason" text,
	"tenant_email" text,
	"tenant_name" text,
	"contact" text,
	"location_edited" boolean DEFAULT false NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_code" text DEFAULT ('TK-'::text || lpad((nextval('tickets_reference_seq'::regclass))::text, 5, '0'::text)) NOT NULL,
	"scope" "ticket_scope" DEFAULT 'unit' NOT NULL,
	"raised_by_role" "ticket_raiser" DEFAULT 'tenant' NOT NULL,
	"society_id" uuid NOT NULL,
	"building_id" uuid,
	"unit_id" uuid,
	"submitted_at" timestamp with time zone NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"urgency" "ticket_urgency" DEFAULT 'low' NOT NULL,
	"raised_by_dr_id" uuid,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "tickets_raiser_identity_check" CHECK (((raised_by_role = 'tenant'::ticket_raiser) AND (raised_by_dr_id IS NULL)) OR ((raised_by_role = 'dr'::ticket_raiser) AND (raised_by_dr_id IS NOT NULL))),
	CONSTRAINT "tickets_scope_check" CHECK (((scope = 'unit'::ticket_scope) AND (unit_id IS NOT NULL) AND (building_id IS NOT NULL)) OR ((scope = 'building'::ticket_scope) AND (building_id IS NOT NULL) AND (unit_id IS NULL)) OR ((scope = 'society'::ticket_scope) AND (unit_id IS NULL) AND (building_id IS NULL)))
);
--> statement-breakpoint
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "drs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"username" text NOT NULL,
	"password_digest" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monthly_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" date NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_budgets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" varchar PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schema_migrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ar_internal_metadata" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"created_at" timestamp(6) NOT NULL,
	"updated_at" timestamp(6) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ar_internal_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locality" text,
	"city" text,
	"state" text,
	"category" text
);
--> statement-breakpoint
ALTER TABLE "buildings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_raised_by_dr_id_fkey" FOREIGN KEY ("raised_by_dr_id") REFERENCES "public"."drs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drs" ADD CONSTRAINT "drs_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drs" ADD CONSTRAINT "drs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenants_active_idx" ON "tenants" USING btree ("active" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_email_lower_idx" ON "tenants" USING btree (lower(email) text_ops);--> statement-breakpoint
CREATE INDEX "tenants_phone_idx" ON "tenants" USING btree ("phone" text_ops);--> statement-breakpoint
CREATE INDEX "tenants_unit_id_idx" ON "tenants" USING btree ("unit_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "requisitions_issue_id_idx" ON "requisitions" USING btree ("issue_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "requisitions_submitted_at_idx" ON "requisitions" USING btree ("submitted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "managers_active_idx" ON "managers" USING btree ("active" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "managers_username_lower_idx" ON "managers" USING btree (lower(username) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "societies_name_lower_idx" ON "societies" USING btree (lower(name) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "units_building_wing_flat_idx" ON "units" USING btree (building_id text_ops,lower(COALESCE(wing, ''::text)) text_ops,lower(COALESCE(flat, ''::text)) text_ops);--> statement-breakpoint
CREATE INDEX "units_category_idx" ON "units" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "units_unit_type_idx" ON "units" USING btree ("unit_type" text_ops);--> statement-breakpoint
CREATE INDEX "tickets_building_id_idx" ON "tickets" USING btree ("building_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tickets_building_submitted_idx" ON "tickets" USING btree ("building_id" timestamptz_ops,"submitted_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "tickets_dr_society_idx" ON "tickets" USING btree ("raised_by_dr_id" uuid_ops) WHERE (scope = 'society'::ticket_scope);--> statement-breakpoint
CREATE INDEX "tickets_raised_by_dr_id_idx" ON "tickets" USING btree ("raised_by_dr_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_reference_code_idx" ON "tickets" USING btree ("reference_code" text_ops);--> statement-breakpoint
CREATE INDEX "tickets_resolved_at_idx" ON "tickets" USING btree ("resolved_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "tickets_scope_idx" ON "tickets" USING btree ("scope" enum_ops);--> statement-breakpoint
CREATE INDEX "tickets_society_id_idx" ON "tickets" USING btree ("society_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tickets_submitted_at_idx" ON "tickets" USING btree ("submitted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "tickets_tenant_email_idx" ON "tickets" USING btree ("tenant_email" text_ops);--> statement-breakpoint
CREATE INDEX "tickets_unit_id_idx" ON "tickets" USING btree ("unit_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "admins_active_idx" ON "admins" USING btree ("active" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "admins_username_lower_idx" ON "admins" USING btree (lower(username) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "drs_active_building_idx" ON "drs" USING btree ("building_id" uuid_ops) WHERE active;--> statement-breakpoint
CREATE INDEX "drs_tenant_id_idx" ON "drs" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "drs_username_lower_idx" ON "drs" USING btree (lower(username) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_budgets_period_category_idx" ON "monthly_budgets" USING btree (period_start date_ops,lower(category) date_ops);--> statement-breakpoint
CREATE INDEX "monthly_budgets_period_idx" ON "monthly_budgets" USING btree ("period_start" date_ops);--> statement-breakpoint
CREATE INDEX "buildings_city_idx" ON "buildings" USING btree ("city" text_ops);--> statement-breakpoint
CREATE INDEX "buildings_locality_idx" ON "buildings" USING btree ("locality" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "buildings_society_name_idx" ON "buildings" USING btree (society_id uuid_ops,lower(name) text_ops);--> statement-breakpoint
CREATE VIEW "public"."tenant_credentials" AS (SELECT t.id AS tenant_id, (COALESCE(b.name, '?'::text) || '-'::text) || COALESCE(u.flat, '?'::text) AS username, t.phone AS default_password, t.must_change_password AS using_default_password, t.name AS tenant_name, b.name AS building, u.wing, u.flat, t.email, t.active FROM tenants t LEFT JOIN units u ON u.id = t.unit_id LEFT JOIN buildings b ON b.id = u.building_id ORDER BY b.name, u.flat);
*/