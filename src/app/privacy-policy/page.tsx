import type { Metadata } from "next";
import Link from "next/link";

import { buildSeoMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur Privacy Policy | AI Security Data Practices",
    description:
      "Privacy policy covering data handling and retention practices for Qexur AI security workflows.",
    path: "/privacy-policy",
    index: true,
  });
}

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 border-2 border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 reveal-rise">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-5xl uppercase tracking-[0.08em]">Privacy Policy</h1>
        <Link
          href="/dashboard"
          aria-label="Close privacy policy"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--qx-border)] text-xl text-[var(--qx-muted)] transition hover:border-cyan-400 hover:text-cyan-200"
        >
          x
        </Link>
      </div>
      <p className="text-sm leading-relaxed text-[var(--qx-muted)]">
        Qexur only processes data required for requested security workflows, stores execution telemetry for platform
        reliability, and enforces a 24-hour purge window for uploaded code and logs.
      </p>
      <p className="text-sm leading-relaxed text-[var(--qx-muted)]">
        This page is a placeholder policy route for the auth consent flow and should be replaced with legal counsel
        approved production language before launch.
      </p>
    </article>
  );
}