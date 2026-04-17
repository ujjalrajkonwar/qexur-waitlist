"use client";

import { useState } from "react";

import { TermsConditionsModal } from "@/components/modals/TermsConditionsModal";

export function AppFooter() {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <footer className="absolute inset-x-0 bottom-0 border-t-2 border-[var(--qx-border)] bg-black/70 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">
            QEXUR Security Simulation Layer.
          </p>

          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            aria-haspopup="dialog"
            aria-expanded={showTermsModal}
            className="text-xs uppercase tracking-[0.2em] text-[var(--qx-text)] underline decoration-[var(--qx-primary)] decoration-2 underline-offset-4"
          >
            Terms and Conditions
          </button>
        </div>
      </footer>

      <TermsConditionsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}