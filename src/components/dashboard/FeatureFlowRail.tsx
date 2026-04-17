import { FEATURE_FLOW_STEPS, FEATURE_LABELS, type FeatureKey } from "@/types/qexur";

type FeatureFlowRailProps = {
  feature: FeatureKey;
  activeStepIndex: number;
};

export function FeatureFlowRail({ feature, activeStepIndex }: FeatureFlowRailProps) {
  return (
    <section className="border-2 border-[var(--qx-border)] bg-[var(--qx-panel)] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Active Flow</p>
      <h3 className="mt-2 font-display text-2xl uppercase tracking-wide">{FEATURE_LABELS[feature]}</h3>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURE_FLOW_STEPS[feature].map((step, index) => {
          const reached = index <= activeStepIndex;

          return (
            <li
              key={step.id}
              className={[
                "border px-3 py-3 text-sm uppercase tracking-wide",
                reached
                  ? "border-[var(--qx-primary)] bg-[var(--qx-primary)]/10 text-[var(--qx-text)]"
                  : "border-[var(--qx-border)] text-[var(--qx-muted)]",
              ].join(" ")}
            >
              <span className="mr-2 font-mono text-xs text-[var(--qx-muted)]">{String(index + 1).padStart(2, "0")}</span>
              {step.label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}