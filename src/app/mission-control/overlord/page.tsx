import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OverlordClient from "./OverlordClient";

export const dynamic = "force-dynamic";

export default async function OverlordPage() {
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/dashboard");
  }

  // Server-Side RBAC check
  const role = data.user.app_metadata?.role;
  if (role !== "super_admin") {
    redirect("/dashboard");
  }

  return <OverlordClient />;
}