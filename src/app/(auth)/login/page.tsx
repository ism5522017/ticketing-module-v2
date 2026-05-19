import { Wrench } from "lucide-react";
import { listBuildings } from "@/lib/buildings/list";
import { LoginForm, type LoginBuildingOption } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const rows = await listBuildings();
  const buildings: LoginBuildingOption[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    locality: b.locality,
    city: b.city,
  }));

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center justify-center gap-3 text-deh-dark">
        <span className="flex h-11 w-11 items-center justify-center rounded-deh-md bg-deh-dark text-deh-yellow shadow-deh-card">
          <Wrench className="h-5 w-5" />
        </span>
        <p className="font-display text-deh-xl font-bold tracking-tight">
          DEH Maintenance
        </p>
      </div>

      <div className="rounded-3xl bg-white px-6 py-10 shadow-deh-card sm:px-10">
        <LoginForm buildings={buildings} />
      </div>
    </div>
  );
}
