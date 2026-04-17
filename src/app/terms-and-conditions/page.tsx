import Link from "next/link";

import { TERMS_SECTIONS } from "@/content/terms";

export default function TermsAndConditionsPage() {
  return (
    <article className="relative mx-auto max-w-4xl space-y-8 border-2 border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6 reveal-rise">
      <Link
        href="/dashboard"
        aria-label="Close terms and conditions"
        className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--qx-border)] text-xl text-[var(--qx-muted)] transition hover:border-cyan-400 hover:text-cyan-200"
      >
        x
      </Link>

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Legal Framework</p>
        <h1 className="font-display text-5xl uppercase tracking-[0.08em]">Terms and Conditions</h1>
      </header>

      {TERMS_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="font-display text-3xl uppercase">{section.title}</h2>
          <p className="text-sm leading-relaxed text-[var(--qx-muted)]">{section.body}</p>
        </section>
      ))}
    </article>
  );
}