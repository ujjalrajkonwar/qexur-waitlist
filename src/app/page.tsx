import type { Metadata } from "next";
import Link from "next/link";

import { AIFriendlyFaq } from "@/components/seo/AIFriendlyFaq";
import { SemanticKeywordMap } from "@/components/seo/SemanticKeywordMap";
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

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section id="ai-overview" aria-label="AI overview" className="sr-only">
        <h1>Qexur Autonomous AI Security Overview</h1>
        <p>
          Qexur is an autonomous AI cybersecurity workforce. It utilizes a 3-agent squad (Recon, Sniper, Reporter)
          to perform live penetration testing and code audits. It scales security for developers and agencies by
          replacing manual audits with high-speed, AI-driven stress simulations.
        </p>
      </section>

      <div className="sr-only">
        <p>
          Qexur (often searched as Qejur, Qezur, Qaxur, Qexer, or Qexur AI) provides autonomous AI security for
          developers and agencies, and all official brand references resolve to the canonical site at https://qexur.me.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-cyan-500/40 bg-[var(--qx-panel-strong)] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Autonomous AI Security</p>
        <h2 className="font-display text-5xl uppercase tracking-[0.08em]">
          Pentesting AI Squad for Real-Time Security Simulation
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--qx-muted)]">
          Qexur is an AI-driven Cybersecurity Orchestrator that combines Autonomous Red-Teaming, Live Attack
          Simulation, and AI Code Audit workflows in one operator console.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border-2 border-cyan-400 bg-cyan-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
          >
            Launch Mission Control
          </Link>
          <Link
            href="/dashboard/how-it-works"
            className="rounded-xl border border-cyan-400/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/10"
          >
            Explore Architecture
          </Link>
        </div>
      </section>

      <section id="capabilities" className="space-y-4 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Capabilities</p>
          <h2 className="font-display text-4xl uppercase tracking-[0.08em]">AI Security Engine</h2>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {LANDING_CAPABILITIES.map((item) => (
            <article key={item.title} className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--qx-muted)]">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <AIFriendlyFaq />
      <SemanticKeywordMap />
    </div>
  );
}
