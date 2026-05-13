import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// prepare: false because Supabase's pooler multiplexes connections per
// transaction; prepared statements are per-connection state and break under
// multiplexing. Same constraint as the old Rails app's database.yml.
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(queryClient, { schema: { ...schema, ...relations } });
