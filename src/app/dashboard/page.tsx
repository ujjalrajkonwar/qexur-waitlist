import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditConsoleSkeleton } from "@/components/dashboard/AuditConsoleSkeleton";
import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Dashboard | Pentesting AI Squad Console",
    description:
      "Authenticated mission control for autonomous penetration testing, live attack simulation, and AI code audit workflows.",
    path: "/dashboard",
    index: false,
  });
}

export default function DashboardPage() {
  return (
    <ConsoleShell active="dashboard" title="Dashboard" subtitle="Mission Control">
      <section className="rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)]/80 p-4 sm:p-6">
        <Suspense fallback={<AuditConsoleSkeleton />}>
          <DashboardClient />
        </Suspense>
      </section>
    </ConsoleShell>
  );
}