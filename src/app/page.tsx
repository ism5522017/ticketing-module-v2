import { redirect } from "next/navigation";

export default function Home() {
  // Middleware (1.9) will route signed-in users to their role dashboard
  // before this redirect fires for them. Anonymous visitors land on /login.
  redirect("/login");
}
