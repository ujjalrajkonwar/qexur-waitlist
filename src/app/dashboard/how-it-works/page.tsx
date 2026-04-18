import type { Metadata } from "next";

import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { HowQexurWorks } from "@/components/dashboard/HowQexurWorks";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Dashboard Docs | AI Security Workflow",
    description:
      "Authenticated technical walkthrough of Qexur workflows for autonomous red-teaming and AI code audit operations.",
    path: "/dashboard/how-it-works",
    index: false,
  });
}

export default function HowItWorksPage() {
  return (
    <ConsoleShell active="dashboard" title="How it Works" subtitle="Mission Control Documentation">
      <HowQexurWorks />
    </ConsoleShell>
  );
}
