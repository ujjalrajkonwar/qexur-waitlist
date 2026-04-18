import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildSeoMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Auth | Access Gateway",
    description: "Authentication gateway for secure access into Qexur dashboard operations.",
    path: "/auth",
    index: false,
  });
}

export default function AuthPage() {
  redirect("/dashboard");
}