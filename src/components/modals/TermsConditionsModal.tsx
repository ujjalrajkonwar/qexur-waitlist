"use client";

import Link from "next/link";
import { useCallback } from "react";
import { createPortal } from "react-dom";

import { TERMS_SECTIONS } from "@/content/terms";
import { useModalA11y } from "@/hooks/useModalA11y";

type TermsConditionsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TermsConditionsModal({ open, onClose }: TermsConditionsModalProps) {
  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose: closeModal,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 p-4 sm:p-6"
      onClick={closeModal}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-and-conditions-title"
        className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto border-2 border-cyan-500/60 bg-zinc-950 shadow-[0_0_32px_rgba(6,182,212,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          data-autofocus
          aria-label="Close terms and conditions"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--qx-border)] text-xl text-[var(--qx-muted)] transition hover:border-cyan-400 hover:text-cyan-200"
        >
          x
        </button>

        <div className="space-y-8 p-6 sm:p-8">
          <header className="space-y-3 pr-12">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Legal Framework</p>
            <h2 id="terms-and-conditions-title" className="font-display text-4xl uppercase tracking-[0.08em] text-zinc-100">
              Terms and Conditions
            </h2>
            <p className="text-sm text-zinc-400">
              This summary is shown in-modal for quick review. You can open the dedicated legal page for a full-page view.
            </p>
          </header>

          {TERMS_SECTIONS.map((section) => (
            <section key={section.id} className="space-y-3 border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="font-display text-2xl uppercase tracking-[0.06em] text-zinc-100">{section.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{section.body}</p>
            </section>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
            <Link
              href="/terms-and-conditions"
              className="border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Open Full Terms Page
            </Link>
            <button
              type="button"
              onClick={closeModal}
              className="border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
