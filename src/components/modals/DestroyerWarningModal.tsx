"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { useModalA11y } from "@/hooks/useModalA11y";

type DestroyerWarningModalProps = {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onExecute: () => void;
};

export function DestroyerWarningModal({
  open,
  pending,
  onCancel,
  onExecute,
}: DestroyerWarningModalProps) {
  const [accepted, setAccepted] = useState(false);

  const closeModal = useCallback(() => {
    if (!pending) {
      setAccepted(false);
      onCancel();
    }
  }, [pending, onCancel]);

  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose: closeModal,
    closeOnEscape: !pending,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 px-4 py-8"
      onClick={closeModal}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="destroyer-warning-title"
        className="w-full max-w-2xl border-2 border-[var(--qx-danger)] bg-[var(--qx-panel-strong)] p-6 shadow-[8px_8px_0_var(--qx-danger)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="destroyer-warning-title" className="font-display text-3xl uppercase tracking-wide text-[var(--qx-danger)]">
          WARNING: LIVE DESTRUCTIVE TEST INITIATED
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--qx-text)]">
          You are about to launch a live penetration test on your servers. Qexur will simulate aggressive attacks.
          This process may result in severe server slowdowns, temporary downtime, application crashes, or unintended
          data corruption. Qexur and its founders bear ZERO liability for any loss of revenue, data, or uptime.
        </p>

        <label className="mt-6 flex items-start gap-3 border border-[var(--qx-danger)]/60 bg-black/30 p-3 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 accent-[var(--qx-danger)]"
          />
          <span>I understand the risks and agree to the Destroyer Terms and Conditions.</span>
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={pending}
            data-autofocus
            className="border border-[var(--qx-border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)] transition hover:border-[var(--qx-text)] hover:text-[var(--qx-text)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!accepted || pending}
            onClick={() => {
              setAccepted(false);
              onExecute();
            }}
            className={[
              "inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition",
              !accepted || pending
                ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
                : "bg-[var(--qx-danger)] hover:bg-[var(--qx-primary-strong)] hover:text-white",
            ].join(" ")}
          >
            {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent" aria-hidden="true" />}
            {pending ? "Executing..." : "Execute Attack"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}