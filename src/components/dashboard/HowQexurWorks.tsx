import Link from "next/link";

export function HowQexurWorks() {
  return (
    <section className="space-y-6 border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] p-6">
      <header className="space-y-3 border border-cyan-500/30 bg-cyan-500/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Mission Control Documentation</p>
            <h2 className="font-display text-4xl uppercase tracking-[0.08em]">How Qexur Works</h2>
            <p className="max-w-4xl text-sm text-[var(--qx-muted)]">
              Welcome to Mission Control. Qexur is an autonomous, multi-agent AI security engine designed for rapid
              external recon and deep code remediation.
            </p>
          </div>

          <Link
            href="/dashboard"
            aria-label="Close how it works"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--qx-border)] text-xl text-[var(--qx-muted)] transition hover:border-cyan-400 hover:text-cyan-200"
          >
            x
          </Link>
        </div>
      </header>

      <article className="space-y-4 border border-[var(--qx-border)] bg-black/20 p-5">
        <h3 className="font-display text-3xl uppercase tracking-[0.08em]">Pillar 1: Reason-First Code Audit</h3>

        <div className="space-y-3 text-sm text-[var(--qx-muted)]">
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 1: Source Intake.</span>{" "}
            Upload code via ZIP, Folder, or GitHub Connect. Qexur uses client-side processing to automatically filter
            non-source assets like node_modules to keep analysis focused.
          </p>
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 2: Set Intensity.</span>{" "}
            Choose Surface Scan for common flaws with 10-20 vulnerabilities, or Deep Audit for production-grade
            dead-code detection across 50+ security and logic classes.
          </p>
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 3: Action.</span>{" "}
            Run the scan or use the Auto-Fix Code agent, marked Coming Soon, to generate exact patches via our
            Coder-Reviewer loop.
          </p>
        </div>
      </article>

      <article className="space-y-4 border border-[var(--qx-border)] bg-black/20 p-5">
        <h3 className="font-display text-3xl uppercase tracking-[0.08em]">Pillar 2: DNS-Verified Stress Simulation</h3>

        <div className="space-y-3 text-sm text-[var(--qx-muted)]">
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 1: Verification (Required).</span>{" "}
            Live attacks require explicit authorization. Enter your domain and verify ownership via a temporary DNS TXT
            record.
          </p>
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 2: Choose Attack Layer.</span>{" "}
            Once verified, select Surface for common externally exposed probes with 15+ vectors, Destroyer for deep API
            and web application logic attacks with 100+ vectors, or Super Destroyer for full ecosystem red-teaming with
            350+ vectors.
          </p>
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Step 3: Simulation.</span>{" "}
            AI agents autonomously attempt to bypass firewalls and exploit flaws.
          </p>
        </div>
      </article>

      <article className="space-y-4 border border-[var(--qx-border)] bg-black/20 p-5">
        <h3 className="font-display text-3xl uppercase tracking-[0.08em]">Pillar 3: The Report Section</h3>

        <div className="space-y-3 text-sm text-[var(--qx-muted)]">
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Execution.</span> After any Audit or Live
            Attack completes, Qexur generates a comprehensive report.
          </p>
          <p>
            <span className="font-semibold uppercase tracking-[0.08em] text-[var(--qx-text)]">Report Contents.</span> Reports include an
            Executive Summary for owners, a detailed Technical Breakdown of findings such as CVEs and logic flaws, and
            prioritized Remediation Steps for developers. For Audits, this is where you can initiate the Auto-Fix loop.
          </p>
        </div>
      </article>

      <div className="rounded-xl border border-amber-300/60 bg-amber-400/10 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
          Auto-Fix remains exclusive to Audit and is not available in Live Attack.
        </p>
      </div>
    </section>
  );
}