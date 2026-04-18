import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditConsoleSkeleton } from "@/components/dashboard/AuditConsoleSkeleton";
import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { MissionControlPreview } from "@/components/home/MissionControlPreview";
import { AIFriendlyFaq } from "@/components/seo/AIFriendlyFaq";
import { SemanticKeywordMap } from "@/components/seo/SemanticKeywordMap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSeoMetadata } from "@/lib/seo/metadata";

const LANDING_CAPABILITIES = [
  {
    title: "Autonomous Red-Teaming",
    description:
      "Run a 3-agent security squad that maps attack surfaces, executes payload simulations, and produces evidence-backed reports.",
  },
  {
    title: "Live Attack Simulation",
    description:
      "Monitor real-time attack orchestration with pipeline telemetry, payload counters, and execution states from queued to completed.",
  },
  {
    title: "AI Code Audit",
    description:
      "Scan repositories and application logic with an AI security audit flow designed to surface exploit paths and remediation priorities.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Qexur | Autonomous AI Security Orchestrator",
    description:
      "Autonomous AI Security with a Pentesting AI Squad, real-time web attack simulation, and AI code audit.",
    path: "/",
    keywords: [
      "Autonomous AI Security",
      "Pentesting AI Squad",
      "Real-time Web Attack Simulation",
      "AI Code Audit",
      "AI-driven Cybersecurity Orchestrator",
    ],
    index: true,
  });
}

async function isAuthenticatedRootSession(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return false;
  }

  return Boolean(data.user);
}

function SemanticSeoLayer() {
  return (
    <section aria-label="Semantic SEO layer" className="seo-semantic-layer">
      <section id="ai-overview" aria-label="AI overview">
        <h2>Qexur Autonomous AI Security Overview</h2>
        <p>
          Qexur is an autonomous AI cybersecurity workforce. It utilizes a 3-agent squad (Recon, Sniper, Reporter)
          to perform live penetration testing and code audits. It scales security for developers and agencies by
          replacing manual audits with high-speed, AI-driven stress simulations.
        </p>
      </section>

      <section aria-label="Brand search variants">
        <p>
          Qexur (often searched as Qejur, Qezur, Qaxur, Qexer, or Qexur AI) provides autonomous AI security for
          developers and agencies, and all official brand references resolve to the canonical site at https://qexur.me.
        </p>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-heading">
        <header>
          <p>Capabilities</p>
          <h2 id="capabilities-heading">AI Security Engine</h2>
        </header>

        <div>
          {LANDING_CAPABILITIES.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <AIFriendlyFaq />
      <SemanticKeywordMap />
    </section>
  );
}

export default async function HomePage() {
  if (await isAuthenticatedRootSession()) {
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

  return (
    <div className="space-y-8">
      <MissionControlPreview />
      <SemanticSeoLayer />
    </div>
  );
}
