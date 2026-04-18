import { AI_FRIENDLY_FAQ } from "@/lib/seo/faq";

export function AIFriendlyFaq() {
  return (
    <section
      id="ai-faq"
      aria-labelledby="ai-faq-heading"
      className="space-y-5 rounded-2xl border border-[var(--qx-border)] bg-[var(--qx-panel-strong)] p-6"
    >
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">AI-Optimized FAQ</p>
        <h2 id="ai-faq-heading" className="font-display text-4xl uppercase tracking-[0.08em]">
          Security Questions, Straight Answers
        </h2>
      </header>

      <div className="space-y-4">
        {AI_FRIENDLY_FAQ.map((item) => (
          <article key={item.question} className="rounded-xl border border-[var(--qx-border)] bg-black/30 p-4">
            <h3 className="text-base font-semibold text-cyan-100">
              <strong>Q:</strong> {item.question}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--qx-muted)]">
              <strong>A:</strong> {item.answer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
