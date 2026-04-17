"use client";

import type { FeatureKey } from "@/types/qexur";

const featureCards: Record<
  FeatureKey,
  {
    title: string;
    subtitle: string;
    disabled?: boolean;
    overlayText?: string;
  }
> = {
  auditor: {
    title: "Web Auditor",
    subtitle: "Reasoning-first static code auditor in report-only Beta mode",
  },
  "wp-auditor": {
    title: "App Auditor",
    subtitle: "Deep-security scan for modern SaaS applications and distributed architectures.",
  },
  destroyer: {
    title: "Destroyer",
    subtitle: "DNS-verified live penetration stress simulation",
  },
};

type FeatureSelectorProps = {
  selectedFeature: FeatureKey;
  onSelectFeatureAction: (feature: FeatureKey) => void;
};

export function FeatureSelector({ selectedFeature, onSelectFeatureAction }: FeatureSelectorProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {(Object.keys(featureCards) as FeatureKey[]).map((feature) => {
        const card = featureCards[feature];
        const active = selectedFeature === feature;
        const disabled = Boolean(card.disabled);

        return (
          <button
            key={feature}
            type="button"
            onClick={() => {
              if (!disabled) {
                onSelectFeatureAction(feature);
              }
            }}
            disabled={disabled}
            className={[
              "group relative border-2 px-4 py-5 text-left transition duration-150",
              disabled ? "cursor-not-allowed opacity-80" : "",
              active
                ? "border-[var(--qx-primary)] bg-[var(--qx-panel-strong)] shadow-[6px_6px_0_var(--qx-primary-strong)]"
                : "border-[var(--qx-border)] bg-[var(--qx-panel)] hover:border-[var(--qx-text)]",
            ].join(" ")}
          >
            <p className="font-display text-3xl uppercase tracking-wider">{card.title}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--qx-muted)]">
              {card.subtitle}
            </p>

            {disabled && card.overlayText && (
              <span className="absolute inset-0 grid place-items-center bg-black/65 font-display text-3xl uppercase tracking-[0.1em] text-cyan-200">
                {card.overlayText}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}