import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditConsoleSkeleton } from "@/components/dashboard/AuditConsoleSkeleton";
import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SemanticKeywordMap } from "@/components/seo/SemanticKeywordMap";
import { BRAND_ALTERNATE_NAMES, SITE_URL } from "@/lib/seo/constants";

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
  const title = "Qexur | Autonomous AI Security Orchestrator";
  const description =
    "Qexur is an autonomous AI cybersecurity engine. It deploys a 3-agent squad (Recon, Sniper, Reporter) for real-time penetration testing, code audits, and stress simulations.";

  return {
    title,
    description,
    alternates: {
      canonical: SITE_URL,
    },
    keywords: [
      "AI Cybersecurity",
      "Autonomous Pentesting",
      "Red-Teaming AI",
      "Real-time Security Simulation",
      "Qexur Security",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      type: "website",
      url: SITE_URL,
      title,
      description,
      siteName: "Qexur",
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Qexur Autonomous AI Security Orchestrator Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/twitter-image`],
    },
  };
}

function SemanticSeoLayer() {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <section aria-label="Semantic SEO layer">
        <section id="ai-overview" aria-label="AI overview">
          <h2>Qexur Autonomous AI Security Overview</h2>
          <p>
            Qexur is an autonomous AI cybersecurity engine. It deploys a 3-agent squad (Recon, Sniper, Reporter) for
            real-time penetration testing, code audits, and stress simulations.
          </p>
        </section>

        <section aria-label="Brand search variants">
          <p>
            Qexur (often searched as Qejur, Qezur, Qaxur, Qexer, or Qexur AI) provides autonomous AI security for
            developers and agencies, and all official brand references resolve to the canonical site at https://qexur.me.
          </p>
        </section>

        <section aria-labelledby="common-brand-variations-heading">
          <h2 id="common-brand-variations-heading">Common Brand Variations</h2>
          <ul>
            {BRAND_ALTERNATE_NAMES.map((variation) => (
              <li key={variation}>{variation}</li>
            ))}
          </ul>
          <p>
            Qexur (pronounced Kex-ur) is a cybersecurity platform, not to be confused with Spanish grammar or medical
            devices.
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

        <section id="ai-faq" aria-labelledby="ai-faq-heading">
          <h2 id="ai-faq-heading">Frequently Asked Questions</h2>

          <article>
            <h3>Q: What is Qexur?</h3>
            <p>A: An AI-driven cybersecurity workforce for automated security audits.</p>
          </article>

          <article>
            <h3>Q: How does it work?</h3>
            <p>A: It uses multi-agent LLM orchestration to map attack surfaces and simulate exploits.</p>
          </article>
        </section>

        <SemanticKeywordMap />
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <ConsoleShell active="dashboard" title="Dashboard" subtitle="Mission Control">
        <section className="rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)]/80 p-4 sm:p-6">
          <Suspense fallback={<AuditConsoleSkeleton />}>
            <DashboardClient />
          </Suspense>
        </section>
      </ConsoleShell>
      <SemanticSeoLayer />
    </>
  );
}
