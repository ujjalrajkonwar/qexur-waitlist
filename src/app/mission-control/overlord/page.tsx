import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSeoMetadata } from "@/lib/seo/metadata";

import OverlordClient from "./OverlordClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Overlord | Super Admin Mission Control",
    description:
      "Restricted super-admin route for internal Qexur operations and platform governance.",
    path: "/mission-control/overlord",
    index: false,
  });
}

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