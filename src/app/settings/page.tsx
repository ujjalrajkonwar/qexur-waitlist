import type { Metadata } from "next";
import Link from "next/link";

import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Settings | Security Workspace Controls",
    description:
      "Authenticated account and workspace settings for Qexur AI security operations.",
    path: "/settings",
    index: false,
  });
}

export default function SettingsPage() {
  return (
    <ConsoleShell active="settings" title="Settings" subtitle="Account and platform preferences">
      <section className="rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6">
        <p className="text-sm leading-relaxed text-[var(--qx-muted)]">
          Settings route is active. Configure profile security, notification rules, and workspace controls here.
        </p>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-lg border border-cyan-400 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-500/10"
        >
          Back to Dashboard
        </Link>
      </section>
    </ConsoleShell>
  );
}
